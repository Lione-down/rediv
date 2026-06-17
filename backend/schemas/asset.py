from pydantic import BaseModel, Field


class AssetCreateRequest(BaseModel):
    type: str = Field(pattern="^(prompt|image|video)$")
    url: str | None = None
    content_text: str | None = None
