import { expect, test } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Scenario {
  id: string
  viewport: string
  zoom_percent: number
  reference_file: { path: string; sha256: string }
  visual_status: 'PENDING' | 'MATCHED' | 'MISMATCH'
  functional_status: 'PENDING' | 'MATCHED' | 'MISMATCH'
  interaction_status: 'PENDING' | 'MATCHED' | 'MISMATCH'
  revid_extension_status: 'PENDING' | 'NOT_APPLICABLE' | 'EXTENSION_PRESERVED' | 'REGRESSION'
  excluded_surface_ids?: string[]
  [key: string]: unknown
}

interface Manifest {
  required_scenario_fields: string[]
  scenarios: Scenario[]
}

interface ActionMapping {
  id: string
  status: string
  tests: string[]
}

interface MappingDocument {
  counter_scope: string
  counters: Record<string, number>
  director_scope: string
  mapped_assertion_run: {
    files: string[]
    project: string
    report_relative_path: string
    report_sha256: string
    result: string
  }
  mappings: ActionMapping[]
  state: string
}

interface PlaywrightJsonReport {
  stats: {
    expected: number
    flaky: number
    skipped: number
    unexpected: number
  }
  suites: Array<{
    file: string
    specs: Array<{
      file: string
      ok: boolean
      title: string
      tests: Array<{
        projectName: string
        results: Array<{ status: string }>
        status: string
      }>
    }>
  }>
}

interface ManifestSchema {
  properties: {
    scenarios: {
      items: {
        additionalProperties: boolean
        properties: Record<string, unknown> & {
          reference_file: {
            additionalProperties: boolean
            properties: Record<string, unknown>
          }
        }
        required: string[]
      }
    }
  }
}

const evidenceRoot = resolve(process.cwd(), '..', 'ai', 'evidence', 't5-096')
const testRoot = resolve(process.cwd(), 'tests', 'e2e')
const assertions: Record<string, { file: string; title: string }> = {
  'L096-SHELL-EMPTY-1440': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-EMPTY-EXACT-MATRIX records exact empty viewports and zoom states' },
  'L096-SHELL-EMPTY-1366': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-EMPTY-EXACT-MATRIX records exact empty viewports and zoom states' },
  'L096-SHELL-EMPTY-920': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-EMPTY-EXACT-MATRIX records exact empty viewports and zoom states' },
  'L096-ZOOM-EMPTY-17': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-EMPTY-EXACT-MATRIX records exact empty viewports and zoom states' },
  'L096-ZOOM-EMPTY-36': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-EMPTY-EXACT-MATRIX records exact empty viewports and zoom states' },
  'L096-ZOOM-EMPTY-200': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-EMPTY-EXACT-MATRIX records exact empty viewports and zoom states' },
  'L096-DISCLOSURE-ADD-ESC': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-DISCLOSURE-ADD-ESC exposes the scoped nine-action catalog without mutation' },
  'L096-RAIL-DISCLOSURES-EMPTY-NATIVE': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-RAIL-DISCLOSURES-EMPTY-NATIVE matches the observed rail geometry across exact viewports' },
  'L096-AGENT-EMPTY-NATIVE': { file: 'canvas-agent-skill-preflight-ui.spec.ts', title: 'Agent/Skill Canvas context preflight is accessible, scoped, mock-only, and mutation-free' },
  'L096-STORYBOARD-EMPTY-NATIVE': { file: 'canvas-storyboard-workflow.spec.ts', title: 'switches one Canvas document into truthful Storyboard review lanes without persistence writes' },
  'L096-ASSET-MANAGER-EMPTY-NATIVE': { file: 'canvas-resource-generation.spec.ts', title: 'resource and generation drawers are keyboard complete at desktop and 920px' },
  'L096-MINIMAP-EMPTY-NATIVE': { file: 'canvas-command-interactions.spec.ts', title: 'view dock supports numeric zoom, fit, and independent grid edge minimap toggles' },
  'L096-GUIDE-NODES-WORKFLOW-SHELL': { file: 'canvas-storyboard-group-workflow.spec.ts', title: 'Workflow creates one durable storyboard group with exact history, reload, and whole-group movement compatibility' },
  'L096-SHARE-POPULATED-EXACT-MATRIX': { file: 'canvas-libtv-structural-parity.spec.ts', title: 'L096-STRUCTURAL-EDGE-CONTRACT keeps the public clean-room graph within two percent' },
  'L096-SHARE-IMAGE-SELECTED': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-POPULATED-CONTEXT records media-first graph and selected high-zoom context' },
  'L096-SHARE-POPULATED-HIGH-ZOOM-BOUNDARY': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-POPULATED-CONTEXT records media-first graph and selected high-zoom context' },
  'L096-SHARE-FOCUS-RESTORATION-BOUNDARY': { file: 'canvas-libtv-three-axis-parity.spec.ts', title: 'L096-REVID-POPULATED-CONTEXT records media-first graph and selected high-zoom context' },
}

test('L096-EVIDENCE-CONTRACT derives zero counters from executable scenario assertions', async () => {
  const manifest = JSON.parse(await readFile(resolve(evidenceRoot, 'official-canvas-scenario-manifest.json'), 'utf8')) as Manifest
  const schema = JSON.parse(await readFile(resolve(evidenceRoot, 'official-canvas-scenario-manifest.schema.json'), 'utf8')) as ManifestSchema
  const mappingBytes = await readFile(resolve(evidenceRoot, 'action-trace-mapping-2026-07-20.json'))
  const mapping = JSON.parse(mappingBytes.toString('utf8')) as MappingDocument
  const comparison = JSON.parse(await readFile(resolve(evidenceRoot, 'comparison-contract-2026-07-20.json'), 'utf8')) as {
    action_trace_mapping: { rows: number; sha256: string }
    exclusions: Array<{ classification: string; id: string }>
  }
  const acceptedViewports = new Set(['1440x900', '1366x768', '920x900', '1662x1138', '1440x900 / 1366x768 / 920x900'])
  const acceptedZooms = new Set([17, 28, 36, 39, 100, 200, 207])
  const scenarioIds = manifest.scenarios.map((scenario) => scenario.id).sort()
  const mappingIds = mapping.mappings.map((entry) => entry.id).sort()
  const scenarioSchema = schema.properties.scenarios.items
  const reportPath = resolve(process.cwd(), '..', mapping.mapped_assertion_run.report_relative_path)
  const reportBytes = await readFile(reportPath)
  const report = JSON.parse(reportBytes.toString('utf8')) as PlaywrightJsonReport
  const reportSpecs = report.suites.flatMap((suite) => suite.specs)
  const assertionFiles = [...new Set(Object.values(assertions).map((assertion) => assertion.file))].sort()

  expect(manifest.scenarios).toHaveLength(17)
  expect(mappingIds).toEqual(scenarioIds)
  expect(Object.keys(assertions).sort()).toEqual(scenarioIds)
  expect(scenarioSchema.additionalProperties).toBe(false)
  expect([...scenarioSchema.required].sort()).toEqual([...manifest.required_scenario_fields].sort())
  expect(mapping.mapped_assertion_run.files).toEqual(assertionFiles)
  expect(mapping.state).toBe('REGISTERED_ROWS_AUTOMATED_PASS_HUMAN_REVIEW_PENDING')
  expect(mapping.counter_scope).toBe('REGISTERED_NON_PAID_READ_ONLY_ROWS_ONLY; DECLARED_CHECKLIST_BOUNDARIES_AND_DIRECTOR_EXCLUSION_NOT_COUNTED')
  expect(mapping.mapped_assertion_run.project).toBe('chromium')
  expect(mapping.mapped_assertion_run.result).toBe(`${report.stats.expected}/${report.stats.expected} passed`)
  expect(createHash('sha256').update(reportBytes).digest('hex')).toBe(mapping.mapped_assertion_run.report_sha256)
  expect(comparison.action_trace_mapping.rows).toBe(mapping.mappings.length)
  expect(createHash('sha256').update(mappingBytes).digest('hex')).toBe(comparison.action_trace_mapping.sha256)
  expect(report.stats).toMatchObject({ expected: 34, skipped: 0, unexpected: 0, flaky: 0 })

  for (const scenario of manifest.scenarios) {
    expect(Object.keys(scenario).filter((key) => !(key in scenarioSchema.properties)), `${scenario.id}.additionalProperties`).toEqual([])
    for (const field of manifest.required_scenario_fields) expect(scenario[field], `${scenario.id}.${field}`).toBeDefined()
    expect(acceptedViewports.has(scenario.viewport), `${scenario.id}.viewport`).toBe(true)
    expect(acceptedZooms.has(scenario.zoom_percent), `${scenario.id}.zoom_percent`).toBe(true)
    expect(scenario.reference_file.path).toMatch(/^(output\/t5-096\/|ai\/evidence\/t5-096\/)/)
    expect(scenario.reference_file.sha256).toMatch(/^[a-f0-9]{64}$/)
    const referenceSchema = scenarioSchema.properties.reference_file
    expect(referenceSchema.additionalProperties).toBe(false)
    expect(
      Object.keys(scenario.reference_file).filter((key) => !(key in referenceSchema.properties)),
      `${scenario.id}.reference_file.additionalProperties`,
    ).toEqual([])
  }

  for (const entry of mapping.mappings) {
    const assertion = assertions[entry.id]
    expect(entry.status, entry.id).toBe('MATCHED')
    expect(entry.tests, entry.id).toContain(assertion.file)
    const source = await readFile(resolve(testRoot, assertion.file), 'utf8')
    expect(source, `${entry.id} missing executable assertion`).toContain(`test('${assertion.title}'`)
    const reportSpec = reportSpecs.find((spec) => spec.file === assertion.file && spec.title === assertion.title)
    expect(reportSpec, `${entry.id} missing reporter result`).toBeDefined()
    expect(reportSpec?.ok, `${entry.id} reporter result`).toBe(true)
    expect(reportSpec?.tests).toContainEqual(expect.objectContaining({
      projectName: mapping.mapped_assertion_run.project,
      status: 'expected',
      results: expect.arrayContaining([expect.objectContaining({ status: 'passed' })]),
    }))
  }

  const derivedCounters = {
    VISUAL_MISMATCH: manifest.scenarios.filter((scenario) => scenario.visual_status === 'MISMATCH').length,
    FUNCTIONAL_MISMATCH: manifest.scenarios.filter((scenario) => scenario.functional_status === 'MISMATCH').length,
    INTERACTION_MISMATCH: manifest.scenarios.filter((scenario) => scenario.interaction_status === 'MISMATCH').length,
    UNOBSERVED: manifest.scenarios.filter((scenario) => (
      scenario.visual_status === 'PENDING' || scenario.functional_status === 'PENDING' || scenario.interaction_status === 'PENDING'
    )).length,
    REVID_EXTENSION_REGRESSION: manifest.scenarios.filter((scenario) => scenario.revid_extension_status === 'REGRESSION').length,
  }
  expect(mapping.counters).toEqual(derivedCounters)
  expect(mapping.director_scope).toBe('HUMAN_EXCLUDED_NOT_APPLICABLE')
  expect(comparison.exclusions).toContainEqual({
    id: 'official_director_console',
    classification: 'HUMAN_EXCLUDED_NOT_APPLICABLE',
    official_region: expect.any(Object),
    reason: expect.any(String),
  })
  expect(manifest.scenarios.find((scenario) => scenario.id === 'L096-SHARE-POPULATED-EXACT-MATRIX')?.excluded_surface_ids)
    .toEqual(['official_director_console'])
})
