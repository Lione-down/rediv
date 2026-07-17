from fastapi import APIRouter, Depends

from api.canvases import map_canvas_domain_error
from controllers import canvases as canvas_controller
from controllers.shot_schemas import generate_mock_shot_schema
from core.security import current_user
from schemas.shot_schema import ShotSchemaDocument, ShotSchemaGenerateRequest


router = APIRouter(
    prefix="/api/projects/{project_id}/canvases/{canvas_id}/shot-schema",
    tags=["shot-schema"],
)


@router.post("", response_model=ShotSchemaDocument)
def create_shot_schema(
    project_id: str,
    canvas_id: str,
    payload: ShotSchemaGenerateRequest,
    user=Depends(current_user),
):
    try:
        canvas_controller.get_canvas(project_id, canvas_id, user["id"])
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
    return generate_mock_shot_schema(project_id, canvas_id, payload)
