from __future__ import annotations

import unittest

from core.audio_generation_contract import build_audio_generation_capabilities


class AudioGenerationContractTestCase(unittest.TestCase):
    def test_production_audio_capability_is_versioned_and_explicitly_unavailable(self) -> None:
        self.assertEqual(
            {
                "contract_version": 2,
                "execution_mode": "unavailable",
                "models": [],
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
            },
            build_audio_generation_capabilities(),
        )


if __name__ == "__main__":
    unittest.main()
