// Web Audio API Synthesizer for "รำวงลอยกระทง" (วันเพ็ญเดือนสิบสอง น้ำก็นองเต็มตลิ่ง)
// พร้อมจังหวะฉิ่ง-ฉับเบาๆ และรองรับไฟล์ MP3 หากวางไว้ที่ public/audio/loy-krathong.mp3

const NOTE_FREQ: Record<string, number> = {
  B4: 493.88, // ท
  D5: 587.33, // ร
  E5: 659.25, // ม
  G5: 783.99, // ซ
  A5: 880.0,  // ล
  B5: 987.77, // ท สูง
};

// โครงโน้ตรำวงลอยกระทงมาตรฐาน [โน้ต | null, ความยาว (eighth-note units, 1 unit = 230ms), ฉิ่ง? ('ching' | 'chap' | null)]
type Step = [keyof typeof NOTE_FREQ | null, number, "ching" | "chap" | null];

const MELODY: Step[] = [
  // ท่อน 1: วัน เพ็ญ เดือน สิบ สอง
  ["D5", 2, "ching"], // วัน
  ["D5", 2, null],    // เพ็ญ
  ["B4", 1, "chap"],  // เดือน
  ["D5", 1, null],    // สิบ
  ["E5", 2, null],    // สอง
  ["G5", 4, "ching"], // (เอื้อน)
  [null, 2, "chap"],

  // น้ำ ก็ นอง เต็ม ต ลิ่ง
  ["A5", 2, null],    // น้ำ
  ["G5", 2, "ching"], // นอง
  ["E5", 2, null],    // เต็ม
  ["D5", 1, "chap"],  // ต
  ["D5", 2, null],    // ลิ่ง
  ["B4", 3, "ching"], // (เอื้อน)
  [null, 2, "chap"],

  // เรา ทั้ง หลาย ชาย หญิง
  ["D5", 1, null],    // เรา
  ["E5", 1, null],    // ทั้ง
  ["G5", 2, "ching"], // หลาย
  ["E5", 2, null],    // ชาย
  ["G5", 4, "chap"],  // หญิง
  [null, 2, "ching"],

  // ส นุก กัน จริง วัน ลอย กะ ทง
  ["D5", 1, null],    // ส
  ["E5", 1, "chap"],  // นุก
  ["G5", 1, null],    // กัน
  ["A5", 1, null],    // จริง
  ["G5", 2, "ching"], // วัน
  ["E5", 1, null],    // ลอย
  ["D5", 1, "chap"],  // กะ
  ["D5", 4, null],    // ทง
  [null, 2, "ching"],

  // ท่อน 2: ลอย ลอย กะ ทง (ซอล)
  ["G5", 2, "chap"],  // ลอย
  ["G5", 2, null],    // ลอย
  ["G5", 1, "ching"], // กะ
  ["G5", 3, null],    // ทง
  ["G5", 1, "chap"],  // ลอย
  ["G5", 1, null],    // ลอย

  // ลอย ลอย กะ ทง (เร)
  ["D5", 2, "ching"], // ลอย
  ["D5", 2, null],    // ลอย
  ["D5", 1, "chap"],  // กะ
  ["D5", 3, null],    // ทง
  [null, 2, "ching"],

  // ลอย กะ ทง กัน แล้ว
  ["G5", 1, null],    // ลอย
  ["G5", 1, "chap"],  // กะ
  ["G5", 2, null],    // ทง
  ["A5", 2, "ching"], // กัน
  ["B5", 4, null],    // แล้ว
  [null, 2, "chap"],

  // ขอ เชิญ น้อง แก้ว ออก มา รำ วง
  ["B5", 1, null],    // ขอ
  ["A5", 1, "ching"], // เชิญ
  ["G5", 1, null],    // น้อง
  ["E5", 1, null],    // แก้ว
  ["D5", 2, "chap"],  // ออก
  ["E5", 1, null],    // มา
  ["G5", 1, "ching"], // รำ
  ["A5", 4, null],    // วง
  [null, 2, "chap"],

  // ท่อน 3: รำ วง วัน ลอย กะ ทง (ที)
  ["B5", 2, "ching"], // รำ
  ["B5", 2, null],    // วง
  ["B5", 1, "chap"],  // วัน
  ["B5", 3, null],    // ลอย กะ ทง
  ["B5", 1, "ching"],
  ["B5", 1, null],

  // รำ วง วัน ลอย กะ ทง (ซอล)
  ["G5", 2, "chap"],  // รำ
  ["G5", 2, null],    // วง
  ["G5", 1, "ching"], // วัน
  ["G5", 3, null],    // ลอย กะ ทง
  [null, 2, "chap"],

  // บุญ จะ ส่ง ให้ เรา สุข ใจ (รอบ 1)
  ["G5", 2, "ching"], // บุญ
  ["E5", 1, null],    // จะ
  ["D5", 2, "chap"],  // ส่ง
  ["E5", 1, null],    // ให้
  ["G5", 2, "ching"], // เรา
  ["E5", 2, null],    // สุข
  ["G5", 3, "chap"],  // ใจ
  [null, 1, null],

  // บุญ จะ ส่ง ให้ เรา สุข ใจ (รอบ 2)
  ["G5", 2, "ching"], // บุญ
  ["E5", 1, null],    // จะ
  ["D5", 2, "chap"],  // ส่ง
  ["E5", 1, null],    // ให้
  ["G5", 2, "ching"], // เรา
  ["E5", 2, null],    // สุข
  ["D5", 4, "chap"],  // ใจ
  [null, 4, null],
];

class LoyKrathongAudioPlayer {
  private ctx: AudioContext | null = null;
  private mp3Audio: HTMLAudioElement | null = null;
  private timer: number | null = null;
  private stepIdx = 0;
  private playing = false;

  async start(): Promise<void> {
    if (this.playing) return;
    this.playing = true;

    try {
      const check = await fetch("/audio/loy-krathong.mp3", { method: "HEAD" });
      if (check.ok && this.playing) {
        const audio = new Audio("/audio/loy-krathong.mp3");
        audio.loop = true;
        audio.volume = 0.35;
        await audio.play();
        this.mp3Audio = audio;
        return;
      }
    } catch {
      // Fallback to Web Audio synth below
    }

    if (!this.playing) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.stepIdx = 0;
    this.scheduleNextNote();
  }

  private playTone(freq: number, durationSec: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // ระนาด/ขลุ่ยไทยโทนอุ่นนุ่ม
    const osc = this.ctx.createOscillator();
    const harmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const harmonicGain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    harmonic.type = "sine";
    harmonic.frequency.setValueAtTime(freq * 2, now);
    harmonicGain.gain.setValueAtTime(0.14, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.085, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.96);

    osc.connect(gain);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + durationSec);
    harmonic.stop(now + durationSec);
  }

  private playChing(type: "ching" | "chap") {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(type === "ching" ? 2650 : 2100, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(type === "ching" ? 0.028 : 0.022, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + (type === "ching" ? 0.35 : 0.09)
    );

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  private scheduleNextNote() {
    if (!this.playing) return;
    const [note, units, ching] = MELODY[this.stepIdx % MELODY.length];
    const unitMs = 215;
    const durationMs = units * unitMs;

    if (note && NOTE_FREQ[note]) {
      this.playTone(NOTE_FREQ[note], durationMs / 1000);
    }
    if (ching) {
      this.playChing(ching);
    }

    this.stepIdx = (this.stepIdx + 1) % MELODY.length;
    this.timer = window.setTimeout(() => this.scheduleNextNote(), durationMs);
  }

  stop(): void {
    this.playing = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.mp3Audio) {
      this.mp3Audio.pause();
      this.mp3Audio.currentTime = 0;
      this.mp3Audio = null;
    }
  }
}

export const loyKrathongAudio = new LoyKrathongAudioPlayer();
