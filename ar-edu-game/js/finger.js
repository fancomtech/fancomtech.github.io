// นิ้วชี้ = เคอร์เซอร์ (ปรับความเร็ว + ตามนิ้วลื่นขึ้น)
const Finger = {
  hands: null,
  active: false,
  loopOn: false,
  busy: false,
  el: null,
  arc: null,
  hover: null,
  hoverT: 0,
  HOLD: 850,
  // ตำแหน่งเป้าหมายจาก MediaPipe
  tx: 0, ty: 0,
  // ตำแหน่งที่แสดงจริง (smooth)
  x: 0, y: 0,
  hasHand: false,
  smoothRaf: null,
  // ความลื่น: ยิ่งสูงยิ่งตามนิ้วเร็ว (0.35–0.7)
  LERP: 0.55,
  video: null,

  initUI() {
    if (document.getElementById('finger')) {
      this.el = document.getElementById('finger');
      this.arc = document.getElementById('finger-arc');
      return;
    }
    const d = document.createElement('div');
    d.id = 'finger';
    d.innerHTML = `
      <div class="dot"></div>
      <svg viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(251,191,36,0.3)" stroke-width="3"/>
        <circle id="finger-arc" cx="20" cy="20" r="16" fill="none" stroke="#22c55e" stroke-width="3"
          stroke-dasharray="100.5" stroke-dashoffset="100.5" stroke-linecap="round"
          transform="rotate(-90 20 20)"/>
      </svg>
      <div class="tag">ชี้</div>`;
    document.body.appendChild(d);
    this.el = d;
    this.arc = document.getElementById('finger-arc');
  },

  async start() {
    this.initUI();
    const video = document.getElementById('cam') || document.getElementById('camera-video');
    const canvas = document.getElementById('hand-canvas');
    if (!video || !canvas) return false;
    this.video = video;

    if (!video.srcObject) {
      try {
        // ความละเอียดต่ำ = ประมวลผลเร็วขึ้นมาก
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 320 },
            height: { ideal: 240 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false
        });
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();
      } catch (e) {
        console.error(e);
        if (!window.__camWarned) {
          window.__camWarned = true;
          Swal.fire({
            icon: 'error',
            title: 'เปิดกล้องไม่ได้',
            text: 'กรุณาอนุญาตการใช้กล้อง · ยังเล่นด้วยการแตะหน้าจอได้',
            confirmButtonColor: '#8b5cf6'
          });
        }
        return false;
      }
    }

    // canvas ใช้ขนาดเล็ก ไม่ต้องเต็มจอ (ประหยัด)
    canvas.width = 320;
    canvas.height = 240;

    if (typeof Hands === 'undefined') {
      if (!window.__handWarned) {
        window.__handWarned = true;
        Swal.fire({
          icon: 'warning',
          title: 'โหลดระบบมือไม่สำเร็จ',
          text: 'ใช้การแตะหน้าจอแทนได้',
          confirmButtonColor: '#8b5cf6'
        });
      }
      return false;
    }

    if (!this.hands) {
      this.hands = new Hands({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
      });
      // modelComplexity 0 = เร็วสุด
      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.4
      });
      this.hands.onResults(r => this.onResults(r));
    }

    this.active = true;
    this.el.style.display = 'block';
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    this.tx = this.x;
    this.ty = this.y;

    // ลูปแสดงเคอร์เซอร์ลื่นๆ แยกจากลูปตรวจจับ
    if (!this.smoothRaf) {
      const smooth = () => {
        if (!this.active) {
          this.smoothRaf = null;
          return;
        }
        // lerp ตามเป้าหมาย
        this.x += (this.tx - this.x) * this.LERP;
        this.y += (this.ty - this.y) * this.LERP;
        // ใช้ transform เร็วกว่า left/top
        this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
        this.el.style.opacity = this.hasHand ? '1' : '0.25';
        this.smoothRaf = requestAnimationFrame(smooth);
      };
      this.smoothRaf = requestAnimationFrame(smooth);
    }

    // ลูปส่งเฟรมเข้า MediaPipe — ไม่รอคิวซ้อน
    if (!this.loopOn) {
      this.loopOn = true;
      const tick = () => {
        if (!this.loopOn) return;
        if (this.active && !this.busy && video.readyState >= 2) {
          this.busy = true;
          this.hands.send({ image: video }).then(() => {
            this.busy = false;
          }).catch(() => {
            this.busy = false;
          });
        }
        // หน่วงเล็กน้อย ~33ms ≈ 30fps ตรวจจับ (พอสำหรับมือ)
        setTimeout(() => requestAnimationFrame(tick), 8);
      };
      tick();
    }
    return true;
  },

  stop() {
    this.active = false;
    this.clearHover();
    if (this.el) this.el.style.display = 'none';
  },

  clearHover() {
    if (this.hover) {
      this.hover.classList.remove('finger-on');
      this.hover = null;
    }
    this.hoverT = 0;
    if (this.arc) this.arc.style.strokeDashoffset = '100.5';
  },

  onResults(results) {
    if (!this.active) return;

    if (!results.multiHandLandmarks || !results.multiHandLandmarks.length) {
      this.hasHand = false;
      this.clearHover();
      return;
    }

    this.hasHand = true;
    const lm = results.multiHandLandmarks[0];
    // ปลายนิ้วชี้ = 8, ข้อนิ้วชี้ = 6 (ช่วยเสถียรขึ้น)
    const tip = lm[8];
    const pip = lm[6];
    // ผสมปลายนิ้ว + ข้อเล็กน้อย ลดสั่น
    const fx = tip.x * 0.85 + pip.x * 0.15;
    const fy = tip.y * 0.85 + pip.y * 0.15;

    // วิดีโอ CSS scaleX(-1) แล้ว → tip.x ตรงกับหน้าจอ
    this.tx = fx * window.innerWidth;
    this.ty = fy * window.innerHeight;

    // hit-test ใช้ตำแหน่งที่ smooth แล้ว (ใกล้เคียงของจริง)
    const target = this.hitTest(this.x, this.y);
    if (target) {
      if (target !== this.hover) {
        if (this.hover) this.hover.classList.remove('finger-on');
        this.hover = target;
        this.hover.classList.add('finger-on');
        this.hoverT = performance.now();
        if (this.arc) this.arc.style.strokeDashoffset = '100.5';
      } else {
        const t = Math.min(1, (performance.now() - this.hoverT) / this.HOLD);
        if (this.arc) this.arc.style.strokeDashoffset = String(100.5 * (1 - t));
        if (t >= 1) {
          this.fire(target);
          this.clearHover();
          this.hoverT = performance.now() + 1e9;
        }
      }
    } else {
      this.clearHover();
    }
  },

  hitTest(x, y) {
    const prev = this.el.style.display;
    this.el.style.display = 'none';
    const raw = document.elementFromPoint(x, y);
    this.el.style.display = prev || 'block';
    if (!raw) return null;

    const hit = raw.closest(
      '[data-finger], button, .opt, .balloon, .match-item, .chip, .mode-btn, .btn'
    );
    if (!hit) return null;
    if (hit.disabled) return null;
    if (hit.classList.contains('done') || hit.classList.contains('pop')) return null;
    return hit;
  },

  fire(el) {
    this.el.classList.add('clicking');
    setTimeout(() => this.el.classList.remove('clicking'), 150);
    try {
      el.click();
    } catch (_) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }
  }
};
