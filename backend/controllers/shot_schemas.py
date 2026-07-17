from __future__ import annotations

from schemas.shot_schema import (
    ShotSchemaDocument,
    ShotSchemaGenerateRequest,
    ShotSchemaShot,
)


_SCRIPT_BOUNDARIES = frozenset({"。", "！", "？", "!", "?", "；", ";"})


def _script_fragments(script: str) -> list[str]:
    fragments: list[str] = []
    buffer: list[str] = []
    for character in script:
        if character == "\n":
            normalized = " ".join("".join(buffer).split()).strip()
            if normalized:
                fragments.append(normalized[:500])
            buffer = []
            continue
        if character.isspace() and not buffer:
            continue
        buffer.append(character)
        if character in _SCRIPT_BOUNDARIES:
            normalized = " ".join("".join(buffer).split()).strip()
            if normalized:
                fragments.append(normalized[:500])
            buffer = []
    normalized = " ".join("".join(buffer).split()).strip()
    if normalized:
        fragments.append(normalized[:500])
    return fragments or [" ".join(script.split()).strip()[:500]]


def generate_mock_shot_schema(
    project_id: str,
    canvas_id: str,
    request: ShotSchemaGenerateRequest,
) -> ShotSchemaDocument:
    fragments = _script_fragments(request.script)
    shot_count = request.requested_shot_count or max(2, min(8, len(fragments)))
    shots = []
    for offset in range(shot_count):
        index = offset + 1
        narrative = fragments[offset % len(fragments)]
        shots.append(ShotSchemaShot(
            shot_id=f"shot-{index:02d}",
            index=index,
            title=f"镜头 {index:02d}",
            narrative=narrative,
            image_prompt=narrative,
        ))
    return ShotSchemaDocument(
        contract_version=1,
        schema_id="revid.shot-sequence",
        provider="mock",
        model="revid-shot-mock-v1",
        project_id=project_id,
        canvas_id=canvas_id,
        source_script_node_id=request.source_script_node_id,
        aspect_ratio="16:9",
        shot_count=shot_count,
        shots=shots,
    )
