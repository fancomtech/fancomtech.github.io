/* =========================================================
   ระบบจัดการหมวดหมู่และคำถาม (ใหม่)
   ========================================================= */

const Admin = {
  qPage: 1,
  qPerPage: 8,
  qSelected: new Set(),
  catSort: 'order',

  /* ---------- หมวดหมู่ ---------- */
  render() {
    const list = this._sortedCats();
    const enabled = list.filter(c => c.enabled !== false).length;
    const linked = list.reduce((s, c) => s + Store.countByCategory(c.id), 0);

    const sum = document.getElementById('cat-summary');
    if (sum) {
      sum.innerHTML = `
        <div class="mg-stat"><div class="mg-n">${list.length}</div><div class="mg-l">หมวดทั้งหมด</div></div>
        <div class="mg-stat"><div class="mg-n">${enabled}</div><div class="mg-l">เปิดใช้งาน</div></div>
        <div class="mg-stat"><div class="mg-n">${linked}</div><div class="mg-l">คำถามที่ผูก</div></div>
        <div class="mg-stat"><div class="mg-n">${Store.getQuestions({ status: 'active' }).length}</div><div class="mg-l">คำถามพร้อมใช้</div></div>`;
    }

    const box = document.getElementById('cat-list');
    if (!box) return;

    if (!list.length) {
      box.innerHTML = `<div class="mg-empty">
        <div style="font-size:2rem;margin-bottom:8px">📁</div>
        ยังไม่มีหมวดหมู่<br>
        <button class="btn primary btn-sm" style="width:auto;margin:12px auto 0;display:inline-block" onclick="Admin.addCat()">+ สร้างหมวดแรก</button>
      </div>`;
      return;
    }

    box.innerHTML = list.map((c) => {
      const n = Store.countByCategory(c.id);
      const on = c.enabled !== false;
      const color = c.color || '#7c3aed';
      return `
        <article class="mg-card" style="--c:${color}">
          <div class="mg-card-main">
            <div class="mg-avatar" style="background:${color}22;border-color:${color}55">${c.icon || '📁'}</div>
            <div class="mg-body">
              <div class="mg-title">${_e(c.name)}</div>
              <div class="mg-desc">${_e(c.description || 'ไม่มีคำอธิบาย')}</div>
              <div class="mg-tags">
                <span class="mg-tag ${on ? 'on' : 'off'}">${on ? '● เปิด' : '○ ปิด'}</span>
                <span class="mg-tag">${n} คำถาม</span>
                <span class="mg-tag">${_e(c.gradeLevel || 'ทุกระดับ')}</span>
              </div>
            </div>
          </div>
          <div class="mg-ops">
            <button class="mg-btn" title="เปิด/ปิด" onclick="Admin.toggleCat('${c.id}')">${on ? 'ปิด' : 'เปิด'}</button>
            <button class="mg-btn" title="แก้ไข" onclick="Admin.editCat('${c.id}')">แก้ไข</button>
            <button class="mg-btn" title="ขึ้น" onclick="Admin.moveCat('${c.id}',-1)">↑</button>
            <button class="mg-btn" title="ลง" onclick="Admin.moveCat('${c.id}',1)">↓</button>
            <button class="mg-btn danger" title="ลบ" onclick="Admin.delCat('${c.id}')">ลบ</button>
          </div>
        </article>`;
    }).join('');
  },

  _sortedCats() {
    const list = [...Store.getCategories()];
    if (this.catSort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    else if (this.catSort === 'count') list.sort((a, b) => Store.countByCategory(b.id) - Store.countByCategory(a.id));
    else if (this.catSort === 'newest') list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    else list.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    return list;
  },

  setSort(v) {
    this.catSort = v;
    this.render();
  },

  async addCat() {
    const v = await this._catDialog(null);
    if (!v) return;
    if (Store.getCategories().some(c => c.name === v.name)) {
      return Swal.fire({ icon: 'warning', title: 'ชื่อหมวดซ้ำ', confirmButtonColor: '#7c3aed' });
    }
    Store.upsertCategory({
      id: uid('cat'),
      ...v,
      sortOrder: Store.getCategories().length,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    this.render();
    toast('สร้างหมวดแล้ว');
  },

  async editCat(id) {
    const c = Store.getCategory(id);
    if (!c) return;
    const v = await this._catDialog(c);
    if (!v) return;
    Store.upsertCategory({ ...c, ...v, updatedAt: Date.now() });
    this.render();
    toast('บันทึกหมวดแล้ว');
  },

  async _catDialog(c) {
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#7c3aed', '#64748b'];
    const cur = c?.color || '#7c3aed';
    const { value } = await Swal.fire({
      title: c ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่',
      width: 500,
      html: `
        <div class="mg-form">
          <label>ชื่อหมวด *</label>
          <input id="cf-name" class="swal2-input" value="${_a(c?.name)}" placeholder="เช่น อันตรายจากการใช้ยา">
          <label>ไอคอน (emoji)</label>
          <input id="cf-icon" class="swal2-input" value="${_a(c?.icon || '📚')}" placeholder="📚">
          <label>คำอธิบาย</label>
          <textarea id="cf-desc" class="swal2-textarea" placeholder="อธิบายสั้น ๆ">${_e(c?.description || '')}</textarea>
          <label>สีประจำหมวด</label>
          <div class="mg-colors">
            ${colors.map(col => `
              <label class="mg-color-dot">
                <input type="radio" name="cf-color" value="${col}" ${cur === col ? 'checked' : ''}>
                <span style="background:${col}"></span>
              </label>`).join('')}
          </div>
          <label>ระดับชั้น</label>
          <select id="cf-grade" class="swal2-input" style="width:100%">
            ${['ทุกระดับ', 'ป.1-3', 'ป.4-6', 'ม.ต้น', 'ม.ปลาย', 'อาชีวศึกษา', 'ทั่วไป'].map(g =>
              `<option ${(c?.gradeLevel || 'ทุกระดับ') === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
          <label class="mg-check"><input type="checkbox" id="cf-en" ${!c || c.enabled !== false ? 'checked' : ''}> เปิดใช้งานทันที</label>
        </div>`,
      showCancelButton: true,
      confirmButtonText: c ? 'บันทึก' : 'สร้างหมวด',
      confirmButtonColor: '#7c3aed',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const name = document.getElementById('cf-name').value.trim();
        if (!name) { Swal.showValidationMessage('กรุณาใส่ชื่อหมวด'); return false; }
        const colorEl = document.querySelector('input[name="cf-color"]:checked');
        return {
          name,
          icon: document.getElementById('cf-icon').value.trim() || '📚',
          description: document.getElementById('cf-desc').value.trim(),
          color: colorEl ? colorEl.value : '#7c3aed',
          gradeLevel: document.getElementById('cf-grade').value,
          difficulty: 'mixed',
          enabled: document.getElementById('cf-en').checked
        };
      }
    });
    return value;
  },

  toggleCat(id) {
    const c = Store.getCategory(id);
    if (!c) return;
    const next = c.enabled === false;
    Store.upsertCategory({ ...c, enabled: next, updatedAt: Date.now() });
    this.render();
    toast(next ? 'เปิดหมวดแล้ว' : 'ปิดหมวดแล้ว');
  },

  moveCat(id, dir) {
    const list = Store.data.categories;
    const i = list.findIndex(c => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((c, idx) => { c.sortOrder = idx; });
    Store.save();
    this.render();
  },

  delCat(id) {
    const n = Store.countByCategory(id);
    Swal.fire({
      title: 'ลบหมวดนี้?',
      html: n
        ? `มีคำถาม <b>${n}</b> ข้อผูกกับหมวดนี้<br><small>คำถามจะไม่ถูกลบ เพียงยกเลิกการผูกหมวด</small>`
        : 'ยืนยันการลบหมวด',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบหมวด',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'ยกเลิก'
    }).then(r => {
      if (r.isConfirmed) {
        Store.deleteCategory(id);
        this.render();
        toast('ลบหมวดแล้ว');
      }
    });
  },

  /* ---------- คำถาม ---------- */
  renderQ() {
    this._fillFilters();
    const filters = this._readFilters();
    let list = Store.getQuestions({
      search: filters.search || undefined,
      categoryId: filters.cat || undefined,
      difficulty: filters.diff || undefined,
      questionType: filters.type || undefined
    });
    if (filters.status === 'active') list = list.filter(q => q.status === 'active');
    if (filters.status === 'inactive') list = list.filter(q => q.status !== 'active');

    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / this.qPerPage));
    if (this.qPage > pages) this.qPage = pages;
    const start = (this.qPage - 1) * this.qPerPage;
    const page = list.slice(start, start + this.qPerPage);

    const label = document.getElementById('q-count-label');
    if (label) label.textContent = `${total} ข้อ · หน้า ${this.qPage}/${pages}`;

    const bulk = document.getElementById('q-bulk');
    if (bulk) {
      bulk.style.display = this.qSelected.size ? 'flex' : 'none';
      const cnt = document.getElementById('q-sel-count');
      if (cnt) cnt.textContent = this.qSelected.size;
    }

    const box = document.getElementById('q-list');
    if (!box) return;

    if (!page.length) {
      box.innerHTML = `<div class="mg-empty">
        <div style="font-size:2rem;margin-bottom:8px">❓</div>
        ไม่พบคำถามตามเงื่อนไข<br>
        <button class="btn primary btn-sm" style="width:auto;margin:12px auto 0;display:inline-block" onclick="Admin.addQ()">+ เพิ่มคำถาม</button>
      </div>`;
      this._pager(pages);
      return;
    }

    box.innerHTML = page.map(q => {
      const cat = Store.getCategory(q.categoryId);
      const ok = this._validQ(q);
      const checked = this.qSelected.has(q.questionId) ? 'checked' : '';
      const active = q.status === 'active';
      return `
        <article class="mg-card q-row ${ok ? '' : 'warn'}">
          <label class="mg-check-box">
            <input type="checkbox" ${checked} onchange="Admin.toggleSel('${q.questionId}', this.checked)">
          </label>
          <div class="mg-body" style="flex:1;min-width:0">
            <div class="mg-title">${_e((q.questionText || '').slice(0, 72))}${(q.questionText || '').length > 72 ? '…' : ''}</div>
            <div class="mg-tags">
              <span class="mg-tag">${cat ? (cat.icon || '') + ' ' + cat.name : 'ไม่มีหมวด'}</span>
              <span class="mg-tag">${q.questionType === 'tf' ? 'ถูก/ผิด' : 'ปรนัย'}</span>
              <span class="mg-tag">${q.difficulty || '-'}</span>
              <span class="mg-tag ${active ? 'on' : 'off'}">${active ? '● ใช้ได้' : '○ ปิด'}</span>
              ${ok ? '' : '<span class="mg-tag warn-tag">⚠️ ไม่ครบ</span>'}
            </div>
          </div>
          <div class="mg-ops">
            <button class="mg-btn" onclick="Admin.previewQ('${q.questionId}')">ดู</button>
            <button class="mg-btn" onclick="Admin.editQ('${q.questionId}')">แก้ไข</button>
            <button class="mg-btn" onclick="Admin.copyQ('${q.questionId}')">คัดลอก</button>
            <button class="mg-btn" onclick="Admin.toggleQ('${q.questionId}')">${active ? 'ปิด' : 'เปิด'}</button>
            <button class="mg-btn danger" onclick="Admin.delQ('${q.questionId}')">ลบ</button>
          </div>
        </article>`;
    }).join('');
    this._pager(pages);
  },

  _fillFilters() {
    const sel = document.getElementById('q-filter-cat');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">ทุกหมวด</option>' +
      Store.getCategories().map(c => `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`).join('');
    if (cur) sel.value = cur;
  },

  _readFilters() {
    return {
      search: document.getElementById('q-search')?.value?.trim() || '',
      cat: document.getElementById('q-filter-cat')?.value || '',
      diff: document.getElementById('q-filter-diff')?.value || '',
      type: document.getElementById('q-filter-type')?.value || '',
      status: document.getElementById('q-filter-status')?.value || ''
    };
  },

  _pager(pages) {
    const el = document.getElementById('q-pager');
    if (!el) return;
    if (pages <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <button class="mg-btn" ${this.qPage <= 1 ? 'disabled' : ''} onclick="Admin.goPage(${this.qPage - 1})">‹ ก่อนหน้า</button>
      <span class="mg-page">หน้า ${this.qPage} / ${pages}</span>
      <button class="mg-btn" ${this.qPage >= pages ? 'disabled' : ''} onclick="Admin.goPage(${this.qPage + 1})">ถัดไป ›</button>`;
  },

  goPage(p) {
    if (p < 1) return;
    this.qPage = p;
    this.renderQ();
  },

  toggleSel(id, on) {
    if (on) this.qSelected.add(id);
    else this.qSelected.delete(id);
    this.renderQ();
  },

  selectAllPage() {
    document.querySelectorAll('#q-list input[type=checkbox]').forEach(cb => {
      const m = (cb.getAttribute('onchange') || '').match(/'([^']+)'/);
      if (m) { cb.checked = true; this.qSelected.add(m[1]); }
    });
    this.renderQ();
  },

  clearSel() {
    this.qSelected.clear();
    this.renderQ();
  },

  bulkDelete() {
    if (!this.qSelected.size) return;
    Swal.fire({
      title: `ลบ ${this.qSelected.size} คำถาม?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบทั้งหมด',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (!r.isConfirmed) return;
      [...this.qSelected].forEach(id => Store.deleteQuestion(id));
      this.qSelected.clear();
      this.renderQ();
      toast('ลบแล้ว');
    });
  },

  bulkStatus(status) {
    if (!this.qSelected.size) return;
    [...this.qSelected].forEach(id => {
      const q = Store.getQuestion(id);
      if (q) Store.upsertQuestion({ ...q, status, updatedAt: Date.now() });
    });
    this.qSelected.clear();
    this.renderQ();
    toast(status === 'active' ? 'เปิดใช้งานแล้ว' : 'ปิดใช้งานแล้ว');
  },

  async bulkMoveCat() {
    if (!this.qSelected.size) return;
    const cats = Store.getCategories();
    if (!cats.length) return;
    const { value } = await Swal.fire({
      title: `ย้าย ${this.qSelected.size} คำถามไปหมวด`,
      html: `<select id="bm-cat" class="swal2-input" style="width:100%">
        ${cats.map(c => `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`).join('')}
      </select>`,
      showCancelButton: true,
      confirmButtonText: 'ย้าย',
      confirmButtonColor: '#7c3aed',
      preConfirm: () => document.getElementById('bm-cat').value
    });
    if (!value) return;
    [...this.qSelected].forEach(id => {
      const q = Store.getQuestion(id);
      if (q) Store.upsertQuestion({ ...q, categoryId: value, updatedAt: Date.now() });
    });
    this.qSelected.clear();
    this.renderQ();
    toast('ย้ายหมวดแล้ว');
  },

  async addQ() { await this._qDialog(null); },
  async editQ(id) { await this._qDialog(Store.getQuestion(id)); },

  async _qDialog(existing) {
    const cats = Store.getCategories();
    if (!cats.length) {
      return Swal.fire({ icon: 'info', title: 'สร้างหมวดก่อน', text: 'ต้องมีหมวดอย่างน้อย 1 หมวด', confirmButtonColor: '#7c3aed' });
    }
    const opts = existing?.options || ['', '', '', ''];
    const correct = existing?.correctAnswer || (typeof existing?.answer === 'number' ? opts[existing.answer] : '') || '';
    const ansIdx = Math.max(0, opts.findIndex(o => o === correct));

    const { value } = await Swal.fire({
      title: existing ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่',
      width: 560,
      html: `
        <div class="mg-form" style="max-height:58vh;overflow:auto;text-align:left">
          <label>หมวด *</label>
          <select id="qf-cat" class="swal2-input" style="width:100%">
            ${cats.map(c => `<option value="${c.id}" ${existing?.categoryId === c.id ? 'selected' : ''}>${c.icon || ''} ${c.name}</option>`).join('')}
          </select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <label>ประเภท</label>
              <select id="qf-type" class="swal2-input" style="width:100%">
                <option value="mcq" ${existing?.questionType !== 'tf' ? 'selected' : ''}>ปรนัย 4 ตัวเลือก</option>
                <option value="tf" ${existing?.questionType === 'tf' ? 'selected' : ''}>ถูก / ผิด</option>
              </select>
            </div>
            <div>
              <label>ความยาก</label>
              <select id="qf-diff" class="swal2-input" style="width:100%">
                <option value="easy" ${existing?.difficulty === 'easy' ? 'selected' : ''}>ง่าย</option>
                <option value="medium" ${!existing || existing.difficulty === 'medium' ? 'selected' : ''}>ปานกลาง</option>
                <option value="hard" ${existing?.difficulty === 'hard' ? 'selected' : ''}>ยาก</option>
              </select>
            </div>
          </div>
          <label>คำถาม *</label>
          <textarea id="qf-q" class="swal2-textarea" placeholder="พิมพ์คำถาม...">${_e(existing?.questionText || '')}</textarea>
          <label>ตัวเลือก A–D *</label>
          <input id="qf-a0" class="swal2-input" value="${_a(opts[0])}" placeholder="A">
          <input id="qf-a1" class="swal2-input" value="${_a(opts[1])}" placeholder="B">
          <input id="qf-a2" class="swal2-input" value="${_a(opts[2])}" placeholder="C">
          <input id="qf-a3" class="swal2-input" value="${_a(opts[3])}" placeholder="D">
          <label>คำตอบที่ถูกต้อง *</label>
          <select id="qf-ans" class="swal2-input" style="width:100%">
            <option value="0" ${ansIdx === 0 ? 'selected' : ''}>A</option>
            <option value="1" ${ansIdx === 1 ? 'selected' : ''}>B</option>
            <option value="2" ${ansIdx === 2 ? 'selected' : ''}>C</option>
            <option value="3" ${ansIdx === 3 ? 'selected' : ''}>D</option>
          </select>
          <label>คำอธิบายเฉลย</label>
          <textarea id="qf-exp" class="swal2-textarea">${_e(existing?.explanation || '')}</textarea>
          <label class="mg-check"><input type="checkbox" id="qf-status" ${!existing || existing.status === 'active' ? 'checked' : ''}> เปิดใช้งาน</label>
        </div>`,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      confirmButtonColor: '#7c3aed',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const questionText = document.getElementById('qf-q').value.trim();
        const type = document.getElementById('qf-type').value;
        let options = [0, 1, 2, 3].map(i => document.getElementById('qf-a' + i).value.trim());
        if (type === 'tf') options = [options[0] || 'ถูก', options[1] || 'ผิด'];
        else if (options.some(o => !o)) { Swal.showValidationMessage('ใส่ตัวเลือกให้ครบ'); return false; }
        if (!questionText) { Swal.showValidationMessage('ใส่คำถาม'); return false; }
        const ai = Math.min(parseInt(document.getElementById('qf-ans').value), options.length - 1);
        return {
          categoryId: document.getElementById('qf-cat').value,
          questionType: type,
          difficulty: document.getElementById('qf-diff').value,
          questionText,
          options,
          correctAnswer: options[ai],
          explanation: document.getElementById('qf-exp').value.trim(),
          status: document.getElementById('qf-status').checked ? 'active' : 'inactive',
          gradeLevel: 'ทุกระดับ',
          score: 10,
          timeLimit: 30,
          tags: []
        };
      }
    });
    if (!value) return;

    const dup = Store.getQuestions({}).find(q =>
      q.questionText.trim() === value.questionText.trim() &&
      (!existing || q.questionId !== existing.questionId)
    );
    if (dup) {
      const conf = await Swal.fire({
        icon: 'warning',
        title: 'พบคำถามข้อความซ้ำ',
        text: 'ต้องการบันทึกต่อหรือไม่?',
        showCancelButton: true,
        confirmButtonText: 'บันทึกอยู่ดี',
        confirmButtonColor: '#7c3aed'
      });
      if (!conf.isConfirmed) return;
    }

    if (existing) Store.upsertQuestion({ ...existing, ...value, updatedAt: Date.now() });
    else Store.upsertQuestion({ questionId: uid('q'), ...value, createdAt: Date.now(), updatedAt: Date.now() });
    this.renderQ();
    toast('บันทึกคำถามแล้ว');
  },

  copyQ(id) {
    const q = Store.getQuestion(id);
    if (!q) return;
    Store.upsertQuestion({
      ...q,
      questionId: uid('q'),
      questionText: q.questionText + ' (สำเนา)',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    this.renderQ();
    toast('คัดลอกแล้ว');
  },

  toggleQ(id) {
    const q = Store.getQuestion(id);
    if (!q) return;
    Store.upsertQuestion({
      ...q,
      status: q.status === 'active' ? 'inactive' : 'active',
      updatedAt: Date.now()
    });
    this.renderQ();
  },

  delQ(id) {
    Swal.fire({
      title: 'ลบคำถาม?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (r.isConfirmed) {
        Store.deleteQuestion(id);
        this.qSelected.delete(id);
        this.renderQ();
        toast('ลบแล้ว');
      }
    });
  },

  previewQ(id) {
    const q = Store.getQuestion(id);
    if (!q) return;
    const cat = Store.getCategory(q.categoryId);
    const correct = q.correctAnswer || (typeof q.answer === 'number' ? (q.options || [])[q.answer] : '');
    const opts = (q.options || []).map((o, i) =>
      `<li style="margin:4px 0">${String.fromCharCode(65 + i)}. ${_e(o)}${o === correct ? ' <b style="color:#22c55e">✓</b>' : ''}</li>`
    ).join('');
    Swal.fire({
      title: 'ตัวอย่างคำถาม',
      width: 520,
      html: `
        <div style="text-align:left;line-height:1.6;font-size:0.92rem">
          <p style="color:#94a3b8;font-size:0.82rem">${cat ? cat.icon + ' ' + cat.name : '-'} · ${q.questionType || 'mcq'} · ${q.difficulty || '-'}</p>
          <p style="font-size:1.05rem;font-weight:600;margin:10px 0">${_e(q.questionText)}</p>
          <ul style="padding-left:18px;list-style:none">${opts}</ul>
          ${q.explanation ? `<p style="margin-top:12px;padding:10px;background:rgba(34,197,94,.1);border-radius:8px;color:#86efac"><b>เฉลย:</b> ${_e(q.explanation)}</p>` : ''}
        </div>`,
      confirmButtonColor: '#7c3aed'
    });
  },

  findDuplicates() {
    const map = {};
    Store.getQuestions({}).forEach(q => {
      const k = (q.questionText || '').trim().toLowerCase();
      if (!k) return;
      (map[k] = map[k] || []).push(q);
    });
    const dups = Object.values(map).filter(a => a.length > 1);
    if (!dups.length) {
      return Swal.fire({ icon: 'success', title: 'ไม่พบคำถามซ้ำ', confirmButtonColor: '#7c3aed' });
    }
    Swal.fire({
      title: `พบ ${dups.length} กลุ่มซ้ำ`,
      width: 520,
      html: `<div style="text-align:left;max-height:280px;overflow:auto;font-size:0.85rem">
        ${dups.slice(0, 20).map(g =>
          `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)">
            <b>${_e(g[0].questionText.slice(0, 55))}…</b><br>
            <span style="color:#94a3b8">${g.length} ข้อ</span>
          </div>`
        ).join('')}
      </div>`,
      confirmButtonColor: '#7c3aed'
    });
  },

  validateAll() {
    const bad = Store.getQuestions({}).filter(q => !this._validQ(q));
    if (!bad.length) {
      return Swal.fire({
        icon: 'success',
        title: 'ครบถ้วนทั้งหมด',
        text: `${Store.getQuestions({}).length} ข้อผ่านการตรวจสอบ`,
        confirmButtonColor: '#7c3aed'
      });
    }
    Swal.fire({
      icon: 'warning',
      title: `พบ ${bad.length} ข้อที่ไม่ครบ`,
      html: `<div style="text-align:left;max-height:240px;overflow:auto;font-size:0.85rem">
        ${bad.slice(0, 20).map(q => `<div>• ${_e((q.questionText || '').slice(0, 50))}…</div>`).join('')}
      </div>`,
      confirmButtonColor: '#7c3aed'
    });
  },

  _validQ(q) {
    if (!q.questionText?.trim()) return false;
    if (!q.options || q.options.length < 2) return false;
    if (!q.correctAnswer && typeof q.answer !== 'number') return false;
    return true;
  },

  exportFiltered() {
    const f = this._readFilters();
    let list = Store.getQuestions({
      search: f.search || undefined,
      categoryId: f.cat || undefined,
      difficulty: f.diff || undefined,
      questionType: f.type || undefined
    });
    if (f.status === 'active') list = list.filter(q => q.status === 'active');
    if (f.status === 'inactive') list = list.filter(q => q.status !== 'active');
    if (!list.length) {
      return Swal.fire({ icon: 'info', title: 'ไม่มีข้อมูลตามตัวกรอง', confirmButtonColor: '#7c3aed' });
    }
    let csv = '\uFEFFหมวด,คำถาม,A,B,C,D,คำตอบ,ประเภท,ความยาก,คำอธิบาย,สถานะ\n';
    list.forEach(q => {
      const c = Store.getCategory(q.categoryId);
      const o = q.options || [];
      const row = [c?.name || '', q.questionText, o[0] || '', o[1] || '', o[2] || '', o[3] || '',
        q.correctAnswer || '', q.questionType || '', q.difficulty || '', q.explanation || '', q.status || '']
        .map(x => `"${String(x).replace(/"/g, '""')}"`);
      csv += row.join(',') + '\n';
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `questions-${list.length}.csv`;
    a.click();
    toast(`ส่งออก ${list.length} ข้อ`);
  },

  importCSV() {
    document.getElementById('csv-import-file')?.click();
  },

  handleCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const { questions, errors } = this._parseCSV(ev.target.result);
        if (errors.length) {
          return Swal.fire({
            icon: 'error',
            title: 'นำเข้าไม่สำเร็จ',
            html: `<div style="text-align:left;max-height:220px;overflow:auto;font-size:0.85rem">
              ${errors.slice(0, 25).map(er => `<div>แถว ${er.row}: ${_e(er.msg)}</div>`).join('')}
            </div>`,
            confirmButtonColor: '#7c3aed'
          });
        }
        questions.forEach(q => Store.upsertQuestion(q));
        this.renderQ();
        this.render();
        Swal.fire({ icon: 'success', title: `นำเข้า ${questions.length} คำถามสำเร็จ`, confirmButtonColor: '#7c3aed' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'อ่านไฟล์ไม่ได้', text: err.message, confirmButtonColor: '#7c3aed' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  _parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
    const errors = [];
    const questions = [];
    if (lines.length < 2) {
      errors.push({ row: 1, msg: 'ไฟล์ว่างหรือไม่มีข้อมูล' });
      return { questions, errors };
    }
    for (let i = 1; i < lines.length; i++) {
      const cols = this._csvLine(lines[i]);
      if (cols.length < 7) {
        errors.push({ row: i + 1, msg: 'คอลัมน์ไม่ครบ (ต้องการ ≥ 7)' });
        continue;
      }
      const [catName, qtext, a, b, c, d, ans, type, diff, exp] = cols;
      if (!qtext?.trim()) {
        errors.push({ row: i + 1, msg: 'ไม่มีข้อความคำถาม' });
        continue;
      }
      const options = [a, b, c, d].map(x => (x || '').trim()).filter(Boolean);
      if (options.length < 2) {
        errors.push({ row: i + 1, msg: 'ต้องมีตัวเลือกอย่างน้อย 2' });
        continue;
      }
      let correctAnswer = (ans || '').trim();
      if (/^[A-Da-d]$/.test(correctAnswer)) {
        const idx = correctAnswer.toUpperCase().charCodeAt(0) - 65;
        correctAnswer = options[idx] || '';
      }
      if (!correctAnswer || !options.includes(correctAnswer)) {
        errors.push({ row: i + 1, msg: `คำตอบ "${ans}" ไม่ตรงตัวเลือก` });
        continue;
      }
      let categoryId = '';
      const found = Store.getCategories().find(x => x.name === (catName || '').trim());
      if (found) categoryId = found.id;
      else if ((catName || '').trim()) {
        categoryId = uid('cat');
        Store.upsertCategory({
          id: categoryId,
          name: catName.trim(),
          icon: '📁',
          color: '#7c3aed',
          description: 'จาก CSV',
          gradeLevel: 'ทุกระดับ',
          difficulty: 'mixed',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      questions.push({
        questionId: uid('q'),
        questionText: qtext.trim(),
        categoryId,
        options: options.length === 2 ? options : [a, b, c, d].map(x => (x || '').trim()),
        correctAnswer,
        questionType: (type || '').trim() === 'tf' ? 'tf' : 'mcq',
        difficulty: ['easy', 'medium', 'hard'].includes((diff || '').trim()) ? diff.trim() : 'medium',
        explanation: (exp || '').trim(),
        status: 'active',
        gradeLevel: 'ทุกระดับ',
        score: 10,
        timeLimit: 30,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    return { questions, errors };
  },

  _csvLine(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ',') { result.push(cur); cur = ''; }
        else cur += ch;
      }
    }
    result.push(cur);
    return result;
  }
};

function _e(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}
function _a(s) {
  return String(s || '').replace(/"/g, '&quot;');
}

function renderCats() { Admin.render(); }
function renderQBank() { Admin.renderQ(); }
function addCat() { return Admin.addCat(); }
function editCat(id) { return Admin.editCat(id); }
function delCat(id) { return Admin.delCat(id); }
function addQ() { return Admin.addQ(); }
function editQ(id) { return Admin.editQ(id); }
function copyQ(id) { return Admin.copyQ(id); }
function delQ(id) { return Admin.delQ(id); }
