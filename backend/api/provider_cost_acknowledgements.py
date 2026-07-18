from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from controllers import provider_cost_acknowledgements as acknowledgement_controller
from core.security import current_user


router = APIRouter(prefix="/api/provider-cost-acknowledgements", tags=["provider-cost-acknowledgements"])


class ProviderCostAcknowledgementRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    duration_hours: int | None = Field(default=None, ge=1, le=720)


class ProviderCostAcknowledgementResponse(BaseModel):
    user_id: str
    provider_id: str
    acknowledged_until: datetime | None
    cancelled_at: datetime | None
    active: bool


@router.get("/{provider_id}", response_model=ProviderCostAcknowledgementResponse)
def get_provider_cost_acknowledgement(provider_id: str, user=Depends(current_user)):
    return acknowledgement_controller.get_acknowledgement(user["id"], provider_id)


@router.post("/{provider_id}", response_model=ProviderCostAcknowledgementResponse)
def acknowledge_provider_cost(
    provider_id: str,
    payload: ProviderCostAcknowledgementRequest,
    user=Depends(current_user),
):
    return acknowledgement_controller.acknowledge_provider_cost(
        user["id"], provider_id, payload.duration_hours,
    )


@router.delete("/{provider_id}", response_model=ProviderCostAcknowledgementResponse)
def cancel_provider_cost_acknowledgement(provider_id: str, user=Depends(current_user)):
    return acknowledgement_controller.cancel_acknowledgement(user["id"], provider_id)
