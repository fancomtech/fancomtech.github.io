/* ========== Question Selection Engine + Game Session ========== */

function uid(prefix) {
  return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** ตรวจสอบว่าคำถามใช้กับโหมดนี้ได้ */
function validateQuestion(q, gameMode) {
  if (!q || q.status !== 'active') return false;
  if (!q.questionText || !String(q.questionText).trim()) return false;
  const type = q.questionType || 'mcq';
  const modes = {
    classic: ['mcq'],
    speed: ['mcq', 'tf'],
    truefalse: ['tf', 'mcq'],
    survival: ['mcq', 'tf'],
    timeattack: ['mcq', 'tf'],
    practice: ['mcq', 'tf'],
    match: ['mcq'],
    memory: ['mcq'],
    demo: ['mcq', 'tf']
  };
  const allowed = modes[gameMode] || ['mcq', 'tf'];
  if (!allowed.includes(type) && !(type === 'mcq' && allowed.includes('mcq'))) {
    // tf questions can be used in mcq modes if they have options
    if (!(type === 'tf' && q.options && q.options.length >= 2)) return false;
  }
  if (!q.options || q.options.length < 2) return false;
  if (!q.correctAnswer && q.correctAnswer !== 0) {
    // try derive
    if (typeof q.answer === 'number' && q.options[q.answer] !== undefined) return true;
    return false;
  }
  return true;
}

function getCorrectText(q) {
  if (q.correctAnswer) return q.correctAnswer;
  if (typeof q.answer === 'number' && q.options && q.options[q.answer] !== undefined) {
    return q.options[q.answer];
  }
  return '';
}

/** กรองคำถามตามเงื่อนไข */
function getAvailableQuestions(filters = {}, gameMode = 'classic') {
  const list = Store.getQuestions({
    status: 'active',
    categoryId: filters.categoryIds && filters.categoryIds.length ? filters.categoryIds : undefined,
    difficulty: filters.difficulty,
    gradeLevel: filters.gradeLevel,
    questionType: filters.questionType,
    search: filters.search,
    enabledOnly: true
  });
  return list.filter(q => validateQuestion(q, gameMode));
}

/** สุ่มคำถามไม่ซ้ำ */
function selectRandomQuestions(filters, count, gameMode) {
  const available = getAvailableQuestions(filters, gameMode);
  if (available.length === 0) {
    return { ok: false, questions: [], available: 0, message: 'ไม่พบคำถามที่ตรงเงื่อนไข' };
  }
  if (available.length < count) {
    return {
      ok: false,
      questions: [],
      available: available.length,
      message: `มีคำถามที่ใช้ได้เพียง ${available.length} ข้อ (ต้องการ ${count} ข้อ)`
    };
  }
  const picked = shuffle(available).slice(0, count);
  // สุ่มลำดับตัวเลือก แต่รักษา correctAnswer
  const prepared = picked.map(q => shuffleAnswerOptions(q));
  return { ok: true, questions: prepared, available: available.length };
}

function shuffleAnswerOptions(q) {
  const copy = { ...q, options: [...(q.options || [])] };
  const correct = getCorrectText(copy);
  copy.options = shuffle(copy.options);
  // อัปเดต index
  copy._correctIndex = copy.options.findIndex(o => o === correct);
  if (copy._correctIndex < 0) copy._correctIndex = 0;
  copy.correctAnswer = correct;
  return copy;
}

/** สร้าง session เกม */
function startGameSession(settings) {
  const {
    mode, count, categoryIds, difficulty, gradeLevel,
    players, timePerQ, scorePerQ, showExplain, shuffleQ
  } = settings;

  const result = selectRandomQuestions(
    { categoryIds, difficulty, gradeLevel },
    count,
    mode
  );
  if (!result.ok) return result;

  const session = {
    sessionId: uid('ses'),
    mode,
    settings: {
      count,
      categoryIds: categoryIds || [],
      difficulty: difficulty || 'all',
      gradeLevel: gradeLevel || 'all',
      timePerQ: timePerQ || 30,
      scorePerQ: scorePerQ || 10,
      showExplain: showExplain !== false,
      shuffleQ: shuffleQ !== false
    },
    questions: result.questions,
    players: (players || [{ id: 'p1', name: 'ผู้เล่น1', color: '#fbbf24' }]).map(p => ({
      id: p.id || uid('pl'),
      name: p.name || 'ผู้เล่น',
      color: p.color || '#fbbf24',
      score: 0,
      correct: 0,
      wrong: 0,
      answered: 0,
      lives: mode === 'survival' ? 3 : null,
      answers: {} // questionId -> { answer, correct, timeMs }
    })),
    currentIndex: 0,
    startedAt: Date.now(),
    finishedAt: null,
    status: 'playing'
  };
  return { ok: true, session };
}

function submitPlayerAnswer(session, playerId, questionId, answer, timeMs) {
  if (!session || session.status !== 'playing') return { ok: false, message: 'เกมไม่ได้อยู่ในสถานะเล่น' };
  const player = session.players.find(p => p.id === playerId);
  if (!player) return { ok: false, message: 'ไม่พบผู้เล่น' };
  if (player.answers[questionId]) return { ok: false, message: 'ตอบข้อนี้ไปแล้ว' };

  const q = session.questions.find(x => x.questionId === questionId);
  if (!q) return { ok: false, message: 'ไม่พบคำถามในรอบนี้' };

  const correctText = getCorrectText(q);
  const isCorrect = String(answer).trim() === String(correctText).trim() ||
    (typeof q._correctIndex === 'number' && session.questions.indexOf(q) >= 0 &&
      q.options[q._correctIndex] === answer);

  // เปรียบเทียบแบบยืดหยุ่น
  let ok = false;
  if (typeof answer === 'number') {
    ok = answer === q._correctIndex;
  } else {
    const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '');
    ok = norm(answer) === norm(correctText);
  }

  const pts = ok ? (session.settings.scorePerQ || 10) : 0;
  // โบนัสความเร็ว (speed / timeattack)
  let bonus = 0;
  if (ok && timeMs != null && session.settings.timePerQ) {
    const remain = Math.max(0, session.settings.timePerQ * 1000 - timeMs);
    bonus = Math.floor(remain / 3000); // +1 ต่อ 3 วิที่เหลือ
  }
  const totalPts = pts + bonus;

  player.answers[questionId] = { answer, correct: ok, timeMs: timeMs || 0, points: totalPts };
  player.answered++;
  if (ok) {
    player.correct++;
    player.score += totalPts;
  } else {
    player.wrong++;
    if (session.mode === 'survival' && player.lives != null) {
      player.lives--;
    }
  }
  return { ok: true, correct: ok, points: totalPts, correctAnswer: correctText, explanation: q.explanation, lives: player.lives };
}

function calculateScore(session, playerId) {
  const player = session.players.find(p => p.id === playerId);
  if (!player) return null;
  const total = session.questions.length;
  return {
    score: player.score,
    correct: player.correct,
    wrong: player.wrong,
    answered: player.answered,
    total,
    accuracy: total ? Math.round((player.correct / total) * 100) : 0
  };
}

function finishGameSession(session) {
  session.status = 'finished';
  session.finishedAt = Date.now();
  Store.addHistory({
    sessionId: session.sessionId,
    mode: session.mode,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    questionCount: session.questions.length,
    players: session.players.map(p => ({
      name: p.name,
      score: p.score,
      correct: p.correct,
      wrong: p.wrong,
      accuracy: session.questions.length ? Math.round((p.correct / session.questions.length) * 100) : 0
    })),
    categoryIds: session.settings.categoryIds
  });
  return session;
}

/** โหมดที่พร้อมใช้งานจริง */
const GAME_MODES = [
  { id: 'classic', name: 'Classic Quiz', icon: '❓', desc: 'ตอบคำถามปรนัย 4 ตัวเลือก', types: ['mcq'] },
  { id: 'speed', name: 'Speed Challenge', icon: '⚡', desc: 'ตอบให้เร็ว มีโบนัสเวลา', types: ['mcq', 'tf'] },
  { id: 'truefalse', name: 'True or False', icon: '✅', desc: 'ตอบถูกหรือผิด', types: ['tf', 'mcq'] },
  { id: 'survival', name: 'Survival Mode', icon: '❤️', desc: 'ผิด 3 ครั้งจบเกม', types: ['mcq', 'tf'] },
  { id: 'timeattack', name: 'Time Attack', icon: '⏱️', desc: 'ทำคะแนนในเวลาที่กำหนด', types: ['mcq', 'tf'] },
  { id: 'practice', name: 'Practice Mode', icon: '📚', desc: 'ฝึกตอบ แสดงเฉลยทันที', types: ['mcq', 'tf'] },
  { id: 'match', name: 'Category Matching', icon: '🔗', desc: 'จับคู่คำถามกับคำตอบ', types: ['mcq'] },
  { id: 'memory', name: 'Memory Match', icon: '🧠', desc: 'เกมความจำจับคู่', types: ['mcq'] },
  { id: 'demo', name: 'Teacher Demo', icon: '👩‍🏫', desc: 'ครูควบคุมการแสดงคำถามและเฉลย', types: ['mcq', 'tf'] }
];
