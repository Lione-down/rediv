from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: str


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
