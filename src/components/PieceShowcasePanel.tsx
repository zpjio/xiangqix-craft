import React, { useState } from 'react';
import { Camp, FontScheme, PieceCraftStyle, PieceType } from '../types/xiangqi';
import { PIECE_LABELS } from '../utils/xiangqiRules';
import { XiangqiPiece } from './XiangqiPiece';

interface PieceShowcasePanelProps {
  craftStyle: PieceCraftStyle;
  fontScheme: FontScheme;
  useTraditionalChar: boolean;
}

const PIECE_TYPES_ORDER: PieceType[] = [
  'general',
  'advisor',
  'elephant',
  'chariot',
  'horse',
  'cannon',
  'soldier',
];

const EASTERN_PALETTE = [
  { name: '辰州朱砂', hex: '#A62626', role: '红方阴刻字色 · 纯正矿物朱红' },
  { name: '赤金泥金', hex: '#D4AF37', role: '黑方阴刻描金 · 宫廷泥金光泽' },
  { name: '温润黄杨', hex: '#DFC196', role: '红方棋子胎骨 · 旋纹高光木色' },
  { name: '乌木松烟', hex: '#1F1D1A', role: '黑方棋子胎骨 · 沉穆墨玉质感' },
  { name: '陈年熟宣', hex: '#DFC8A2', role: '棋盘内芯铺陈 · 柔和护眼纸感' },
  { name: '小叶紫檀', hex: '#2C1E18', role: '棋盘重框底座 · 传世硬木包浆' },
];

export const PieceShowcasePanel: React.FC<PieceShowcasePanelProps> = ({
  craftStyle,
  fontScheme,
  useTraditionalChar,
}) => {
  const [inspectedType, setInspectedType] = useState<PieceType>('general');
  const [inspectedCamp, setInspectedCamp] = useState<Camp>('red');
  const [activeCodeTab, setActiveCodeTab] = useState<'svg' | 'css'>('svg');

  const inspectedLabel = PIECE_LABELS[inspectedCamp][inspectedType];

  return (
    <section className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 py-10 border-t border-[#3A281E]">
      {/* 标题区 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs tracking-[0.25em] text-[#C8A252] mb-2">
            01. 棋子造物与书法镌刻图鉴 · PIECE & CALLIGRAPHY ATLAS
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4EFE6] tracking-wide">
            十四枚红黑棋子造型微差与书法阴刻规范
          </h2>
        </div>
        <p className="text-sm text-[#B8A692] max-w-xl leading-relaxed">
          摒弃西洋国际象棋的具象立柱雕塑，承袭宋明木雕象棋“天圆地方、以字代象”传统。红方采用
          <span className="text-[#E06D53] font-medium">「双圆连珠弦纹 + 四极海棠菱花」</span>，黑方采用
          <span className="text-[#D4AF37] font-medium">「外圆内八角玄甲框 + 四隅方胜矩纹」</span>，兼顾色彩与几何双重辨识度。
        </p>
      </div>

      {/* 主体：左侧 14 枚红黑棋子对照阵列 + 右侧微距放大镜与代码参考 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* 左侧：红黑七兵种 14 枚全图鉴 */}
        <div className="lg:col-span-7 bg-[#1F1612] border border-[#3E2B20] rounded-xl p-6 flex flex-col justify-between">
          <div>
            {/* 红方阵列 */}
            <div className="mb-7">
              <div className="flex items-center justify-between border-b border-[#34231A] pb-2.5 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-[#E25B4B]">红方南军 · 阳春朱砂</span>
                  <span className="text-xs text-[#9C8976]">·</span>
                  <span className="text-xs text-[#B8A692]">双圆连珠内环 · 四极海棠菱花</span>
                </div>
                <span className="text-xs text-[#9C8976]">点击任意棋子微距检视</span>
              </div>
              <div className="grid grid-cols-7 gap-2.5 sm:gap-4">
                {PIECE_TYPES_ORDER.map((type) => {
                  const isCurrent = inspectedCamp === 'red' && inspectedType === type;
                  const info = PIECE_LABELS.red[type];
                  return (
                    <div
                      key={`showcase-red-${type}`}
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                        isCurrent ? 'bg-[#332119] ring-1 ring-[#D4AF37]' : 'hover:bg-[#291B15]'
                      }`}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14">
                        <XiangqiPiece
                          piece={{ id: `demo-r-${type}`, type, camp: 'red', row: 0, col: 0 }}
                          craftStyle={craftStyle}
                          fontScheme={fontScheme}
                          useTraditionalChar={useTraditionalChar}
                          onClick={() => {
                            setInspectedCamp('red');
                            setInspectedType(type);
                          }}
                        />
                      </div>
                      <span className="mt-2 text-xs font-medium text-[#E8DDD0]">
                        {info.traditional} / {info.simplified}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 黑方阵列 */}
            <div>
              <div className="flex items-center justify-between border-b border-[#34231A] pb-2.5 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-[#D4AF37]">黑方北军 · 玄甲泥金</span>
                  <span className="text-xs text-[#9C8976]">·</span>
                  <span className="text-xs text-[#B8A692]">外圆内八角框 · 四隅方胜矩纹</span>
                </div>
                <span className="text-xs text-[#9C8976]">乌木胎体 · 阴刻填金</span>
              </div>
              <div className="grid grid-cols-7 gap-2.5 sm:gap-4">
                {PIECE_TYPES_ORDER.map((type) => {
                  const isCurrent = inspectedCamp === 'black' && inspectedType === type;
                  const info = PIECE_LABELS.black[type];
                  return (
                    <div
                      key={`showcase-black-${type}`}
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                        isCurrent ? 'bg-[#332119] ring-1 ring-[#D4AF37]' : 'hover:bg-[#291B15]'
                      }`}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14">
                        <XiangqiPiece
                          piece={{ id: `demo-b-${type}`, type, camp: 'black', row: 0, col: 0 }}
                          craftStyle={craftStyle}
                          fontScheme={fontScheme}
                          useTraditionalChar={useTraditionalChar}
                          onClick={() => {
                            setInspectedCamp('black');
                            setInspectedType(type);
                          }}
                        />
                      </div>
                      <span className="mt-2 text-xs font-medium text-[#C8B8A6]">
                        {info.traditional} / {info.simplified}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 东方传统色彩体系表 */}
          <div className="mt-8 pt-5 border-t border-[#34231A]">
            <div className="text-xs tracking-wider text-[#C8A252] mb-3">
              02. 东方矿物与木艺色彩体系 · TRADITIONAL COLOR SYSTEM
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EASTERN_PALETTE.map((swatch) => (
                <div
                  key={swatch.name}
                  className="flex items-center gap-3 p-2 rounded-lg bg-[#18110E] border border-[#2F2119]"
                >
                  <span
                    className="w-7 h-7 rounded-md shrink-0 border border-white/15 shadow-inner"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#F4EFE6] truncate">
                        {swatch.name}
                      </span>
                      <span className="text-[11px] font-mono text-[#9C8976] tabular-nums">
                        {swatch.hex}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9C8976] truncate">{swatch.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：单枚棋子微距解剖 + SVG / CSS 样式代码参考 */}
        <div className="lg:col-span-5 bg-[#1F1612] border border-[#3E2B20] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#34231A] pb-3 mb-5">
              <div>
                <span className="text-xs text-[#C8A252] tracking-wider">微距工艺检视 · MACRO VIEW</span>
                <h3 className="text-lg font-bold text-[#F4EFE6] mt-0.5">
                  {inspectedCamp === 'red' ? '红方' : '黑方'} · 「
                  {useTraditionalChar ? inspectedLabel.traditional : inspectedLabel.simplified}」字棋子结构解剖
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-[#150E0B] p-1 rounded-lg border border-[#34231A]">
                <button
                  type="button"
                  onClick={() => setInspectedCamp('red')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                    inspectedCamp === 'red'
                      ? 'bg-[#9E2A2B] text-[#F4EFE6] font-medium'
                      : 'text-[#B8A692] hover:text-[#F4EFE6]'
                  }`}
                >
                  红方
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedCamp('black')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                    inspectedCamp === 'black'
                      ? 'bg-[#382C26] text-[#D4AF37] font-medium'
                      : 'text-[#B8A692] hover:text-[#F4EFE6]'
                  }`}
                >
                  黑方
                </button>
              </div>
            </div>

            {/* 放大棋子展示与工艺指标 */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#16100D] border border-[#2F2119] rounded-xl p-5 mb-5">
              <div className="w-28 h-28 shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 transform scale-115">
                  <XiangqiPiece
                    piece={{
                      id: 'macro-piece',
                      type: inspectedType,
                      camp: inspectedCamp,
                      row: 0,
                      col: 0,
                    }}
                    craftStyle={craftStyle}
                    fontScheme={fontScheme}
                    useTraditionalChar={useTraditionalChar}
                  />
                </div>
              </div>
              <div className="space-y-2 text-xs text-[#C8B8A6]">
                <div className="text-sm font-semibold text-[#F4EFE6]">
                  {inspectedLabel.roleDesc}
                </div>
                <p className="leading-relaxed">
                  <strong className="text-[#D4AF37]">字形考据：</strong>
                  繁体作「{inspectedLabel.traditional}」，简体作「{inspectedLabel.simplified}」。
                  {inspectedCamp === 'red'
                    ? '红方多加「亻」或「彳」旁（仕、傌、俥），以示文武礼制之别。'
                    : '黑方保持古字本形（士、馬、車、砲），刚健雄浑，垒石为砲。'}
                </p>
                <p className="leading-relaxed">
                  <strong className="text-[#D4AF37]">几何微差：</strong>
                  {inspectedCamp === 'red'
                    ? '外粗内细双同心圆环 + 东西南北四枚海棠菱花星点。'
                    : '外圆内正八边形（八方玄甲）弦框 + 四隅方折矩印。'}
                </p>
              </div>
            </div>
          </div>

          {/* SVG / CSS 核心参考代码切换 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#B8A692]">
                混合渲染核心实现参考 (SVG 阴刻纹饰 + CSS 立体光影)
              </span>
              <div className="flex items-center gap-1 bg-[#150E0B] p-1 rounded-lg border border-[#34231A]">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('svg')}
                  className={`px-2.5 py-0.5 text-xs rounded cursor-pointer ${
                    activeCodeTab === 'svg'
                      ? 'bg-[#2C1E18] text-[#D4AF37] font-medium'
                      : 'text-[#9C8976] hover:text-[#F4EFE6]'
                  }`}
                >
                  SVG 纹饰结构
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('css')}
                  className={`px-2.5 py-0.5 text-xs rounded cursor-pointer ${
                    activeCodeTab === 'css'
                      ? 'bg-[#2C1E18] text-[#D4AF37] font-medium'
                      : 'text-[#9C8976] hover:text-[#F4EFE6]'
                  }`}
                >
                  CSS 木雕与阴刻
                </button>
              </div>
            </div>

            <pre className="bg-[#120D0A] border border-[#2C1E18] rounded-lg p-3.5 text-[11px] font-mono text-[#D6C7B2] overflow-x-auto leading-relaxed">
              {activeCodeTab === 'svg'
                ? `<!-- 棋子 SVG 阵营微差弦纹层 (viewBox="0 0 100 100") -->
<svg viewBox="0 0 100 100" class="piece-ornament">
  <!-- 外圈阴刻主弦纹（天道浑圆） -->
  <circle cx="50" cy="50" r="42" fill="none" stroke="${
    inspectedCamp === 'red' ? '#9E2A2B' : '#D4AF37'
  }" stroke-width="2.2" />
  ${
    inspectedCamp === 'red'
      ? `<!-- 红方专属：内层柔弧连珠圆环 + 四极海棠菱花 -->
  <circle cx="50" cy="50" r="37.2" fill="none" stroke="#9E2A2B" stroke-width="0.95" />
  <polygon points="50,5.5 52,8 50,10.5 48,8" fill="#9E2A2B" />`
      : `<!-- 黑方专属：内层正八角玄甲弦框 + 四隅方胜矩纹 -->
  <polygon points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
           fill="none" stroke="#D4AF37" stroke-width="1.05" />
  <rect x="48.6" y="6.8" width="2.8" height="2.8" fill="#D4AF37" />`
  }
</svg>`
                : `/* 旋木棋子高光立体阴影与阴刻汉字光效 */
.piece-token-${inspectedCamp} {
  background: radial-gradient(circle at 32% 28%, ${
    inspectedCamp === 'red'
      ? '#F3DFC1 0%, #DFC196 42%, #9C784C 100%'
      : '#3D3530 0%, #26201D 45%, #0E0B0A 100%'
  });
  box-shadow:
    0 6px 12px -2px rgba(15, 8, 4, 0.75),
    inset 0 2px 3px rgba(255, 248, 231, ${inspectedCamp === 'red' ? '0.75' : '0.18'}),
    inset 0 -3px 6px rgba(0, 0, 0, 0.7);
}
.engraved-char {
  font-family: "Noto Serif SC", "Ma Shan Zheng", serif;
  color: ${inspectedCamp === 'red' ? '#A62222' : '#DFB654'};
  text-shadow: 0 1px 0 rgba(255,245,225,0.6), 0 -1px 1px rgba(0,0,0,0.75);
}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
