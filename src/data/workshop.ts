import snapshot from './workshop.generated.json';
export const workshop = snapshot;
export const projectCount = workshop.projects.length;
export function project(name: string) {
  const item = workshop.projects.find((item) => item.repo === name);
  if (!item) throw new Error(`Featured project unavailable: ${name}`);
  return { ...item, url: item.site || item.source };
}
export const selectedGroups = [
  {
    title: 'A better way to work with agents.',
    label: 'Agent workflows',
    key: 'skills',
    names: [
      'agent-designer',
      'document-SKILLs',
      'presentation',
      'webmaton',
      'latex-arxiv-SKILL',
      'automaton',
      'markmaton',
      'docker-for-apple-container',
    ],
  },
  {
    title: 'Intelligence, close to the machine.',
    label: 'Local intelligence',
    key: 'models',
    names: ['mlx-speech', 'tnt-asr', 'ltx-video-mlx', 'mlx-spatial', 'mlx-cv', 'mlx-atomistic'],
  },
  {
    title: 'Room for human taste.',
    label: 'Creative practice',
    key: 'creative',
    names: ['setloom'],
  },
].map((group) => ({ ...group, projects: group.names.map(project) }));
