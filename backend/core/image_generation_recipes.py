from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


ImageGenerationRecipeId = Literal["character-sheet", "scene-multiview"]


@dataclass(frozen=True)
class ImageGenerationRecipe:
    id: ImageGenerationRecipeId
    version: int
    output_size: str
    prompt: str


IMAGE_GENERATION_RECIPES: dict[ImageGenerationRecipeId, ImageGenerationRecipe] = {
    "character-sheet": ImageGenerationRecipe(
        id="character-sheet",
        version=1,
        output_size="1024x768",
        prompt=(
            "Create one coherent horizontal character asset sheet on a clean white background using "
            "the provided image as the sole visual reference. Preserve the same identity, hairstyle, "
            "facial features, body proportions, outfit, accessories, palette, and rendering style. "
            "Arrange one primary full-body view, smaller front, side, and back views, four readable "
            "facial expressions, two or three natural poses, and close details of clothing or key "
            "accessories. Keep scale, anatomy, costume construction, and colors consistent across every "
            "view. Do not invent or replace identity, wardrobe, accessories, or art direction. Use a "
            "simple production-ready layout without decorative text or branding."
        ),
    ),
    "scene-multiview": ImageGenerationRecipe(
        id="scene-multiview",
        version=1,
        output_size="1024x768",
        prompt=(
            "Create one coherent horizontal scene multi-view board using the provided image as the sole "
            "visual reference. Preserve scene geometry, architecture, object placement, palette, "
            "atmosphere, time of day, lighting logic, and rendering style. Arrange one primary establishing "
            "view, complementary angles that describe the same space, and focused material and lighting "
            "details. Keep spatial relationships and visual continuity consistent across all panels. Do "
            "not invent or replace major structures, props, weather, palette, or art direction. Use a "
            "simple production-ready layout without decorative text or branding."
        ),
    ),
}


def resolve_image_generation_recipe(recipe_id: ImageGenerationRecipeId) -> ImageGenerationRecipe:
    return IMAGE_GENERATION_RECIPES[recipe_id]
