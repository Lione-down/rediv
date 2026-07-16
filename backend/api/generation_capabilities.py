from fastapi import APIRouter, Depends

from core.generation_parameter_contract import build_generation_capabilities
from core.security import current_user


router = APIRouter(
    prefix="/api/generation-capabilities",
    tags=["generation-capabilities"],
)


@router.get("")
def get_generation_capabilities(_user=Depends(current_user)):
    return build_generation_capabilities()
