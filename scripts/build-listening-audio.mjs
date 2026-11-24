/* 生成听力逐句 MP3，并把音频内联成 data URI。
 * 依赖：Python + edge-tts（pip install edge-tts）
 * 用法：node scripts/build-listening-audio.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(root, 'data', 'cet4-listening.js');
const audioDir = path.join(root, 'assets', 'audio', 'listening');
const outFile = path.join(root, 'data', 'cet4-listening-audio.js');
fs.mkdirSync(audioDir, { recursive: true });

const sandbox = { window: {}, StudyHubData: {} };
sandbox.window.StudyHubData = sandbox.StudyHubData;
vm.runInNewContext(fs.readFileSync(dataFile, 'utf8'), sandbox, { filename: dataFile });
const data = sandbox.StudyHubData && sandbox.StudyHubData.cet4Listening;
if (!data || !Array.isArray(data.sets)) throw new Error('没有找到 cet4Listening.sets');

const VOICE = { M: 'en-US-GuyNeural', W: 'en-US-AriaNeural', N: 'en-US-AriaNeural' };
const RATE = '-5%';
const manifest = { generatedAt: new Date().toISOString(), rate: RATE, sets: {} };
const sets = {};

function synth(text, voice, file) {
  const args = ['-m', 'edge_tts', '--voice', voice, '--rate=' + RATE, '--text', text, '--write-media', file];
  const r = spawnSync('python', args, { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0) {
    throw new Error('edge-tts 失败：' + (r.stderr || r.stdout || 'exit ' + r.status));
  }
  if (!fs.existsSync(file) || fs.statSync(file).size < 1000) throw new Error('音频文件为空：' + file);
}

for (const set of data.sets) {
  sets[set.id] = [];
  manifest.sets[set.id] = { title: set.title, lines: [] };
  for (let i = 0; i < set.script.length; i++) {
    const line = set.script[i];
    const voice = VOICE[line.role] || VOICE.N;
    const file = path.join(audioDir, set.id + '-' + String(i + 1).padStart(2, '0') + '.mp3');
    process.stdout.write(set.id + ' ' + (i + 1) + '/' + set.script.length + ' ' + voice + ' ... ');
    synth(line.text, voice, file);
    const bytes = fs.statSync(file).size;
    sets[set.id].push('data:audio/mpeg;base64,' + fs.readFileSync(file).toString('base64'));
    manifest.sets[set.id].lines.push({ index: i, role: line.role, voice, file: path.relative(root, file), bytes });
    process.stdout.write(bytes + ' bytes\n');
  }
}

const header = '/* 自动生成：node scripts/build-listening-audio.mjs；音频由 edge-tts 生成，跨浏览器播放。 */\n' +
  'window.StudyHubData = window.StudyHubData || {};\n' +
  'StudyHubData.cet4ListeningAudio = {\n' +
  '  meta: ' + JSON.stringify({ source: 'edge-tts', rate: RATE, generatedAt: manifest.generatedAt, note: '逐句 MP3，内联为 data URI，不依赖系统语音包' }) + ',\n' +
  '  sets: {\n';
const body = Object.keys(sets).map(function (id) {
  return '    ' + JSON.stringify(id) + ': ' + JSON.stringify(sets[id]) + ',\n';
}).join('');
const footer = '  }\n};\n';
fs.writeFileSync(outFile, header + body + footer, 'utf8');
fs.writeFileSync(path.join(audioDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

const total = Object.values(sets).reduce(function (n, arr) { return n + arr.length; }, 0);
const bytes = fs.statSync(outFile).size;
console.log('\n完成：' + total + ' 句，data 文件 ' + (bytes / 1024).toFixed(1) + ' KB');