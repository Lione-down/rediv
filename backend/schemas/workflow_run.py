from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import Field

from schemas.workflow_template import Fingerprint, StrictContractModel


WorkflowRunStatus = Literal[
    "ready",
    "submitting",
    "queued",
    "running",
    "persisting",
    "succeeded",
    "failed",
    "cancelled",
]
WorkflowRunStepStatus = Literal[
    "draft",
    "ready",
    "submitting",
    "queued",
    "running",
    "persisting",
    "succeeded",
    "failed",
    "blocked",
    "cancelled",
]


class WorkflowRunPreflightRequest(StrictContractModel):
    cost_confirmed: bool = False


class WorkflowRunStartRequest(StrictContractModel):
    client_run_id: str = Field(min_length=1, max_length=64)
    preflight_fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")
    cost_confirmed: bool = False


class WorkflowRunStepResponse(StrictContractModel):
    run_step_id: str
    instance_step_id: str
    step_id: str
    node_id: str
    status: WorkflowRunStepStatus
    generation_job_id: str | None
    result_asset_id: str | None
    error_code: str | None


class WorkflowRunResponse(StrictContractModel):
    run_id: str
    instance_id: str
    status: WorkflowRunStatus
    preflight_fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")
    quota_estimate: dict[str, int]
    cost_class: str
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    steps: list[WorkflowRunStepResponse]
