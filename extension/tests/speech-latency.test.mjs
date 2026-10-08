import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { speechPhrase } from '../speech_phrases.js';

// Run the production dispatch/stop functions with a deterministic clock and
// Chrome messages replaced; no audio service, model or persistent data is used.
const background = readFileSync(new URL('../background.js', import.meta.url), 'utf8');
const dispatchSource = background.slice(background.indexOf('async function audioStop('),
  background.indexOf('async function audioFeed('));

function dispatcher() {
  let now = 10000, timerId = 0, accept = async () => ({ queued: true });
  const timers = new Map(), messages = [], sessions = new Map();
  const session = { committed: '', lastPreview: '', speechEpoch: 'speech-test' };
  sessions.set(1, session);
  const context = vm.createContext({
    speechPhrase, audioSessions: sessions, audioIntents: new Map(), captureGrants: new Map(),
    audioTargetTab: null, audioStartGeneration: 0, cancelSpeech: async () => {},
    Date: { now: () => now },
    setTimeout(fn, ms) { timers.set(++timerId, { at: now + ms, fn }); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    chrome: {
      runtime: { sendMessage: async () => ({ ok: true }) },
      tabs: { async sendMessage(tab, message) { messages.push(message); return accept(message); } },
    },
  });
  vm.runInContext(dispatchSource, context);
  return {
    session, timers, sessions,
    sent: () => messages.filter(m => m.type === 'IT_VIDEO_SPEECH').map(m => m.source),
    feed: events => context.sendSpeech(1, events, session),
    stop: () => context.audioStop(1),
    accept(fn) { accept = fn; },
    async advance(ms) {
      const end = now + ms;
      for (;;) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        timers.delete(next[0]);
        now = next[1].at;
        await next[1].fn();
      }
      now = end;
    },
  };
}

test('Japanese stable phrases dispatch at commas or the deadline, without waiting for another ASR event', async () => {
  const d = dispatcher();
  const first = 'ちょっと待って、';
  await d.feed([{ language: 'Japanese', stable_text: first + 'まだ敵がいる',
    preview_text: first + 'まだ敵がいる気がする' }]);
  assert.deepEqual(d.sent(), [first], 'a Japanese clause can be sent before the sentence ends');
  await d.advance(800);
  await d.feed([{ language: 'Japanese', stable_text: first + 'まだ敵がいるから',
    preview_text: first + 'まだ敵がいるから逃げよう' }]);
  await d.advance(399);
  assert.equal(d.sent().length, 1);
  await d.advance(1);
  assert.deepEqual(d.sent(), [first, 'まだ敵がいるから'], 'new stable text does not postpone the original deadline');
  await d.feed([{ language: 'Japanese', stable_text: first + 'まだ敵がいるから逃げよう。', final: true }]);
  assert.deepEqual(d.sent(), [first, 'まだ敵がいるから', '逃げよう。']);
  await d.advance(3000);
  assert.equal(d.sent().length, 3, 'finalized text must not be sent twice');

  const fast = dispatcher();
  await fast.feed([{ language: 'Japanese', stable_text: '危ない！' }]);
  await fast.advance(100);
  await fast.feed([{ language: 'Japanese', stable_text: '危ない！逃げて！' }]);
  await fast.advance(299);
  assert.equal(fast.sent().length, 1);
  await fast.advance(1);
  assert.deepEqual(fast.sent(), ['危ない！', '逃げて！'], 'Japanese dispatch uses the 400 ms interval');
});

test('Japanese timers serialize with new events and are cleared when speech stops', async () => {
  const d = dispatcher();
  await d.feed([{ language: 'Japanese', stable_text: 'やばい', preview_text: 'やばい逃げて' }]);
  let acknowledge;
  d.accept(message => message.type === 'IT_VIDEO_SPEECH'
    ? new Promise(resolve => { acknowledge = resolve; }) : Promise.resolve({ queued: true }));
  const flushing = d.advance(1200);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(d.sent(), ['やばい']);
  const ending = d.feed([{ language: 'Japanese', stable_text: 'やばい！', final: true }]);
  d.accept(async () => ({ queued: true }));
  acknowledge({ queued: true });
  await Promise.all([flushing, ending]);
  assert.equal(d.sent().filter(text => text.includes('やばい')).length, 1);

  await d.feed([{ language: 'Japanese', stable_text: 'やばい！まだ来る' }]);
  assert.ok(d.timers.size);
  await d.stop();
  assert.equal(d.timers.size, 0);
  const count = d.sent().length;
  await d.advance(5000);
  assert.equal(d.sent().length, count, 'stopped sessions must never publish a delayed phrase');
  assert.throws(() => speechPhrase('違う文字', '確定済み', false,
    { language: 'Japanese', pendingMs: 1200 }), /确认文本/);
});

test('other languages keep the original phrase rules and 900 ms interval', async () => {
  const d = dispatcher();
  await d.feed([{ language: 'English', stable_text: 'Wait, there is an enemy' }]);
  await d.advance(2000);
  assert.deepEqual(d.sent(), []);
  assert.equal(d.timers.size, 0);
  await d.feed([{ language: 'English', stable_text: 'Wait, there is an enemy.' }]);
  await d.advance(400);
  await d.feed([{ language: 'English', stable_text: 'Wait, there is an enemy. Run!' }]);
  assert.equal(d.sent().length, 1);
  await d.advance(500);
  await d.feed([{ language: 'English', stable_text: 'Wait, there is an enemy. Run!' }]);
  assert.deepEqual(d.sent(), ['Wait, there is an enemy.', 'Run!']);
  assert.equal(speechPhrase('这是没有句号的中文短句', '', false,
    { language: 'Chinese', pendingMs: 5000 }).text, '');
  assert.equal(speechPhrase('ちょっと待って、まだ敵がいる', '', false).text, '',
    'Japanese optimization requires the ASR language marker');
});
