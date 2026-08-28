# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

**deploy-action** is a GitHub Action (published as `localopsco/deploy-action`)
that triggers a deployment in [LocalOps Deliver](https://localops.co). It is a
thin HTTP client: given an environment, a service, and one of a commit SHA /
Docker image tag / Helm chart version, it POSTs a deploy request to the LocalOps
Deliver API and optionally attaches PR metadata for preview deployments.

## Tech Stack

- **Language:** TypeScript (Node.js >= 24, pinned via `.node-version` /
  `mise.toml` to `24.12.0`)
- **Action runtime:** `node24` (see `runs.using` in `action.yml`)
- **HTTP client:** `ky`
- **Actions SDK:** `@actions/core` (inputs/outputs/logging), `@actions/github`
  (workflow/PR context)
- **Bundler:** Rollup (`rollup.config.ts`) with `@rollup/plugin-typescript`,
  `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs` — bundles to a single
  ESM file, `dist/index.js`, which is what GitHub Actions actually executes
- **Test runner:** Vitest (with `@vitest/coverage-v8` for coverage)
- **Lint/format:** oxlint + Prettier
- **Git hooks:** Husky + lint-staged. `.husky/pre-commit` runs `npm run package`
  and stages the rebuilt `dist/` before running `lint-staged`
  (`.lintstagedrc.yml`: Prettier on `*.{md,yml,yaml,json}`, oxlint --fix +
  Prettier on `*.{js,ts}`) — so a local commit already keeps `dist/` current;
  CI's `check-dist.yml` is the backstop for commits made another way

## Architecture

This is a single-purpose action with a very small surface area:

```text
action.yml              # Action metadata: inputs, branding, runs.using: node24
src/index.ts            # Entrypoint: imports and invokes run() from main.ts
src/main.ts             # All action logic lives here
dist/index.js           # Rollup-bundled output GitHub Actions runs (committed)
__tests__/main.test.ts  # Vitest unit tests for main.ts (mocks core and ky)
__fixtures__/core.ts    # Hand-rolled mock of @actions/core used by tests
```

### Runtime flow (`src/main.ts`)

1. Read inputs via `@actions/core`: `base_url` (default
   `https://sdk.localops.co`), `preview` (boolean), `environment_id` (required),
   `service_id` (required), `api_token` (required), and exactly one of
   `commit_id` / `docker_image_tag` / `helm_chart_version`.
1. Validate: fail if none of `commit_id` / `docker_image_tag` /
   `helm_chart_version` is set; fail if `preview` is true but `commit_id` is not
   set.
1. Build a JSON payload with whichever deploy target was provided.
1. If `preview` is true and the workflow event is `pull_request` (via
   `@actions/github` context), add `pr_number` and `branch_name` to the payload
   from `github.context.payload.pull_request`.
1. `POST {base_url}/v1/environments/{environment_id}/services/{service_id}/deploy`
   with `Authorization: Bearer {api_token}` using `ky`.
1. On success, `core.info('Deployment triggered successfully.')`. On any thrown
   `Error`, `core.setFailed(error.message)` (the action never throws past
   `run()`).

### Inputs / outputs contract

Defined in `action.yml` and documented in `README.md`. There are no declared
`outputs`. Keep `action.yml`, `README.md`, and `__tests__/main.test.ts` in sync
whenever inputs change.

### Distribution model

GitHub Actions run the **committed** `dist/index.js`, not `src/`. Any change to
`src/` requires `npm run package` (or `npm run bundle`) to regenerate
`dist/index.js`/`dist/index.js.map`, and both must be committed together. CI
enforces this via `.github/workflows/check-dist.yml` (rebuilds `dist/` and fails
if it differs from what's committed).

## Common Commands

```bash
# Install dependencies
npm install

# Run tests (watch mode)
npm test
# Run tests once (used in CI)
npm run ci-test
# Run a single test (by name pattern) or a single file
npx vitest run -t "deploys with commit_id"
npx vitest run __tests__/main.test.ts
# Run tests with coverage (writes badges/coverage.svg via make-coverage-badge)
npm run coverage

# Lint
npm run lint

# Format
npm run format:write   # apply Prettier
npm run format:check   # check only (CI)

# Build the distributable bundle (required after any src/ change)
npm run package
npm run package:watch  # rebuild on change

# Run everything CI-style locally (format, lint, test, coverage, package)
npm run all

# Exercise the action locally against .env-style inputs (uses @github/local-action)
npm run local-action
```

## CI / Repository Automation

- **`.github/workflows/ci.yml`** — on PRs to `main` and pushes to `main`:
  `npm ci`, `npm run format:check`, `npm run lint`, `npm run ci-test`.
- **`.github/workflows/check-dist.yml`** — verifies the committed `dist/`
  matches a fresh `npm run package` build.
- **`.github/workflows/licensed.yml`** — runs `licensed` (config in
  `.licensed.yml`) to check dependency license compliance; allowed licenses
  include MIT, Apache-2.0, BSD-2/3-Clause, ISC, CC0-1.0.
- **`.github/workflows/linter.yml`** — general linting (e.g. YAML/Markdown via
  `.yaml-lint.yml` / `.markdown-lint.yml`), plus `actionlint` (config in
  `actionlint.yml`, which ignores the `node24` runner-name warning since it's
  newer than actionlint's known list).
- **`.github/workflows/codeql-analysis.yml`** — CodeQL security scanning.
- **`.checkov.yml`** — Checkov static analysis config (skips `coverage` and
  `node_modules`).
- **`script/release`** — helper shell script to cut a new release: tags a
  version, updates the major version tag (e.g. `v1`), and pushes tags. Reminds
  you to bump `version` in `package.json` first.

Note: `.github/copilot-instructions.md` is stale in places — it describes
`jest.config.js`, `eslint.config.mjs`, and a `.devcontainer/` directory, none
of which exist in this repo. The actual test runner is Vitest (`ci-test`) and
the linter is oxlint; there is no dev container. Its general guidelines
(dist/ up to date, README updated alongside behavior changes, focused PRs)
still apply.

## Testing Notes

- Tests live in `__tests__/main.test.ts` and mock both `@actions/core` (via the
  hand-written fixture in `__fixtures__/core.ts`) and `ky` (via `vi.mock`).
- `@actions/github` is not mocked in the current tests — preview/PR-context
  behavior is only exercised through the default (non-`pull_request`) event
  context, so `pr_number`/`branch_name` attachment isn't directly covered by a
  test today.
- When adding new inputs or behavior branches in `src/main.ts`, extend
  `__tests__/main.test.ts` and, if `@actions/core` gains new mocked methods,
  extend `__fixtures__/core.ts`.

## When Modifying This Action

1. Change input/output contracts in `action.yml` first, then implement in
   `src/main.ts`.
1. Update `README.md` (Inputs table and examples) to match.
1. Add/update tests in `__tests__/main.test.ts`.
1. Run `npm run all` locally (format, lint, test, coverage, package) before
   committing.
1. Commit the regenerated `dist/index.js` and `dist/index.js.map` — CI's
   `check-dist.yml` will fail the build otherwise.
1. Bump `version` in `package.json` and use `script/release` when cutting a new
   tagged release.
