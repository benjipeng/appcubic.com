import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const component = readFileSync(
  new URL('../src/components/GoogleAnalytics.astro', import.meta.url),
  'utf8',
);
const code = component.match(/<script\b[^>]*define:vars[^>]*>([\s\S]*?)<\/script>/)[1];
function harness(hostname = 'www.appcubic.com') {
  const listeners = {},
    scripts = [];
  let idle;
  class Element {
    constructor(href) {
      this.href = href;
      this.textContent = 'Explore the project';
    }
    getAttribute() {
      return null;
    }
    closest(selector) {
      return selector === 'a[href]' ? this : { id: 'work', classList: ['feature-track'] };
    }
  }
  const window = {};
  const context = {
    window,
    location: { hostname },
    measurementId: 'G-TEST',
    URL,
    Element,
    Date,
    setTimeout,
    requestIdleCallback: (callback) => {
      idle = callback;
    },
    addEventListener: () => {},
    document: {
      readyState: 'complete',
      createElement: () => ({}),
      head: { appendChild: (s) => scripts.push(s) },
      addEventListener: (name, fn) => (listeners[name] = fn),
    },
  };
  vm.runInNewContext(code, context);
  return {
    window,
    listeners,
    scripts,
    Element,
    events: () =>
      Array.from(window.dataLayer || [])
        .map((args) => Array.from(args))
        .filter((args) => args[0] === 'event'),
  };
}
test('studio links retain native navigation and report clean destinations and placement once', () => {
  const h = harness();
  assert.equal(h.scripts.length, 0);
  let prevented = false;
  h.listeners.click({
    type: 'click',
    button: 0,
    target: new h.Element('https://benji.appcubic.com/?private=value#section'),
    preventDefault: () => {
      prevented = true;
    },
  });
  const event = h.events()[0];
  assert.equal(event[1], 'studio_link');
  assert.equal(event[2].link_url, 'https://benji.appcubic.com/');
  assert.equal(event[2].link_domain, 'benji.appcubic.com');
  assert.equal(event[2].link_placement, 'work');
  assert.equal(prevented, false);
  assert.equal(h.scripts.length, 1);
  h.listeners.auxclick({
    type: 'auxclick',
    button: 1,
    target: new h.Element('https://www.renocrypt.com/'),
  });
  assert.equal(h.events().length, 2);
  assert.equal(h.scripts.length, 1);
  h.listeners.click({
    type: 'click',
    button: 0,
    target: new h.Element('https://www.appcubic.com/about/'),
  });
  h.listeners.click({
    type: 'click',
    defaultPrevented: true,
    target: new h.Element('https://appautomaton.com/'),
  });
  h.listeners.auxclick({
    type: 'auxclick',
    button: 2,
    target: new h.Element('https://appautomaton.com/'),
  });
  assert.equal(h.events().length, 2);
});
test('local previews send no production analytics', () => {
  const h = harness('127.0.0.1');
  assert.equal(Object.keys(h.listeners).length, 0);
  assert.equal(h.scripts.length, 0);
  assert.equal(h.window.dataLayer, undefined);
});
