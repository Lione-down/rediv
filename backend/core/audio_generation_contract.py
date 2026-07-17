from __future__ import annotations

from typing import Any


AUDIO_CAPABILITY_CONTRACT_VERSION = 1


def build_audio_generation_capabilities() -> dict[str, Any]:
    """Describe the current production audio boundary without claiming execution."""
    return {
        "contract_version": AUDIO_CAPABILITY_CONTRACT_VERSION,
        "execution_mode": "unavailable",
        "model": None,
        "generation_modes": [],
        "provider_generation_modes": [],
        "audio_driven_video_modes": [],
        "provider_audio_driven_video_modes": [],
        "quota": {
            "available": False,
            "quota_type": None,
            "unit_estimate": None,
        },
        "task": {
            "available": False,
            "cancel_supported": False,
            "resume_supported": False,
        },
    }
