export type Camp = 'red' | 'black';

export type PieceType =
  | 'general'   // 帅 / 将
  | 'advisor'   // 仕 / 士
  | 'elephant'  // 相 / 象
  | 'horse'     // 傌 / 馬
  | 'chariot'   // 俥 / 車
  | 'cannon'    // 炮 / 砲
  | 'soldier';  // 兵 / 卒

export interface Piece {
  id: string;
  type: PieceType;
  camp: Camp;
  row: number; // 0 to 9 (0 is top/Black, 9 is bottom/Red)
  col: number; // 0 to 8 (9 vertical lines)
}

export interface Position {
  row: number;
  col: number;
}

export interface MoveRecord {
  piece: Piece;
  from: Position;
  to: Position;
  captured?: Piece;
  notation: string; // 传统中文纵线记谱，如 "炮二平五"
}

export type BoardTheme = 'xuan-rosewood' | 'imperial-lacquer' | 'song-celadon';
export type PieceCraftStyle = 'boxwood-ebony' | 'ebony-gilt' | 'mutton-jade';
export type FontScheme = 'kaiti-serif' | 'calligraphy-brush' | 'seal-script';

export interface ImpactEffect {
  id: number;
  row: number;
  col: number;
  camp: Camp;
  isCapture: boolean;
}

export interface EvaluationSnapshot {
  step: number;
  moveNotation: string;
  netScore: number;     // 正值为红方优势，负值为黑方优势
  redWinRate: number;   // 红方优势占比 (5..95%)
  redPower: number;     // 红方子力与位置总分
  blackPower: number;   // 黑方子力与位置总分
  summary: string;      // 局势评语，如 "中路得势 · 红方小优"
}

export interface SavedBoardSnapshot {
  id: string;
  title: string;
  createdAt: string;
  presetId: string;
  pieces: Piece[];
  currentStep: number;
  recordedMoves: MoveRecord[];
  turn: Camp;
  capturedByRed: Piece[];
  capturedByBlack: Piece[];
  evaluations: EvaluationSnapshot[];
}

export interface DeepAnalysisSummary {
  commentary: string;     // 局面总体文字点评
  redPoint: string;       // 红方态势要点
  blackPoint: string;     // 黑方态势要点
  bestMove: string;       // 建议下一步最佳四字着法
  bestMoveReason: string; // 最佳着法战术理由
  source: 'local-engine' | 'gemini-ai';
}




