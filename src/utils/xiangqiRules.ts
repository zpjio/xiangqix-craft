import { Camp, DeepAnalysisSummary, EvaluationSnapshot, MoveRecord, Piece, PieceType, Position } from '../types/xiangqi';

export const PIECE_LABELS: Record<Camp, Record<PieceType, { traditional: string; simplified: string; roleDesc: string }>> = {
  red: {
    general: { traditional: '帥', simplified: '帅', roleDesc: '九宫统帅 · 直行一格' },
    advisor: { traditional: '仕', simplified: '仕', roleDesc: '贴身护卫 · 九宫斜行' },
    elephant: { traditional: '相', simplified: '相', roleDesc: '飞相巡河 · 田字塞眼' },
    horse: { traditional: '傌', simplified: '马', roleDesc: '八面威风 · 日字蹩腿' },
    chariot: { traditional: '俥', simplified: '车', roleDesc: '纵横驰骋 · 一往无前' },
    cannon: { traditional: '炮', simplified: '炮', roleDesc: '隔山打牛 · 翻山越岭' },
    soldier: { traditional: '兵', simplified: '兵', roleDesc: '勇往直前 · 过河横行' },
  },
  black: {
    general: { traditional: '將', simplified: '将', roleDesc: '北境统帅 · 坐镇中军' },
    advisor: { traditional: '士', simplified: '士', roleDesc: '内廷谋士 · 九宫斜行' },
    elephant: { traditional: '象', simplified: '象', roleDesc: '飞象护营 · 不过楚河' },
    horse: { traditional: '馬', simplified: '马', roleDesc: '铁骑突袭 · 日字蹩腿' },
    chariot: { traditional: '車', simplified: '车', roleDesc: '长驱直入 · 纵横九路' },
    cannon: { traditional: '砲', simplified: '炮', roleDesc: '垒石发石 · 隔子击杀' },
    soldier: { traditional: '卒', simplified: '卒', roleDesc: '寸步不退 · 渡河横行' },
  },
};

export const RED_ROAD_NUMERALS = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
export const BLACK_ROAD_NUMERALS = ['１', '２', '３', '４', '５', '６', '７', '８', '９'];

export function createInitialPieces(): Piece[] {
  return [
    // Black camp (top, rows 0-4)
    { id: 'b-chariot-1', type: 'chariot', camp: 'black', row: 0, col: 0 },
    { id: 'b-horse-1', type: 'horse', camp: 'black', row: 0, col: 1 },
    { id: 'b-elephant-1', type: 'elephant', camp: 'black', row: 0, col: 2 },
    { id: 'b-advisor-1', type: 'advisor', camp: 'black', row: 0, col: 3 },
    { id: 'b-general', type: 'general', camp: 'black', row: 0, col: 4 },
    { id: 'b-advisor-2', type: 'advisor', camp: 'black', row: 0, col: 5 },
    { id: 'b-elephant-2', type: 'elephant', camp: 'black', row: 0, col: 6 },
    { id: 'b-horse-2', type: 'horse', camp: 'black', row: 0, col: 7 },
    { id: 'b-chariot-2', type: 'chariot', camp: 'black', row: 0, col: 8 },
    { id: 'b-cannon-1', type: 'cannon', camp: 'black', row: 2, col: 1 },
    { id: 'b-cannon-2', type: 'cannon', camp: 'black', row: 2, col: 7 },
    { id: 'b-soldier-1', type: 'soldier', camp: 'black', row: 3, col: 0 },
    { id: 'b-soldier-2', type: 'soldier', camp: 'black', row: 3, col: 2 },
    { id: 'b-soldier-3', type: 'soldier', camp: 'black', row: 3, col: 4 },
    { id: 'b-soldier-4', type: 'soldier', camp: 'black', row: 3, col: 6 },
    { id: 'b-soldier-5', type: 'soldier', camp: 'black', row: 3, col: 8 },

    // Red camp (bottom, rows 5-9)
    { id: 'r-soldier-1', type: 'soldier', camp: 'red', row: 6, col: 0 },
    { id: 'r-soldier-2', type: 'soldier', camp: 'red', row: 6, col: 2 },
    { id: 'r-soldier-3', type: 'soldier', camp: 'red', row: 6, col: 4 },
    { id: 'r-soldier-4', type: 'soldier', camp: 'red', row: 6, col: 6 },
    { id: 'r-soldier-5', type: 'soldier', camp: 'red', row: 6, col: 8 },
    { id: 'r-cannon-1', type: 'cannon', camp: 'red', row: 7, col: 1 },
    { id: 'r-cannon-2', type: 'cannon', camp: 'red', row: 7, col: 7 },
    { id: 'r-chariot-1', type: 'chariot', camp: 'red', row: 9, col: 0 },
    { id: 'r-horse-1', type: 'horse', camp: 'red', row: 9, col: 1 },
    { id: 'r-elephant-1', type: 'elephant', camp: 'red', row: 9, col: 2 },
    { id: 'r-advisor-1', type: 'advisor', camp: 'red', row: 9, col: 3 },
    { id: 'r-general', type: 'general', camp: 'red', row: 9, col: 4 },
    { id: 'r-advisor-2', type: 'advisor', camp: 'red', row: 9, col: 5 },
    { id: 'r-elephant-2', type: 'elephant', camp: 'red', row: 9, col: 6 },
    { id: 'r-horse-2', type: 'horse', camp: 'red', row: 9, col: 7 },
    { id: 'r-chariot-2', type: 'chariot', camp: 'red', row: 9, col: 8 },
  ];
}

// 经典古谱与中局预设
export const CLASSICAL_PRESETS: { id: string; name: string; subtitle: string; pieces: () => Piece[] }[] = [
  {
    id: 'standard',
    name: '全盘整阵 · 初始阵列',
    subtitle: '三十二子严阵以待，九路十线全貌呈现',
    pieces: createInitialPieces,
  },
  {
    id: 'dangtoupao',
    name: '橘中秘 · 当头炮对屏风马',
    subtitle: '中路突破与双马护中的经典中盘对峙',
    pieces: () => {
      const base = createInitialPieces();
      return base.map((p) => {
        if (p.id === 'r-cannon-2') return { ...p, row: 7, col: 4 }; // 炮二平五
        if (p.id === 'b-horse-2') return { ...p, row: 2, col: 6 };  // 马8进7
        if (p.id === 'r-horse-2') return { ...p, row: 7, col: 6 };  // 马二进三
        if (p.id === 'b-horse-1') return { ...p, row: 2, col: 2 };  // 马2进3
        if (p.id === 'r-chariot-2') return { ...p, row: 9, col: 7 }; // 车一平二
        if (p.id === 'b-chariot-1') return { ...p, row: 0, col: 1 }; // 车1平2
        if (p.id === 'r-soldier-4') return { ...p, row: 5, col: 6 }; // 兵三进一
        if (p.id === 'b-soldier-4') return { ...p, row: 4, col: 6 }; // 卒7进1
        return p;
      });
    },
  },
  {
    id: 'qixing',
    name: '古谱残局 · 七星聚会',
    subtitle: '清代四大名局之首，红黑双方各七子凌厉杀阵',
    pieces: () => [
      { id: 'b-general', type: 'general', camp: 'black', row: 0, col: 5 },
      { id: 'b-elephant-2', type: 'elephant', camp: 'black', row: 2, col: 4 },
      { id: 'b-chariot-1', type: 'chariot', camp: 'black', row: 4, col: 3 },
      { id: 'b-soldier-1', type: 'soldier', camp: 'black', row: 5, col: 1 },
      { id: 'b-soldier-2', type: 'soldier', camp: 'black', row: 7, col: 4 },
      { id: 'b-soldier-3', type: 'soldier', camp: 'black', row: 8, col: 4 },
      { id: 'b-soldier-4', type: 'soldier', camp: 'black', row: 8, col: 5 },

      { id: 'r-general', type: 'general', camp: 'red', row: 9, col: 4 },
      { id: 'r-chariot-1', type: 'chariot', camp: 'red', row: 1, col: 7 },
      { id: 'r-chariot-2', type: 'chariot', camp: 'red', row: 4, col: 8 },
      { id: 'r-cannon-1', type: 'cannon', camp: 'red', row: 9, col: 8 },
      { id: 'r-soldier-1', type: 'soldier', camp: 'red', row: 1, col: 3 },
      { id: 'r-soldier-2', type: 'soldier', camp: 'red', row: 1, col: 4 },
      { id: 'r-soldier-3', type: 'soldier', camp: 'red', row: 3, col: 8 },
    ],
  },
];

export function getPieceAt(pieces: Piece[], row: number, col: number): Piece | undefined {
  return pieces.find((p) => p.row === row && p.col === col);
}

function isInsidePalace(camp: Camp, row: number, col: number): boolean {
  if (col < 3 || col > 5) return false;
  if (camp === 'black') return row >= 0 && row <= 2;
  return row >= 7 && row <= 9;
}

function countObstaclesBetween(pieces: Piece[], r1: number, c1: number, r2: number, c2: number): number {
  let count = 0;
  if (r1 === r2) {
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    for (let c = minC + 1; c < maxC; c++) {
      if (getPieceAt(pieces, r1, c)) count++;
    }
  } else if (c1 === c2) {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (let r = minR + 1; r < maxR; r++) {
      if (getPieceAt(pieces, r, c1)) count++;
    }
  }
  return count;
}

export function getLegalMovesForPiece(piece: Piece, pieces: Piece[]): Position[] {
  const moves: Position[] = [];
  const { row, col, camp, type } = piece;

  const tryAdd = (r: number, c: number) => {
    if (r < 0 || r > 9 || c < 0 || c > 8) return;
    const target = getPieceAt(pieces, r, c);
    if (!target || target.camp !== camp) {
      moves.push({ row: r, col: c });
    }
  };

  switch (type) {
    case 'general': {
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (isInsidePalace(camp, nr, nc)) {
          tryAdd(nr, nc);
        }
      }
      // 飞将规则：若将帅同列且中间无子
      const enemyGeneral = pieces.find((p) => p.type === 'general' && p.camp !== camp);
      if (enemyGeneral && enemyGeneral.col === col) {
        if (countObstaclesBetween(pieces, row, col, enemyGeneral.row, enemyGeneral.col) === 0) {
          moves.push({ row: enemyGeneral.row, col: enemyGeneral.col });
        }
      }
      break;
    }

    case 'advisor': {
      const dirs = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (isInsidePalace(camp, nr, nc)) {
          tryAdd(nr, nc);
        }
      }
      break;
    }

    case 'elephant': {
      const dirs = [
        [-2, -2],
        [-2, 2],
        [2, -2],
        [2, 2],
      ];
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        // 象不能过河
        if (camp === 'black' && nr > 4) continue;
        if (camp === 'red' && nr < 5) continue;
        // 检查象眼
        const eyeR = row + dr / 2;
        const eyeC = col + dc / 2;
        if (!getPieceAt(pieces, eyeR, eyeC)) {
          tryAdd(nr, nc);
        }
      }
      break;
    }

    case 'horse': {
      const jumps = [
        { dr: -2, dc: -1, legR: -1, legC: 0 },
        { dr: -2, dc: 1, legR: -1, legC: 0 },
        { dr: 2, dc: -1, legR: 1, legC: 0 },
        { dr: 2, dc: 1, legR: 1, legC: 0 },
        { dr: -1, dc: -2, legR: 0, legC: -1 },
        { dr: 1, dc: -2, legR: 0, legC: -1 },
        { dr: -1, dc: 2, legR: 0, legC: 1 },
        { dr: 1, dc: 2, legR: 0, legC: 1 },
      ];
      for (const j of jumps) {
        const legPiece = getPieceAt(pieces, row + j.legR, col + j.legC);
        if (!legPiece) {
          tryAdd(row + j.dr, col + j.dc);
        }
      }
      break;
    }

    case 'chariot': {
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of dirs) {
        let nr = row + dr;
        let nc = col + dc;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          const target = getPieceAt(pieces, nr, nc);
          if (!target) {
            moves.push({ row: nr, col: nc });
          } else {
            if (target.camp !== camp) {
              moves.push({ row: nr, col: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'cannon': {
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dr, dc] of dirs) {
        let nr = row + dr;
        let nc = col + dc;
        let jumped = false;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          const target = getPieceAt(pieces, nr, nc);
          if (!jumped) {
            if (!target) {
              moves.push({ row: nr, col: nc });
            } else {
              jumped = true;
            }
          } else {
            if (target) {
              if (target.camp !== camp) {
                moves.push({ row: nr, col: nc });
              }
              break;
            }
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'soldier': {
      const forward = camp === 'red' ? -1 : 1;
      tryAdd(row + forward, col);
      const crossedRiver = camp === 'red' ? row <= 4 : row >= 5;
      if (crossedRiver) {
        tryAdd(row, col - 1);
        tryAdd(row, col + 1);
      }
      break;
    }
  }

  return moves;
}

// 生成中国象棋传统四字棋谱（如：炮二平五、馬8進7）
export function formatChineseNotation(piece: Piece, from: Position, to: Position): string {
  const char = PIECE_LABELS[piece.camp][piece.type].traditional;
  const numerals = piece.camp === 'red' ? RED_ROAD_NUMERALS : ['１', '２', '３', '４', '５', '６', '７', '８', '９'];
  const stepNumerals = piece.camp === 'red' ? ['一', '二', '三', '四', '五', '六', '七', '八', '九'] : ['１', '２', '３', '４', '５', '６', '７', '８', '９'];

  const startColStr = numerals[from.col];
  const endColStr = numerals[to.col];

  if (from.row === to.row) {
    return `${char}${startColStr}平${endColStr}`;
  }

  const isForward = piece.camp === 'red' ? to.row < from.row : to.row > from.row;
  const action = isForward ? '進' : '退';

  if (piece.type === 'horse' || piece.type === 'elephant' || piece.type === 'advisor') {
    return `${char}${startColStr}${action}${endColStr}`;
  }

  const distance = Math.abs(to.row - from.row);
  return `${char}${startColStr}${action}${stepNumerals[distance - 1] || distance}`;
}

export type WoodSoundVariant = 'zitan-dense' | 'boxwood-warm' | 'huali-crisp' | 'ebony-deep';

export interface WoodClackOptions {
  isCapture?: boolean;
  row?: number; // 0..9，用于计算距离棋盘中心的径向共鸣
  col?: number; // 0..8，用于计算距离边界刚度及左右立体声声像
  variant?: WoodSoundVariant; // 可指定木纹音色或自动随机
}

export interface WoodAcousticReport {
  variantName: string;
  zoneLabel: string;
  baseFreqHz: number;
  decayMs: number;
}

const WOOD_VARIANTS: {
  id: WoodSoundVariant;
  label: string;
  pitchMultiplier: number;
  harmonicRatio: number;
  noiseFreq: number;
  noiseQ: number;
}[] = [
  {
    id: 'zitan-dense',
    label: '小叶紫檀 · 沉穆金石音',
    pitchMultiplier: 0.94,
    harmonicRatio: 2.38,
    noiseFreq: 1650,
    noiseQ: 4.2,
  },
  {
    id: 'boxwood-warm',
    label: '温润黄杨 · 醇厚木质音',
    pitchMultiplier: 1.0,
    harmonicRatio: 2.12,
    noiseFreq: 1380,
    noiseQ: 3.1,
  },
  {
    id: 'huali-crisp',
    label: '黄花梨木 · 清越激越音',
    pitchMultiplier: 1.09,
    harmonicRatio: 2.65,
    noiseFreq: 2150,
    noiseQ: 5.0,
  },
  {
    id: 'ebony-deep',
    label: '千年乌木 · 浑厚低回音',
    pitchMultiplier: 0.87,
    harmonicRatio: 1.92,
    noiseFreq: 1180,
    noiseQ: 3.6,
  },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// 合成温润紫檀木落子音效（支持随机木纹碰撞、盘心空腔共鸣 vs 边界实木刚度、左右声像及双子交击）
export function playWoodClackSound(
  optionsOrCapture: boolean | WoodClackOptions = false
): WoodAcousticReport | null {
  const opts: WoodClackOptions =
    typeof optionsOrCapture === 'boolean'
      ? { isCapture: optionsOrCapture }
      : optionsOrCapture;

  const isCapture = opts.isCapture ?? false;
  const row = opts.row ?? 4.5;
  const col = opts.col ?? 4;

  // 1. 计算落点与棋盘中心 (row=4.5, col=4) 的归一化距离
  // normDist: 0 表示正中心（盘心空腔共鸣最强），1 表示四角外框边界（木框刚度最高、音色最清脆）
  const normRow = (row - 4.5) / 4.5;
  const normCol = (col - 4) / 4;
  const normDist = Math.min(1, Math.hypot(normRow, normCol) / Math.SQRT2);
  const centerProximity = 1 - normDist; // 1 = 中心, 0 = 边界

  // 2. 随机或指定木纹声学特征 + 细微天然木纹抖动 (±4.5%)
  const chosenVariant = opts.variant
    ? WOOD_VARIANTS.find((v) => v.id === opts.variant) || WOOD_VARIANTS[0]
    : WOOD_VARIANTS[Math.floor(Math.random() * WOOD_VARIANTS.length)];
  const microJitter = 0.955 + Math.random() * 0.09;

  // 3. 物理声学参数计算：
  // 盘心低沉浑厚 (基频 ~175Hz, 衰减 ~130ms)；边界清脆短促 (基频 ~275Hz, 衰减 ~72ms)
  const spatialBaseFreq = 275 - centerProximity * 100;
  const baseFreq = Math.round(
    spatialBaseFreq * chosenVariant.pitchMultiplier * microJitter * (isCapture ? 0.92 : 1)
  );
  const decaySec = (0.072 + centerProximity * 0.058) * (isCapture ? 1.15 : 1);

  const zoneLabel =
    centerProximity > 0.66
      ? '中宫/河界 · 盘心空腔浑厚共鸣'
      : centerProximity > 0.35
      ? '内腹纵线 · 均衡木案共振'
      : '紫檀边廓 · 边框实木清脆刚音';

  const ctx = getAudioContext();
  if (!ctx) {
    return {
      variantName: chosenVariant.label,
      zoneLabel,
      baseFreqHz: baseFreq,
      decayMs: Math.round(decaySec * 1000),
    };
  }

  try {
    const now = ctx.currentTime;

    // 立体声声像（左翼第9路偏左，右翼第1路偏右）
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(((col - 4) / 4) * 0.55, now);
      panner.connect(ctx.destination);
    }
    const outputNode: AudioNode = panner || ctx.destination;

    // 辅助函数：生成单次木质敲击脉冲（包含木胎基频 + 泛音共振 + 木纹摩擦瞬态噪波）
    const triggerWoodStrike = (
      startTime: number,
      freq: number,
      duration: number,
      gainPeak: number,
      stiffnessBoost: number
    ) => {
      // (A) 主腔体基频振荡器 (Board / Token Primary Mode)
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(freq, startTime);
      bodyOsc.frequency.exponentialRampToValueAtTime(freq * 0.34, startTime + duration);

      bodyGain.gain.setValueAtTime(0.001, startTime);
      bodyGain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.003);
      bodyGain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(outputNode);
      bodyOsc.start(startTime);
      bodyOsc.stop(startTime + duration + 0.01);

      // (B) 木纹高次谐波振荡器 (Wood Ring Overtone Mode — 靠近边界时更明显)
      const overtoneOsc = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtoneOsc.type = 'sine';
      const overtoneFreq = freq * chosenVariant.harmonicRatio * (1 + stiffnessBoost * 0.15);
      overtoneOsc.frequency.setValueAtTime(overtoneFreq, startTime);
      overtoneOsc.frequency.exponentialRampToValueAtTime(
        overtoneFreq * 0.48,
        startTime + duration * 0.55
      );

      const overtonePeak = gainPeak * (0.28 + stiffnessBoost * 0.32);
      overtoneGain.gain.setValueAtTime(0.001, startTime);
      overtoneGain.gain.linearRampToValueAtTime(overtonePeak, startTime + 0.002);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 0.55);

      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(outputNode);
      overtoneOsc.start(startTime);
      overtoneOsc.stop(startTime + duration * 0.6);

      // (C) 木纹纹理接触瞬态噪波 (Filtered Grain Impact Burst)
      const bufferSize = Math.floor(ctx.sampleRate * 0.024);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // 指数衰减包络的随机木刺纹理
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(
        chosenVariant.noiseFreq * (0.9 + stiffnessBoost * 0.35) * microJitter,
        startTime
      );
      bandpass.Q.setValueAtTime(chosenVariant.noiseQ, startTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(gainPeak * (0.42 + stiffnessBoost * 0.25), startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.022);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(outputNode);
      noiseSource.start(startTime);
    };

    // 若为吃子动作，先触发一声清脆高频的“双木棋子碰撞声”，18ms 后再触发沉稳的“棋盘落定声”
    if (isCapture) {
      triggerWoodStrike(now, baseFreq * 1.48, 0.048, 0.26, 0.85);
      triggerWoodStrike(now + 0.018, baseFreq, decaySec, 0.38, normDist);
    } else {
      triggerWoodStrike(now, baseFreq, decaySec, 0.28, normDist);
    }
  } catch {
    // Ignore audio context restriction errors
  }

  return {
    variantName: chosenVariant.label,
    zoneLabel,
    baseFreqHz: baseFreq,
    decayMs: Math.round(decaySec * 1000),
  };
}

// 提子离案时的轻柔木纹微响
export function playPieceLiftSound(row = 4.5, col = 4) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const base = 320 + ((Math.abs(row - 4.5) + Math.abs(col - 4)) / 8.5) * 60;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.18, now + 0.032);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.038);
  } catch {
    // Ignore
  }
}

// ==================== 棋局形势实时评估引擎 (Material + Positional Evaluator) ====================
const BASE_PIECE_VALUE: Record<PieceType, number> = {
  general: 0,    // 统帅存活为基础前提，不计入差值以免稀释子力曲线
  chariot: 900,  // 一车十子寒
  cannon: 450,   // 炮胜双士
  horse: 400,    // 马炮相当
  advisor: 200,  // 贴身护卫
  elephant: 200, // 飞相护营
  soldier: 100,  // 未渡河基础分
};

function computeSinglePieceScore(piece: Piece): number {
  const { type, camp, row, col } = piece;
  let score = BASE_PIECE_VALUE[type];

  // 将行数统一转换为“本方视角前进深度” (0 = 本方底线, 9 = 敌方底线)
  const depth = camp === 'red' ? 9 - row : row;
  const crossedRiver = depth >= 5;
  const centerColDist = Math.abs(col - 4); // 距离五路中线的偏移 (0..4)

  switch (type) {
    case 'chariot': {
      // 出车离开底角、占肋道(四/六路)、巡河或压境加分
      if (depth > 0 || (col !== 0 && col !== 8)) score += 35;
      if (col === 3 || col === 5) score += 40; // 占肋道
      if (depth === 4 || depth === 5) score += 35; // 巡河车
      if (depth >= 6) score += 65; // 深入敌阵压境
      break;
    }
    case 'cannon': {
      // 当头炮（镇中五路）与沉底炮加成
      if (col === 4) score += 55;
      if (depth >= 7) score += 45;
      break;
    }
    case 'horse': {
      // 屏风马护中、盘河马、卧槽马加成
      if (depth >= 2 && (col === 2 || col === 6)) score += 38;
      if (crossedRiver) score += 55 - centerColDist * 6;
      if (depth >= 7 && (col === 2 || col === 3 || col === 5 || col === 6)) {
        score += 75; // 逼近九宫卧槽位
      }
      break;
    }
    case 'soldier': {
      // 过河兵/卒价值翻倍，逼近九宫形同小车
      if (crossedRiver) {
        score += 110;
        if (depth >= 6 && depth <= 8 && centerColDist <= 1) {
          score += 80; // 九宫腹地咽喉兵卒
        } else {
          score += (4 - centerColDist) * 15;
        }
      } else if (depth === 4 && (col === 2 || col === 4 || col === 6)) {
        score += 25; // 挺中兵或三七路活通马路
      }
      break;
    }
    case 'advisor':
    case 'elephant': {
      // 中路联防稳固加分
      if (col === 4) score += 20;
      break;
    }
    case 'general': {
      // 统帅坐镇九宫底线中位更稳固
      if (depth === 0 && col === 4) score += 15;
      break;
    }
  }

  return score;
}

export function evaluateBoardPosition(
  pieces: Piece[],
  step = 0,
  moveNotation = '初始整阵'
): EvaluationSnapshot {
  let redPower = 20; // 先手微弱主动权补偿 (+20)
  let blackPower = 0;

  let redAdvisors = 0;
  let redElephants = 0;
  let blackAdvisors = 0;
  let blackElephants = 0;

  for (const p of pieces) {
    const val = computeSinglePieceScore(p);
    if (p.camp === 'red') {
      redPower += val;
      if (p.type === 'advisor') redAdvisors++;
      if (p.type === 'elephant') redElephants++;
    } else {
      blackPower += val;
      if (p.type === 'advisor') blackAdvisors++;
      if (p.type === 'elephant') blackElephants++;
    }
  }

  // 士象全护城协防加成
  if (redAdvisors === 2 && redElephants === 2) redPower += 45;
  if (blackAdvisors === 2 && blackElephants === 2) blackPower += 45;

  const netScore = Math.round(redPower - blackPower);

  // 使用 Sigmoid 函数将净分差映射为红方态势胜率 (5% ~ 95%)
  const rawProb = 1 / (1 + Math.exp(-netScore / 380));
  const redWinRate = Math.max(5, Math.min(95, Math.round(rawProb * 100)));

  let summary = '两军均势 · 楚汉相持';
  if (netScore > 450) {
    summary = '红方胜势 · 兵临城下';
  } else if (netScore > 140) {
    summary = '红方占优 · 攻势凌厉';
  } else if (netScore > 45) {
    summary = '红方小优 · 先手得势';
  } else if (netScore < -450) {
    summary = '黑方胜势 · 铁骑压境';
  } else if (netScore < -140) {
    summary = '黑方占优 · 反客为主';
  } else if (netScore < -45) {
    summary = '黑方小优 · 阵脚稳固';
  }

  return {
    step,
    moveNotation,
    netScore,
    redWinRate,
    redPower: Math.round(redPower),
    blackPower: Math.round(blackPower),
    summary,
  };
}

// 为预设棋局生成初始推演走势脉络，使图表在开局即具可读性，并随每一次落子实时追加
export function getPresetInitialEvaluations(presetId: string, currentPieces: Piece[]): EvaluationSnapshot[] {
  const currentEval = evaluateBoardPosition(currentPieces, 0, '当前盘面');

  if (presetId === 'dangtoupao') {
    return [
      { step: 0, moveNotation: '开局整阵', netScore: 20, redWinRate: 51, redPower: 4085, blackPower: 4065, summary: '两军均势 · 严阵以待' },
      { step: 1, moveNotation: '炮二平五', netScore: 75, redWinRate: 55, redPower: 4140, blackPower: 4065, summary: '红方小优 · 当头炮镇中' },
      { step: 2, moveNotation: '馬８進７', netScore: 38, redWinRate: 52, redPower: 4140, blackPower: 4102, summary: '两军均势 · 跃马护中卒' },
      { step: 3, moveNotation: '傌二進三', netScore: 82, redWinRate: 55, redPower: 4184, blackPower: 4102, summary: '红方小优 · 正马出击' },
      { step: 4, moveNotation: '馬２進３', netScore: 44, redWinRate: 53, redPower: 4184, blackPower: 4140, summary: '屏风双马 · 阵脚稳固' },
      {
        ...currentEval,
        step: 5,
        moveNotation: '中盘对峙',
      },
    ];
  }

  if (presetId === 'qixing') {
    return [
      { step: 0, moveNotation: '残局初形', netScore: -160, redWinRate: 40, redPower: 2540, blackPower: 2700, summary: '黑卒锁宫 · 杀机四伏' },
      { step: 1, moveNotation: '双车逼宫', netScore: 95, redWinRate: 56, redPower: 2680, blackPower: 2585, summary: '红车联攻 · 绝境逢生' },
      {
        ...currentEval,
        step: 2,
        moveNotation: '七星聚会',
      },
    ];
  }

  return [
    {
      ...currentEval,
      step: 0,
      moveNotation: '开局整阵',
    },
  ];
}

// 根据起止坐标序列在初始棋阵上推演生成标准 MoveRecord 列表
function buildMoveRecordsFromCoords(
  initialPieces: Piece[],
  coordSteps: { from: Position; to: Position }[]
): MoveRecord[] {
  let current = initialPieces.map((p) => ({ ...p }));
  const records: MoveRecord[] = [];

  for (const step of coordSteps) {
    const movingPiece = getPieceAt(current, step.from.row, step.from.col);
    if (!movingPiece) continue;
    const targetPiece = getPieceAt(current, step.to.row, step.to.col);
    const notation = formatChineseNotation(movingPiece, step.from, step.to);

    records.push({
      piece: { ...movingPiece },
      from: { ...step.from },
      to: { ...step.to },
      captured: targetPiece ? { ...targetPiece } : undefined,
      notation,
    });

    current = current
      .filter((p) => !(p.row === step.to.row && p.col === step.to.col))
      .map((p) =>
        p.id === movingPiece.id ? { ...p, row: step.to.row, col: step.to.col } : p
      );
  }

  return records;
}

// 为各预设提供经典棋谱序列，方便用户直接点击「自动演示」或拖动滑块观赏完整对局演进
export function generatePresetDemoMoves(presetId: string): MoveRecord[] {
  const preset = CLASSICAL_PRESETS.find((p) => p.id === presetId) || CLASSICAL_PRESETS[0];
  const basePieces = preset.pieces();

  if (presetId === 'dangtoupao') {
    return buildMoveRecordsFromCoords(basePieces, [
      { from: { row: 9, col: 7 }, to: { row: 5, col: 7 } }, // 1. 俥二進四（巡河车）
      { from: { row: 2, col: 7 }, to: { row: 2, col: 4 } }, // 2. 砲８平５（还架中炮）
      { from: { row: 5, col: 6 }, to: { row: 4, col: 6 } }, // 3. 兵三進一（渡河兑卒）
      { from: { row: 2, col: 1 }, to: { row: 4, col: 1 } }, // 4. 砲２進２（巡河炮）
      { from: { row: 5, col: 7 }, to: { row: 5, col: 3 } }, // 5. 俥二平六（占肋道）
      { from: { row: 0, col: 1 }, to: { row: 4, col: 1 } }, // 6. 車２進４
    ]);
  }

  if (presetId === 'qixing') {
    return buildMoveRecordsFromCoords(basePieces, [
      { from: { row: 9, col: 8 }, to: { row: 0, col: 8 } }, // 1. 炮一進九（沉底叫将）
      { from: { row: 2, col: 4 }, to: { row: 0, col: 6 } }, // 2. 象５退７（飞象解将）
      { from: { row: 4, col: 8 }, to: { row: 0, col: 8 } }, // 3. 俥一進四（弃炮献车）
      { from: { row: 4, col: 3 }, to: { row: 4, col: 4 } }, // 4. 車４平５（回防中路）
      { from: { row: 1, col: 7 }, to: { row: 1, col: 5 } }, // 5. 俥二平四（肋道绝杀）
    ]);
  }

  // 默认：全盘整阵《橘中秘》中炮过河车对屏风马十步经典演武
  return buildMoveRecordsFromCoords(basePieces, [
    { from: { row: 7, col: 7 }, to: { row: 7, col: 4 } }, // 1. 炮二平五
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 } }, // 2. 馬８進７
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 } }, // 3. 傌二進三
    { from: { row: 0, col: 8 }, to: { row: 0, col: 7 } }, // 4. 車９平８
    { from: { row: 9, col: 8 }, to: { row: 9, col: 7 } }, // 5. 俥一平二
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // 6. 馬２進３
    { from: { row: 6, col: 2 }, to: { row: 5, col: 2 } }, // 7. 兵七進一
    { from: { row: 3, col: 2 }, to: { row: 4, col: 2 } }, // 8. 卒３進１
    { from: { row: 9, col: 7 }, to: { row: 3, col: 7 } }, // 9. 俥二進六
    { from: { row: 2, col: 1 }, to: { row: 2, col: 0 } }, // 10. 砲２平１
  ]);
}

// 根据初始棋阵、完整棋谱序列与目标步数 (0..moves.length) 精确还原任意步数的棋盘与评估状态
export function reconstructBoardAtStep(
  initialPieces: Piece[],
  allMoves: MoveRecord[],
  targetStep: number
): {
  pieces: Piece[];
  capturedByRed: Piece[];
  capturedByBlack: Piece[];
  turn: Camp;
  lastMove: MoveRecord | null;
  evaluations: EvaluationSnapshot[];
} {
  const clampedStep = Math.max(0, Math.min(targetStep, allMoves.length));
  let currentPieces = initialPieces.map((p) => ({ ...p }));
  const capturedByRed: Piece[] = [];
  const capturedByBlack: Piece[] = [];
  const evaluations: EvaluationSnapshot[] = [
    evaluateBoardPosition(currentPieces, 0, '初阵整列'),
  ];

  for (let i = 0; i < clampedStep; i++) {
    const move = allMoves[i];
    if (move.captured) {
      if (move.piece.camp === 'red') {
        capturedByRed.push(move.captured);
      } else {
        capturedByBlack.push(move.captured);
      }
    }

    currentPieces = currentPieces
      .filter((p) => !(p.row === move.to.row && p.col === move.to.col))
      .map((p) =>
        p.id === move.piece.id ? { ...p, row: move.to.row, col: move.to.col } : p
      );

    evaluations.push(evaluateBoardPosition(currentPieces, i + 1, move.notation));
  }

  const lastMove = clampedStep > 0 ? allMoves[clampedStep - 1] : null;
  const turn: Camp = lastMove ? (lastMove.piece.camp === 'red' ? 'black' : 'red') : 'red';

  return {
    pieces: currentPieces,
    capturedByRed,
    capturedByBlack,
    turn,
    lastMove,
    evaluations,
  };
}

// ==================== 棋局深度分析总结与最佳棋着推演 ====================

export interface BestMoveCandidate {
  piece: Piece;
  from: Position;
  to: Position;
  captured?: Piece;
  notation: string;
  scoreDelta: number;
  reason: string;
}

// 序列化当前棋盘在场棋子分布，供后端 Gemini AI 深度点评使用
export function serializeBoardForAI(pieces: Piece[]): string {
  const redPieces = pieces
    .filter((p) => p.camp === 'red')
    .map(
      (p) =>
        `${PIECE_LABELS.red[p.type].traditional}(${RED_ROAD_NUMERALS[p.col]}路,行${p.row})`
    )
    .join('、');
  const blackPieces = pieces
    .filter((p) => p.camp === 'black')
    .map(
      (p) =>
        `${PIECE_LABELS.black[p.type].traditional}(${BLACK_ROAD_NUMERALS[p.col]}路,行${p.row})`
    )
    .join('、');

  return `红方在场(${pieces.filter((p) => p.camp === 'red').length}子)：${redPieces}\n黑方在场(${pieces.filter((p) => p.camp === 'black').length}子)：${blackPieces}`;
}

// 为当前执子方遍历所有合法落子，通过一步博弈评估找出最佳棋着与战术理由
export function findBestMoveCandidate(pieces: Piece[], turn: Camp): BestMoveCandidate | null {
  const baseEval = evaluateBoardPosition(pieces, 0, '');
  const activePieces = pieces.filter((p) => p.camp === turn);

  let bestCandidate: BestMoveCandidate | null = null;
  let bestNetForTurn = -Infinity;

  for (const piece of activePieces) {
    const legalMoves = getLegalMovesForPiece(piece, pieces);
    for (const to of legalMoves) {
      const targetPiece = getPieceAt(pieces, to.row, to.col);
      const nextPieces = pieces
        .filter((p) => !(p.row === to.row && p.col === to.col))
        .map((p) => (p.id === piece.id ? { ...p, row: to.row, col: to.col } : p));

      const nextEval = evaluateBoardPosition(nextPieces, 1, '');
      // 换算为当前执子方视角的净得分
      const rawNet = turn === 'red' ? nextEval.netScore : -nextEval.netScore;
      const baseNet = turn === 'red' ? baseEval.netScore : -baseEval.netScore;
      let scoreDelta = rawNet - baseNet;

      // 经典战术位置微调偏好（当头炮、屏风马、出车肋道、过河兵卒、吃子得子）
      let reason = '调运子力，呼应左右两翼阵势';
      if (targetPiece) {
        const capName = PIECE_LABELS[targetPiece.camp][targetPiece.type].traditional;
        scoreDelta += 45;
        reason = `果断击杀敌方「${capName}」，扩大子力与先手优势`;
      } else if (piece.type === 'cannon' && to.col === 4 && piece.col !== 4) {
        scoreDelta += 42;
        reason = '架设当头中炮，直指中路腹地威慑九宫';
      } else if (piece.type === 'horse' && (to.col === 2 || to.col === 6)) {
        scoreDelta += 32;
        reason = '跃马正位构成屏风之势，护卫中路兼顾出车';
      } else if (
        piece.type === 'chariot' &&
        (piece.col === 0 || piece.col === 8) &&
        (to.col === 1 || to.col === 7 || to.col === 3 || to.col === 5)
      ) {
        scoreDelta += 38;
        reason = '亮车抢占要道通途，迅速贯通纵横火力';
      } else if (piece.type === 'chariot' && Math.abs(to.row - piece.row) >= 3) {
        scoreDelta += 28;
        reason = '长车巡河压境，封锁敌方子力出路';
      } else if (piece.type === 'soldier') {
        const crossed = turn === 'red' ? to.row <= 4 : to.row >= 5;
        if (crossed) {
          scoreDelta += 26;
          reason = '兵卒渡河逼近九宫，配合大子撕开防线';
        } else if (to.col === 2 || to.col === 6 || to.col === 4) {
          scoreDelta += 18;
          reason = '挺进三七路或中路先锋，活通本方马路';
        }
      }

      const totalVal = rawNet + scoreDelta * 0.4;
      if (totalVal > bestNetForTurn) {
        bestNetForTurn = totalVal;
        bestCandidate = {
          piece,
          from: { row: piece.row, col: piece.col },
          to,
          captured: targetPiece,
          notation: formatChineseNotation(piece, { row: piece.row, col: piece.col }, to),
          scoreDelta: Math.round(scoreDelta),
          reason,
        };
      }
    }
  }

  return bestCandidate;
}

// 生成本地即时深度分析总结（支持与后端 Gemini AI 深度评注无缝切换/增强）
export function generateLocalDeepAnalysis(
  pieces: Piece[],
  turn: Camp,
  currentEval?: EvaluationSnapshot
): DeepAnalysisSummary {
  const evalSnap = currentEval || evaluateBoardPosition(pieces, 0, '当前盘面');

  // 统计红黑双方关键阵型特征
  const redCenterCannon = pieces.some((p) => p.camp === 'red' && p.type === 'cannon' && p.col === 4);
  const blackCenterCannon = pieces.some((p) => p.camp === 'black' && p.type === 'cannon' && p.col === 4);
  const redActiveChariots = pieces.filter(
    (p) => p.camp === 'red' && p.type === 'chariot' && (p.row < 9 || (p.col !== 0 && p.col !== 8))
  ).length;
  const blackActiveChariots = pieces.filter(
    (p) => p.camp === 'black' && p.type === 'chariot' && (p.row > 0 || (p.col !== 0 && p.col !== 8))
  ).length;
  const redScreenHorses = pieces.filter(
    (p) => p.camp === 'red' && p.type === 'horse' && p.row <= 7 && (p.col === 2 || p.col === 6)
  ).length;
  const blackScreenHorses = pieces.filter(
    (p) => p.camp === 'black' && p.type === 'horse' && p.row >= 2 && (p.col === 2 || p.col === 6)
  ).length;
  const redCrossedSoldiers = pieces.filter((p) => p.camp === 'red' && p.type === 'soldier' && p.row <= 4).length;
  const blackCrossedSoldiers = pieces.filter((p) => p.camp === 'black' && p.type === 'soldier' && p.row >= 5).length;

  // 红方态势提炼
  let redPoint = '三军整肃，车马待发';
  if (redCenterCannon && redActiveChariots >= 1) {
    redPoint = '当头炮镇中路，车马联攻凌厉';
  } else if (redCenterCannon) {
    redPoint = '红方中炮占优，中路攻势成形';
  } else if (redCrossedSoldiers >= 2) {
    redPoint = '过河兵逼近九宫，前线压迫感强';
  } else if (redActiveChariots >= 1 || redScreenHorses >= 1) {
    redPoint = '红方车马舒展，肋道控制稳健';
  }

  // 黑方态势提炼
  let blackPoint = '阵脚严密，伺机反击';
  if (blackScreenHorses >= 2) {
    blackPoint = '屏风双马护中，车马呼应灵活';
  } else if (blackCenterCannon) {
    blackPoint = '黑架中炮对攻，中路火力针锋相对';
  } else if (blackCrossedSoldiers >= 2) {
    blackPoint = '黑卒渡河锁喉，北军杀机暗藏';
  } else if (blackActiveChariots >= 1 || blackScreenHorses >= 1) {
    blackPoint = '黑方车马灵活，右翼机动充沛';
  }

  // 综合文字点评
  let commentary = '';
  if (Math.abs(evalSnap.netScore) <= 40 && pieces.length === 32 && !redCenterCannon && !blackCenterCannon) {
    commentary = '两军初阵严整，楚河汉界剑拔弩张；红方握先手之利，宜架中炮或飞相抢占先机。';
  } else if (evalSnap.netScore > 160) {
    commentary = `红方子力与阵位明显占优（${redPoint}），黑方宜稳固士象防线并寻机兑子解围。`;
  } else if (evalSnap.netScore < -160) {
    commentary = `黑方反客为主占据主动（${blackPoint}），红方需谨防中路与底线冷着。`;
  } else {
    commentary = `${redPoint}，${blackPoint}；当前楚汉均势相持，得先者胜。`;
  }

  const candidate = findBestMoveCandidate(pieces, turn);

  return {
    commentary,
    redPoint,
    blackPoint,
    bestMove: candidate ? candidate.notation : turn === 'red' ? '炮二平五' : '馬８進７',
    bestMoveReason: candidate
      ? candidate.reason
      : '抢占中路制高点，通联双车要道',
    source: 'local-engine',
  };
}
