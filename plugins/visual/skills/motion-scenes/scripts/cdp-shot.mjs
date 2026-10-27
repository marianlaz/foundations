// Real-time screenshots of a page at given delays (ms), via the Chrome DevTools Protocol.
// usage: node cdp-shot.mjs <url> <outPrefix> <ms1> [ms2 ...]   [W=1440 H=900]
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const [url, prefix, ...times] = process.argv.slice(2);
const W = +(process.env.W || 1440), H = +(process.env.H || 900), PORT = 9333;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + prefix.replace(/[^/]+$/, '') + 'cdp-prof', '--allow-file-access-from-files', '--hide-scrollbars', `--window-size=${W},${H}`, 'about:blank'], {stdio: 'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver; for (let i = 0; i < 50 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(200); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params, sessionId})); });
const {result: {targetId}} = await send('Target.createTarget', {url: 'about:blank'});
const {result: {sessionId}} = await send('Target.attachToTarget', {targetId, flatten: true});
await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: 1, mobile: false}, sessionId);
await send('Page.enable', {}, sessionId);
const t0 = Date.now(); await send('Page.navigate', {url}, sessionId);
for (const [k, ms] of times.entries()) {
  await sleep(Math.max(0, +ms - (Date.now() - t0)));
  const r = await send('Page.captureScreenshot', {format: 'png'}, sessionId);
  const f = `${prefix}${String(k).padStart(2, '0')}-${ms}.png`; writeFileSync(f, Buffer.from(r.result.data, 'base64')); console.log(f);
}
ws.close(); chrome.kill();
