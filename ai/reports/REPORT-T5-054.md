# REPORT-T5-054 - Ordered multi-generation edge identity

## Result

`DONE - PASS`

Selected generation connections now expose their exact ordered role as `Tn`, `Rn`, or `Vn`. The identity comes from the same authoritative generation context and result lineage used by request previews, provider inputs, provenance markers, reload inspection, and result navigation.

Excluded prompt or reference edges keep their contextual order but add a muted `未参与` state. They remain understandable in the graph without being misrepresented as provider inputs. Inspection continues to change selection only and creates no document PATCH.

## Verification

- Browser RED: PASS; generic prompt, reference, and result labels reproduced before implementation.
- Production build: PASS, 4,813 modules transformed.
- Focused ordered edge verification: PASS, 5/5.
- Related context, reorder, selection composition, remix, lineage, insertion, reroute, keyboard, and readonly regression: PASS, 69/69.
- Provider equality: PASS; reversed T/R persistence produced exact prompt provenance and image IDs `asset-character`, then `asset-reference`.
- Result equality: PASS; V1..V6 matched canonical result connection order, including V2 selection.
- Excluded state: PASS; duplicate R3 stayed visible as `未参与` and never entered provider image IDs.
- Persistence and mutation: PASS; reload preserved R1 identity and inspection produced zero document PATCH.
- Responsive visual review: PASS at 1440x900, 920x760, and readonly 375x812.

## Retained evidence

- `output/playwright/t5-054-ordered-edge-identity/ordered-v2-result-edge-1440x900.png`
- `output/playwright/t5-054-ordered-edge-identity/excluded-r3-edge-920x760.png`
- `output/playwright/t5-054-ordered-edge-identity/excluded-r3-edge-readonly-375x812.png`

## Deferred

Edge-driven reorder, permanent labels, provider limit changes, editable connection metadata, real provider calls, and result-order persistence changes remain outside T5-054.
