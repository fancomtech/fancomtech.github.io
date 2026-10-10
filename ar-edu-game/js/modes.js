/* ========== Game Mode Renderers ========== */
const ModeUI = {
  /** Classic / Speed / Practice / Survival / TimeAttack / TrueFalse — ทีละข้อ */
  renderMCQ(q, container, onAnswer, opts = {}) {
    const isTF = (q.questionType === 'tf') || (q.options && q.options.length === 2 &&
      q.options.every(o => /^(ถูก|ผิด|true|false|ใช่|ไม่)$/i.test(String(o).trim())));
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'g-card';
    card.innerHTML = `<div class="g-label">${opts.label || 'คำถาม'}</div>
      <div class="g-q">${esc(q.questionText)}</div>
      <div class="g-opts" id="g-opts"></div>
      <div id="g-fb"></div>`;
    container.appendChild(card);
    const box = card.querySelector('#g-opts');
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'opt';
      btn.dataset.finger = '';
      btn.textContent = isTF ? opt : `${String.fromCharCode(65 + i)}. ${opt}`;
      btn.onclick = () => {
        if (btn.disabled) return;
        [...box.querySelectorAll('.opt')].forEach(b => b.disabled = true);
        const correctIdx = typeof q._correctIndex === 'number' ? q._correctIndex :
          q.options.findIndex(o => o === (q.correctAnswer || q.options[q.answer]));
        const ok = i === correctIdx;
        if (ok) btn.classList.add('yes');
        else {
          btn.classList.add('no');
          if (box.children[correctIdx]) box.children[correctIdx].classList.add('yes');
        }
        onAnswer({ index: i, text: opt, correct: ok, correctIdx });
      };
      box.appendChild(btn);
    });
  },

  showFeedback(container, result, q, onNext, showExplain) {
    const fb = container.querySelector('#g-fb') || container;
    const div = document.createElement('div');
    div.className = 'fb';
    div.innerHTML = `
      <div class="fb-ico">${result.correct ? '✅' : '❌'}</div>
      <div class="fb-msg" style="color:${result.correct ? 'var(--ok)' : 'var(--no)'}">
        ${result.correct ? 'ถูกต้อง!' : 'ยังไม่ถูก'}
        ${result.points ? ` (+${result.points})` : ''}
      </div>
      <div class="fb-ans">💡 คำตอบ: ${esc(result.correctAnswer || getCorrectText(q))}</div>
      ${showExplain && q.explanation ? `<div class="fb-exp">${esc(q.explanation)}</div>` : ''}
      <button class="btn primary" data-finger id="fb-next">ข้อถัดไป</button>`;
    const host = container.querySelector('#g-fb') || container;
    host.innerHTML = '';
    host.appendChild(div);
    div.querySelector('#fb-next').onclick = onNext;
  },

  /** Match mode */
  renderMatch(questions, container, onDone) {
    const pairs = questions.slice(0, Math.min(4, questions.length)).map((q, i) => ({
      id: i,
      left: q.questionText.length > 48 ? q.questionText.slice(0, 46) + '…' : q.questionText,
      right: getCorrectText(q),
      q
    }));
    const rights = shuffle(pairs.map(p => ({ id: p.id, text: p.right })));
    let sel = null, done = 0, score = 0;
    container.innerHTML = `
      <div class="g-card">
        <div class="g-label">🔗 จับคู่</div>
        <div class="g-q">ชี้รายการซ้าย แล้วชี้คำตอบที่ตรงกัน</div>
        <div class="match-grid"><div id="m-l"></div><div id="m-r"></div></div>
        <div id="g-fb"></div>
      </div>`;
    const L = container.querySelector('#m-l');
    const R = container.querySelector('#m-r');
    pairs.forEach(p => {
      const el = document.createElement('div');
      el.className = 'match-item'; el.dataset.finger = ''; el.dataset.id = p.id;
      el.textContent = p.left;
      el.onclick = () => {
        if (el.classList.contains('done')) return;
        L.querySelectorAll('.match-item').forEach(x => x.classList.remove('sel'));
        el.classList.add('sel'); sel = el;
      };
      L.appendChild(el);
    });
    rights.forEach(p => {
      const el = document.createElement('div');
      el.className = 'match-item'; el.dataset.finger = ''; el.dataset.id = p.id;
      el.textContent = p.text.length > 42 ? p.text.slice(0, 40) + '…' : p.text;
      el.onclick = () => {
        if (el.classList.contains('done') || !sel) return;
        if (sel.dataset.id === el.dataset.id) {
          sel.classList.add('done'); sel.classList.remove('sel');
          el.classList.add('done'); done++; score += 10; sel = null;
          if (done >= pairs.length) {
            container.querySelector('#g-fb').innerHTML = `
              <div class="fb"><div class="fb-ico">✅</div>
              <div class="fb-msg" style="color:var(--ok)">จับคู่ครบ!</div>
              <button class="btn primary" data-finger id="fb-next">ดูผล</button></div>`;
            container.querySelector('#fb-next').onclick = () => onDone(score, done);
          }
        } else {
          el.classList.add('bad'); sel.classList.add('bad');
          const s = sel;
          setTimeout(() => { el.classList.remove('bad'); s.classList.remove('bad', 'sel'); sel = null; }, 500);
        }
      };
      R.appendChild(el);
    });
  },

  /** Memory match — กลับไพ่จับคู่ */
  renderMemory(questions, container, onDone) {
    const pairs = questions.slice(0, 4);
    const cards = [];
    pairs.forEach((q, i) => {
      cards.push({ key: i, text: q.questionText.length > 40 ? q.questionText.slice(0, 38) + '…' : q.questionText, side: 'q' });
      cards.push({ key: i, text: getCorrectText(q).length > 40 ? getCorrectText(q).slice(0, 38) + '…' : getCorrectText(q), side: 'a' });
    });
    shuffle(cards);
    let flipped = [], locked = false, matched = 0, score = 0;
    container.innerHTML = `<div class="g-card"><div class="g-label">🧠 Memory</div>
      <div class="mem-grid" id="mem"></div><div id="g-fb"></div></div>`;
    const grid = container.querySelector('#mem');
    cards.forEach((c, idx) => {
      const el = document.createElement('button');
      el.className = 'mem-card'; el.dataset.finger = '';
      el.innerHTML = `<span class="mem-back">?</span><span class="mem-front" hidden>${esc(c.text)}</span>`;
      el.onclick = () => {
        if (locked || el.classList.contains('matched') || el.classList.contains('open')) return;
        el.classList.add('open');
        el.querySelector('.mem-back').hidden = true;
        el.querySelector('.mem-front').hidden = false;
        flipped.push({ el, key: c.key });
        if (flipped.length === 2) {
          locked = true;
          if (flipped[0].key === flipped[1].key) {
            flipped.forEach(f => f.el.classList.add('matched'));
            matched++; score += 10;
            flipped = []; locked = false;
            if (matched >= pairs.length) {
              container.querySelector('#g-fb').innerHTML = `
                <div class="fb"><div class="fb-ico">✅</div>
                <div class="fb-msg" style="color:var(--ok)">จับคู่ครบ!</div>
                <button class="btn primary" data-finger id="fb-next">ดูผล</button></div>`;
              container.querySelector('#fb-next').onclick = () => onDone(score, matched);
            }
          } else {
            setTimeout(() => {
              flipped.forEach(f => {
                f.el.classList.remove('open');
                f.el.querySelector('.mem-back').hidden = false;
                f.el.querySelector('.mem-front').hidden = true;
              });
              flipped = []; locked = false;
            }, 700);
          }
        }
      };
      grid.appendChild(el);
    });
  },

  /** Teacher Demo */
  renderDemo(q, container, onReveal, onNext) {
    container.innerHTML = `
      <div class="g-card">
        <div class="g-label">👩‍🏫 Teacher Demo</div>
        <div class="g-q">${esc(q.questionText)}</div>
        <div class="g-opts" id="g-opts"></div>
        <div class="demo-actions">
          <button class="btn primary" data-finger id="demo-reveal">แสดงเฉลย</button>
          <button class="btn ghost" data-finger id="demo-next">ข้อถัดไป</button>
        </div>
        <div id="g-fb"></div>
      </div>`;
    const box = container.querySelector('#g-opts');
    q.options.forEach((opt, i) => {
      const d = document.createElement('div');
      d.className = 'opt demo-opt';
      d.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      d.dataset.idx = i;
      box.appendChild(d);
    });
    container.querySelector('#demo-reveal').onclick = () => {
      const ci = typeof q._correctIndex === 'number' ? q._correctIndex :
        q.options.findIndex(o => o === getCorrectText(q));
      [...box.children].forEach((el, i) => {
        if (i === ci) el.classList.add('yes');
      });
      container.querySelector('#g-fb').innerHTML = `
        <div class="fb-ans">💡 ${esc(getCorrectText(q))}</div>
        <div class="fb-exp">${esc(q.explanation || '')}</div>`;
      onReveal();
    };
    container.querySelector('#demo-next').onclick = onNext;
  }
};

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}
