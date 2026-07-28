from __future__ import annotations

from schemas.story_production import StoryProductionDocument


class StoryDirectorPromptError(ValueError):
    pass


def compile_story_shot_prompt(
    document: StoryProductionDocument,
    *,
    shot_id: str,
) -> str:
    shot = next((candidate for candidate in document.shots if candidate.shot_id == shot_id), None)
    if shot is None:
        raise StoryDirectorPromptError("Unknown story-production shot")

    lines = [f"Current shot: {shot.video_prompt}"]
    continuity = document.continuity
    if continuity.observed_end_state:
        lines.append(f"Accepted opening state: {continuity.observed_end_state}")
    if shot.continuity_locks:
        lines.append(f"Continuity locks: {', '.join(shot.continuity_locks)}")

    references = {
        reference.reference_id: reference
        for reference in document.references
    }
    for reference_id in shot.reference_ids:
        reference = references[reference_id]
        exclusions = ", ".join(reference.must_not_transfer)
        lines.append(
            f"Reference {reference.role}: {reference.instruction}; "
            f"must not transfer: {exclusions}"
        )

    event_summaries = {
        event.event_id: event.summary
        for event in document.story.events
    }
    if shot.reserved_beat_ids:
        reserved = [event_summaries[event_id] for event_id in shot.reserved_beat_ids]
        lines.append(f"Reserved beats, do not consume: {' | '.join(reserved)}")
    return "\n".join(lines)
