const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const comboEl = document.querySelector('#combo');
const overlay = document.querySelector('#overlay');
const status = document.querySelector('#status');
const instruction = document.querySelector('#instruction');
const W = canvas.width, C = W / 2, radii = [126, 210];
let best = Number(localStorage.neonOrbitBest || 0), score = 0, combo = 1, shield = 0, mode = 'ready';
let ring = 0, angle = -Math.PI / 2, objects = [], sparks = [], messages = [], last = 0, spawned = 0;
bestEl.textContent = String(best).padStart(4, '0');

function reset() { score = 0; combo = 1; shield = 0; ring = 0; angle = -Math.PI / 2; objects = []; sparks = []; messages = []; spawned = 0; updateHud(); }
function updateHud() { scoreEl.textContent = String(Math.floor(score)).padStart(4, '0'); comboEl.textContent = `x${combo}`; }
function start() { reset(); mode = 'playing'; overlay.classList.add('playing'); last = performance.now(); requestAnimationFrame(loop); }
function burst(a, r, color, count = 18) { for (let i = 0; i < count; i++) sparks.push({ a: a + (Math.random() - .5) * 1.4, r, life: 1, v: 2 + Math.random() * 5, color }); }
function notice(text, color) { messages.push({ text, color, life: 1 }); }
function switchOrbit() { if (mode !== 'playing') return start(); const old = ring; ring = 1 - ring; burst(angle, radii[old], ring ? '#ff5d94' : '#54f7ff', 12); }
function addObject() {
  const roll = Math.random();
  const type = roll < .64 ? 'hazard' : roll < .92 ? 'core' : 'shield';
  objects.push({ a: Math.random() * Math.PI * 2, target: Math.random() < .5 ? 0 : 1, r: 390, speed: 1.35 + score / 1500, width: .15 + Math.random() * .15, type });
}
function die() { mode = 'dead'; best = Math.max(best, Math.floor(score)); localStorage.neonOrbitBest = best; bestEl.textContent = String(best).padStart(4, '0'); overlay.classList.remove('playing'); status.textContent = 'SIGNAL LOST'; instruction.textContent = `SCORE ${String(Math.floor(score)).padStart(4, '0')}  /  クリックして再起動`; }
function hit(object) {
  if (object.type === 'hazard') {
    if (shield) { shield = 0; burst(object.a, radii[ring], '#ffd15c', 34); notice('SHIELD SAVED', '#ffd15c'); return; }
    die(); return;
  }
  if (object.type === 'core') { score += 10 * combo; combo = Math.min(combo + 1, 9); burst(object.a, radii[ring], '#f4ffff'); notice(`+${10 * (combo - 1)}  COMBO x${combo}`, '#f4ffff'); }
  if (object.type === 'shield') { shield = 1; combo = Math.min(combo + 1, 9); burst(object.a, radii[ring], '#ffd15c', 28); notice('SHIELD ONLINE', '#ffd15c'); }
}
function drawCircle(r, color, line = 2) { ctx.beginPath(); ctx.arc(C, C, r, 0, Math.PI * 2); ctx.strokeStyle = color; ctx.lineWidth = line; ctx.stroke(); }
function loop(now) {
  if (mode !== 'playing') return;
  const dt = Math.min((now - last) / 1000, .04); last = now; score += dt * combo * 5; spawned += dt;
  if (spawned > Math.max(.3, .78 - score / 260)) { addObject(); spawned = 0; }
  angle += dt * (1.75 + score / 500);
  objects.forEach(o => o.r -= o.speed * 150 * dt); objects = objects.filter(o => o.r > 45);
  for (const o of objects) {
    const gap = o.type === 'hazard' ? 15 : 20;
    if (Math.abs(o.r - radii[o.target]) < gap && ring === o.target && Math.abs(Math.atan2(Math.sin(angle - o.a), Math.cos(angle - o.a))) < o.width / 2 + .1) { hit(o); o.r = 0; if (mode !== 'playing') break; }
  }
  sparks.forEach(s => { s.r += s.v; s.life -= dt * 2; }); sparks = sparks.filter(s => s.life > 0);
  messages.forEach(m => m.life -= dt); messages = messages.filter(m => m.life > 0);
  updateHud(); draw(); if (mode === 'playing') requestAnimationFrame(loop);
}
function draw() {
  ctx.clearRect(0, 0, W, W); const bg = ctx.createRadialGradient(C, C, 10, C, C, 460); bg.addColorStop(0, '#102a3a'); bg.addColorStop(.55, '#081523'); bg.addColorStop(1, '#03070e'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, W);
  ctx.save(); ctx.translate(C, C); for (let i = 0; i < 150; i++) { const a = i * 2.4, r = 90 + (i * 47 % 330); ctx.fillStyle = `rgba(116,222,255,${.025 + (i % 3) * .012})`; ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 1, 1); } ctx.restore();
  drawCircle(126, 'rgba(84,247,255,.18)', 1); drawCircle(210, 'rgba(255,93,148,.18)', 1); drawCircle(168, 'rgba(223,248,255,.08)', 1);
  objects.forEach(o => { const color = o.type === 'hazard' ? (o.target ? '#ff5d94' : '#54f7ff') : o.type === 'shield' ? '#ffd15c' : '#f4ffff'; ctx.save(); ctx.translate(C, C); ctx.rotate(o.a); ctx.beginPath(); if (o.type === 'hazard') ctx.arc(0, 0, o.r, -o.width / 2, o.width / 2); else ctx.arc(o.r, 0, 9, 0, Math.PI * 2); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.shadowBlur = 18; ctx.shadowColor = color; ctx.lineWidth = o.type === 'hazard' ? 12 : 2; o.type === 'hazard' ? ctx.stroke() : ctx.fill(); ctx.restore(); });
  sparks.forEach(s => { ctx.fillStyle = s.color; ctx.globalAlpha = s.life; ctx.beginPath(); ctx.arc(C + Math.cos(s.a) * s.r, C + Math.sin(s.a) * s.r, 2, 0, 7); ctx.fill(); ctx.globalAlpha = 1; });
  const r = radii[ring], x = C + Math.cos(angle) * r, y = C + Math.sin(angle) * r;
  if (shield) { ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.strokeStyle = '#ffd15c'; ctx.shadowBlur = 18; ctx.shadowColor = '#ffd15c'; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.shadowBlur = 25; ctx.shadowColor = '#f9ffff'; ctx.fillStyle = '#f4ffff'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = ring ? '#ff5d94' : '#54f7ff'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = '12px DM Mono, monospace'; messages.forEach((m, i) => { ctx.globalAlpha = m.life; ctx.fillStyle = m.color; ctx.fillText(m.text, C, C + 4 + i * 18); }); ctx.globalAlpha = 1;
}
canvas.addEventListener('pointerdown', switchOrbit); window.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); switchOrbit(); } }); draw();
