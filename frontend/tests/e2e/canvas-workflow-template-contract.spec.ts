import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'


const fixtureRoot = resolve(
  process.cwd(),
  '..',
  'ai',
  'requirements',
  'contracts',
  'fixtures',
  'workflow-template',
)

async function loadFixture<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(resolve(fixtureRoot, name), 'utf-8')) as T
}

async function loadContract() {
  return import('../../src/modules/template/workflow-template-contract')
}

function setPath(payload: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.')
  let current: unknown = payload
  for (const part of parts.slice(0, -1)) {
    if (Array.isArray(current)) current = current[Number(part)]
    else {
      const record = current as Record<string, unknown>
      if (!(part in record)) record[part] = {}
      current = record[part]
    }
  }
  if (Array.isArray(current)) current[Number(parts.at(-1))] = value
  else (current as Record<string, unknown>)[parts.at(-1)!] = value
}

test('portable workflow template manifest parses and fingerprints identically', async () => {
  const contract = await loadContract()
  const payload = await loadFixture<Record<string, unknown>>('portable-manifest.json')

  const parsed = contract.parseWorkflowTemplateManifest(payload)

  expect(parsed.schema_id).toBe('revid.workflow-template')
  expect(parsed.schema_version).toBe(1)
  expect(contract.canonicalWorkflowTemplateJson(parsed)).toBe(
    contract.canonicalWorkflowTemplateJson(payload),
  )
  await expect(contract.fingerprintWorkflowTemplate(parsed)).resolves.toBe(
    'bb3f4c5214f5e2ff18138d9ac8809cc7cdbcded8e0f3e03b729e1be9bb35bbbb',
  )
  parsed.metadata.description = '合法 Unicode 🎬 模板'
  await expect(contract.fingerprintWorkflowTemplate(parsed)).resolves.toBe(
    '2eae599df2da5793d24b3f3ba16ff1220c8cd11333d4727ac673e22913062f23',
  )
})

test('security abuse fixtures fail closed in the TypeScript parser', async () => {
  const contract = await loadContract()
  const portable = await loadFixture<Record<string, unknown>>('portable-manifest.json')
  const cases = await loadFixture<Array<{ name: string; path: string; value: unknown }>>(
    'security-abuse-cases.json',
  )

  for (const fixture of cases) {
    const payload = structuredClone(portable)
    setPath(payload, fixture.path, fixture.value)
    expect(() => contract.parseWorkflowTemplateManifest(payload), fixture.name).toThrow()
  }
})

test('portable classifier and provider projection fixtures match the frozen matrix', async () => {
  const contract = await loadContract()
  const portability = await loadFixture<Array<{ path: string; classification: string }>>(
    'non-portable-cases.json',
  )
  const projections = await loadFixture<Record<string, unknown>[]>(
    'provider-projection-cases.json',
  )
  const projectionAbuse = await loadFixture<
    Array<{ name: string; base_index: number; path: string; value: unknown }>
  >('provider-projection-abuse-cases.json')

  expect(portability.map((fixture) => contract.classifyWorkflowTemplateField(fixture.path))).toEqual(
    portability.map((fixture) => fixture.classification),
  )
  expect(projections.map(contract.parseWorkflowTemplateProviderProjection)).toHaveLength(6)
  expect(JSON.stringify(projections)).not.toContain('"resolution"')
  expect(JSON.stringify(projections)).not.toContain('"tags"')
  for (const fixture of projectionAbuse) {
    const payload = structuredClone(projections[fixture.base_index])
    setPath(payload, fixture.path, fixture.value)
    expect(
      () => contract.parseWorkflowTemplateProviderProjection(payload),
      fixture.name,
    ).toThrow()
  }
})
