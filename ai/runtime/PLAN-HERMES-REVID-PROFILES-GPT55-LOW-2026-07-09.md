# Hermes Revid Profiles GPT-5.5 Low Plan

## Goal

Set the five Revid Hermes sub-agent profiles to use `gpt-5.5` with low reasoning effort.

## Scope

- `C:\Users\mkd\AppData\Local\hermes\profiles\revid-backend\config.yaml`
- `C:\Users\mkd\AppData\Local\hermes\profiles\revid-dispatcher\config.yaml`
- `C:\Users\mkd\AppData\Local\hermes\profiles\revid-frontend\config.yaml`
- `C:\Users\mkd\AppData\Local\hermes\profiles\revid-pm\config.yaml`
- `C:\Users\mkd\AppData\Local\hermes\profiles\revid-reviewer\config.yaml`

## Changes

1. Set `model.provider` to `openai-codex`.
2. Set `model.default` to `gpt-5.5`.
3. Set top-level `agent.reasoning_effort` to `low`; add it where missing.

## Verification

Run a read-only field check over the five profile configs and confirm each profile reports:

- `provider = openai-codex`
- `default = gpt-5.5`
- `reasoning_effort = low`
