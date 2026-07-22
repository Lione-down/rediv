# T6-003 Unit 6N Official-Scale Square Capture

## Problem

The prior Human comparison paired two different Canvas zoom states. The official `三花小猫` screenshot contains an approximately `213px` square media body, a roughly `900 x 50px` top toolbar, and a roughly `660 x 192px` lower composer. The existing Revid isolated square artifact used a `320px` media body at 100% while correctly keeping the toolbar and composer screen-space stable.

That artifact proves the production rule but is not an honest like-for-like visual comparison. Unit 6N corrects only the evidence scale.

## Contract

- Capture the existing isolated square materialized family at 67% Canvas zoom.
- Media width is approximately `320 * 0.67 = 214.4px`.
- Toolbar remains approximately `900 x 50px`.
- Composer remains approximately `660 x 190px`.
- Toolbar, media, and composer centers align within 2 CSS px.
- The media-to-composer gap remains `16 world px`, approximately `10.72 CSS px` at 67%.
- One visible media card remains; the canonical result and lineage shell remain concealed.
- The capture causes zero document PATCHes and requires no production-code change.

## Human Gate

The official-scale artifact improves comparison quality but does not replace Human visual/interaction acceptance. T6-003 remains open until that acceptance is explicit.

## Result

- Focused browser contract: `1/1` pass.
- Matched media width: approximately `214px`; official screenshot approximately `213px`.
- Toolbar: approximately `900 x 50px`; composer: approximately `660 x 190px`.
- Fixed comparison frame: `960 x 562px`.
- Revid toolbar frame offset: approximately `12/34px`; official approximately `13/34px`.
- Revid media horizontal range: approximately `356..569px`; official approximately `357..570px`.
- Revid composer horizontal range: approximately `132..792px`; official approximately `133..793px`.
- Product-code changes: none.
- Document PATCHes during capture: zero.
- Final state/hygiene: validator and diff check pass; `110` owned paths and `105` UTF-8 text files have zero UTF-8, BOM, sensitive-path, secret-signature, or database-artifact findings.

Artifacts:

- `output/playwright/t6-003-materialized-card/selected-materialized-square-card-official-frame.png`, SHA-256 `B006032CA8BE9D77A9E313A8AF5834B89110B74930C929387E4F76A9CAE57144`.
- `output/playwright/t6-003-materialized-card/selected-materialized-square-card-official-scale.png`, SHA-256 `25BBB8C6E34AC13783CD8303542D5EC1FE63CA423DADBEE73824E83780822BD3`.

Manual inspection finds the official-frame composition structurally converged. Remaining differences are Revid-owned wording, capability availability, iconography, graphite/violet palette, and lawful mock media rather than node/card hierarchy drift.
