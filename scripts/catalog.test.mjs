import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCatalog } from './sync-workshop.mjs';
const record = (repo) => ({
  repo,
  description: 'An inspectable project.',
  source: `https://github.com/appautomaton/${repo}`,
  site: `https://appautomaton.com/${repo}/`,
});
const data = () => ({
  organization: 'appautomaton',
  projects: ['agent-designer', 'mlx-atomistic', 'setloom'].map(record),
});
test('catalog synchronization preserves canonical project facts and accepts new public entries', () => {
  const d = data();
  d.projects.push(record('new-project'));
  assert.equal(normalizeCatalog(d).projects.length, 4);
  delete d.projects[3].site;
  assert.equal(normalizeCatalog(d).projects[3].site, undefined);
});
test('catalog rejects changed ownership, stale domains, duplicate entries, and missing featured work', () => {
  for (const mutate of [
    (d) => (d.organization = 'elsewhere'),
    (d) => (d.projects[0].source = 'https://github.com/elsewhere/agent-designer'),
    (d) => (d.projects[0].site = 'https://appautomaton.renocrypt.com/agent-designer/'),
    (d) => d.projects.push(d.projects[0]),
    (d) => d.projects.pop(),
  ]) {
    const d = data();
    mutate(d);
    assert.throws(() => normalizeCatalog(d));
  }
});
