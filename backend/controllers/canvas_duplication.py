from __future__ import annotations

from copy import deepcopy

from core.cinematic_skill_contract import cinematic_source_revision
from models.canvas_node import CanvasNode


def duplicate_node_content(
    source_node: CanvasNode,
    children: list[CanvasNode],
    node_id_map: dict[str, str],
) -> dict:
    content = deepcopy(source_node.content)
    if isinstance(content, dict):
        source_script_node_id = content.get("source_script_node_id")
        if isinstance(source_script_node_id, str) and source_script_node_id in node_id_map:
            content["source_script_node_id"] = node_id_map[source_script_node_id]
        cinematic_skill = content.get("cinematic_skill")
        if isinstance(cinematic_skill, dict) and cinematic_skill.get("contract_version") == 1:
            mentions = cinematic_skill.get("mentions")
            if isinstance(mentions, list):
                remapped_mentions = []
                for mention in mentions:
                    if not isinstance(mention, dict) or set(mention) != {
                        "node_id", "role", "instruction", "source_revision",
                    }:
                        remapped_mentions = []
                        break
                    node_id = mention.get("node_id")
                    if not isinstance(node_id, str) or node_id not in node_id_map:
                        remapped_mentions = []
                        break
                    remapped_mentions.append({**mention, "node_id": node_id_map[node_id]})
                if len(remapped_mentions) == len(mentions):
                    cinematic_skill["mentions"] = remapped_mentions
        sequence = content.get("cinematic_sequence")
        if (
            isinstance(sequence, dict)
            and sequence.get("contract_version") == 1
            and sequence.get("schema_id") == "revid.cinematic-sequence"
        ):
            sequence_source_id = sequence.get("source_script_node_id")
            if isinstance(sequence_source_id, str) and sequence_source_id in node_id_map:
                remapped_source_id = node_id_map[sequence_source_id]
                sequence["source_script_node_id"] = remapped_source_id
                sequence["sequence_id"] = f"sequence-{remapped_source_id}"[:96]
                director_brief = sequence.get("director_brief")
                if isinstance(director_brief, dict):
                    director_brief["source_script_node_id"] = remapped_source_id
            clips = sequence.get("clips")
            if isinstance(clips, list):
                for clip in clips:
                    if not isinstance(clip, dict) or clip.get("state") != "accepted":
                        continue
                    result_id = clip.get("accepted_result_node_id")
                    if isinstance(result_id, str) and result_id in node_id_map:
                        clip["accepted_result_node_id"] = node_id_map[result_id]
                    else:
                        clip.update({
                            "state": "rejected",
                            "accepted_result_node_id": None,
                            "accepted_result_revision": None,
                            "observed_end_state": None,
                        })
    ordered_child_ids = content.get("ordered_child_ids") if isinstance(content, dict) else None
    is_storyboard_common = (
        source_node.node_type == "group"
        and isinstance(content, dict)
        and content.get("subtype") == "storyboard"
        and type(content.get("serialization_version")) is int
        and content["serialization_version"] == 1
        and content.get("aspect_ratio") in {"16:9", "9:16", "1:1", "4:3"}
        and type(content.get("columns")) is int
        and 1 <= content["columns"] <= 5
        and type(content.get("show_numbers")) is bool
        and isinstance(ordered_child_ids, list)
        and 2 <= len(ordered_child_ids) <= 25
        and all(type(child_id) is str for child_id in ordered_child_ids)
        and len(set(ordered_child_ids)) == len(ordered_child_ids)
    )
    if not is_storyboard_common:
        return content

    children_by_id = {child.id: child for child in children}
    has_exact_children = (
        len(children_by_id) == len(ordered_child_ids)
        and set(children_by_id) == set(ordered_child_ids)
    )
    is_storyboard_v1 = (
        type(content.get("storyboard_schema_version")) is int
        and content["storyboard_schema_version"] == 1
    )
    has_exact_image_children = is_storyboard_v1 and has_exact_children and all(
        child.node_type in {"asset", "result"}
        and isinstance(child.content, dict)
        and child.content.get("subtype") == "image"
        and (
            (
                type(child.content.get("serialization_version")) is int
                and child.content["serialization_version"] == 1
            )
            or (
                child.node_type == "asset"
                and "serialization_version" not in child.content
            )
        )
        and not child.is_locked
        and child.parent_node_id == source_node.id
        for child in children
    )
    is_shot_storyboard_v2 = (
        type(content.get("storyboard_schema_version")) is int
        and content["storyboard_schema_version"] == 2
        and content.get("storyboard_kind") == "shot-plan"
        and type(content.get("shot_schema_version")) is int
        and content["shot_schema_version"] in {1, 2}
    )
    shot_indices = [
        child.content.get("shot_index")
        for child in children
        if isinstance(child.content, dict)
    ]
    has_exact_shot_children = is_shot_storyboard_v2 and has_exact_children and all(
        child.node_type == "generation"
        and isinstance(child.content, dict)
        and child.content.get("subtype") == "image"
        and type(child.content.get("serialization_version")) is int
        and child.content["serialization_version"] == 1
        and type(child.content.get("shot_schema_version")) is int
        and child.content["shot_schema_version"] in {1, 2}
        and type(child.content.get("shot_index")) is int
        and 1 <= child.content["shot_index"] <= len(ordered_child_ids)
        and child.content.get("shot_id") == f"shot-{child.content['shot_index']:02d}"
        and isinstance(child.content.get("shot_title"), str)
        and bool(child.content["shot_title"].strip())
        and len(child.content["shot_title"]) <= 80
        and not child.is_locked
        and child.parent_node_id == source_node.id
        for child_id in ordered_child_ids
        for child in [children_by_id[child_id]]
    ) and set(shot_indices) == set(range(1, len(ordered_child_ids) + 1))
    if not has_exact_image_children and not has_exact_shot_children:
        return content

    content["ordered_child_ids"] = [node_id_map[child_id] for child_id in ordered_child_ids]
    return content


def refresh_duplicated_cinematic_revisions(duplicated_nodes: dict[str, CanvasNode]) -> None:
    nodes_by_new_id = {node.id: node for node in duplicated_nodes.values()}

    def revision(node: CanvasNode) -> str:
        return cinematic_source_revision({
            "id": node.id,
            "node_type": node.node_type,
            "content": node.content,
            "parent_node_id": node.parent_node_id,
            "status": node.status,
        })

    for duplicated in duplicated_nodes.values():
        content = duplicated.content
        if not isinstance(content, dict):
            continue
        source_script_node_id = content.get("source_script_node_id")
        if isinstance(source_script_node_id, str) and source_script_node_id in nodes_by_new_id:
            content["source_revision"] = revision(nodes_by_new_id[source_script_node_id])
        cinematic_skill = content.get("cinematic_skill")
        mentions = cinematic_skill.get("mentions") if isinstance(cinematic_skill, dict) else None
        if isinstance(mentions, list):
            for mention in mentions:
                node_id = mention.get("node_id") if isinstance(mention, dict) else None
                if isinstance(node_id, str) and node_id in nodes_by_new_id:
                    mention["source_revision"] = revision(nodes_by_new_id[node_id])
        sequence = content.get("cinematic_sequence")
        if not isinstance(sequence, dict) or sequence.get("schema_id") != "revid.cinematic-sequence":
            continue
        sequence_source_id = sequence.get("source_script_node_id")
        if isinstance(sequence_source_id, str) and sequence_source_id in nodes_by_new_id:
            source_revision = revision(nodes_by_new_id[sequence_source_id])
            sequence["source_revision"] = source_revision
            director_brief = sequence.get("director_brief")
            if isinstance(director_brief, dict):
                director_brief["source_revision"] = source_revision
        clips = sequence.get("clips")
        if isinstance(clips, list):
            for clip in clips:
                result_id = clip.get("accepted_result_node_id") if isinstance(clip, dict) else None
                if isinstance(result_id, str) and result_id in nodes_by_new_id:
                    clip["accepted_result_revision"] = revision(nodes_by_new_id[result_id])
