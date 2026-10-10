# Dependency security verification ? 10 October 2026

## Scope

Only `frontend/package.json`, its npm lockfile, and this verification report are intentionally changed. UI, API routes, authentication, database integration, application source, and the GitHub Actions audit gate are unchanged. No dependency was removed and `npm audit fix --force` was not used.

## Initial findings and remediation

The installed and locked Next.js version was **16.2.12**. The initial production audit reported seven affected package entries: one critical, five high, and one moderate. This includes inherited entries for PostCSS and Vercel Analytics, in addition to the five packages identified in the request.

Ran `npm audit fix` without force. It refreshed compatible transitive packages and selected Next.js/ESLint 16.4.0 under the existing caret ranges. The subsequent production audit still reported two high entries: Sharp and Next.js inheriting Sharp's issue. The existing exact Sharp override prevented automatic remediation.

Selected **Next.js 16.3.8** and matching **eslint-config-next 16.3.8** instead of retaining the larger 16.4 feature update. Their manifest ranges are now `~16.3.8`, allowing patches within 16.3. The published Node requirement is >=20.9.0 and the React peer range accepts the existing React/React DOM 19.2.4; CI uses Node 22. Updated the existing Sharp override to **0.35.5**. The PostCSS 8.5.25 override remains unchanged. npm generated all lockfile updates.

## Next.js advisories affecting the original version

| Advisory | Issue | First patched 16.x version in audit |
| --- | --- | --- |
| [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) | Critical remote code execution on Windows-hosted servers | 16.3.3 |
| [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) | Critical remote code execution in AVIF image optimization | 16.3.3 |
| [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) | Critical remote code execution in next/og ImageResponse | 16.3.6 |
| [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676) | Moderate SSG/ISR cache poisoning | 16.3.8 |
| [GHSA-39w2-rjm5-chcv](https://github.com/advisories/GHSA-39w2-rjm5-chcv) | Low development MCP endpoint information disclosure | 16.3.8 |
| [GHSA-f87g-xv8r-7p7x](https://github.com/advisories/GHSA-f87g-xv8r-7p7x) | Moderate metadata image-route information disclosure | 16.3.8 |
| [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p) | Moderate SSG/ISR cross-user cache poisoning and denial of service | 16.3.8 |
| [GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4) | High image optimization SSRF | 16.3.8 |

The [official 16.3.8 release](https://github.com/vercel/next.js/releases/tag/v16.3.8) documents the latest security fixes. Advisory presence does not establish exploitability of every issue in this particular app; upgrading covers the affected package versions without relying on configuration workarounds.

## Every dependency version change

Platform-specific packages are grouped only when their old/new versions and reason are identical. All changed lockfile package versions are covered below.

| Package(s) | Before ? after | Reason |
| --- | --- | --- |
| next, eslint-config-next | 16.2.12 ? 16.3.8 | Patched framework and matching lint configuration; no major upgrade |
| @next/env, @next/eslint-plugin-next, all eight @next/swc platform packages | 16.2.12 ? 16.3.8 | Companion packages required by the selected Next.js release |
| @swc/helpers | 0.5.15 ? 0.5.23 | Required compiler runtime dependency of Next.js 16.3.8 |
| sharp and all 16 @img/sharp platform packages (excluding libvips packages) | 0.35.3 ? 0.35.5 | Fixes bundled libheif/librsvg vulnerabilities; existing override advanced to patched version |
| All ten @img/sharp-libvips platform packages | 1.3.2 ? 1.3.4 | Updated native image libraries distributed with patched Sharp |
| @emnapi/runtime | 1.11.2 ? 1.11.3 | Compatible runtime resolution for Sharp's WebAssembly/platform dependency tree |
| nanoid | 3.3.16 ? 3.3.20 | Compatible 3.x fix for zero-size custom generator infinite loop; no 5.x migration |
| source-map-js | 1.2.1 ? 1.2.2 | Fixes indexed source-map offset denial of service |
| baseline-browser-mapping | 2.10.42 ? 2.11.28 | Fixes process termination on invalid input |
| browserslist | 4.28.5 ? 4.29.3 | Audit remediation for unbounded caching and untrusted custom statistics handling |
| brace-expansion (root dependency) | 1.1.18 ? 1.1.21 | Compatible fixes for expansion CPU/memory/recursion denial of service |
| brace-expansion (typescript-estree dependency) | 5.0.8 ? 5.0.12 | Same security remediation within its existing major |
| js-yaml | 4.3.0 ? 4.3.2 | Fixes excessive CPU use during YAML resolution/merge processing |
| fastq | 1.20.1 ? 1.20.3 | Compatible transitive refresh selected by non-forced audit remediation |
| caniuse-lite | 1.0.30001803 ? 1.0.30001815 | Browser-data refresh accompanying the patched Browserslist dependency tree |
| electron-to-chromium | 1.5.389 ? 1.5.452 | Browser-data refresh accompanying that dependency tree |
| node-releases | 2.0.50 ? 2.0.58 | Node compatibility data refresh accompanying that dependency tree |
| update-browserslist-db | 1.2.3 ? 1.3.4 | Compatible database updater resolution accompanying that dependency tree |

## Remaining security risk

A full audit including development dependencies still reports **five high package entries for one underlying advisory**, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):

`eslint-config-next ? @next/eslint-plugin-next ? fast-glob ? micromatch ? braces@3.0.3`

Deeply nested brace patterns can exhaust the call stack. The registry's latest braces release is 3.0.3 and the advisory lists no patched release. Next.js's 16.4 lint plugin uses the same fast-glob dependency, so moving to 16.4 would not resolve it either. npm proposes downgrading eslint-config-next to 14.2.35; that incompatible tooling downgrade was rejected. No dependency aliases, removal of linting, or audit suppression was used.

This chain is development-only and absent from the production audit scope. Avoid feeding untrusted glob patterns to lint tooling; retain isolated, least-privilege CI execution and track the upstream fix. **The claim of zero high/critical vulnerabilities applies to production dependencies, not to the complete development tree.**

A clean dependency audit does not certify application-level security or deployed Supabase permissions. Live Google OAuth, authenticated database operations, Linux-native Sharp execution, and deployment behavior require environment-specific validation. This work does not deploy the update.

## Verification

Verified locally on Windows with Node 24.18.0/npm 11.18.0. GitHub Actions uses Node 22; no remote workflow run is claimed.

| Check | Result |
| --- | --- |
| `npm ci` | PASS: clean installation from the final lockfile |
| `npm run build` | PASS: Next.js 16.3.8, TypeScript, all 17 static pages generated |
| `npm test` | PASS: 10/10 tests |
| `npm run lint` | PASS |
| Backend `python -m pytest -q` | PASS: 24/24 tests |
| Backend `python -m ruff check .` | PASS |
| `npm audit --omit=dev --audit-level=high` (rerun after build/tests) | PASS, exit 0: **found 0 vulnerabilities**, including zero moderate/high/critical |
| `npm audit` including development tooling | FAIL: five high entries from the single unpatched braces advisory described above |
| `npm ls` for updated packages | PASS: installed tree matches the patched lockfile versions |
| Sharp native image smoke test | PASS: AVIF encode/decode, resize, PNG output; Sharp 0.35.5/libvips 8.18.7 |
| Production HTTP smoke test | PASS: `/`, `/login`, `/privacy` return 200 with CSP |
| Unauthenticated redirects | PASS: `/app` and `/auth/callback` without a code return 307 to `/login` |
| `git diff --check` | PASS |

Non-failing notices: Node emits a module-type warning for the existing TypeScript test import; pytest emits the existing Starlette TestClient deprecation warning. npm reports that unrs-resolver's optional postinstall script is not allowlisted in this local environment; installation, lint, and build nevertheless passed without bypassing that policy.

No live authenticated user actions or production data changes were performed. React, React DOM, Supabase clients, and application source remain unchanged. Commit both package files together so GitHub Actions uses the verified resolutions.
