import { readFile, writeFile } from 'node:fs/promises';
import { normalizeCatalog } from './sync-workshop.mjs';

const catalog = normalizeCatalog(
  JSON.parse(await readFile('src/data/workshop.generated.json', 'utf8')),
);
const markdown = (text) => text.replaceAll('[', '\\[').replaceAll(']', '\\]');
const lines = [
  '# AppCubic',
  '',
  '> An independent applied AI studio. AppCubic builds agent workflows, turns research into working products, and advises technical teams.',
  '',
  'AppCubic has been building since 2019. The studio connects model capability with clear interfaces, careful evaluation, and the practical work of running a product.',
  '',
  '## Studio',
  '',
  '- [AppCubic](https://www.appcubic.com/): systems, research, and ventures.',
  '- [About the studio](https://www.appcubic.com/about/): the practice and its background.',
  '- [App Automaton overview](https://www.appcubic.com/appautomaton/): selected public work.',
  '- [App Automaton catalog](https://appautomaton.com/): the full public project collection.',
  '',
  '## Public projects',
  '',
  ...catalog.projects.map(
    (p) => `- [${markdown(p.repo)}](${p.site || p.source}): ${markdown(p.description)}`,
  ),
  '',
  'Code and model terms vary by project. Read the source repository and model documentation before use.',
  '',
  '## Further reading',
  '',
  '- [RenoCrypt](https://www.renocrypt.com/): writing on machine learning, systems, and security.',
  '- [Research systems](https://research.appcubic.com/): research and technical work.',
  '- [Futur](https://futur.renocrypt.com/): product and operations.',
  '- [Benji Peng](https://benji.appcubic.com/): personal background.',
  '- [GitHub organization](https://github.com/appautomaton): source repositories.',
  '',
  '## Sitemap',
  '',
  '- [Sitemap index](https://www.appcubic.com/sitemap-index.xml)',
  '',
];
await writeFile('public/llms.txt', lines.join('\n'));
console.log(`Wrote discovery text with ${catalog.projects.length} catalog projects.`);
