# T6-001 Unit 4 Continuation Canon Evidence

- Date: `2026-07-20`; baseline `f0f56df6b195967e5f16d889ef755211668ef9fe`.
- Accept/reject is one atomic sequence command and exactly one canon revision increment. Accept requires a generated clip, successful result, observed end state, and explicit completed/reserved beats. Reject keeps the result unchanged and adds no accepted canon.
- Continuation revalidates current-Canvas result type/status, exact image/video medium, project/Canvas, asset ID, task lineage, and source revision before preflight.
- Deleted, foreign, missing-task, wrong-media, and stale results fail closed.
- Canvas duplication remaps sequence/source/director/accepted-result IDs, creates a duplicate sequence ID, refreshes revisions, and leaves historical source content unchanged.
- Backend: `17/17` plus `3` duplication subtests. Frontend: `8/8`. Build: `4941 modules transformed`.
- No real provider call, migration, destructive action, secret, or new persistence authority occurred.
