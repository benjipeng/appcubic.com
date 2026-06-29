# appcubic.com

> The source for **[appcubic.com](https://www.appcubic.com)**, the landing site for **AppCubic**, an applied AI venture studio.

[![Live](https://img.shields.io/badge/live-appcubic.com-0e1018?logo=vercel&logoColor=white)](https://www.appcubic.com)
[![Astro](https://img.shields.io/badge/Astro-static-BC52EE?logo=astro&logoColor=white)](https://astro.build/)

This repository builds and deploys appcubic.com, a static site built with Astro.

## Stack

- **[Astro](https://astro.build/)** as the static site framework, configured for `output: "static"`
- **[@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)** for sitemap generation
- **[Lucide](https://lucide.dev/)** icons through `@lucide/astro`
- **GitHub Actions** builds the site and publishes it to **GitHub Pages**
- Custom domain `www.appcubic.com`

## Local development

```bash
git clone https://github.com/benjipeng/appcubic.com.git
cd appcubic.com

npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:4321
npm run build    # build for production into dist/
npm run preview  # preview the production build
```

## Structure

| Path | Purpose |
| :-- | :-- |
| `src/pages/` | Routes, one file per page |
| `src/layouts/` | Shared page shells |
| `src/components/` | Reusable UI components |
| `src/content/` and `src/content.config.ts` | Content collections and their schema |
| `src/data/` | Structured site data |
| `src/styles/` | Global styles |
| `public/` | Files served verbatim |
| `astro.config.mjs` | Astro configuration and integrations |

## Deployment

Each push to `main` runs the GitHub Actions workflow in `.github/workflows/deploy.yml`, which builds the site and deploys it to GitHub Pages. DNS points `www.appcubic.com` at Pages, so deploys are automatic on merge.

## License

Released under the GNU General Public License. See [`LICENSE`](./LICENSE).
