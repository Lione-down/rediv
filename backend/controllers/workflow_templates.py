from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy.exc import IntegrityError

from core.builtin_workflow_templates import (
    get_builtin_workflow_template,
    is_builtin_workflow_template,
    list_builtin_workflow_templates,
)
from core.workflow_template_contract import workflow_template_fingerprint
from models.base import get_session, utc_now
from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateSlot,
    WorkflowTemplateVersion,
)
from repositories.workflow_templates import WorkflowTemplateRepository
from schemas.workflow_template import WorkflowTemplateManifest


class WorkflowTemplateLifecycleError(Exception):
    code = "workflow_template_invalid"

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        if code is not None:
            self.code = code


class WorkflowTemplateNotFoundError(WorkflowTemplateLifecycleError):
    code = "workflow_template_not_found"


class WorkflowTemplateForbiddenError(WorkflowTemplateLifecycleError):
    code = "workflow_template_forbidden"


class WorkflowTemplateConflictError(WorkflowTemplateLifecycleError):
    code = "workflow_template_conflict"


def list_workflow_templates(owner_user_id: str) -> dict:
    with get_session() as session:
        repository = WorkflowTemplateRepository(session)
        items = list_builtin_workflow_templates()
        items.extend(
            _serialize_version(definition, version)
            for definition, version in repository.list_owner_latest(owner_user_id)
        )
    items.sort(key=lambda item: item["template_id"])
    return {"items": items, "total": len(items)}


def get_workflow_template(
    template_id: str,
    version_number: int,
    owner_user_id: str,
) -> dict:
    builtin = get_builtin_workflow_template(template_id, version_number)
    if builtin is not None:
        return builtin
    if is_builtin_workflow_template(template_id):
        raise WorkflowTemplateNotFoundError("Workflow template not found")

    with get_session() as session:
        repository = WorkflowTemplateRepository(session)
        definition = repository.get_definition(
            template_id,
            owner_user_id=owner_user_id,
        )
        if definition is None:
            raise WorkflowTemplateNotFoundError("Workflow template not found")
        version = repository.get_version(definition.id, version_number)
        if version is None:
            raise WorkflowTemplateNotFoundError("Workflow template not found")
        return _serialize_version(definition, version)


def create_workflow_template(
    manifest: WorkflowTemplateManifest,
    owner_user_id: str,
) -> dict:
    _validate_manifest_identity(
        manifest,
        template_id=manifest.template_id,
        version=1,
        lifecycle="draft",
    )
    if is_builtin_workflow_template(manifest.template_id):
        raise WorkflowTemplateForbiddenError("Built-in templates are read-only")

    try:
        with get_session() as session, session.begin():
            repository = WorkflowTemplateRepository(session)
            if repository.get_definition(manifest.template_id) is not None:
                raise WorkflowTemplateConflictError(
                    "Workflow template identifier is unavailable"
                )
            now = utc_now()
            definition = WorkflowTemplateDefinition(
                id=str(uuid4()),
                template_key=manifest.template_id,
                owner_user_id=owner_user_id,
                scope="private",
                status="active",
                name=manifest.metadata.name,
                category=manifest.metadata.category,
                description=manifest.metadata.description,
                created_at=now,
                updated_at=now,
            )
            repository.add_definition(definition)
            version = _new_version_row(
                definition.id,
                manifest,
                owner_user_id,
                now,
            )
            repository.add_version(version)
            repository.replace_slots(
                version.id,
                _normalized_slots(version.id, manifest, now),
            )
            result = _serialize_version(definition, version)
        return result
    except IntegrityError as error:
        raise WorkflowTemplateConflictError(
            "Workflow template identifier is unavailable"
        ) from error


def update_workflow_template_draft(
    template_id: str,
    version_number: int,
    manifest: WorkflowTemplateManifest,
    owner_user_id: str,
) -> dict:
    if is_builtin_workflow_template(template_id):
        raise WorkflowTemplateForbiddenError("Built-in templates are read-only")

    with get_session() as session, session.begin():
        repository = WorkflowTemplateRepository(session)
        definition = _owned_definition(
            repository,
            template_id,
            owner_user_id,
            lock=True,
        )
        version = _exact_version(repository, definition.id, version_number)
        if version.lifecycle != "draft":
            raise WorkflowTemplateConflictError(
                "Only draft workflow-template versions can be updated"
            )
        _validate_manifest_identity(
            manifest,
            template_id=template_id,
            version=version_number,
            lifecycle="draft",
        )
        now = utc_now()
        version.manifest = manifest.model_dump(mode="json", exclude_none=True)
        version.fingerprint = workflow_template_fingerprint(manifest)
        definition.name = manifest.metadata.name
        definition.category = manifest.metadata.category
        definition.description = manifest.metadata.description
        definition.updated_at = now
        repository.replace_slots(
            version.id,
            _normalized_slots(version.id, manifest, now),
        )
        session.flush()
        return _serialize_version(definition, version)


def create_workflow_template_version(
    template_id: str,
    source_version: int,
    owner_user_id: str,
) -> dict:
    if is_builtin_workflow_template(template_id):
        raise WorkflowTemplateForbiddenError("Built-in templates are read-only")

    try:
        with get_session() as session, session.begin():
            repository = WorkflowTemplateRepository(session)
            definition = _owned_definition(
                repository,
                template_id,
                owner_user_id,
                lock=True,
            )
            source = _exact_version(repository, definition.id, source_version)
            if repository.has_draft(definition.id):
                raise WorkflowTemplateConflictError(
                    "A draft workflow-template version already exists"
                )
            next_number = repository.max_version(definition.id) + 1
            payload = dict(source.manifest)
            payload["template_version"] = next_number
            payload["lifecycle"] = "draft"
            payload["scope"] = "private"
            manifest = WorkflowTemplateManifest.model_validate(payload)
            now = utc_now()
            version = _new_version_row(
                definition.id,
                manifest,
                owner_user_id,
                now,
            )
            repository.add_version(version)
            repository.replace_slots(
                version.id,
                _normalized_slots(version.id, manifest, now),
            )
            definition.updated_at = now
            session.flush()
            result = _serialize_version(definition, version)
        return result
    except IntegrityError as error:
        raise WorkflowTemplateConflictError(
            "Workflow-template version changed concurrently"
        ) from error


def publish_workflow_template_version(
    template_id: str,
    version_number: int,
    owner_user_id: str,
) -> dict:
    if is_builtin_workflow_template(template_id):
        raise WorkflowTemplateForbiddenError("Built-in templates are read-only")

    with get_session() as session, session.begin():
        repository = WorkflowTemplateRepository(session)
        definition = _owned_definition(
            repository,
            template_id,
            owner_user_id,
            lock=True,
        )
        version = _exact_version(repository, definition.id, version_number)
        if version.lifecycle != "draft":
            raise WorkflowTemplateConflictError(
                "Only draft workflow-template versions can be published"
            )
        payload = dict(version.manifest)
        payload["lifecycle"] = "published"
        manifest = WorkflowTemplateManifest.model_validate(payload)
        version.manifest = manifest.model_dump(mode="json", exclude_none=True)
        version.fingerprint = workflow_template_fingerprint(manifest)
        version.lifecycle = "published"
        version.published_at = utc_now().replace(
            microsecond=0,
            tzinfo=None,
        )
        session.flush()
        return _serialize_version(definition, version)


def retire_workflow_template_version(
    template_id: str,
    version_number: int,
    owner_user_id: str,
) -> dict:
    if is_builtin_workflow_template(template_id):
        raise WorkflowTemplateForbiddenError("Built-in templates are read-only")

    with get_session() as session, session.begin():
        repository = WorkflowTemplateRepository(session)
        definition = _owned_definition(
            repository,
            template_id,
            owner_user_id,
            lock=True,
        )
        version = _exact_version(repository, definition.id, version_number)
        if version.lifecycle != "published":
            raise WorkflowTemplateConflictError(
                "Only published workflow-template versions can be retired"
            )
        version.lifecycle = "retired"
        session.flush()
        return _serialize_version(definition, version)


def _owned_definition(
    repository: WorkflowTemplateRepository,
    template_id: str,
    owner_user_id: str,
    *,
    lock: bool,
) -> WorkflowTemplateDefinition:
    definition = repository.get_definition(
        template_id,
        owner_user_id=owner_user_id,
        lock=lock,
    )
    if definition is None:
        raise WorkflowTemplateNotFoundError("Workflow template not found")
    return definition


def _exact_version(
    repository: WorkflowTemplateRepository,
    definition_id: str,
    version_number: int,
) -> WorkflowTemplateVersion:
    version = repository.get_version(definition_id, version_number)
    if version is None:
        raise WorkflowTemplateNotFoundError("Workflow template not found")
    return version


def _validate_manifest_identity(
    manifest: WorkflowTemplateManifest,
    *,
    template_id: str,
    version: int,
    lifecycle: str,
) -> None:
    if (
        manifest.template_id != template_id
        or manifest.template_version != version
        or manifest.lifecycle != lifecycle
        or manifest.scope != "private"
    ):
        raise WorkflowTemplateLifecycleError(
            "Workflow-template manifest identity does not match the operation"
        )


def _new_version_row(
    definition_id: str,
    manifest: WorkflowTemplateManifest,
    owner_user_id: str,
    now: datetime,
) -> WorkflowTemplateVersion:
    normalized = manifest.model_dump(mode="json", exclude_none=True)
    return WorkflowTemplateVersion(
        id=str(uuid4()),
        definition_id=definition_id,
        version=manifest.template_version,
        schema_id=manifest.schema_id,
        schema_version=manifest.schema_version,
        lifecycle=manifest.lifecycle,
        manifest=normalized,
        fingerprint=workflow_template_fingerprint(manifest),
        created_by_user_id=owner_user_id,
        published_at=None,
        created_at=now,
    )


def _normalized_slots(
    version_id: str,
    manifest: WorkflowTemplateManifest,
    now: datetime,
) -> list[WorkflowTemplateSlot]:
    slots: list[WorkflowTemplateSlot] = []
    for position, variable in enumerate(manifest.variables):
        slots.append(
            WorkflowTemplateSlot(
                id=str(uuid4()),
                version_id=version_id,
                slot_key=variable.key,
                slot_kind="variable",
                value_type=variable.type,
                is_required=variable.required,
                position=position,
                definition=variable.model_dump(mode="json", exclude_none=True),
                created_at=now,
            )
        )
    offset = len(slots)
    for index, asset_slot in enumerate(manifest.asset_slots):
        slots.append(
            WorkflowTemplateSlot(
                id=str(uuid4()),
                version_id=version_id,
                slot_key=asset_slot.slot_id,
                slot_kind="asset",
                value_type=asset_slot.media_type,
                is_required=asset_slot.required,
                position=offset + index,
                definition=asset_slot.model_dump(
                    mode="json",
                    exclude_none=True,
                ),
                created_at=now,
            )
        )
    return slots


def _serialize_version(
    definition: WorkflowTemplateDefinition,
    version: WorkflowTemplateVersion,
) -> dict:
    return {
        "template_id": definition.template_key,
        "scope": definition.scope,
        "version": version.version,
        "lifecycle": version.lifecycle,
        "fingerprint": version.fingerprint,
        "manifest": version.manifest,
        "published_at": version.published_at,
    }
