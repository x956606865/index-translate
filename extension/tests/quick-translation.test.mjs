import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = readFileSync(process.env.CONTENT_SCRIPT || new URL('../content.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));

// Minimal DOM/message doubles: exercise the actual content-script listeners,
// text-range slicing and request lifecycle without a browser or real backend.
function page() {
  const listeners = new Map(), messages = [];
  let document, selection = null, hit, firstPublic = true, poll, receive;
  const rect = { left: 20, bottom: 60, width: 380, height: 100 };
  class Element {
    constructor(tag, text = '') {
      this.tagName = tag.toUpperCase(); this.nodeType = 1;
      this.childNodes = []; this.dataset = {}; this.style = {}; this.textContent = text;
      this.isConnected = true; this.handlers = {};
    }
    append(...nodes) { nodes.forEach(n => { n.parentElement = this; this.childNodes.push(n); }); }
    matches(selector) {
      return selector.split(',').some(s => s === this.tagName.toLowerCase() ||
        (s === '[data-index-owned]' && !!this.dataset.indexOwned));
    }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector); }
    querySelectorAll(selector) { return descendants(this).filter(n => n.matches?.(selector)); }
    get nextSibling() { return nextSibling(this); }
    after(node) { insertAfter(this, node); }
    getRootNode() { return document; }
    getBoundingClientRect() { return rect; }
    getClientRects() { return [rect]; }
    attachShadow() { this.root = new Element('shadow'); return this.root; }
    setAttribute() {}
    addEventListener(name, fn) { this.handlers[name] = fn; }
    remove() {
      this.isConnected = false;
      this.parentElement?.childNodes.splice(this.parentElement.childNodes.indexOf(this), 1);
    }
  }
  const nextSibling = node => node.parentElement?.childNodes[node.parentElement.childNodes.indexOf(node) + 1];
  const insertAfter = (anchor, node) => {
    node.parentElement = anchor.parentElement;
    anchor.parentElement.childNodes.splice(anchor.parentElement.childNodes.indexOf(anchor) + 1, 0, node);
  };
  const textNode = text => ({ nodeType: 3, textContent: text, isConnected: true,
    getRootNode: () => document, get nextSibling() { return nextSibling(this); },
    after(node) { insertAfter(this, node); } });
  const descendants = node => node.childNodes?.flatMap(n => [n, ...descendants(n)]) || [];
  function range(node, start = 0, end = node.textContent.length) {
    return {
      commonAncestorContainer: node, startContainer: node, endContainer: node,
      startOffset: start, endOffset: end,
      selectNodeContents(n) { Object.assign(this, range(n)); },
      setStart(n, offset) { this.startOffset = offset; },
      setEnd(n, offset) { this.endOffset = offset; },
      intersectsNode(n) { return n === node || descendants(node).includes(n); },
      toString() { return node.textContent.slice(this.startOffset, this.endOffset); },
      getClientRects: () => [rect], getBoundingClientRect: () => rect,
    };
  }
  const listen = (name, fn) => listeners.set(name, [...(listeners.get(name) || []), fn]);
  document = {
    documentElement: new Element('html'), activeElement: new Element('body'),
    addEventListener: listen, createElement: tag => new Element(tag),
    createRange: () => range(textNode('')), elementFromPoint: () => hit,
    createTreeWalker(node) {
      const nodes = descendants(node);
      return { nextNode: () => nodes.shift() || null };
    },
  };
  const context = {
    document, NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1 }, crypto: webcrypto,
    location: { href: 'https://example.test/article' }, innerWidth: 1200, innerHeight: 800,
    getComputedStyle: () => ({ visibility: 'visible', display: 'block' }),
    MutationObserver: class { observe() {} }, addEventListener: listen,
    setInterval() {}, setTimeout, clearTimeout, getSelection: () => selection,
    chrome: { runtime: { id: 'test', onMessage: { addListener(fn) { receive = fn; } },
      async sendMessage(message) {
        messages.push(message);
        if (message.type === 'PUBLIC') {
          if (firstPublic) { firstPublic = false; return new Promise(() => {}); }
          return { ok: true, value: { source: 'auto', target: 'zh', glossary: [] } };
        }
        if (message.type === 'POLL') return poll(message);
        return { ok: true, value: {} };
      },
    } },
  };
  context.window = context;
  vm.runInNewContext(source, context);
  const paragraph = new Element('p');
  const text = textNode('Before selected words after.');
  const emphasis = new Element('em'); emphasis.append(text);
  const link = new Element('a'); link.append(textNode('Linked words.'));
  paragraph.append(emphasis, new Element('br'), link);
  const nested = new Element('div'); nested.append(textNode('Unrelated nested paragraph.'));
  paragraph.append(nested);
  document.documentElement.append(paragraph);
  hit = link;
  poll = async message => ({ ok: true, value: { status: 'completed', results:
    messages.find(m => m.type === 'SUBMIT' && m.request_id === message.request_id)
      .paragraphs.map(p => ({ id: p.id, text: '<b>译文</b>' })) } });
  const fire = (type, overrides = {}) => {
    const event = { key: 'Alt', isTrusted: true, target: document.activeElement,
      composedPath: () => [document.activeElement], preventDefault() {}, ...overrides };
    for (const fn of listeners.get(type) || []) fn(event);
  };
  return {
    document, messages, fire, paragraph,
    select() { selection = { isCollapsed: false, rangeCount: 1, getRangeAt: () => range(text, 7, 21) }; },
    hover() { selection = null; fire('pointermove', { clientX: 30, clientY: 40 }); },
    tap() { fire('keydown'); fire('keyup'); },
    edit() { document.activeElement = new Element('input'); },
    setPoll(fn) { poll = fn; },
    restore() { receive({ type: 'IT_RESTORE' }, { id: 'test' }, () => {}); },
    outputs: () => descendants(document.documentElement).filter(n => n.dataset?.indexOwned === 'quick-translation'),
    hoverOther() { selection = null; hit = nested; fire('pointermove', { clientX: 30, clientY: 40 }); },
  };
}

test('Alt translates the exact selection first, then only the hovered paragraph', async () => {
  const p = page();
  p.hover(); p.select(); p.tap(); await settle();
  const first = p.messages.find(m => m.type === 'SUBMIT');
  assert.ok(first, 'Alt must submit a local translation without starting page scan');
  assert.equal(first.paragraphs[0].text, 'selected words');
  const output = p.outputs()[0];
  assert.ok(output, 'translation must be inserted into the page');
  assert.equal(output.parentElement, p.paragraph, 'translation sits beside the source in its paragraph');
  assert.ok(output.dataset.indexTranslation, 'reuse existing bilingual CSS');
  assert.equal(p.paragraph.childNodes[0].childNodes[0].textContent, 'Before selected words after.',
    'selection inside inline markup preserves the entire original text');
  assert.equal(p.paragraph.childNodes[2].nextSibling, output,
    'translation follows the complete source run, including unselected inline content');
  assert.equal(output.textContent, '<b>译文</b>');
  assert.equal(output.childNodes.length, 0, 'render results as text');
  p.hover(); p.tap(); await settle();
  const submits = p.messages.filter(m => m.type === 'SUBMIT');
  assert.equal(submits.length, 2);
  assert.equal(submits[1].paragraphs[0].text, 'Before selected words after.\nLinked words.');
  assert.notEqual(submits[0].page_epoch, submits[1].page_epoch);
  assert.equal(output.isConnected, false, 'retranslating the same paragraph replaces its output');
  p.hoverOther(); p.tap(); await settle();
  assert.equal(p.outputs().length, 2, 'completed translations in other paragraphs remain');
  p.fire('keydown', { key: 'Escape' });
  assert.equal(p.outputs().length, 2, 'Escape does not remove completed inline translations');
  p.restore(); await settle();
  assert.equal(p.outputs().length, 0, 'restore removes all local translations');
});

test('modifier chords and editors do not trigger; closing cancels and ignores late results', async () => {
  const p = page(); p.hover();
  p.fire('keydown'); p.fire('keydown', { key: 'Tab' }); p.fire('keyup');
  p.fire('keydown', { ctrlKey: true }); p.fire('keyup');
  p.edit(); p.tap(); await settle();
  assert.equal(p.messages.filter(m => m.type === 'SUBMIT').length, 0);
  const q = page(); q.select();
  let finish;
  q.setPoll(() => new Promise(resolve => { finish = resolve; }));
  q.tap(); await settle();
  assert.equal(typeof finish, 'function', 'translation should be polling');
  const output = q.outputs()[0];
  q.fire('keydown', { key: 'Escape' });
  assert.equal(output.isConnected, false);
  assert.ok(q.messages.some(m => m.type === 'CANCEL'));
  finish({ ok: true, value: { status: 'completed', results: [] } });
  await settle();
  assert.equal(output.textContent, '模型加载或翻译中…');
  assert.ok(q.messages.some(m => m.type === 'FORGET'));
});
