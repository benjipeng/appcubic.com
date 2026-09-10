# AppCubic

The source for [appcubic.com](https://www.appcubic.com), an independent applied AI
studio. Astro publishes three complete HTML pages: `/`, `/about/`, and
`/appautomaton/`. Their addresses remain stable through the redesign.

## Development

Use Node 24 and the committed npm lockfile.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm run build:offline` uses the checked-in catalog snapshot. Both builds generate
the discovery text, compile the site, and verify headings, canonical URLs,
followable links, image alternatives, social metadata, sitemaps, and the browser
script budget.

## Content and publication

`scripts/sync-workshop.mjs` reads the public catalog at
`https://appautomaton.com/catalog.json`. It validates organization ownership,
source addresses, and canonical project websites. The App Automaton site owns
GitHub discovery; this site consumes its published catalog. Editorial groups
live in `src/data/workshop.ts`. Project URLs and descriptions come from the
snapshot, never from a second hand-maintained URL list.

CI runs the tests and builds every pull request. It publishes only `main`, with
daily refreshes scheduled for 06:17 UTC and a manual **Run workflow** option.
GitHub schedules are best effort. A failed catalog request or validation stops a
CI publication. Local work can use the last validated snapshot.

## Presentation and reading

Boska carries display typography. General Sans carries body text and controls.
The body starts at 18px on desktop and 17px on phones, with medium weight and
generous line spacing. Theme and motion preferences persist locally.

The opening combines an original rendered sculpture with native scroll effects.
Only the current theme's 10-second loop loads, after page load and while the
artwork is exposed. It pauses when covered, offscreen, backgrounded, or disabled.
Reduced-motion and data-saving preferences retain the static poster. All text,
links, logos, and image alternatives exist without JavaScript.

Blender is an optional artwork authoring tool. It is not installed in CI or used
in the browser. See [art and font provenance](docs/ASSETS.md).

## Link measurement

Normal HTML links preserve native navigation and remain followable. No tracking
redirects or query parameters are added. Production pages use the existing GA4
property and send the `studio_link` event for HTTPS destinations on another
hostname, including sibling subdomains. Events contain the clean destination,
domain, link text, and page section. Local previews send no production analytics.

Use `studio_link` for this report. GA4 enhanced measurement may separately emit
its own `click` event; do not add those event counts together. Browser blocking,
visitor preferences, and interrupted requests can prevent delivery. Search
Console backlink reports and Analytics click reports measure different things.

## License

The website source is released under the [GNU General Public License](LICENSE).
Third-party fonts and the rendering environment retain their own licenses.
App Automaton project code and model terms are defined by each project.
