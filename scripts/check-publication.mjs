import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const root = 'https://www.appcubic.com';
const paths = ['/', '/about/', '/appautomaton/'];
for (const path of paths) {
  const html = await readFile(`dist${path}index.html`, 'utf8');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `Expected one h1 on ${path}`);
  assert(html.includes(`rel="canonical" href="${root}${path}"`), `Incorrect canonical on ${path}`);
  assert(!html.includes('noindex'), `Indexing blocked on ${path}`);
  assert(!html.includes('appautomaton.renocrypt.com'), `Stale organization address on ${path}`);
  assert(!/fonts\.googleapis|fonts\.gstatic/.test(html), 'Google Fonts are not allowed');
  for (const url of [
    'https://appautomaton.com/',
    'https://www.renocrypt.com/',
    'https://benji.appcubic.com/',
  ])
    assert(html.includes(`href="${url}"`), `Missing direct studio link ${url} on ${path}`);
  for (const anchor of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    assert(
      !/\brel="[^"]*\b(?:nofollow|ugc|sponsored)\b/i.test(anchor[1]),
      'A publication link has restrictive attributes',
    );
    assert(
      anchor[2]
        .replace(/<svg\b[\s\S]*?<\/svg>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim(),
      'A link has no text',
    );
  }
  for (const script of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))
    JSON.parse(script[1]);
  for (const image of html.matchAll(/<img\b[^>]*>/g))
    assert(/\balt="/.test(image[0]), 'Missing image text alternative');
}
const map = await readFile('dist/sitemap-0.xml', 'utf8');
for (const path of paths) assert(map.includes(`<loc>${root}${path}</loc>`));
assert((await readFile('dist/robots.txt', 'utf8')).includes('User-agent: *\nAllow: /'));
const files = await readdir('dist/_astro');
let browserBytes = 0;
for (const file of files.filter((f) => f.endsWith('.js')))
  browserBytes += gzipSync(await readFile('dist/_astro/' + file)).length;
assert(browserBytes < 12 * 1024, `Browser scripts exceed budget: ${browserBytes}`);
console.log(
  `Verified three indexable pages, direct followable links, metadata, and sitemaps. Browser scripts: ${browserBytes} bytes gzip.`,
);

const social = await readFile('dist/assets/imgs/studio-continuum.png');
assert.equal(social.readUInt32BE(16), 1200);
assert.equal(social.readUInt32BE(20), 630);
const discovery = await readFile('dist/llms.txt', 'utf8');
assert(discovery.includes('https://benji.appcubic.com/'));
assert(!discovery.includes('appautomaton.renocrypt.com'));
assert(!discovery.includes('benji.renocrypt.com'));
