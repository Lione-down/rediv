# Revid V3 Workflow Template V1 Behavior Matrix

- Status: `FROZEN / V1`
- Date: `2026-07-28`
- Schema: [`revid-workflow-template.v1.schema.json`](contracts/revid-workflow-template.v1.schema.json)
- Canonical fixture:
  [`portable-manifest.json`](contracts/fixtures/workflow-template/portable-manifest.json)
- Authority: this matrix and the schema refine the approved
  [Reusable Cinematic Template PRD](REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md). Runtime behavior starts in T6-018;
  T6-017 performs no database, Canvas, quota, job, or provider mutation.

## 1. Frozen V1 product defaults

| Decision | V1 contract |
|---|---|
| Scope | Built-in plus user-owned `private`; no team/public marketplace |
| Built-in seeds | Three categories: product ad, knowledge/talking-head, multi-shot narrative |
| Publish | Private publish creates an immutable version; edits create a new version |
| Upgrade | Exact version pin; compatible upgrade is explicit and never overwrites local overrides |
| Import/export | Deferred beyond V1 |
| Text model selector | No Pro Alpha selector in V1 |
| Image 2.0 precomposition | Explicit user action only; never automatic or silent |
| Cost display | Backend-authoritative quota units plus cost class; no hard-coded currency |
| Assets | Rebind in target project and revalidate owner, project, status, and source revision |
| Legacy Graph Template | Remains readable; new capture/parameterization is introduced additively |
| Human acceptance | Intermediate machine checks do not equal Human acceptance; final journey gate is T6-027 |

## 2. Contract objects and ownership

| Object | Portable fields | Server/runtime fields | V1 behavior |
|---|---|---|---|
| Definition | `template_id`, scope, metadata | owner identity, timestamps | Stable identity; owner comes from authenticated context, not manifest |
| Version | version number, manifest, fingerprint | persistence ID, audit fields | Published versions immutable |
| Variable | key, type, required, label, bounded defaults/constraints | resolved runtime value | Only declared scalar/bounded-list types |
| Asset slot | slot ID, media/role, cardinality, revision policy | bound asset/project/owner/revision | No private asset ID in portable manifest |
| Graph node | local ID, node type/subtype | remapped Canvas node ID | Local IDs are deterministic template-local references |
| Connection | local ID, source/target local IDs and ports | remapped connection ID | Endpoints must reference declared nodes |
| Step | step ID, node local ID, intent, model policy, inputs, dependencies, capabilities | job/provider task/result/quota state | DAG only; no executable script, endpoint, header, or token |
| Binding | slot/value or target-project asset binding | authenticated owner/project validation | Stale or foreign binding fails closed |
| Instance | exact template/version, target project/canvas, preflight fingerprint, node map | Canvas revision and audit lineage | Instantiation is separate from execution |
| Workflow run | instance, preflight fingerprint, durable step states | job IDs and result lineage | Introduced after explicit run confirmation, never by manifest parsing |
| Provider projection | sanitized contract ID, intent, supported request shape | credentials, endpoint selection, raw response | Adapter remains provider authority |

## 3. Field portability

The normative cases are
[`non-portable-cases.json`](contracts/fixtures/workflow-template/non-portable-cases.json).

| Classification | Behavior | Examples |
|---|---|---|
| `portable` | Preserve after strict validation | layout, literal metadata, declared policy |
| `remap_local_id` | Preserve local reference; allocate new stable Canvas ID on instantiate | graph node/connection local IDs |
| `promote_to_asset_slot` | Replace source-project asset reference with declared slot | `canvas.project_asset_id` |
| `revalidate_binding` | Keep requested revision policy; validate target binding at preflight | `binding.source_revision` |
| `server_owned_reference` | Store symbolic reference only; backend appends current contract | `prompt.system_contract` |
| `strip` | Never serialize into a portable manifest | job/task/result/quota/owner/local-path fields |

Unknown fields fail closed in JSON Schema, Pydantic, and TypeScript. Capture must not silently downgrade an unknown
field to portable.

## 4. Canonicalization and fingerprint

1. Parse through the strict V1 manifest contract.
2. Remove absent optional values; do not add runtime fields.
3. Serialize with the repository RFC 8785-compatible canonical JSON authority.
4. Hash UTF-8 bytes with SHA-256.
5. The canonical fixture fingerprint is
   `bb3f4c5214f5e2ff18138d9ac8809cc7cdbcded8e0f3e03b729e1be9bb35bbbb`.
6. Backend and frontend must produce the identical canonical text and fingerprint.
7. Unsafe integers, non-finite numbers, lone surrogates, forged fingerprints, and unknown fields fail closed.

## 5. Provider projection matrix

Normative sanitized fixtures are
[`provider-projection-cases.json`](contracts/fixtures/workflow-template/provider-projection-cases.json).
They are contract evidence only and make no provider call.

| Intent | Contract ID | Supported input shape | Fail-closed boundary |
|---|---|---|---|
| Story production | `agnes.text.chat-completions.v1` | `agnes-2.5-flash`, messages, tool contract | No template-owned system prompt, endpoint, headers, token, or Pro Alpha selector |
| Image precomposition | `agnes.image-2.0.generations.v1` | Prompt plus 2–9 ordered images in `extra_body`; nested `response_format` | Explicit user action only; no `tags`; no top-level `response_format` |
| Shot image | `agnes.image-2.1.generations.v1` | Prompt, supported size/ratio, zero or one image in `extra_body` | No semantic multi-image fusion; no top-level `response_format` |
| Shot video | `agnes.video-v2.0.v1` | Text only, one top-level image, or 2–8 ordered keyframes | No `resolution`; no semantic role/scene/prop fusion; modes are mutually exclusive |

Video `num_frames` must be `1 + 8n` and no greater than `441`. Semantic identity/style/scene metadata remains Revid
business metadata; it is never projected as an unsupported Agnes Video field.

## 6. Security and mutation behavior

| Event | Result |
|---|---|
| Parse valid manifest | Return normalized typed data; zero side effects |
| Parse unknown/code/network/credential/runtime field | Reject before persistence or projection |
| Parse unsupported provider shape | Reject before adapter execution |
| Canonicalize/fingerprint | Pure deterministic computation |
| Provider-free preflight | T6-020; validates capability, asset, revision, DAG, quota units/cost class |
| Instantiate | T6-021; one atomic Canvas mutation after successful preflight |
| Execute | T6-025; only after explicit Human user action and fresh runtime preflight |

The normative abuse corpus is
[`security-abuse-cases.json`](contracts/fixtures/workflow-template/security-abuse-cases.json). Fixtures contain
sanitized dummy strings only and must never be replaced with real secrets, provider payloads, user content, or raw
responses.

## 7. Compatibility matrix

| Existing authority | V1 relationship |
|---|---|
| Legacy Graph Template | Readable and preserved; additive V3 objects do not break existing capture/instantiate routes |
| Canvas document patch | Sole graph write authority; T6-021 reuses its atomic stable-ID mutation |
| Typed command/history/autosave | All post-instance edits continue through the existing command path |
| Strict Story Production | Canonical Script intermediate representation; template adds lineage, not a second story model |
| T6-013 generation cards | Same-card status/result and compact durable-job boundary remain authoritative |
| Provider capability registry/adapters | Sole authority for executable model/request support |
| Workflow/Storyboard views | Projections of one canonical Canvas/Story state; no second store |

## 8. Version compatibility

V1 compatibility is additive-only:

- adding an optional variable or slot with a valid default may be compatible;
- widening documented metadata without changing execution semantics may be compatible;
- removing/renaming a node, port, step, required variable, asset slot, lock, or capability is incompatible;
- changing provider intent, dependency order, security policy, or result semantics is incompatible;
- upgrades are always previewed and explicitly accepted; otherwise an instance remains pinned or is cloned/detached.

The executable compatibility checker and upgrade workflow belong to T6-026.
