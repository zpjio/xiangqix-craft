import React from 'react';
import {
  BoardTheme,
  Camp,
  FontScheme,
  ImpactEffect,
  MoveRecord,
  Piece,
  PieceCraftStyle,
  Position,
} from '../types/xiangqi';
import { BLACK_ROAD_NUMERALS, RED_ROAD_NUMERALS, getPieceAt } from '../utils/xiangqiRules';
import { XiangqiPiece } from './XiangqiPiece';

interface XiangqiBoardProps {
  pieces: Piece[];
  selectedPieceId: string | null;
  legalMoves: Position[];
  lastMove: MoveRecord | null;
  impactEffect?: ImpactEffect | null;
  boardTheme: BoardTheme;
  craftStyle: PieceCraftStyle;
  fontScheme: FontScheme;
  useTraditionalChar: boolean;
  showCoordinates: boolean;
  onSelectIntersection: (row: number, col: number) => void;
}

// 棋盘几何常量：SVG 画布 900 x 1000，外边距 X=70, Y=65，格距 STEP=95
const STEP = 95;
const OFFSET_X = 70; // 70 + 8 * 95 = 830 (左右对称 70)
const OFFSET_Y = 72; // 72 + 9 * 95 = 927 (上下对称 ~72)

// 落子瞬间：朱砂粉尘与紫檀/黄杨细木屑径向散落组件
const ImpactDustBurst: React.FC<{ camp: Camp; isCapture: boolean; effectId: number }> = ({
  camp,
  isCapture,
  effectId,
}) => {
  const count = isCapture ? 18 : 12;
  const particles = Array.from({ length: count }).map((_, idx) => {
    // 均匀分布角度 + 确定性伪随机偏移，保证每次落子颗粒自然散落
    const seed = ((effectId * 31 + idx * 17) % 97) / 97;
    const baseAngle = (idx / count) * Math.PI * 2 + (seed - 0.5) * 0.42;
    const minRadius = isCapture ? 24 : 20;
    const maxRadius = isCapture ? 52 : 38;
    const dist = minRadius + seed * (maxRadius - minRadius);

    const tx = `${Math.round(Math.cos(baseAngle) * dist)}px`;
    const ty = `${Math.round(Math.sin(baseAngle) * dist)}px`;
    const rot = `${Math.round((seed - 0.5) * 260)}deg`;
    const dur = `${Math.round((isCapture ? 520 : 440) + seed * 180)}ms`;
    const scale = (0.75 + seed * 0.65).toFixed(2);

    // 区分“朱砂粉尘/泥金微尘（圆粒）”与“黄杨/紫檀木屑（细长木刺）”
    const isWoodSplinter = idx % 3 === 0;
    let colorClass = 'bg-[#C8372D]'; // 辰州朱砂粉尘
    if (isWoodSplinter) {
      colorClass = idx % 2 === 0 ? 'bg-[#DFC196]' : 'bg-[#8C5A36]'; // 黄杨木屑 / 紫檀木屑
    } else if (camp === 'black' && idx % 2 === 1) {
      colorClass = 'bg-[#D4AF37]'; // 黑方泥金微尘
    } else if (isCapture && idx % 4 === 1) {
      colorClass = 'bg-[#E85D4A]'; // 吃子飞溅高光银朱尘
    }

    return {
      key: `dust-${effectId}-${idx}`,
      isWoodSplinter,
      colorClass,
      style: {
        '--tx': tx,
        '--ty': ty,
        '--rot': rot,
        '--dur': dur,
        '--scale': scale,
        animationDelay: `${(idx % 4) * 12}ms`,
      } as React.CSSProperties,
    };
  });

  return (
    <div
      key={`burst-${effectId}`}
      className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
      aria-hidden="true"
    >
      {/* 接触面微震气浪环 */}
      <span
        className={`absolute w-11 h-11 rounded-full border animate-impact-ring ${
          isCapture
            ? 'border-[#C8372D]/85 shadow-[0_0_10px_rgba(200,55,45,0.45)]'
            : camp === 'red'
            ? 'border-[#A62626]/65'
            : 'border-[#D4AF37]/65'
        }`}
      />

      {/* 朱砂粉尘与细木屑微粒 */}
      {particles.map((p) => (
        <span
          key={p.key}
          style={p.style}
          className={`absolute animate-dust-particle ${p.colorClass} ${
            p.isWoodSplinter
              ? 'w-1.5 h-0.5 rounded-[1px] shadow-[0_0_2px_rgba(0,0,0,0.6)]'
              : 'w-1 h-1 rounded-full shadow-[0_0_3px_rgba(200,55,45,0.4)]'
          }`}
        />
      ))}
    </div>
  );
};

export const XiangqiBoard: React.FC<XiangqiBoardProps> = ({
  pieces,
  selectedPieceId,
  legalMoves,
  lastMove,
  impactEffect = null,
  boardTheme,
  craftStyle,
  fontScheme,
  useTraditionalChar,
  showCoordinates,
  onSelectIntersection,
}) => {
  // 主题配色映射
  const themeColors = {
    'xuan-rosewood': {
      surfaceStart: '#E6D2B0',
      surfaceMid: '#DBC299',
      surfaceEnd: '#C8AA7A',
      inkLine: '#2B221C',
      riverText: '#3A2B21',
      sealRed: '#9E2A2B',
      coordText: '#C5A880',
      frameClass: 'zitan-board-frame border-[#543828]',
    },
    'imperial-lacquer': {
      surfaceStart: '#231614',
      surfaceMid: '#1A100E',
      surfaceEnd: '#120A09',
      inkLine: '#C8A252',
      riverText: '#D4AF37',
      sealRed: '#B83227',
      coordText: '#D4AF37',
      frameClass: 'bg-[#140B09] border-[#6E5225] shadow-[0_24px_48px_rgba(0,0,0,0.9)]',
    },
    'song-celadon': {
      surfaceStart: '#DCE3DC',
      surfaceMid: '#CBD5CC',
      surfaceEnd: '#B5C3B7',
      inkLine: '#243028',
      riverText: '#2C3B31',
      sealRed: '#9E2A2B',
      coordText: '#BCC7BE',
      frameClass: 'bg-[#1E2621] border-[#425247] shadow-[0_24px_48px_rgba(0,0,0,0.85)]',
    },
  }[boardTheme];

  // 生成炮位与兵卒位的传统直角花标路径 (Fiducial L-marks)
  const renderFiducialMark = (row: number, col: number) => {
    const cx = OFFSET_X + col * STEP;
    const cy = OFFSET_Y + row * STEP;
    const gap = 7;
    const len = 16;
    const paths: string[] = [];

    // 左上与左下（如果不是最左列 col > 0）
    if (col > 0) {
      paths.push(`M ${cx - gap - len} ${cy - gap} L ${cx - gap} ${cy - gap} L ${cx - gap} ${cy - gap - len}`);
      paths.push(`M ${cx - gap - len} ${cy + gap} L ${cx - gap} ${cy + gap} L ${cx - gap} ${cy + gap + len}`);
    }
    // 右上与右下（如果不是最右列 col < 8）
    if (col < 8) {
      paths.push(`M ${cx + gap + len} ${cy - gap} L ${cx + gap} ${cy - gap} L ${cx + gap} ${cy - gap - len}`);
      paths.push(`M ${cx + gap + len} ${cy + gap} L ${cx + gap} ${cy + gap} L ${cx + gap} ${cy + gap + len}`);
    }

    return (
      <path
        key={`mark-${row}-${col}`}
        d={paths.join(' ')}
        fill="none"
        stroke={themeColors.inkLine}
        strokeWidth="2"
        strokeLinecap="square"
        strokeOpacity="0.82"
      />
    );
  };

  // 14个传统星位坐标：4个炮位 + 10个兵卒位
  const fiducialPositions: [number, number][] = [
    [2, 1],
    [2, 7],
    [7, 1],
    [7, 7],
    [3, 0],
    [3, 2],
    [3, 4],
    [3, 6],
    [3, 8],
    [6, 0],
    [6, 2],
    [6, 4],
    [6, 6],
    [6, 8],
  ];

  return (
    <div className="relative w-full max-w-[660px] mx-auto select-none">
      {/* 紫檀木案外框与四角铜包角 */}
      <div
        className={`relative rounded-xl p-3 sm:p-5 border-2 transition-colors duration-300 ${themeColors.frameClass}`}
      >
        {/* 四个传统黄铜回纹包角 */}
        <span className="absolute top-1.5 left-1.5 w-5 h-5 border-t-2 border-l-2 border-[#D4AF37]/50 pointer-events-none" />
        <span className="absolute top-1.5 right-1.5 w-5 h-5 border-t-2 border-r-2 border-[#D4AF37]/50 pointer-events-none" />
        <span className="absolute bottom-1.5 left-1.5 w-5 h-5 border-b-2 border-l-2 border-[#D4AF37]/50 pointer-events-none" />
        <span className="absolute bottom-1.5 right-1.5 w-5 h-5 border-b-2 border-r-2 border-[#D4AF37]/50 pointer-events-none" />

        {/* 核心棋盘画布容器（保持 9:10 黄金比例） */}
        <div className="relative w-full aspect-[9/10] rounded-md overflow-hidden shadow-inner">
          {/* 第一层：SVG 宣纸肌理、九路十线、九宫斜线、楚河汉界 */}
          <svg
            viewBox="0 0 900 1000"
            className="w-full h-full block"
            aria-label="中国象棋九路十线棋盘"
          >
            <defs>
              {/* 宣纸/漆盘径向光泽 */}
              <radialGradient id="boardSurfaceGrad" cx="50%" cy="48%" r="65%">
                <stop offset="0%" stopColor={themeColors.surfaceStart} />
                <stop offset="65%" stopColor={themeColors.surfaceMid} />
                <stop offset="100%" stopColor={themeColors.surfaceEnd} />
              </radialGradient>

              {/* 陈年宣纸纤维纹理滤镜 */}
              <filter id="xuanPaperTexture" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.04"
                  numOctaves="4"
                  seed="12"
                  result="noise"
                />
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.045 0"
                  in="noise"
                  result="tintedNoise"
                />
                <feComposite operator="in" in2="SourceGraphic" />
              </filter>

              {/* 楚河汉界水波暗纹图案 */}
              <pattern
                id="riverWavePattern"
                x="0"
                y="0"
                width="60"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 0 15 Q 15 5, 30 15 T 60 15"
                  fill="none"
                  stroke={themeColors.inkLine}
                  strokeWidth="1"
                  strokeOpacity="0.1"
                />
              </pattern>
            </defs>

            {/* 棋盘底色与宣纸肌理层 */}
            <rect width="900" height="1000" fill="url(#boardSurfaceGrad)" />
            <rect width="900" height="1000" fill="#5C4028" filter="url(#xuanPaperTexture)" opacity="0.4" />

            {/* 顶部黑方九路数字坐标与底部红方汉字路标 */}
            {showCoordinates &&
              Array.from({ length: 9 }).map((_, col) => {
                const x = OFFSET_X + col * STEP;
                return (
                  <g key={`coord-${col}`}>
                    <text
                      x={x}
                      y={34}
                      textAnchor="middle"
                      fill={themeColors.inkLine}
                      fillOpacity="0.65"
                      className="font-serif-sc text-[20px] font-semibold"
                    >
                      {BLACK_ROAD_NUMERALS[col]}
                    </text>
                    <text
                      x={x}
                      y={976}
                      textAnchor="middle"
                      fill={themeColors.inkLine}
                      fillOpacity="0.72"
                      className="font-serif-sc text-[20px] font-bold"
                    >
                      {RED_ROAD_NUMERALS[col]}
                    </text>
                  </g>
                );
              })}

            {/* 外围双层重框（传统外粗内细回纹边框） */}
            <rect
              x={OFFSET_X - 12}
              y={OFFSET_Y - 12}
              width={STEP * 8 + 24}
              height={STEP * 9 + 24}
              fill="none"
              stroke={themeColors.inkLine}
              strokeWidth="4.5"
              strokeOpacity="0.9"
            />
            <rect
              x={OFFSET_X}
              y={OFFSET_Y}
              width={STEP * 8}
              height={STEP * 9}
              fill="none"
              stroke={themeColors.inkLine}
              strokeWidth="2.2"
            />

            {/* 楚河汉界水波暗纹区域 (行4与行5之间) */}
            <rect
              x={OFFSET_X}
              y={OFFSET_Y + 4 * STEP}
              width={STEP * 8}
              height={STEP}
              fill="url(#riverWavePattern)"
            />

            {/* 十条横线 (10 Horizontal Ranks) */}
            {Array.from({ length: 10 }).map((_, row) => {
              const y = OFFSET_Y + row * STEP;
              return (
                <line
                  key={`rank-${row}`}
                  x1={OFFSET_X}
                  y1={y}
                  x2={OFFSET_X + 8 * STEP}
                  y2={y}
                  stroke={themeColors.inkLine}
                  strokeWidth={row === 0 || row === 9 || row === 4 || row === 5 ? '2.5' : '1.8'}
                  strokeOpacity="0.88"
                />
              );
            })}

            {/* 九条纵线 (9 Vertical Files) — 除左右两条边线贯通外，中间7条在楚河汉界断开 */}
            {Array.from({ length: 9 }).map((_, col) => {
              const x = OFFSET_X + col * STEP;
              if (col === 0 || col === 8) {
                return (
                  <line
                    key={`file-edge-${col}`}
                    x1={x}
                    y1={OFFSET_Y}
                    x2={x}
                    y2={OFFSET_Y + 9 * STEP}
                    stroke={themeColors.inkLine}
                    strokeWidth="2.5"
                    strokeOpacity="0.9"
                  />
                );
              }
              return (
                <g key={`file-inner-${col}`}>
                  {/* 北岸黑方纵线 (行 0 -> 4) */}
                  <line
                    x1={x}
                    y1={OFFSET_Y}
                    x2={x}
                    y2={OFFSET_Y + 4 * STEP}
                    stroke={themeColors.inkLine}
                    strokeWidth="1.8"
                    strokeOpacity="0.85"
                  />
                  {/* 南岸红方纵线 (行 5 -> 9) */}
                  <line
                    x1={x}
                    y1={OFFSET_Y + 5 * STEP}
                    x2={x}
                    y2={OFFSET_Y + 9 * STEP}
                    stroke={themeColors.inkLine}
                    strokeWidth="1.8"
                    strokeOpacity="0.85"
                  />
                </g>
              );
            })}

            {/* 北方黑营九宫米字斜线 (Row 0..2, Col 3..5) */}
            <g stroke={themeColors.inkLine} strokeWidth="1.8" strokeDasharray="6 3" strokeOpacity="0.8">
              <line
                x1={OFFSET_X + 3 * STEP}
                y1={OFFSET_Y + 0 * STEP}
                x2={OFFSET_X + 5 * STEP}
                y2={OFFSET_Y + 2 * STEP}
              />
              <line
                x1={OFFSET_X + 5 * STEP}
                y1={OFFSET_Y + 0 * STEP}
                x2={OFFSET_X + 3 * STEP}
                y2={OFFSET_Y + 2 * STEP}
              />
            </g>

            {/* 南方红营九宫米字斜线 (Row 7..9, Col 3..5) */}
            <g stroke={themeColors.inkLine} strokeWidth="1.8" strokeDasharray="6 3" strokeOpacity="0.8">
              <line
                x1={OFFSET_X + 3 * STEP}
                y1={OFFSET_Y + 7 * STEP}
                x2={OFFSET_X + 5 * STEP}
                y2={OFFSET_Y + 9 * STEP}
              />
              <line
                x1={OFFSET_X + 5 * STEP}
                y1={OFFSET_Y + 7 * STEP}
                x2={OFFSET_X + 3 * STEP}
                y2={OFFSET_Y + 9 * STEP}
              />
            </g>

            {/* 九宫中心中军宝座菱形花饰 */}
            {[1, 8].map((centerRow) => {
              const cx = OFFSET_X + 4 * STEP;
              const cy = OFFSET_Y + centerRow * STEP;
              return (
                <polygon
                  key={`palace-gem-${centerRow}`}
                  points={`${cx},${cy - 8} ${cx + 8},${cy} ${cx},${cy + 8} ${cx - 8},${cy}`}
                  fill={themeColors.inkLine}
                  fillOpacity="0.32"
                />
              );
            })}

            {/* 14个炮位与兵卒位传统直角折角标 */}
            {fiducialPositions.map(([r, c]) => renderFiducialMark(r, c))}

            {/* 楚河汉界书法榜书与闲章 */}
            <g className="select-none pointer-events-none">
              {/* 左侧：楚河 */}
              <text
                x={OFFSET_X + 1.85 * STEP}
                y={OFFSET_Y + 4.64 * STEP}
                textAnchor="middle"
                fill={themeColors.riverText}
                fillOpacity="0.86"
                className="font-calligraphy text-[52px] tracking-[0.28em]"
              >
                楚河
              </text>

              {/* 中央传统朱文压角印章 */}
              <g transform={`translate(${OFFSET_X + 4 * STEP - 18}, ${OFFSET_Y + 4.5 * STEP - 18})`}>
                <rect
                  width="36"
                  height="36"
                  rx="3"
                  fill={themeColors.sealRed}
                  fillOpacity="0.82"
                />
                <rect
                  x="2.5"
                  y="2.5"
                  width="31"
                  height="31"
                  fill="none"
                  stroke="#F4EFE6"
                  strokeWidth="1"
                  strokeOpacity="0.7"
                />
                <text
                  x="18"
                  y="15"
                  textAnchor="middle"
                  fill="#F4EFE6"
                  className="font-serif-sc text-[10px] font-bold"
                >
                  觀棋
                </text>
                <text
                  x="18"
                  y="28"
                  textAnchor="middle"
                  fill="#F4EFE6"
                  className="font-serif-sc text-[10px] font-bold"
                >
                  不語
                </text>
              </g>

              {/* 右侧：漢界 */}
              <text
                x={OFFSET_X + 6.25 * STEP}
                y={OFFSET_Y + 4.64 * STEP}
                textAnchor="middle"
                fill={themeColors.riverText}
                fillOpacity="0.86"
                className="font-calligraphy text-[52px] tracking-[0.28em]"
              >
                漢界
              </text>
            </g>

            {/* 上一步起止轨迹虚线指示 */}
            {lastMove && (
              <g className="pointer-events-none">
                <line
                  x1={OFFSET_X + lastMove.from.col * STEP}
                  y1={OFFSET_Y + lastMove.from.row * STEP}
                  x2={OFFSET_X + lastMove.to.col * STEP}
                  y2={OFFSET_Y + lastMove.to.row * STEP}
                  stroke="#9E2A2B"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeOpacity="0.65"
                />
                <circle
                  cx={OFFSET_X + lastMove.from.col * STEP}
                  cy={OFFSET_Y + lastMove.from.row * STEP}
                  r="6"
                  fill="#9E2A2B"
                  fillOpacity="0.7"
                />
              </g>
            )}
          </svg>

          {/* 第二层：DOM + CSS 九路十线 90 个交叉点与立体棋子层 */}
          <div className="absolute inset-0">
            {Array.from({ length: 10 }).map((_, row) =>
              Array.from({ length: 9 }).map((__, col) => {
                // 计算交叉点在 900x1000 坐标系中的百分比位置
                const leftPct = ((OFFSET_X + col * STEP) / 900) * 100;
                const topPct = ((OFFSET_Y + row * STEP) / 1000) * 100;

                const piece = getPieceAt(pieces, row, col);
                const isSelected = piece ? piece.id === selectedPieceId : false;
                const isLegalTarget = legalMoves.some((m) => m.row === row && m.col === col);
                const isLastMoveDest =
                  lastMove?.to.row === row && lastMove?.to.col === col;
                const isImpactHere =
                  impactEffect && impactEffect.row === row && impactEffect.col === col;

                return (
                  <div
                    key={`intersection-${row}-${col}`}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: '9.4%',
                      height: '8.46%',
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  >
                    {/* 落子瞬间：朱砂粉尘与木屑散落特效 */}
                    {isImpactHere && (
                      <ImpactDustBurst
                        camp={impactEffect.camp}
                        isCapture={impactEffect.isCapture}
                        effectId={impactEffect.id}
                      />
                    )}

                    {/* 空交叉点点击区域与合法落子青玉点 */}
                    {!piece && (
                      <button
                        type="button"
                        onClick={() => onSelectIntersection(row, col)}
                        aria-label={`交叉点 第${row + 1}横 第${col + 1}路`}
                        className="w-full h-full rounded-full flex items-center justify-center cursor-pointer group focus:outline-none"
                      >
                        {isLegalTarget ? (
                          <span className="relative flex items-center justify-center w-5 h-5">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#3E6B52] border border-[#D4AF37] shadow-[0_0_8px_rgba(62,107,82,0.8)] transition-transform group-hover:scale-125" />
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[#9E2A2B]/25 transition-colors" />
                        )}
                      </button>
                    )}

                    {/* 棋子实体渲染 */}
                    {piece && (
                      <div
                        key={isImpactHere ? `piece-land-${impactEffect.id}` : piece.id}
                        className={`relative w-full h-full flex items-center justify-center ${
                          isImpactHere ? 'animate-piece-land' : ''
                        }`}
                      >
                        <XiangqiPiece
                          piece={piece}
                          isSelected={isSelected}
                          isLastMove={isLastMoveDest}
                          craftStyle={craftStyle}
                          fontScheme={fontScheme}
                          useTraditionalChar={useTraditionalChar}
                          onClick={() => onSelectIntersection(row, col)}
                        />

                        {/* 可吃子目标：传统朱砂四隅锁定框 */}
                        {isLegalTarget && (
                          <button
                            type="button"
                            onClick={() => onSelectIntersection(row, col)}
                            aria-label={`吃掉${piece.camp === 'red' ? '红' : '黑'}子`}
                            className="absolute -inset-1 z-40 cursor-pointer pointer-events-auto flex items-center justify-center"
                          >
                            <span className="w-full h-full rounded-full border-2 border-[#C8372D] shadow-[0_0_12px_rgba(200,55,45,0.85)]" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
