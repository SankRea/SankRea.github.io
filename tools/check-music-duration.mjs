// Run manually: node tools/check-music-duration.mjs
// Uses only Node built-ins. The browser reads actual media duration without playing audio.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: { port: { type: 'string', default: '8788' } } });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('端口需为 1024–65535。');
const token = randomBytes(24).toString('hex');
const origin = `http://127.0.0.1:${port}`;
let run;
let starting;
let saveQueue = Promise.resolve();

function summarize() {
  const results = run.results.filter(Boolean);
  return {
    total: run.tracks.length, checked: results.length,
    short: results.filter(item => item.status === 'short').length,
    long: results.filter(item => item.status === 'ok').length,
    failed: results.filter(item => item.status === 'failed').length,
    pending: run.tracks.length - results.length
  };
}
function queueSave() {
  const report = {
    schemaVersion: 1, playlistUrl: run.playlistUrl, startedAt: run.startedAt,
    updatedAt: new Date().toISOString(), thresholdSeconds: 60,
    method: 'Browser HTMLAudioElement metadata; actual resolved audio, not catalogue duration',
    summary: summarize(),
    tracks: run.tracks.map((track, index) => run.results[index] || { ...track, status: 'pending' })
  };
  const folder = run.folder;
  const csvCell = value => {
    let text = String(value ?? '');
    // Keep names safe to open in spreadsheet software.
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const short = report.tracks.filter(track => track.status === 'short');
  const failed = report.tracks.filter(track => track.status === 'failed');
  const rows = [['序号', '歌曲', '歌手', '歌曲ID', '时长（秒）', '状态', '尝试次数', '错误', '资源URL'],
    ...report.tracks.map(track => [track.index + 1, track.name, track.artist, track.songId,
      track.durationSeconds, track.status, track.attempts, track.error, track.url])];
  const list = [
    `不足 60 秒的音频资源：${short.length} 首`,
    `检测 ${report.summary.checked}/${report.summary.total}，失败 ${failed.length}，待检测 ${report.summary.pending}`,
    `歌单：${report.playlistUrl}`, `开始：${report.startedAt}`, '',
    ...short.map(track => `${track.name} — ${track.artist} | ${track.durationSeconds.toFixed(3)} 秒 | ID: ${track.songId || '无'} | ${track.url}`),
    '', '检测失败（不算短曲）：', ...failed.map(track => `${track.name} — ${track.artist} | ${track.error}`),
    '', '结果只代表此次接口返回的实际音频；短曲可能是试听片段。pending/failed 不可用于屏蔽。'
  ].join('\r\n');
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, 'results.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
    await writeFile(join(folder, 'all-tracks.csv'), '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n'), 'utf8');
    await writeFile(join(folder, 'short-tracks.txt'), '\uFEFF' + list + '\r\n', 'utf8');
  });
  return saveQueue;
}
async function startRun() {
  if (run) {
    await queueSave();
    return run;
  }
  if (starting) return starting;
  starting = (async () => {
    const config = await readFile(join(root, 'source/_data/body-end.njk'), 'utf8');
    const configured = config.match(/\bdata-api="([^"]+)"/);
    if (!configured) throw new Error('未找到音乐 data-api 配置。');
    const playlistUrl = configured[1].replaceAll('&amp;', '&');
    if (new URL(playlistUrl).protocol !== 'https:') throw new Error('歌单接口必须使用 HTTPS。');
    const response = await fetch(playlistUrl, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`歌单接口 HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error('接口未返回非空歌单。');
    const tracks = data.map((track, index) => {
      let parsed;
      try { parsed = new URL(track.url); } catch {}
      return { index, name: String(track?.name || '未命名歌曲'), artist: String(track?.artist || '未知歌手'),
        songId: parsed?.searchParams.get('id') || '', server: parsed?.searchParams.get('server') || '',
        url: parsed?.protocol === 'https:' ? parsed.href : '' };
    });
    const startedAt = new Date().toISOString();
    run = { playlistUrl, startedAt, tracks, results: Array(tracks.length).fill(null),
      folder: join(root, 'reports/music-duration', startedAt.replaceAll(':', '-')) };
    await queueSave();
    console.log(`报告目录：${run.folder}`);
    return run;
  })();
  try { return await starting; } finally { starting = null; }
}
function json(response, code, value) {
  response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}
async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16384) throw new Error('请求过大。');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
const server = createServer(async (request, response) => {
  try {
    if (request.headers.host !== `127.0.0.1:${port}`) return json(response, 403, { error: '仅限本地访问。' });
    const path = new URL(request.url, origin).pathname;
    if (request.method === 'GET' && path === '/') {
      const page = await readFile(join(root, 'tools/music-duration-checker.html'), 'utf8');
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return response.end(page.replace('__TOKEN__', token));
    }
    if (request.method !== 'POST' || request.headers['x-checker-token'] !== token
      || (request.headers.origin && request.headers.origin !== origin)) {
      return json(response, 403, { error: '无效的本地请求。' });
    }
    if (path === '/api/start') {
      await startRun();
      return json(response, 200, { tracks: run.tracks, results: run.results, folder: run.folder, summary: summarize() });
    }
    if (path === '/api/result') {
      const input = await body(request);
      if (!run || !Number.isInteger(input.index) || !run.tracks[input.index]) throw new Error('无效的歌曲序号。');
      const valid = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0;
      const record = { ...run.tracks[input.index],
        status: valid ? (input.durationSeconds < 60 ? 'short' : 'ok') : 'failed',
        durationSeconds: valid ? input.durationSeconds : null,
        attempts: Number.isInteger(input.attempts) ? input.attempts : 0,
        error: valid ? '' : String(input.error || '未获取到可靠时长').slice(0, 500), checkedAt: new Date().toISOString() };
      run.results[input.index] = record;
      await queueSave();
      return json(response, 200, { record, summary: summarize() });
    }
    json(response, 404, { error: '地址不存在。' });
  } catch (error) {
    console.error(error.message);
    json(response, 500, { error: error.message });
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? '端口被占用，可运行：node tools/check-music-duration.mjs --port 8790' : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`请用浏览器打开 ${origin} ，点击“开始检测”。`);
  console.log('不会启动 Hexo、播放音乐或修改博客歌单。报告逐首保存；结束后按 Ctrl+C 退出。');
});
process.on('SIGINT', () => {
  console.log('\n正在保存已完成记录…');
  server.close();
  server.closeAllConnections();
  saveQueue.then(() => process.exit(0), error => { console.error(error.message); process.exit(1); });
});
