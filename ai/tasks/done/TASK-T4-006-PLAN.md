# T4-006 PLAN — Dark Design System & Naive UI Provider REWORK (Wave 2)

## Objective
Verify and validate the completed SmokeTest composable usage fix. Ensure all providers fire correctly in both 1440x900 and 375px viewports.

## Scope Analysis
The previous run (t_a8f1fb24) already completed:
- SmokeTest.vue: composable calls moved to setup top-level (lines 8-11)
- App.vue: Full provider nesting (ConfigProvider > LoadingBar > Dialog > Notification > Message)
- naive-theme.ts: Complete dark theme overrides with brand color #6347C2
- Router: /smoke route registered
- design-system.md: Comprehensive token table, component states, layout specs

## Verification Checklist
1. `npm run build` passes with 0 errors
2. Composable calls verified at setup top-level (not inside handlers)
3. Browser: visit /smoke at 1440x900, click all 4 provider buttons
4. Browser: resize to 375px, click all 4 provider buttons
5. Console: 0 errors, no horizontal overflow
6. Focus-visible rings visible on buttons and inputs
7. Reduced-motion respected

## Files in Scope
- frontend/src/views/smoke/SmokeTest.vue (verify, no changes needed)
- frontend/src/App.vue (verify providers)
- frontend/src/assets/styles/naive-theme.ts (verify theme)
- frontend/src/router/index.ts (verify /smoke route)
- frontend/index.html (verify no #app width constraint)
- frontend/src/assets/styles/global.scss (verify min-height: 100dvh)
