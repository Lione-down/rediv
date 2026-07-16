export const GENERATION_CAPABILITIES = {
  contract_version: 1,
  image: {
    model: 'agnes-image-2.1-flash', size: '1K',
    aspect_ratios: ['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9'],
    default_aspect_ratio: '4:3',
  },
  video: {
    model: 'agnes-video-v2.0', width: 1152, height: 768,
    reference_modes: ['text-to-video', 'image-to-video', 'keyframes'],
    default_duration_seconds: 5, min_keyframes: 2, max_keyframes: 8,
    duration_presets: [
      { duration_seconds: 3, num_frames: 81, frame_rate: 24 },
      { duration_seconds: 5, num_frames: 121, frame_rate: 24 },
      { duration_seconds: 10, num_frames: 241, frame_rate: 24 },
      { duration_seconds: 18, num_frames: 441, frame_rate: 24 },
    ],
  },
} as const

export function createMockGenerationRequestParameters(
  mediaType: 'image' | 'video',
  requestBody: Record<string, unknown>,
) {
  const imageIds = Array.isArray(requestBody.image_ids) ? requestBody.image_ids : []
  if (mediaType === 'image') {
    return {
      contract_version: 1, media_type: 'image', model: GENERATION_CAPABILITIES.image.model,
      size: requestBody.generation_recipe_id ? '1024x768' : GENERATION_CAPABILITIES.image.size,
      aspect_ratio: requestBody.generation_recipe_id ? '4:3' : requestBody.aspect_ratio,
      image_ids: imageIds,
      ...(requestBody.generation_recipe_id ? {
        generation_recipe_id: requestBody.generation_recipe_id,
        generation_recipe_version: requestBody.generation_recipe_version,
      } : {}),
    }
  }
  const durationSeconds = Number(requestBody.duration_seconds ?? 5)
  const framePreset = GENERATION_CAPABILITIES.video.duration_presets.find((preset) => (
    preset.duration_seconds === durationSeconds
  ))
  return {
    contract_version: 1, media_type: 'video', model: GENERATION_CAPABILITIES.video.model,
    reference_mode: requestBody.reference_mode, duration_seconds: durationSeconds,
    num_frames: framePreset?.num_frames, frame_rate: framePreset?.frame_rate,
    width: GENERATION_CAPABILITIES.video.width, height: GENERATION_CAPABILITIES.video.height,
    image_ids: imageIds,
  }
}
