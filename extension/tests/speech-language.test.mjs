import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';
import { speechLanguage } from '../protocol.js';

const videoSource = readFileSync(new URL('../video.js', import.meta.url), 'utf8');
const background = readFileSync(new URL('../background.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));

function page() {
  let receive;
  const events = new Map(), intervals = [], messages = [], timeouts = [];
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.style = {}; this.dataset = {};
      this.isConnected = true; this.textTracks = []; this.handlers = {};
    }
    append(...nodes) { nodes.forEach(n => { n.parentNode = this; }); }
    attachShadow() { return new Element('shadow'); }
    setAttribute() {}
    hasAttribute() { return false; }
    matches() { return false; }
    addEventListener(name, fn) { this.handlers[name] = fn; }
    removeEventListener(name) { delete this.handlers[name]; }
    replaceChildren() {}
    remove() { this.parentNode = null; }
    getBoundingClientRect() { return {width:640,height:360,top:0,left:0,bottom:360,right:640}; }
  }
  const player = new Element('video');
  const context = {
    location: {href:'https://example.test/video/1'}, crypto:webcrypto,
    document: {documentElement:new Element('html'), querySelectorAll:() => [player],
      createElement:tag => new Element(tag)},
    innerHeight:800, innerWidth:1200, getComputedStyle:() => ({display:'block',visibility:'visible'}),
    MutationObserver:class { observe() {} }, addEventListener:(name, fn) => events.set(name, fn),
    setInterval(fn) { intervals.push(fn); return intervals.length; }, clearInterval() {},
    setTimeout(fn) { timeouts.push(fn); return timeouts.length; }, clearTimeout() {},
    chrome: {runtime:{id:'test',onMessage:{addListener(fn) { receive = fn; }},
      async sendMessage(message) { messages.push(message); return {ok:true,value:{restarted:true}}; }}},
  };
  vm.runInNewContext(videoSource, context);
  const send = message => new Promise(resolve => receive(message, {id:'test'}, resolve));
  return {context, player, messages, events, intervals, timeouts, send,
    language: language => send({type:'IT_VIDEO_LANGUAGE',expectedUrl:context.location.href,language}),
    start:() => send({type:'IT_VIDEO_START',forceSpeech:true}),
  };
}

test('page language defaults to Auto, persists across stop/seek/resume, and isolates tabs', async () => {
  const p = page(), other = page();
  assert.equal((await p.language()).value.language, 'Auto');
  assert.equal((await p.language('Japanese')).ok, true);
  assert.equal((await other.language()).value.language, 'Auto');
  assert.equal((await p.start()).speechLanguage, 'Japanese');
  await p.player.handlers.seeking();
  assert.equal(p.messages.filter(m => m.type === 'VIDEO_AUDIO_RESTART_PAGE').at(-1).speechLanguage, 'Japanese');
  await p.language('English');
  assert.equal(p.messages.filter(m => m.type === 'VIDEO_AUDIO_RESTART_PAGE').at(-1).speechLanguage, 'English');
  const epoch = (await p.send({type:'IT_VIDEO_EPOCH'})).speechEpoch;
  p.player.handlers.pause();
  p.timeouts.at(-1)();
  await settle();
  p.player.handlers.playing();
  await settle();
  assert.equal(p.messages.filter(m => m.type === 'VIDEO_AUDIO_RESTART_PAGE').at(-1).speechLanguage, 'English');
  assert.notEqual((await p.send({type:'IT_VIDEO_EPOCH'})).speechEpoch, epoch);
  await p.send({type:'IT_VIDEO_STOP'});
  assert.equal((await p.start()).speechLanguage, 'English');
  await p.language('Auto');
  assert.equal(p.messages.filter(m => m.type === 'VIDEO_AUDIO_RESTART_PAGE').at(-1).speechLanguage, 'Auto');
  assert.equal((await p.language('invalid')).ok, false);
  assert.equal((await p.language()).value.language, 'Auto');
});

test('navigation and pagehide clear the lock and reject stale popup writes', async () => {
  const p = page();
  await p.language('Japanese');
  await p.start();
  const oldUrl = p.context.location.href;
  p.context.location.href = 'https://example.test/video/2';
  p.intervals[0]();
  const stale = await p.send({type:'IT_VIDEO_LANGUAGE',expectedUrl:oldUrl,language:'Japanese'});
  assert.equal(stale.ok, false);
  assert.equal((await p.language()).value.language, 'Auto');
  assert.equal((await p.send({type:'IT_VIDEO_EPOCH'})).active, false);
  assert.ok(p.messages.some(m => m.type === 'VIDEO_AUDIO_STOP_PAGE'));
  await p.language('Korean');
  p.events.get('pagehide')();
  assert.equal((await p.language()).value.language, 'Auto');
  assert.equal((await page().language()).value.language, 'Auto');
});

function backgroundSession() {
  const calls = [], cancelled = [], sessions = new Map();
  let responder = async language => ({session_id:`sid-${calls.length}`,language});
  const context = vm.createContext({speechLanguage,crypto:webcrypto,clearTimeout,
    audioSessions:sessions,audioIntents:new Map(),audioTargetTab:1,audioStartGeneration:0,audioStarts:Promise.resolve(),
    async api(cfg, path, method, body) { calls.push(body.language); return responder(body.language); },
    async cancelSpeech(cfg, sid) { cancelled.push(sid); },
    async audioStop(id) { sessions.delete(id); },
    chrome:{runtime:{sendMessage:async () => ({ok:true})},tabs:{sendMessage:async () => ({shown:true,paused:false})}},
  });
  vm.runInContext(background.slice(background.indexOf('async function openSpeechSession('),background.indexOf('function ui(')),context);
  return {context,calls,cancelled,sessions,respond(fn) { responder = fn; }};
}

test('model loading uses the latest page language and cancels obsolete sessions', async () => {
  const b = backgroundSession();
  const session = {cfg:{},speechLanguage:'Auto'};
  let complete;
  b.respond(language => new Promise(resolve => { complete = sid => resolve({session_id:sid,language}); }));
  const pending = b.context.openSpeechSession(session, () => true);
  session.speechLanguage = 'Japanese';
  complete('obsolete');
  await settle();
  assert.deepEqual(b.calls, ['Auto','Japanese']);
  assert.deepEqual(b.cancelled, ['obsolete']);
  complete('latest');
  assert.equal(await pending, true);
  assert.equal(session.sid, 'latest');

  b.respond(async () => ({session_id:'old-backend'}));
  await assert.rejects(b.context.openSpeechSession(session, () => true), /后端未确认/);
  assert.ok(b.cancelled.includes('old-backend'));
  session.speechLanguage = 'Auto';
  assert.equal(await b.context.openSpeechSession(session, () => true), true, 'old backend remains usable in Auto');
});

test('restart retains the lock and initial-start coalescing replaces both epoch and language', async () => {
  const b = backgroundSession();
  b.sessions.set(1,{cfg:{},speechLanguage:'Japanese',captureId:'capture',sid:'first'});
  assert.equal((await b.context.audioRestart(1,'seek-epoch')).restarted, true);
  assert.deepEqual(b.calls,['Japanese']);
  assert.equal((await b.context.audioRestart(1,'change-epoch','Korean')).restarted,true);
  assert.deepEqual(b.calls,['Japanese','Korean']);
  const loading = {speechEpoch:'before',speechLanguage:'Auto',sid:null};
  b.sessions.set(1,loading);
  const intent = {session:loading,speechEpoch:'before',speechLanguage:'Auto'};
  b.context.audioIntents.set(1,intent);
  const result = b.context.audioRestart(1,'after','Japanese');
  assert.equal(loading.speechLanguage,'Japanese');
  assert.equal(intent.speechLanguage,'Japanese');
  assert.equal(loading.speechEpoch,'after');
  loading.sid = 'loaded';
  assert.equal((await result).restarted,true);
});

test('nine-minute rollover sends the selected language to the next ASR session', async () => {
  const b = backgroundSession();
  const session = {cfg:{},speechLanguage:'Japanese',captureId:'capture',sid:'first',
    samples:9*60*16000-160,seq:0,asrRevision:0,queue:Promise.resolve()};
  b.sessions.set(1,session);
  Object.assign(b.context,{takeSpeechEvents:() => ({events:[],revision:0}),sendSpeech:async () => {}});
  vm.runInContext(background.slice(background.indexOf('async function audioFeed('),background.indexOf('async function audioPause(')),b.context);
  await b.context.audioFeed(1,{captureId:'capture',samples:160,pcm_f32le_b64:'A'.repeat(856)});
  assert.equal(b.calls.at(-1),'Japanese');
  assert.equal(session.samples,0);
});
