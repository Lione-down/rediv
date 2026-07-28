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


IMAGE_GENERATION_RECIPES: dict[tuple[ImageGenerationRecipeId, int], ImageGenerationRecipe] = {
    ("character-sheet", 1): ImageGenerationRecipe(
        id="character-sheet",
        version=1,
        output_size="1K",
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
    ("scene-multiview", 1): ImageGenerationRecipe(
        id="scene-multiview",
        version=1,
        output_size="1K",
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
    ("character-sheet", 2): ImageGenerationRecipe(
        id="character-sheet",
        version=2,
        output_size="1K",
        prompt=(
            "Create one coherent horizontal character asset sheet on a clean white background using "
            "the provided image as the sole visual reference. First inspect the supplied reference and "
            "lock its source medium for every panel. A photographic source requires photorealistic "
            "photographic output only, with consistent camera, lens, lighting, skin, hair, fabric, and "
            "material behavior. An illustrated source must preserve its line quality, shading language, "
            "proportions, palette, and rendering technique. A 3D source must preserve its geometry, "
            "materials, lighting, lens and render character. Preserve the same person and all observable "
            "facial structure, hairstyle, hair color and texture, body proportions, outfit construction, "
            "accessories, colors, and materials in every panel. Do not introduce anime, cartoon, "
            "painterly, or 3D conversion, face replacement, beautification, age shift, ethnicity shift, "
            "wardrobe redesign, or invented accessories. A clean white background changes only the board "
            "environment, never the subject medium or identity. Arrange one primary full-body view, "
            "smaller front, side, and back views, four readable facial expressions, two or three natural "
            "poses, and close details of existing clothing or accessories. Infer unseen side or back "
            "details minimally and only for continuity. Use a production-ready layout without decorative "
            "text or branding."
        ),
    ),
    ("scene-multiview", 2): ImageGenerationRecipe(
        id="scene-multiview",
        version=2,
        output_size="1K",
        prompt=(
            "Create one coherent horizontal scene multi-view board using the provided image as the sole "
            "visual reference. First inspect the supplied reference and lock its source medium for every "
            "panel. A photographic source requires photorealistic photographic output only. An "
            "illustrated source must preserve its line quality, shading language, proportions, palette, "
            "and rendering technique. A 3D source must preserve geometry, materials, lighting, lens and "
            "render character. Preserve the same scene geometry, architecture, object identity and "
            "placement, palette, materials, atmosphere, weather, time of day, light direction, exposure, "
            "and lighting continuity across all views. Do not introduce anime, cartoon, painterly, "
            "photographic, or 3D medium conversion; do not replace major structures, redesign objects, "
            "invent props, change weather, shift the palette, or alter the art direction. Arrange one "
            "primary establishing view, complementary angles that describe the same space, and focused "
            "material and lighting details. Infer unseen geometry minimally and only when required for "
            "spatial continuity. Use a production-ready layout without decorative text or branding."
        ),
    ),
}


def resolve_image_generation_recipe(
    recipe_id: ImageGenerationRecipeId,
    recipe_version: int | None = None,
) -> ImageGenerationRecipe:
    key = (recipe_id, 1 if recipe_version is None else recipe_version)
    recipe = IMAGE_GENERATION_RECIPES.get(key)
    if recipe is None:
        raise ValueError("unknown image generation recipe version")
    return recipe
