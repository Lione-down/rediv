import type {
  WorkflowTemplateAssetSlot,
  WorkflowTemplateGraphConnection,
  WorkflowTemplateGraphNode,
  WorkflowTemplateManifest,
  WorkflowTemplateProviderProjection,
  WorkflowTemplateStep,
  WorkflowTemplateVariable,
} from './types'
import {
  assertEnum,
  assertInteger,
  assertKeys,
  assertNoLoneSurrogates,
  assertRecord,
  assertString,
  assertStringArray,
  type JsonRecord,
} from './workflow-template-contract-guards'


export type WorkflowTemplateFieldClassification =
  | 'portable'
  | 'remap_local_id'
  | 'promote_to_asset_slot'
  | 'revalidate_binding'
  | 'strip'
  | 'server_owned_reference'

const identifierPattern = /^[a-z][a-z0-9_-]{0,63}$/
const templateIdPattern = /^[a-z][a-z0-9.-]{2,127}$/

function parseVariable(value: unknown): WorkflowTemplateVariable {
  const variable = assertRecord(value, 'variable')
  assertKeys(
    variable,
    ['key', 'type', 'required', 'label'],
    ['default', 'max_length', 'minimum', 'maximum', 'options'],
    'variable',
  )
  assertString(variable.key, 'variable.key', /^[a-z][a-z0-9_]{0,63}$/)
  assertEnum(
    variable.type,
    ['text', 'multiline', 'integer', 'boolean', 'enum', 'bounded_list'],
    'variable.type',
  )
  if (typeof variable.required !== 'boolean') throw new TypeError('variable.required must be boolean')
  assertString(variable.label, 'variable.label')
  if (variable.max_length !== undefined) assertInteger(variable.max_length, 'max_length', 1, 20_000)
  if (variable.minimum !== undefined) assertInteger(variable.minimum, 'minimum')
  if (variable.maximum !== undefined) assertInteger(variable.maximum, 'maximum')
  if (
    variable.minimum !== undefined
    && variable.maximum !== undefined
    && variable.minimum > variable.maximum
  ) {
    throw new TypeError('minimum must not exceed maximum')
  }
  if (variable.options !== undefined) assertStringArray(variable.options, 'options', 1, 50)
  if (variable.type === 'enum') {
    if (!variable.options || (variable.default !== undefined && !variable.options.includes(String(variable.default)))) {
      throw new TypeError('enum variable requires matching options')
    }
  } else if (variable.options !== undefined) {
    throw new TypeError('options are only valid for enum')
  }
  if (variable.type === 'integer') {
    if (variable.default !== undefined) assertInteger(variable.default, 'integer default')
  } else if (variable.minimum !== undefined || variable.maximum !== undefined) {
    throw new TypeError('integer bounds are only valid for integer variables')
  }
  if (variable.type === 'text' || variable.type === 'multiline') {
    if (variable.default !== undefined && typeof variable.default !== 'string') {
      throw new TypeError('text default must be string')
    }
  } else if (variable.max_length !== undefined) {
    throw new TypeError('max_length is only valid for text variables')
  }
  if (variable.type === 'boolean' && variable.default !== undefined && typeof variable.default !== 'boolean') {
    throw new TypeError('boolean default must be boolean')
  }
  if (
    variable.type === 'bounded_list'
    && variable.default !== undefined
    && (!Array.isArray(variable.default) || variable.default.some((item) => typeof item !== 'string'))
  ) {
    throw new TypeError('bounded_list default must be string array')
  }
  return variable as unknown as WorkflowTemplateVariable
}

function parseAssetSlot(value: unknown): WorkflowTemplateAssetSlot {
  const slot = assertRecord(value, 'asset slot')
  assertKeys(
    slot,
    ['slot_id', 'media_type', 'role', 'required', 'minimum_items', 'maximum_items', 'revision_policy'],
    [],
    'asset slot',
  )
  assertString(slot.slot_id, 'slot_id', /^[a-z][a-z0-9_]{0,63}$/)
  assertEnum(slot.media_type, ['image', 'video', 'audio'], 'media_type')
  assertEnum(
    slot.role,
    ['identity', 'style', 'subject', 'first_frame', 'last_frame', 'reference'],
    'role',
  )
  if (typeof slot.required !== 'boolean') throw new TypeError('required must be boolean')
  assertInteger(slot.minimum_items, 'minimum_items', 0, 9)
  assertInteger(slot.maximum_items, 'maximum_items', 1, 9)
  if (slot.minimum_items > slot.maximum_items) throw new TypeError('invalid asset slot bounds')
  assertEnum(slot.revision_policy, ['exact', 'latest_compatible'], 'revision_policy')
  return slot as unknown as WorkflowTemplateAssetSlot
}

function parseGraphNode(value: unknown): WorkflowTemplateGraphNode {
  const node = assertRecord(value, 'graph node')
  assertKeys(node, ['local_id', 'node_type'], ['subtype'], 'graph node')
  assertString(node.local_id, 'node.local_id', identifierPattern)
  assertEnum(node.node_type, ['text', 'script', 'generation', 'group', 'asset'], 'node_type')
  if (node.subtype !== undefined) assertEnum(node.subtype, ['image', 'video'], 'subtype')
  if ((node.node_type === 'generation') !== (node.subtype !== undefined)) {
    throw new TypeError('generation subtype contract is invalid')
  }
  return node as unknown as WorkflowTemplateGraphNode
}

function parseGraphConnection(value: unknown): WorkflowTemplateGraphConnection {
  const connection = assertRecord(value, 'graph connection')
  assertKeys(
    connection,
    ['local_id', 'source_node_local_id', 'source_port', 'target_node_local_id', 'target_port'],
    [],
    'graph connection',
  )
  assertString(connection.local_id, 'connection.local_id', identifierPattern)
  assertString(connection.source_node_local_id, 'source_node_local_id', identifierPattern)
  assertString(connection.source_port, 'source_port')
  assertString(connection.target_node_local_id, 'target_node_local_id', identifierPattern)
  assertString(connection.target_port, 'target_port')
  return connection as unknown as WorkflowTemplateGraphConnection
}

function parseStep(value: unknown): WorkflowTemplateStep {
  const step = assertRecord(value, 'step')
  assertKeys(
    step,
    [
      'step_id',
      'node_local_id',
      'intent',
      'model_policy',
      'input_bindings',
      'depends_on',
      'capability_requirements',
    ],
    [],
    'step',
  )
  assertString(step.step_id, 'step_id', identifierPattern)
  assertString(step.node_local_id, 'node_local_id', identifierPattern)
  assertEnum(
    step.intent,
    ['story-production', 'shot-image', 'image-precomposition', 'shot-video'],
    'intent',
  )
  assertEnum(
    step.model_policy,
    [
      'agnes-text-default',
      'agnes-image-quality-default',
      'agnes-image-precomposition',
      'agnes-video-default',
    ],
    'model_policy',
  )
  assertStringArray(step.input_bindings, 'input_bindings', 0, 64)
  assertStringArray(step.depends_on, 'depends_on', 0, 64)
  assertStringArray(step.capability_requirements, 'capability_requirements', 1, 16)
  return step as unknown as WorkflowTemplateStep
}

export function parseWorkflowTemplateManifest(value: unknown): WorkflowTemplateManifest {
  const manifest = assertRecord(value, 'workflow template manifest')
  assertKeys(
    manifest,
    [
      'schema_id',
      'schema_version',
      'template_id',
      'template_version',
      'lifecycle',
      'scope',
      'metadata',
      'variables',
      'asset_slots',
      'graph',
      'steps',
      'override_policy',
      'result_policy',
      'security',
    ],
    [],
    'workflow template manifest',
  )
  if (manifest.schema_id !== 'revid.workflow-template' || manifest.schema_version !== 1) {
    throw new TypeError('workflow template schema identity is unsupported')
  }
  assertString(manifest.template_id, 'template_id', templateIdPattern)
  assertInteger(manifest.template_version, 'template_version', 1)
  assertEnum(manifest.lifecycle, ['draft', 'published', 'retired'], 'lifecycle')
  assertEnum(manifest.scope, ['built_in', 'private'], 'scope')

  const metadata = assertRecord(manifest.metadata, 'metadata')
  assertKeys(metadata, ['name', 'category', 'tags', 'description'], [], 'metadata')
  assertString(metadata.name, 'metadata.name')
  assertString(metadata.category, 'metadata.category')
  assertStringArray(metadata.tags, 'metadata.tags', 0, 12)
  assertString(metadata.description, 'metadata.description')

  if (!Array.isArray(manifest.variables) || manifest.variables.length > 100) {
    throw new TypeError('variables must be a bounded array')
  }
  const variables = manifest.variables.map(parseVariable)
  if (!Array.isArray(manifest.asset_slots) || manifest.asset_slots.length > 50) {
    throw new TypeError('asset_slots must be a bounded array')
  }
  const assetSlots = manifest.asset_slots.map(parseAssetSlot)

  const graph = assertRecord(manifest.graph, 'graph')
  assertKeys(graph, ['nodes', 'connections'], [], 'graph')
  if (!Array.isArray(graph.nodes) || !graph.nodes.length || graph.nodes.length > 250) {
    throw new TypeError('graph nodes must be a bounded non-empty array')
  }
  if (!Array.isArray(graph.connections) || graph.connections.length > 500) {
    throw new TypeError('graph connections must be a bounded array')
  }
  const nodes = graph.nodes.map(parseGraphNode)
  const connections = graph.connections.map(parseGraphConnection)
  const nodeIds = nodes.map((node) => node.local_id)
  const connectionIds = connections.map((connection) => connection.local_id)
  assertUnique(nodeIds, 'node local IDs')
  assertUnique(connectionIds, 'connection local IDs')
  const knownNodes = new Set(nodeIds)
  if (
    connections.some(
      (connection) =>
        !knownNodes.has(connection.source_node_local_id)
        || !knownNodes.has(connection.target_node_local_id),
    )
  ) {
    throw new TypeError('graph connection endpoint is unknown')
  }

  if (!Array.isArray(manifest.steps) || !manifest.steps.length || manifest.steps.length > 100) {
    throw new TypeError('steps must be a bounded non-empty array')
  }
  const steps = manifest.steps.map(parseStep)
  const variableKeys = variables.map((variable) => variable.key)
  const slotIds = assetSlots.map((slot) => slot.slot_id)
  const stepIds = steps.map((step) => step.step_id)
  assertUnique(variableKeys, 'variable keys')
  assertUnique(slotIds, 'asset slot IDs')
  assertUnique(stepIds, 'step IDs')
  const inputIds = new Set([...variableKeys, ...slotIds])
  const knownSteps = new Set(stepIds)
  for (const step of steps) {
    if (
      !knownNodes.has(step.node_local_id)
      || step.input_bindings.some((binding) => !inputIds.has(binding))
      || step.depends_on.some((dependency) => !knownSteps.has(dependency) || dependency === step.step_id)
    ) {
      throw new TypeError('step references are invalid')
    }
  }
  assertAcyclic(steps)

  parseStringListPolicy(manifest.override_policy, 'override_policy')
  parseLiteralPolicy(
    manifest.result_policy,
    ['same_card', 'image_batch_siblings', 'ingest_provider_media'],
    true,
    'result_policy',
  )
  parseLiteralPolicy(
    manifest.security,
    ['arbitrary_code', 'auto_execute', 'cross_project_lookup'],
    false,
    'security',
  )
  return structuredClone(manifest) as unknown as WorkflowTemplateManifest
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new TypeError(`${label} must be unique`)
}

function assertAcyclic(steps: WorkflowTemplateStep[]): void {
  const dependencies = new Map(steps.map((step) => [step.step_id, step.depends_on]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (stepId: string) => {
    if (visiting.has(stepId)) throw new TypeError('step dependencies must be acyclic')
    if (visited.has(stepId)) return
    visiting.add(stepId)
    dependencies.get(stepId)!.forEach(visit)
    visiting.delete(stepId)
    visited.add(stepId)
  }
  steps.forEach((step) => visit(step.step_id))
}

function parseStringListPolicy(value: unknown, label: string): void {
  const policy = assertRecord(value, label)
  assertKeys(policy, ['allowed_fields', 'locked_fields'], [], label)
  assertStringArray(policy.allowed_fields, `${label}.allowed_fields`, 0, 100)
  assertStringArray(policy.locked_fields, `${label}.locked_fields`, 1, 100)
}

function parseLiteralPolicy(
  value: unknown,
  keys: string[],
  expected: boolean,
  label: string,
): void {
  const policy = assertRecord(value, label)
  assertKeys(policy, keys, [], label)
  if (keys.some((key) => policy[key] !== expected)) {
    throw new TypeError(`${label} contains an unsafe value`)
  }
}

export function parseWorkflowTemplateProviderProjection(
  value: unknown,
): WorkflowTemplateProviderProjection {
  const projection = assertRecord(value, 'provider projection')
  assertKeys(
    projection,
    ['name', 'projection_version', 'provider', 'contract_id', 'intent', 'request'],
    [],
    'provider projection',
  )
  assertString(projection.name, 'projection.name')
  if (projection.projection_version !== 1 || projection.provider !== 'agnes') {
    throw new TypeError('provider projection identity is unsupported')
  }
  assertEnum(
    projection.contract_id,
    [
      'agnes.text.chat-completions.v1',
      'agnes.image-2.0.generations.v1',
      'agnes.image-2.1.generations.v1',
      'agnes.video-v2.0.v1',
    ],
    'contract_id',
  )
  assertEnum(
    projection.intent,
    ['story-production', 'image-precomposition', 'shot-image', 'shot-video'],
    'intent',
  )
  const request = assertRecord(projection.request, 'provider request')
  validateProviderRequest(projection.contract_id, projection.intent, request)
  return structuredClone(projection) as unknown as WorkflowTemplateProviderProjection
}

function validateProviderRequest(contractId: string, intent: string, request: JsonRecord): void {
  if (contractId === 'agnes.text.chat-completions.v1') {
    assertKeys(request, ['model', 'messages', 'tools'], [], 'text request')
    if (
      request.model !== 'agnes-2.5-flash'
      || intent !== 'story-production'
      || !Array.isArray(request.messages)
      || !request.messages.length
      || !Array.isArray(request.tools)
      || !request.tools.length
    ) {
      throw new TypeError('text provider request is invalid')
    }
    return
  }
  if (contractId === 'agnes.image-2.0.generations.v1') {
    assertKeys(request, ['model', 'prompt', 'extra_body'], [], 'Image 2.0 request')
    const images = parseImageExtraBody(request.extra_body)
    if (
      request.model !== 'agnes-image-2.0-flash'
      || intent !== 'image-precomposition'
      || images.length < 2
      || images.length > 9
    ) {
      throw new TypeError('Image 2.0 provider request is invalid')
    }
    assertString(request.prompt, 'image prompt')
    return
  }
  if (contractId === 'agnes.image-2.1.generations.v1') {
    assertKeys(request, ['model', 'prompt', 'size', 'ratio', 'extra_body'], [], 'Image 2.1 request')
    const images = parseImageExtraBody(request.extra_body)
    if (
      request.model !== 'agnes-image-2.1-flash'
      || intent !== 'shot-image'
      || images.length > 1
    ) {
      throw new TypeError('Image 2.1 provider request is invalid')
    }
    assertString(request.prompt, 'image prompt')
    assertEnum(request.size, ['1K', '2K', '4K'], 'image size')
    assertString(request.ratio, 'image ratio')
    return
  }
  assertKeys(
    request,
    ['model', 'prompt', 'width', 'height', 'num_frames', 'frame_rate'],
    ['image', 'negative_prompt', 'seed', 'extra_body'],
    'video request',
  )
  if (request.model !== 'agnes-video-v2.0' || intent !== 'shot-video') {
    throw new TypeError('video provider identity is invalid')
  }
  assertString(request.prompt, 'video prompt')
  assertInteger(request.width, 'video width', 1)
  assertInteger(request.height, 'video height', 1)
  assertInteger(request.frame_rate, 'video frame_rate', 1)
  assertInteger(request.num_frames, 'video num_frames', 1, 441)
  if ((request.num_frames - 1) % 8 !== 0) throw new TypeError('num_frames must be 1 + 8n')
  if (request.image !== undefined) assertString(request.image, 'video image')
  if (request.negative_prompt !== undefined) assertString(request.negative_prompt, 'negative_prompt')
  if (request.seed !== undefined) assertInteger(request.seed, 'seed')
  if (request.extra_body !== undefined) {
    if (request.image !== undefined) throw new TypeError('video image modes are exclusive')
    const extra = assertRecord(request.extra_body, 'video extra_body')
    assertKeys(extra, ['mode', 'image'], [], 'video extra_body')
    if (extra.mode !== 'keyframes') throw new TypeError('video mode is unsupported')
    assertStringArray(extra.image, 'video keyframes', 2, 8)
  }
}

function parseImageExtraBody(value: unknown): string[] {
  const extra = assertRecord(value, 'image extra_body')
  assertKeys(extra, ['image', 'response_format'], [], 'image extra_body')
  if (extra.response_format !== 'url') throw new TypeError('image response_format must be url')
  assertStringArray(extra.image, 'image references', 0, 9)
  return extra.image
}

export function classifyWorkflowTemplateField(path: string): WorkflowTemplateFieldClassification {
  if (path === 'graph.nodes.*.local_id' || path === 'graph.connections.*.local_id') {
    return 'remap_local_id'
  }
  if (path === 'canvas.project_asset_id') return 'promote_to_asset_slot'
  if (path === 'binding.source_revision') return 'revalidate_binding'
  if (path === 'prompt.system_contract') return 'server_owned_reference'
  if (
    path.startsWith('generation.')
    || path.startsWith('billing.')
    || path.startsWith('ownership.')
    || path.startsWith('runtime.')
  ) {
    return 'strip'
  }
  if (path === 'layout.position') return 'portable'
  throw new TypeError('workflow_template_field_unclassified')
}

export function canonicalWorkflowTemplateJson(value: unknown): string {
  return canonicalJson(parseWorkflowTemplateManifest(value))
}

export async function fingerprintWorkflowTemplate(value: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(canonicalWorkflowTemplateJson(value))
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function canonicalJson(value: unknown): string {
  if (value === null) return 'null'
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isSafeInteger(value)) {
      throw new TypeError('canonical JSON accepts only finite safe integers in this contract')
    }
    return Object.is(value, -0) ? '0' : String(value)
  }
  if (typeof value === 'string') {
    assertNoLoneSurrogates(value)
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value === 'object' && value !== null) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${canonicalJson(key)}:${canonicalJson((value as JsonRecord)[key])}`)
      .join(',')}}`
  }
  throw new TypeError(`unsupported canonical JSON value: ${typeof value}`)
}
