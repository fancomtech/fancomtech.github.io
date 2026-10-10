/* ========== Data Store + Version Migration ========== */
const DB_KEY = 'ar_edu_game_v3';
const DB_VER = 3;

const Store = {
  data: null,

  default() {
    return {
      version: DB_VER,
      categories: [],
      questions: [],
      settings: {
        sound: true,
        showExplain: true,
        defaultTimePerQ: 30,
        defaultScore: 10,
        fingerHoldMs: 850
      },
      history: [],
      players: []
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        this.data = this.default();
        this.seed();
        this.save();
        return this.data;
      }
      let d = JSON.parse(raw);
      if (!d.version || d.version < DB_VER) d = this.migrate(d);
      this.data = d;
      // ถ้าว่างเปล่า ให้ seed
      if (!this.data.categories.length || !this.data.questions.length) {
        this.seed();
        this.save();
      }
      return this.data;
    } catch (e) {
      console.error('Store load error', e);
      this.data = this.default();
      this.seed();
      this.save();
      return this.data;
    }
  },

  migrate(old) {
    const d = this.default();
    // ดึงคำถาม/หัวข้อจากเวอร์ชันเก่า
    if (old.topics && Array.isArray(old.topics)) {
      d.categories = old.topics.map((t, i) => ({
        id: t.id || ('cat_' + i),
        name: t.name || 'หมวดไม่มีชื่อ',
        description: '',
        icon: '📚',
        color: t.color || '#7c3aed',
        gradeLevel: 'ทุกระดับ',
        difficulty: 'mixed',
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));
    }
    if (old.questions && Array.isArray(old.questions)) {
      d.questions = old.questions.map((q, i) => this.normalizeQ(q, i));
    }
    if (old.rooms) d._legacyRooms = old.rooms;
    if (old.history) d.history = old.history;
    if (old.settings) d.settings = { ...d.settings, ...old.settings };
    d.version = DB_VER;
    return d;
  },

  normalizeQ(q, i) {
    const opts = q.options || [];
    let correct = '';
    if (typeof q.answer === 'number' && opts[q.answer] !== undefined) correct = opts[q.answer];
    else if (q.correctAnswer) correct = q.correctAnswer;
    return {
      questionId: q.questionId || q.id || ('q_' + Date.now() + '_' + i),
      questionText: q.questionText || q.q || '',
      categoryId: q.categoryId || q.topicId || '',
      subject: q.subject || '',
      gradeLevel: q.gradeLevel || 'ทุกระดับ',
      difficulty: q.difficulty || 'medium',
      questionType: q.questionType || 'mcq',
      options: opts,
      correctAnswer: correct,
      explanation: q.explanation || q.explain || '',
      imageUrl: q.imageUrl || '',
      audioUrl: q.audioUrl || '',
      tags: q.tags || [],
      timeLimit: q.timeLimit || 30,
      score: q.score || 10,
      status: q.status !== undefined ? q.status : 'active',
      createdAt: q.createdAt || Date.now(),
      updatedAt: q.updatedAt || Date.now()
    };
  },

  seed() {
    if (typeof DEFAULT_CATEGORIES !== 'undefined') {
      this.data.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (typeof DEFAULT_QUESTIONS !== 'undefined') {
      this.data.questions = DEFAULT_QUESTIONS.map((q, i) => this.normalizeQ(q, i));
    }
  },

  save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Save failed', e);
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'พื้นที่จัดเก็บอาจเต็ม', confirmButtonColor: '#7c3aed' });
      }
    }
  },

  // --- Categories ---
  getCategories(onlyEnabled = false) {
    let list = this.data.categories || [];
    if (onlyEnabled) list = list.filter(c => c.enabled !== false);
    return list;
  },

  getCategory(id) {
    return (this.data.categories || []).find(c => c.id === id);
  },

  upsertCategory(cat) {
    const i = this.data.categories.findIndex(c => c.id === cat.id);
    cat.updatedAt = Date.now();
    if (i >= 0) this.data.categories[i] = { ...this.data.categories[i], ...cat };
    else {
      cat.createdAt = Date.now();
      this.data.categories.push(cat);
    }
    this.save();
  },

  deleteCategory(id) {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    // ไม่ลบคำถาม แต่ยกเลิกการผูก
    this.data.questions.forEach(q => {
      if (q.categoryId === id) q.categoryId = '';
    });
    this.save();
  },

  // --- Questions ---
  getQuestions(filters = {}) {
    let list = [...(this.data.questions || [])];
    if (filters.status !== undefined) list = list.filter(q => q.status === filters.status);
    else list = list.filter(q => q.status !== 'deleted');

    if (filters.categoryId) {
      const ids = Array.isArray(filters.categoryId) ? filters.categoryId : [filters.categoryId];
      list = list.filter(q => ids.includes(q.categoryId));
    }
    if (filters.difficulty && filters.difficulty !== 'all') {
      list = list.filter(q => q.difficulty === filters.difficulty);
    }
    if (filters.gradeLevel && filters.gradeLevel !== 'all') {
      list = list.filter(q => q.gradeLevel === filters.gradeLevel || q.gradeLevel === 'ทุกระดับ');
    }
    if (filters.questionType) {
      list = list.filter(q => q.questionType === filters.questionType);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(q =>
        (q.questionText || '').toLowerCase().includes(s) ||
        (q.questionId || '').toLowerCase().includes(s) ||
        (q.tags || []).some(t => String(t).toLowerCase().includes(s))
      );
    }
    if (filters.enabledOnly) {
      list = list.filter(q => q.status === 'active');
    }
    return list;
  },

  getQuestion(id) {
    return (this.data.questions || []).find(q => q.questionId === id);
  },

  upsertQuestion(q) {
    const i = this.data.questions.findIndex(x => x.questionId === q.questionId);
    q.updatedAt = Date.now();
    if (i >= 0) this.data.questions[i] = { ...this.data.questions[i], ...q };
    else {
      q.createdAt = Date.now();
      this.data.questions.push(q);
    }
    this.save();
  },

  deleteQuestion(id) {
    this.data.questions = this.data.questions.filter(q => q.questionId !== id);
    this.save();
  },

  countByCategory(catId) {
    return (this.data.questions || []).filter(q => q.categoryId === catId && q.status === 'active').length;
  },

  // --- History ---
  addHistory(session) {
    this.data.history = this.data.history || [];
    this.data.history.unshift(session);
    if (this.data.history.length > 200) this.data.history = this.data.history.slice(0, 200);
    this.save();
  },

  getHistory(limit = 50) {
    return (this.data.history || []).slice(0, limit);
  },

  // --- Export / Import ---
  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  },

  importJSON(str) {
    const d = JSON.parse(str);
    if (!d.questions && !d.categories) throw new Error('ไฟล์ไม่มี categories หรือ questions');
    if (d.version && d.version > DB_VER) throw new Error('ไฟล์เวอร์ชันใหม่กว่าที่รองรับ');
    // merge อย่างปลอดภัย
    if (d.categories) this.data.categories = d.categories;
    if (d.questions) this.data.questions = d.questions.map((q, i) => this.normalizeQ(q, i));
    if (d.settings) this.data.settings = { ...this.data.settings, ...d.settings };
    if (d.history) this.data.history = d.history;
    this.data.version = DB_VER;
    this.save();
  },

  resetAll() {
    this.data = this.default();
    this.seed();
    this.save();
  }
};
