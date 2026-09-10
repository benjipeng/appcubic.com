import { readFile, writeFile } from 'node:fs/promises';
const destination = new URL('../src/data/workshop.generated.json', import.meta.url);
export function normalizeCatalog(data) {
  if (
    data?.organization !== 'appautomaton' ||
    !Array.isArray(data.projects) ||
    !data.projects.length
  )
    throw new Error('The workshop catalog is not valid');
  const seen = new Set();
  const projects = data.projects.map((project) => {
    const { repo, description, source, site, group, groupName } = project;
    if (typeof repo !== 'string' || !/^[\w.-]+$/.test(repo) || seen.has(repo))
      throw new Error('Invalid or repeated repository');
    seen.add(repo);
    if (typeof description !== 'string' || source !== `https://github.com/appautomaton/${repo}`)
      throw new Error(`Invalid source for ${repo}`);
    if (site && site !== `https://appautomaton.com/${repo}/`)
      throw new Error(`Invalid website for ${repo}`);
    return { repo, description, source, ...(site ? { site } : {}), group, groupName };
  });
  for (const name of ['agent-designer', 'mlx-atomistic', 'setloom'])
    if (!seen.has(name)) throw new Error(`A featured project is missing: ${name}`);
  return { organization: 'appautomaton', url: 'https://appautomaton.com/', projects };
}
async function sync() {
  let catalog;
  try {
    const response = await fetch('https://appautomaton.com/catalog.json', {
      headers: { 'User-Agent': 'AppCubic-Website-Build/1.0' },
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    catalog = normalizeCatalog(await response.json());
  } catch (error) {
    if (process.env.GITHUB_ACTIONS === 'true') throw error;
    normalizeCatalog(JSON.parse(await readFile(destination, 'utf8')));
    console.warn(`Using the checked-in workshop snapshot: ${error.message}`);
    return;
  }
  await writeFile(destination, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Synchronized ${catalog.projects.length} public workshop projects`);
}
if (process.argv[1] && new URL(process.argv[1], 'file:').href === import.meta.url) await sync();
