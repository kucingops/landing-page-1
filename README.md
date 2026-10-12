# landing-page-1

Portfolio landing page for **kucingops**. The page measures its own load time in the visitor's
browser and shows it in the hero, along with TTFB, first paint, LCP, layout shift, bytes
transferred and offline status.

- SvelteKit 3 + Svelte 5, fully prerendered with `adapter-static`
- Installable PWA with a hand-written service worker (precaches the whole site, works offline)
- No web fonts, no runtime dependencies, ~38 KB of gzipped JS
- Lighthouse 100 / 100 / 100 / 100, CLS 0

## Develop

```sh
bun install
bun dev
```

Edit your details in [`src/lib/profile.ts`](src/lib/profile.ts). Change the icon in
`static/icon.svg`, then run `bun scripts/icons.ts` to regenerate the PNGs.

## Scripts

| Command            | What it does                                           |
| ------------------ | ------------------------------------------------------ |
| `bun run check`    | Type-check Svelte and TypeScript                       |
| `bun run lint`     | Check formatting (`bun run format` to fix)             |
| `bun run test`     | Unit tests (Vitest)                                    |
| `bun run build`    | Build the static site into `build/`                    |
| `bun run size`     | Fail if gzipped JS > 50 KB, CSS > 12 KB, HTML > 20 KB  |
| `bun run test:e2e` | Browser tests on desktop and mobile, including offline |

To test with the GitHub Pages path locally, prefix with `BASE_PATH=/landing-page-1`.

## CI/CD

Every push and pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. **No AI attribution**: rejects commits whose author or message credits an AI assistant
2. Format, type check, unit tests, build, bundle size budget
3. Playwright tests on desktop and mobile, including an offline reload
4. Lighthouse CI: fails below 98 performance or 100 on accessibility, best practices and SEO,
   or if LCP > 1.2 s, TBT > 50 ms, CLS > 0.01

Pushes to `main` that pass deploy to GitHub Pages. One-time setup: **Settings → Pages →
Build and deployment → Source: GitHub Actions**.

### Commit rule

Commits must not carry AI attribution (`Co-Authored-By: Claude`, `Generated with Claude`, and
similar). `bun install` sets `core.hooksPath` to `.githooks`, whose `commit-msg` hook blocks such
messages locally; CI checks every pushed commit as well.
