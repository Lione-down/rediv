from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


Identifier = str
Fingerprint = str


class StrictContractModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        allow_inf_nan=False,
        str_strip_whitespace=True,
    )


class WorkflowTemplateMetadata(StrictContractModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=64)
    tags: list[str] = Field(max_length=12)
    description: str = Field(min_length=1, max_length=500)


class WorkflowTemplateVariable(StrictContractModel):
    key: str = Field(pattern=r"^[a-z][a-z0-9_]{0,63}$")
    type: Literal["text", "multiline", "integer", "boolean", "enum", "bounded_list"]
    required: bool
    label: str = Field(min_length=1, max_length=120)
    default: str | int | bool | list[str] | None = None
    max_length: int | None = Field(default=None, ge=1, le=20_000)
    minimum: int | None = None
    maximum: int | None = None
    options: list[str] | None = Field(default=None, min_length=1, max_length=50)

    @model_validator(mode="after")
    def validate_type_contract(self) -> "WorkflowTemplateVariable":
        if self.minimum is not None and self.maximum is not None and self.minimum > self.maximum:
            raise ValueError("minimum must not exceed maximum")
        if self.type == "enum":
            if not self.options:
                raise ValueError("enum variables require options")
            if self.default is not None and self.default not in self.options:
                raise ValueError("enum default must be one of options")
        elif self.options is not None:
            raise ValueError("options are only valid for enum variables")
        if self.type == "integer":
            if self.default is not None and (
                isinstance(self.default, bool) or not isinstance(self.default, int)
            ):
                raise ValueError("integer default must be an integer")
        elif self.minimum is not None or self.maximum is not None:
            raise ValueError("minimum and maximum are only valid for integer variables")
        if self.type in {"text", "multiline"}:
            if self.default is not None and not isinstance(self.default, str):
                raise ValueError("text default must be a string")
        elif self.max_length is not None:
            raise ValueError("max_length is only valid for text variables")
        if self.type == "boolean" and self.default is not None and not isinstance(self.default, bool):
            raise ValueError("boolean default must be a boolean")
        if self.type == "bounded_list" and self.default is not None and not isinstance(
            self.default,
            list,
        ):
            raise ValueError("bounded_list default must be a list")
        return self


class WorkflowTemplateAssetSlot(StrictContractModel):
    slot_id: str = Field(pattern=r"^[a-z][a-z0-9_]{0,63}$")
    media_type: Literal["image", "video", "audio"]
    role: Literal["identity", "style", "subject", "first_frame", "last_frame", "reference"]
    required: bool
    minimum_items: int = Field(ge=0, le=9)
    maximum_items: int = Field(ge=1, le=9)
    revision_policy: Literal["exact", "latest_compatible"]

    @model_validator(mode="after")
    def validate_item_bounds(self) -> "WorkflowTemplateAssetSlot":
        if self.minimum_items > self.maximum_items:
            raise ValueError("minimum_items must not exceed maximum_items")
        return self


class WorkflowTemplateGraphNode(StrictContractModel):
    local_id: str = Field(pattern=r"^[a-z][a-z0-9_-]{0,63}$")
    node_type: Literal["text", "script", "generation", "group", "asset"]
    subtype: Literal["image", "video"] | None = None

    @model_validator(mode="after")
    def validate_subtype(self) -> "WorkflowTemplateGraphNode":
        if self.node_type == "generation" and self.subtype is None:
            raise ValueError("generation nodes require subtype")
        if self.node_type != "generation" and self.subtype is not None:
            raise ValueError("subtype is only valid for generation nodes")
        return self


class WorkflowTemplateGraphConnection(StrictContractModel):
    local_id: str = Field(pattern=r"^[a-z][a-z0-9_-]{0,63}$")
    source_node_local_id: Identifier
    source_port: str = Field(min_length=1, max_length=64)
    target_node_local_id: Identifier
    target_port: str = Field(min_length=1, max_length=64)


class WorkflowTemplateGraph(StrictContractModel):
    nodes: list[WorkflowTemplateGraphNode] = Field(min_length=1, max_length=250)
    connections: list[WorkflowTemplateGraphConnection] = Field(max_length=500)

    @model_validator(mode="after")
    def validate_graph(self) -> "WorkflowTemplateGraph":
        node_ids = [node.local_id for node in self.nodes]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError("graph node local IDs must be unique")
        connection_ids = [connection.local_id for connection in self.connections]
        if len(connection_ids) != len(set(connection_ids)):
            raise ValueError("graph connection local IDs must be unique")
        known_nodes = set(node_ids)
        for connection in self.connections:
            if (
                connection.source_node_local_id not in known_nodes
                or connection.target_node_local_id not in known_nodes
            ):
                raise ValueError("graph connection endpoints must reference declared nodes")
        return self


class WorkflowTemplateStep(StrictContractModel):
    step_id: str = Field(pattern=r"^[a-z][a-z0-9_-]{0,63}$")
    node_local_id: Identifier
    intent: Literal["story-production", "shot-image", "image-precomposition", "shot-video"]
    model_policy: Literal[
        "agnes-text-default",
        "agnes-image-quality-default",
        "agnes-image-precomposition",
        "agnes-video-default",
    ]
    input_bindings: list[Identifier] = Field(max_length=64)
    depends_on: list[Identifier] = Field(max_length=64)
    capability_requirements: list[str] = Field(min_length=1, max_length=16)


class WorkflowTemplateOverridePolicy(StrictContractModel):
    allowed_fields: list[str] = Field(max_length=100)
    locked_fields: list[str] = Field(min_length=1, max_length=100)


class WorkflowTemplateResultPolicy(StrictContractModel):
    same_card: Literal[True]
    image_batch_siblings: Literal[True]
    ingest_provider_media: Literal[True]


class WorkflowTemplateSecurity(StrictContractModel):
    arbitrary_code: Literal[False]
    auto_execute: Literal[False]
    cross_project_lookup: Literal[False]


class WorkflowTemplateManifest(StrictContractModel):
    schema_id: Literal["revid.workflow-template"]
    schema_version: Literal[1]
    template_id: str = Field(pattern=r"^[a-z][a-z0-9.-]{2,127}$")
    template_version: int = Field(ge=1)
    lifecycle: Literal["draft", "published", "retired"]
    scope: Literal["built_in", "private"]
    metadata: WorkflowTemplateMetadata
    variables: list[WorkflowTemplateVariable] = Field(max_length=100)
    asset_slots: list[WorkflowTemplateAssetSlot] = Field(max_length=50)
    graph: WorkflowTemplateGraph
    steps: list[WorkflowTemplateStep] = Field(min_length=1, max_length=100)
    override_policy: WorkflowTemplateOverridePolicy
    result_policy: WorkflowTemplateResultPolicy
    security: WorkflowTemplateSecurity

    @model_validator(mode="after")
    def validate_manifest_references(self) -> "WorkflowTemplateManifest":
        variable_keys = [variable.key for variable in self.variables]
        slot_ids = [slot.slot_id for slot in self.asset_slots]
        step_ids = [step.step_id for step in self.steps]
        for values, label in (
            (variable_keys, "variable keys"),
            (slot_ids, "asset slot IDs"),
            (step_ids, "step IDs"),
        ):
            if len(values) != len(set(values)):
                raise ValueError(f"{label} must be unique")

        graph_node_ids = {node.local_id for node in self.graph.nodes}
        input_ids = set(variable_keys) | set(slot_ids)
        known_steps = set(step_ids)
        dependencies: dict[str, set[str]] = {}
        for step in self.steps:
            if step.node_local_id not in graph_node_ids:
                raise ValueError("step node_local_id must reference a graph node")
            if not set(step.input_bindings).issubset(input_ids):
                raise ValueError("step input_bindings must reference variables or asset slots")
            if not set(step.depends_on).issubset(known_steps):
                raise ValueError("step dependencies must reference declared steps")
            if step.step_id in step.depends_on:
                raise ValueError("step cannot depend on itself")
            dependencies[step.step_id] = set(step.depends_on)

        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(step_id: str) -> None:
            if step_id in visiting:
                raise ValueError("step dependencies must be acyclic")
            if step_id in visited:
                return
            visiting.add(step_id)
            for dependency in dependencies[step_id]:
                visit(dependency)
            visiting.remove(step_id)
            visited.add(step_id)

        for step_id in step_ids:
            visit(step_id)
        return self


class WorkflowTemplateProviderProjection(StrictContractModel):
    name: str = Field(min_length=1, max_length=120)
    projection_version: Literal[1]
    provider: Literal["agnes"]
    contract_id: Literal[
        "agnes.text.chat-completions.v1",
        "agnes.image-2.0.generations.v1",
        "agnes.image-2.1.generations.v1",
        "agnes.video-v2.0.v1",
    ]
    intent: Literal["story-production", "image-precomposition", "shot-image", "shot-video"]
    request: dict[str, Any]

    @model_validator(mode="after")
    def validate_provider_request(self) -> "WorkflowTemplateProviderProjection":
        request = self.request
        contract = self.contract_id
        allowed: set[str]
        expected_model: str
        if contract == "agnes.text.chat-completions.v1":
            allowed = {"model", "messages", "tools"}
            expected_model = "agnes-2.5-flash"
            if self.intent != "story-production" or not request.get("messages") or not request.get("tools"):
                raise ValueError("text projection requires story intent, messages, and tools")
        elif contract == "agnes.image-2.0.generations.v1":
            allowed = {"model", "prompt", "extra_body"}
            expected_model = "agnes-image-2.0-flash"
            images = self._validate_extra_body({"image", "response_format"})
            if self.intent != "image-precomposition" or not 2 <= len(images) <= 9:
                raise ValueError("Image 2.0 precomposition requires two to nine images")
        elif contract == "agnes.image-2.1.generations.v1":
            allowed = {"model", "prompt", "size", "ratio", "extra_body"}
            expected_model = "agnes-image-2.1-flash"
            images = self._validate_extra_body({"image", "response_format"})
            if self.intent != "shot-image" or len(images) > 1:
                raise ValueError("Image 2.1 accepts at most one reference image")
            if request.get("size") not in {"1K", "2K", "4K"}:
                raise ValueError("Image 2.1 size is invalid")
        else:
            allowed = {
                "model",
                "prompt",
                "image",
                "negative_prompt",
                "width",
                "height",
                "num_frames",
                "frame_rate",
                "seed",
                "extra_body",
            }
            expected_model = "agnes-video-v2.0"
            if self.intent != "shot-video":
                raise ValueError("video projection requires shot-video intent")
            self._validate_video_request()

        if set(request) - allowed:
            raise ValueError("provider request contains unsupported fields")
        if request.get("model") != expected_model or not isinstance(request.get("prompt"), str):
            if contract == "agnes.text.chat-completions.v1" and request.get("model") == expected_model:
                return self
            raise ValueError("provider request model or prompt is invalid")
        return self

    def _validate_extra_body(self, allowed: set[str]) -> list[Any]:
        extra_body = self.request.get("extra_body")
        if not isinstance(extra_body, dict) or set(extra_body) - allowed:
            raise ValueError("provider extra_body is invalid")
        if extra_body.get("response_format") != "url":
            raise ValueError("image response_format must be nested and url")
        images = extra_body.get("image")
        if not isinstance(images, list) or not all(isinstance(item, str) for item in images):
            raise ValueError("provider image references must be a list of strings")
        return images

    def _validate_video_request(self) -> None:
        request = self.request
        frame_count = request.get("num_frames")
        if (
            not isinstance(frame_count, int)
            or isinstance(frame_count, bool)
            or frame_count < 1
            or frame_count > 441
            or (frame_count - 1) % 8 != 0
        ):
            raise ValueError("video num_frames must be 1 + 8n and no greater than 441")
        extra_body = request.get("extra_body")
        image = request.get("image")
        if extra_body is not None:
            if image is not None or not isinstance(extra_body, dict):
                raise ValueError("video single-image and keyframe modes are exclusive")
            if set(extra_body) != {"mode", "image"} or extra_body.get("mode") != "keyframes":
                raise ValueError("video keyframe extra_body is invalid")
            images = extra_body.get("image")
            if not isinstance(images, list) or not 2 <= len(images) <= 8:
                raise ValueError("video keyframes require two to eight ordered images")
        elif image is not None and not isinstance(image, str):
            raise ValueError("video image must be a string")


class WorkflowTemplateBinding(StrictContractModel):
    slot_id: Identifier
    binding_type: Literal["asset", "value"]
    value: str | int | bool | list[str] | None = None
    asset_id: str | None = None
    source_revision: int | None = Field(default=None, ge=1)
    project_id: str
    owner_id: str


class WorkflowTemplateInstance(StrictContractModel):
    instance_id: str
    template_id: str
    template_version: int = Field(ge=1)
    project_id: str
    canvas_id: str
    state: Literal["preflighted", "instantiated", "detached"]
    preflight_fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")
    node_id_map: dict[str, str]


class WorkflowRunStep(StrictContractModel):
    step_id: str
    state: Literal["pending", "ready", "running", "succeeded", "failed", "blocked"]


class WorkflowRun(StrictContractModel):
    run_id: str
    instance_id: str
    state: Literal["ready", "running", "succeeded", "failed", "blocked"]
    preflight_fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")
    steps: list[WorkflowRunStep]


class WorkflowTemplateDefinition(StrictContractModel):
    template_id: str
    scope: Literal["built_in", "private"]
    owner_id: str | None = None
    latest_version: int = Field(ge=1)


class WorkflowTemplateVersionRef(StrictContractModel):
    template_id: str
    template_version: int = Field(ge=1)
    fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")


class WorkflowTemplatePreflight(StrictContractModel):
    template: WorkflowTemplateVersionRef
    project_id: str
    canvas_id: str
    bindings: list[WorkflowTemplateBinding]
    fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")


class WorkflowTemplateLifecycleCreateRequest(StrictContractModel):
    manifest: dict[str, Any]


class WorkflowTemplateLifecycleUpdateRequest(StrictContractModel):
    manifest: dict[str, Any]


class WorkflowTemplateLifecycleNewVersionRequest(StrictContractModel):
    source_version: int = Field(ge=1)


class WorkflowTemplateLifecycleResponse(StrictContractModel):
    template_id: str
    scope: Literal["built_in", "private"]
    version: int = Field(ge=1)
    lifecycle: Literal["draft", "published", "retired"]
    fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")
    manifest: WorkflowTemplateManifest
    published_at: datetime | None


class WorkflowTemplateLifecycleListResponse(StrictContractModel):
    items: list[WorkflowTemplateLifecycleResponse]
    total: int = Field(ge=0)
