const SHOT_CONTROL_DEFAULTS = {
  angle: 'eye-level', framing: 'medium', focus: 'deep', lighting: 'natural', temporal: 'hold',
} as const

export const GENERATION_CAPABILITIES = {
  contract_version: 3,
  image: {
    model: 'agnes-image-2.1-flash', size: '1K',
    aspect_ratios: ['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9'],
    default_aspect_ratio: '4:3',
    operations: {
      contract_version: 1,
      supported_operations: ['expand', 'inpaint', 'erase', 'cutout', 'upscale', 'region', 'fusion'],
      provider_operations: ['expand', 'inpaint', 'erase', 'cutout', 'upscale', 'fusion'],
      region_coordinate_space: 'source-normalized',
      max_fusion_images: 8,
      upscale_factors: [2, 4],
    },
    shot_controls: {
      contract_version: 1,
      supported_controls: ['angle', 'framing', 'focus', 'lighting'],
      provider_controls: ['angle', 'framing', 'focus', 'lighting'],
      defaults: SHOT_CONTROL_DEFAULTS,
    },
  },
  video: {
    model: 'agnes-video-v2.0', width: 1152, height: 768,
    aspect_ratios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    default_aspect_ratio: '16:9',
    reference_modes: ['text-to-video', 'image-to-video', 'keyframes'],
    default_duration_seconds: 5, min_keyframes: 2, max_keyframes: 8,
    duration_presets: [
      { duration_seconds: 3, num_frames: 81, frame_rate: 24 },
      { duration_seconds: 5, num_frames: 121, frame_rate: 24 },
      { duration_seconds: 10, num_frames: 241, frame_rate: 24 },
      { duration_seconds: 18, num_frames: 441, frame_rate: 24 },
    ],
    shot_controls: {
      contract_version: 1,
      supported_controls: ['angle', 'framing', 'focus', 'lighting', 'temporal'],
      provider_controls: ['angle', 'framing', 'focus', 'lighting', 'temporal'],
      defaults: SHOT_CONTROL_DEFAULTS,
    },
  },
} as const

export const GENERATION_CAPABILITIES_V6 = {
  ...GENERATION_CAPABILITIES,
  contract_version: 6,
  text: {
    contract_version: 2,
    available: true,
    models: [{
      id: 'agnes-2.0-flash',
      label: 'Agnes 2.0 Flash',
      workflow_modes: ['text-to-video'],
    }, {
      id: 'agnes-2.5-flash',
      label: 'Agnes 2.5 Flash',
      workflow_modes: ['text-to-video'],
    }],
    intents: ['script_draft', 'script_refine'],
    locales: ['zh-CN', 'en-US'],
    default_locale: 'zh-CN',
    brief_max_length: 4000,
    source_max_length: 12000,
    output_max_length: 12000,
    creates_media: false,
    runs_cinematic_decomposition: false,
    story_director: {
      available: true,
      request_contract_version: 1,
    },
  },
  image: {
    ...GENERATION_CAPABILITIES.image,
    output_counts: [1, 2, 3, 4],
    default_output_count: 1,
  },
  video: {
    ...GENERATION_CAPABILITIES.video,
    aspect_ratio_dimensions: {
      '16:9': { width: 1152, height: 648 },
      '9:16': { width: 648, height: 1152 },
      '1:1': { width: 768, height: 768 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 },
    },
    reference_roles: ['first-frame', 'last-frame', 'reference'],
    max_references: 9,
  },
  audio: {
    contract_version: 1,
    execution_mode: 'unavailable',
    model: null,
    generation_modes: [],
    provider_generation_modes: [],
    audio_driven_video_modes: [],
    provider_audio_driven_video_modes: [],
    quota: { available: false, quota_type: null, unit_estimate: null },
    task: { available: false, cancel_supported: false, resume_supported: false },
  },
} as const

export function createMockGenerationRequestParameters(
  mediaType: 'image' | 'video',
  requestBody: Record<string, unknown>,
) {
  const imageIds = Array.isArray(requestBody.image_ids) ? requestBody.image_ids : []
  const handoff = requestBody.cinematic_handoff as Record<string, unknown> | undefined
  const submittedPreflight = handoff?.submitted_preflight as Record<string, unknown> | undefined
  const cinematicSkill = handoff && submittedPreflight ? {
    cinematic_skill: {
      contract_version: 1,
      skill_id: handoff.skill_id,
      skill_version: handoff.skill_version,
      canvas_revision: handoff.canvas_revision,
      capability_version: 1,
      canonical_request: submittedPreflight.canonical_request,
      request_digest: submittedPreflight.request_digest,
    },
  } : {}
  if (mediaType === 'image') {
    return {
      contract_version: 1, media_type: 'image', model: GENERATION_CAPABILITIES.image.model,
      size: requestBody.generation_recipe_id ? '1024x768' : GENERATION_CAPABILITIES.image.size,
      aspect_ratio: requestBody.generation_recipe_id ? '4:3' : requestBody.aspect_ratio,
      image_ids: imageIds,
      ...(requestBody.output_count ? { output_count: requestBody.output_count } : {}),
      ...(requestBody.generation_recipe_id ? {
        generation_recipe_id: requestBody.generation_recipe_id,
        generation_recipe_version: requestBody.generation_recipe_version,
      } : {}),
      ...(requestBody.image_operation ? { image_operation: requestBody.image_operation } : {}),
      ...(requestBody.shot_controls ? { shot_controls: requestBody.shot_controls } : {}),
      ...(requestBody.batch ? { batch: requestBody.batch } : {}),
      ...cinematicSkill,
    }
  }
  const videoReferences = Array.isArray(requestBody.video_references)
    ? requestBody.video_references as Array<Record<string, unknown>>
    : null
  const structuredImageIds = videoReferences?.map((binding) => binding.asset_id) ?? imageIds
  const structuredMode = videoReferences
    ? videoReferences.length === 0
      ? 'text-to-video'
      : videoReferences.length === 1 && videoReferences[0]?.role === 'first-frame'
        ? 'image-to-video'
        : 'keyframes'
    : requestBody.reference_mode
  const durationSeconds = Number(requestBody.duration_seconds ?? 5)
  const framePreset = GENERATION_CAPABILITIES.video.duration_presets.find((preset) => (
    preset.duration_seconds === durationSeconds
  ))
  return {
    contract_version: 1, media_type: 'video', model: GENERATION_CAPABILITIES.video.model,
    reference_mode: structuredMode, duration_seconds: durationSeconds,
    num_frames: framePreset?.num_frames, frame_rate: framePreset?.frame_rate,
    aspect_ratio: requestBody.aspect_ratio ?? GENERATION_CAPABILITIES.video.default_aspect_ratio,
    width: GENERATION_CAPABILITIES.video.width, height: GENERATION_CAPABILITIES.video.height,
    image_ids: structuredImageIds,
    ...(videoReferences ? { video_references: videoReferences } : {}),
    ...(requestBody.shot_controls ? { shot_controls: requestBody.shot_controls } : {}),
    ...cinematicSkill,
  }
}
