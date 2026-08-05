const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const overlay = document.querySelector('#overlay');
const status = document.querySelector('#status');
const instruction = document.querySelector('#instruction');
const W = canvas.width, C = W / 2;
let best = Number(localStorage.neonOrbitBest || 0), score = 0, mode = 'ready';
let ring = 0, angle = -Math.PI / 2, obstacles = [], sparks = [], last = 0, spawned = 0;
bestEl.textContent = String(best).padStart(4, '0');

function reset() { score = 0; ring = 0; angle = -Math.PI / 2; obstacles = []; sparks = []; spawned = 0; scoreEl.textContent = '0000'; }
function start() { reset(); mode = 'playing'; overlay.classList.add('playing'); last = performance.now(); requestAnimationFrame(loop); }
function switchOrbit() { if (mode !== 'playing') return start(); ring = 1 - ring; for(let i=0;i<18;i++) sparks.push({a:angle+(Math.random()-.5), r: ring ? 126 : 210, life:1, v:2+Math.random()*3}); }
function addObstacle() { const a = Math.random() * Math.PI * 2; const target = Math.random() < .54 ? 0 : 1; obstacles.push({ a, target, r: 390, speed: 1.45 + score / 1700, width: .16 + Math.random() * .16, hue: target ? '#ff5d94' : '#54f7ff' }); }
function die() { mode = 'dead'; best = Math.max(best, score); localStorage.neonOrbitBest = best; bestEl.textContent = String(best).padStart(4,'0'); overlay.classList.remove('playing'); status.textContent = 'SIGNAL LOST'; instruction.textContent = `SCORE ${String(score).padStart(4,'0')}  /  クリックして再起動`; }
function drawCircle(r, color, line=2) { ctx.beginPath();ctx.arc(C,C,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=line;ctx.stroke(); }
function loop(now) { if(mode !== 'playing') return; const dt = Math.min((now-last)/1000,.04); last=now; score += dt*10; spawned += dt; if(spawned > Math.max(.34, .86-score/220)) { addObstacle(); spawned=0; }
 angle += dt*(1.75 + score/500); obstacles.forEach(o=>o.r-=o.speed*150*dt); obstacles = obstacles.filter(o=>o.r>45);
 for(const o of obstacles) { const pr = o.target ? 210 : 126; if(Math.abs(o.r-pr)<15 && ring===o.target && Math.abs(Math.atan2(Math.sin(angle-o.a),Math.cos(angle-o.a))) < o.width/2+.11) { die(); break; } }
 sparks.forEach(s=>{s.r+=s.v;s.life-=dt*2;}); sparks=sparks.filter(s=>s.life>0);
 draw(); if(mode==='playing') requestAnimationFrame(loop); }
function draw() { ctx.clearRect(0,0,W,W); const bg=ctx.createRadialGradient(C,C,10,C,C,460);bg.addColorStop(0,'#102a3a');bg.addColorStop(.55,'#081523');bg.addColorStop(1,'#03070e');ctx.fillStyle=bg;ctx.fillRect(0,0,W,W);
 ctx.save(); ctx.translate(C,C); for(let i=0;i<150;i++){ const a=i*2.4, r=90+(i*47%330);ctx.fillStyle=`rgba(116,222,255,${.025+(i%3)*.012})`;ctx.fillRect(Math.cos(a)*r,Math.sin(a)*r,1,1); } ctx.restore();
 drawCircle(126,'rgba(84,247,255,.18)',1); drawCircle(210,'rgba(255,93,148,.18)',1); drawCircle(168,'rgba(223,248,255,.08)',1);
 obstacles.forEach(o=>{ctx.save();ctx.translate(C,C);ctx.rotate(o.a);ctx.beginPath();ctx.arc(0,0,o.r,-o.width/2,o.width/2);ctx.strokeStyle=o.hue;ctx.shadowBlur=17;ctx.shadowColor=o.hue;ctx.lineWidth=12;ctx.stroke();ctx.restore();});
 sparks.forEach(s=>{ctx.fillStyle=`rgba(223,248,255,${s.life})`;ctx.beginPath();ctx.arc(C+Math.cos(s.a)*s.r,C+Math.sin(s.a)*s.r,2,0,7);ctx.fill();});
 const r=ring?210:126,x=C+Math.cos(angle)*r,y=C+Math.sin(angle)*r;ctx.shadowBlur=25;ctx.shadowColor='#f9ffff';ctx.fillStyle='#f4ffff';ctx.beginPath();ctx.arc(x,y,9,0,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=ring?'#ff5d94':'#54f7ff';ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();
 ctx.fillStyle='rgba(223,248,255,.6)';ctx.font='12px DM Mono, monospace';ctx.textAlign='center';ctx.fillText('+'+String(Math.floor(score)).padStart(4,'0'),C,C+4);scoreEl.textContent=String(Math.floor(score)).padStart(4,'0'); }
canvas.addEventListener('pointerdown', switchOrbit); window.addEventListener('keydown', e=>{if(e.code==='Space'){e.preventDefault();switchOrbit();}});draw();
