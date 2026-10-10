/* ========== AR EDU GAME · Main Application ========== */
Store.load();

let role = null; // teacher | student
let session = null;
let currentPlayerId = null;
let qStartTime = 0;
let timerIv = null;
let globalTimerLeft = 0;

const $ = id => document.getElementById(id);
const show = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
};

function toast(msg, icon = 'success') {
  Swal.fire({ toast: true, position: 'top', icon, title: msg, showConfirmButton: false, timer: 1600 });
}

// ---------- Home / Role ----------
function goHome() {
  Finger.stop();
  role = null; session = null;
  show('screen-home');
}

function chooseRole(r) {
  role = r;
  if (r === 'teacher') {
    show('screen-teacher');
    switchTeacherTab('cats');
  } else {
    show('screen-setup');
    renderSetup();
  }
}

// ---------- Teacher Tabs ----------
function switchTeacherTab(name) {
  document.querySelectorAll('.ttab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tpanel').forEach(p => p.classList.toggle('active', p.id === 'tp-' + name));
  if (name === 'dash') renderDashboard();
  if (name === 'cats') renderCats();
  if (name === 'qs') renderQBank();
  if (name === 'hist') renderHistory();
  if (name === 'data') { /* static */ }
}

// ---------- Dashboard ----------
function renderDashboard() {
  const qs = Store.getQuestions({ status: 'active' });
  const cats = Store.getCategories();
  const hist = Store.getHistory(100);
  const totalPlays = hist.length;
  const avgScore = hist.length
    ? Math.round(hist.reduce((s, h) => s + (h.players?.[0]?.score || 0), 0) / hist.length)
    : 0;
  const avgAcc = hist.length
    ? Math.round(hist.reduce((s, h) => s + (h.players?.[0]?.accuracy || 0), 0) / hist.length)
    : 0;
  $('dash-stats').innerHTML = `
    <div class="stat"><b>${cats.length}</b><span>หมวด</span></div>
    <div class="stat"><b>${qs.length}</b><span>คำถามที่ใช้งาน</span></div>
    <div class="stat"><b>${totalPlays}</b><span>รอบที่เล่น</span></div>
    <div class="stat"><b>${avgScore}</b><span>คะแนนเฉลี่ย</span></div>
    <div class="stat"><b>${avgAcc}%</b><span>ความแม่นยำเฉลี่ย</span></div>
    <div class="stat"><b>${Store.data.questions.length}</b><span>คำถามทั้งหมด</span></div>`;
  // ต่อหมวด
  $('dash-cats').innerHTML = cats.map(c => {
    const n = Store.countByCategory(c.id);
    return `<div class="mini-row"><span>${c.icon} ${c.name}</span><b>${n}</b></div>`;
  }).join('') || '<p class="muted">ยังไม่มีหมวด</p>';
  // โหมดนิยม
  const modeCount = {};
  hist.forEach(h => { modeCount[h.mode] = (modeCount[h.mode] || 0) + 1; });
  const modes = Object.entries(modeCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $('dash-modes').innerHTML = modes.map(([m, n]) => {
    const info = GAME_MODES.find(x => x.id === m);
    return `<div class="mini-row"><span>${info ? info.icon + ' ' + info.name : m}</span><b>${n}</b></div>`;
  }).join('') || '<p class="muted">ยังไม่มีประวัติ</p>';
}

// ---------- Categories CRUD ----------
// ---------- Categories & Questions → delegated to Admin (js/admin.js) ----------
function renderCats() { Admin.render(); }
function renderQBank() { Admin.renderQ(); }
async function addCat() { return Admin.addCat(); }
async function editCat(id) { return Admin.editCat(id); }
function delCat(id) { return Admin.delCat(id); }
async function addQ() { return Admin.addQ(); }
async function editQ(id) { return Admin.editQ(id); }
async function copyQ(id) { return Admin.copyQ(id); }
function delQ(id) { return Admin.delQ(id); }

// ---------- History ----------
function renderHistory() {
  const hist = Store.getHistory(50);
  $('hist-list').innerHTML = hist.map(h => {
    const mode = GAME_MODES.find(m => m.id === h.mode);
    const p = h.players?.[0];
    return `<div class="list-item">
      <div class="info">
        <strong>${mode ? mode.icon + ' ' + mode.name : h.mode}</strong>
        <small>${new Date(h.finishedAt || h.startedAt).toLocaleString('th-TH')} · ${h.questionCount} ข้อ · ${p ? p.name + ' ' + p.score + ' คะแนน (' + p.accuracy + '%)' : ''}</small>
      </div>
    </div>`;
  }).join('') || '<div class="empty">ยังไม่มีประวัติ</div>';
}

// ---------- Data Import/Export ----------
function exportData() {
  const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ar-edu-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  toast('ส่งออก JSON แล้ว');
}

function exportCSV() {
  let csv = '\uFEFFหมวด,คำถาม,A,B,C,D,คำตอบ,ประเภท,ความยาก,คำอธิบาย\n';
  Store.getQuestions({}).forEach(q => {
    const cat = Store.getCategory(q.categoryId);
    const opts = q.options || [];
    const row = [cat?.name || '', q.questionText, opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || '',
      q.correctAnswer || '', q.questionType || '', q.difficulty || '', q.explanation || '']
      .map(c => `"${String(c).replace(/"/g, '""')}"`);
    csv += row.join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ar-edu-questions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  toast('ส่งออก CSV แล้ว');
}

function importData() { $('import-file').click(); }
function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      Store.importJSON(ev.target.result);
      toast('นำเข้าสำเร็จ');
      renderDashboard(); renderCats(); renderQBank();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'นำเข้าไม่สำเร็จ', text: err.message, confirmButtonColor: '#7c3aed' });
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function resetData() {
  Swal.fire({ title: 'คืนค่าเริ่มต้น?', text: 'ข้อมูลที่แก้ไขจะถูกลบและกลับไปใช้คลังตัวอย่าง', icon: 'warning',
    showCancelButton: true, confirmButtonText: 'คืนค่า', confirmButtonColor: '#ef4444' })
    .then(r => {
      if (r.isConfirmed) {
        Store.resetAll();
        toast('คืนค่าแล้ว');
        renderDashboard(); renderCats(); renderQBank();
      }
    });
}

// ---------- Student Setup ----------
function renderSetup() {
  // modes
  $('mode-grid').innerHTML = GAME_MODES.map(m => `
    <label class="mode-card">
      <input type="radio" name="mode" value="${m.id}" ${m.id === 'classic' ? 'checked' : ''}>
      <div class="mode-body">
        <span class="mico">${m.icon}</span>
        <strong>${m.name}</strong>
        <small>${m.desc}</small>
      </div>
    </label>`).join('');

  // categories
  const cats = Store.getCategories(true);
  $('cat-grid').innerHTML = cats.map(c => {
    const n = Store.countByCategory(c.id);
    return `<label class="cat-chip">
      <input type="checkbox" name="cats" value="${c.id}" ${c.id === 'cat_drug_danger' ? 'checked' : ''}>
      <span>${c.icon} ${c.name} (${n})</span>
    </label>`;
  }).join('');

  updateAvailCount();
  document.querySelectorAll('input[name="cats"]').forEach(c => c.addEventListener('change', updateAvailCount));
  document.querySelectorAll('input[name="mode"]').forEach(c => c.addEventListener('change', updateAvailCount));
  document.querySelectorAll('input[name="qcount"]').forEach(c => c.addEventListener('change', updateAvailCount));
  $('custom-count')?.addEventListener('input', updateAvailCount);
  $('diff-select')?.addEventListener('change', updateAvailCount);
}

function getSetupFilters() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'classic';
  let count = parseInt(document.querySelector('input[name="qcount"]:checked')?.value || '5');
  if (document.querySelector('input[name="qcount"]:checked')?.value === 'custom') {
    count = parseInt($('custom-count')?.value || '5');
  }
  const categoryIds = [...document.querySelectorAll('input[name="cats"]:checked')].map(c => c.value);
  const difficulty = $('diff-select')?.value || 'all';
  const playerName = $('player-name')?.value?.trim() || 'ผู้เล่น1';
  return { mode, count, categoryIds, difficulty, playerName };
}

function updateAvailCount() {
  const f = getSetupFilters();
  const avail = getAvailableQuestions({ categoryIds: f.categoryIds, difficulty: f.difficulty }, f.mode);
  $('avail-count').textContent = `คำถามที่พร้อมเล่น: ${avail.length} ข้อ`;
  $('avail-count').className = avail.length >= f.count ? 'ok-msg' : 'warn-msg';
}

async function startPlay() {
  const f = getSetupFilters();
  if (f.count < 1 || f.count > 100) {
    Swal.fire({ icon: 'warning', title: 'จำนวนข้อต้องอยู่ระหว่าง 1–100', confirmButtonColor: '#7c3aed' }); return;
  }
  if (!f.categoryIds.length) {
    Swal.fire({ icon: 'warning', title: 'เลือกอย่างน้อย 1 หมวด', confirmButtonColor: '#7c3aed' }); return;
  }

  const res = startGameSession({
    mode: f.mode,
    count: f.count,
    categoryIds: f.categoryIds,
    difficulty: f.difficulty,
    players: [{ id: 'p1', name: f.playerName, color: '#fbbf24' }],
    timePerQ: f.mode === 'speed' || f.mode === 'timeattack' ? 20 : 30,
    scorePerQ: 10,
    showExplain: true
  });

  if (!res.ok) {
    Swal.fire({
      icon: 'warning',
      title: 'เริ่มเกมไม่ได้',
      text: res.message + (res.available != null ? ` — มี ${res.available} ข้อ` : ''),
      confirmButtonColor: '#7c3aed'
    });
    return;
  }

  session = res.session;
  currentPlayerId = session.players[0].id;
  show('screen-game');
  await Finger.start();
  playRound();
}

// ---------- Game Loop ----------
function playRound() {
  clearInterval(timerIv);
  const mode = session.mode;
  const stage = $('game-stage');
  const player = session.players[0];

  $('g-mode').textContent = (GAME_MODES.find(m => m.id === mode) || {}).name || mode;
  $('g-score').textContent = player.score;
  if (mode === 'survival') $('g-extra').textContent = `❤️ ${player.lives}`;
  else $('g-extra').textContent = '';

  // Match / Memory — ทั้งชุด
  if (mode === 'match') {
    $('g-progress').textContent = 'จับคู่';
    ModeUI.renderMatch(session.questions, stage, (score, n) => {
      player.score += score; player.correct += n;
      finishPlay();
    });
    return;
  }
  if (mode === 'memory') {
    $('g-progress').textContent = 'Memory';
    ModeUI.renderMemory(session.questions, stage, (score, n) => {
      player.score += score; player.correct += n;
      finishPlay();
    });
    return;
  }

  if (session.currentIndex >= session.questions.length) {
    finishPlay(); return;
  }

  // Survival out of lives
  if (mode === 'survival' && player.lives <= 0) {
    finishPlay(); return;
  }

  const q = session.questions[session.currentIndex];
  $('g-progress').textContent = `${session.currentIndex + 1}/${session.questions.length}`;
  qStartTime = Date.now();

  // Timer for speed / timeattack
  if (mode === 'speed' || mode === 'timeattack') {
    let left = session.settings.timePerQ;
    $('g-timer').style.display = 'block';
    $('g-timer').textContent = left + 's';
    timerIv = setInterval(() => {
      left--;
      $('g-timer').textContent = left + 's';
      if (left <= 0) {
        clearInterval(timerIv);
        // auto wrong
        handleAnswer(q, { index: -1, text: '', correct: false });
      }
    }, 1000);
  } else {
    $('g-timer').style.display = 'none';
  }

  if (mode === 'demo') {
    ModeUI.renderDemo(q, stage, () => {}, () => {
      session.currentIndex++;
      playRound();
    });
    return;
  }

  // TF mode: convert mcq to true/false style if needed — use options as-is
  ModeUI.renderMCQ(q, stage, (ans) => {
    clearInterval(timerIv);
    handleAnswer(q, ans);
  }, { label: mode === 'truefalse' ? 'ถูกหรือผิด' : 'คำถาม' });
}

function handleAnswer(q, ans) {
  const timeMs = Date.now() - qStartTime;
  const answerVal = (typeof ans.index === 'number' && ans.index >= 0) ? ans.index : (ans.text || '');
  let result = submitPlayerAnswer(session, currentPlayerId, q.questionId, answerVal, timeMs);
  // ถ้าตอบซ้ำหรือ error — ใช้ผลจาก UI
  if (!result.ok && result.message === 'ตอบข้อนี้ไปแล้ว') {
    result = { ok: true, correct: !!ans.correct, points: ans.correct ? 10 : 0, correctAnswer: getCorrectText(q) };
  } else if (!result.ok) {
    result = { ok: true, correct: !!ans.correct, points: ans.correct ? 10 : 0, correctAnswer: getCorrectText(q), explanation: q.explanation };
    // อัปเดตคะแนนด้วยตนเอง
    const player = session.players[0];
    if (ans.correct) { player.score += 10; player.correct++; }
    else { player.wrong++; if (session.mode === 'survival' && player.lives != null) player.lives--; }
    player.answered++;
  }

  const player = session.players[0];
  $('g-score').textContent = player.score;
  if (session.mode === 'survival') $('g-extra').textContent = '❤️ ' + player.lives;

  const showExp = session.settings.showExplain || session.mode === 'practice';
  ModeUI.showFeedback($('game-stage'), {
    correct: result.correct,
    points: result.points || 0,
    correctAnswer: result.correctAnswer || getCorrectText(q)
  }, q, () => {
    session.currentIndex++;
    if (session.mode === 'survival' && player.lives <= 0) finishPlay();
    else playRound();
  }, showExp);
}

function finishPlay() {
  clearInterval(timerIv);
  Finger.stop();
  finishGameSession(session);
  const sc = calculateScore(session, currentPlayerId);
  $('r-score').textContent = sc.score;
  $('r-detail').innerHTML = `
    <p>ถูก ${sc.correct} / ผิด ${sc.wrong} / ทั้งหมด ${sc.total}</p>
    <p>ความแม่นยำ ${sc.accuracy}%</p>
    <p class="muted">โหมด: ${(GAME_MODES.find(m => m.id === session.mode) || {}).name || session.mode}</p>`;
  show('screen-result');
}

function playAgain() {
  show('screen-setup');
  renderSetup();
}

// ---------- How to ----------
function showHowTo() {
  Swal.fire({
    title: 'วิธีใช้ AR EDU GAME',
    html: `<div style="text-align:left;line-height:1.65;font-size:0.92rem">
      <b>ครู:</b> จัดการหมวด · คลังคำถาม · ดูสถิติ · นำเข้า/ส่งออก<br>
      <b>นักเรียน:</b> เลือกโหมด · หมวด · จำนวนข้อ → เล่น<br>
      <b>นิ้วชี้:</b> เปิดกล้อง แล้วชี้ค้างที่ปุ่ม ~0.85 วินาที<br>
      ทุกโหมดใช้คลังคำถามกลางชุดเดียวกัน
    </div>`,
    confirmButtonColor: '#7c3aed'
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // bind count radios custom
  document.querySelectorAll('input[name="qcount"]').forEach(r => {
    r.addEventListener('change', () => {
      const custom = r.value === 'custom';
      if ($('custom-wrap')) $('custom-wrap').style.display = custom ? 'block' : 'none';
      updateAvailCount();
    });
  });
});
