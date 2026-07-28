from __future__ import annotations

from collections.abc import Awaitable, Callable

from core.story_director_contract import (
    StoryDirectorOutputError,
    parse_story_director_output,
)
from core.story_director_skill import build_story_director_messages
from schemas.story_production import StoryProductionDocument, StoryTemplateLineage


StoryDirectorGenerator = Callable[..., str]
AsyncStoryDirectorGenerator = Callable[..., Awaitable[str]]


class StoryDirectorExecutionError(ValueError):
    pass


def execute_story_director(
    *,
    source_text: str,
    source_node_id: str,
    source_revision: str,
    model_id: str,
    requested_shot_count: int | None,
    generate: StoryDirectorGenerator,
    template_lineage: StoryTemplateLineage | None = None,
) -> StoryProductionDocument:
    messages = build_story_director_messages(
        source_text=source_text,
        source_node_id=source_node_id,
        source_revision=source_revision,
        model_id=model_id,
        requested_shot_count=requested_shot_count,
    )
    for attempt in range(2):
        raw = generate(model_id=model_id, messages=messages)
        try:
            return parse_story_director_output(
                raw,
                source_node_id=source_node_id,
                source_revision=source_revision,
                model_id=model_id,
                template_lineage=template_lineage,
            )
        except StoryDirectorOutputError as error:
            if attempt == 1:
                raise StoryDirectorExecutionError(
                    "Story director returned invalid structured output after bounded repair"
                ) from error
            messages = [
                *messages,
                {"role": "assistant", "content": raw},
                {
                    "role": "user",
                    "content": (
                        "Repair the prior response. Return one complete strict JSON "
                        "revid.provider-storyboard version 1 object only, using the exact "
                        "fields requested by the original system message."
                    ),
                },
            ]
    raise StoryDirectorExecutionError("Story director execution did not complete")


async def execute_story_director_async(
    *,
    source_text: str,
    source_node_id: str,
    source_revision: str,
    model_id: str,
    requested_shot_count: int | None,
    generate: AsyncStoryDirectorGenerator,
    template_lineage: StoryTemplateLineage | None = None,
) -> StoryProductionDocument:
    messages = build_story_director_messages(
        source_text=source_text,
        source_node_id=source_node_id,
        source_revision=source_revision,
        model_id=model_id,
        requested_shot_count=requested_shot_count,
    )
    for attempt in range(2):
        raw = await generate(model_id=model_id, messages=messages)
        try:
            return parse_story_director_output(
                raw,
                source_node_id=source_node_id,
                source_revision=source_revision,
                model_id=model_id,
                template_lineage=template_lineage,
            )
        except StoryDirectorOutputError as error:
            if attempt == 1:
                raise StoryDirectorExecutionError(
                    "Story director returned invalid structured output after bounded repair"
                ) from error
            messages = [
                *messages,
                {"role": "assistant", "content": raw},
                {
                    "role": "user",
                    "content": (
                        "Repair the prior response. Return one complete strict JSON "
                        "revid.provider-storyboard version 1 object only, using the exact "
                        "fields requested by the original system message."
                    ),
                },
            ]
    raise StoryDirectorExecutionError("Story director execution did not complete")
