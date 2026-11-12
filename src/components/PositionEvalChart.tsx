import React from 'react';
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EvaluationSnapshot } from '../types/xiangqi';

interface PositionEvalChartProps {
  evaluations: EvaluationSnapshot[];
}

export const PositionEvalChart: React.FC<PositionEvalChartProps> = ({ evaluations }) => {
  const latest = evaluations[evaluations.length - 1] || {
    step: 0,
    moveNotation: '开局整阵',
    netScore: 20,
    redWinRate: 51,
    redPower: 4085,
    blackPower: 4065,
    summary: '两军均势 · 楚汉相持',
  };

  const blackWinRate = 100 - latest.redWinRate;

  // 计算正负分界渐变偏移比例，使 0 轴以上呈现辰州朱砂红，0 轴以下呈现乌木泥金黄
  const gradientOffset = () => {
    const dataMax = Math.max(...evaluations.map((i) => i.netScore), 120);
    const dataMin = Math.min(...evaluations.map((i) => i.netScore), -120);
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  // 若仅有 1 个初始点，补充一个起点以构成平滑可视图表基线
  const chartData =
    evaluations.length === 1
      ? [
          { ...evaluations[0], stepLabel: '初阵' },
          { ...evaluations[0], stepLabel: '当前' },
        ]
      : evaluations.map((item, idx) => ({
          ...item,
          stepLabel: idx === 0 ? '初阵' : `${item.step}`,
        }));

  return (
    <div className="bg-[#150E0B] border border-[#2E2018] rounded-lg p-3.5 space-y-3">
      {/* 顶部标题与局势断语 */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-[#D4AF37]">
          陆 · 楚汉形势评估走势 (POSITION EVALUATION)
        </span>
        <span
          className={`text-xs font-semibold ${
            latest.netScore >= 0 ? 'text-[#E25B4B]' : 'text-[#D4AF37]'
          }`}
        >
          {latest.summary}
        </span>
      </div>

      {/* 红黑胜势比例天平条 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
          <span className="text-[#E25B4B]">
            红方势 {latest.redWinRate}% ({latest.redPower})
          </span>
          <span className="text-[#9C8976]">
            净势差 {latest.netScore >= 0 ? `+${latest.netScore}` : latest.netScore}
          </span>
          <span className="text-[#D4AF37]">
            ({latest.blackPower}) {blackWinRate}% 黑方势
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#241914] overflow-hidden flex border border-[#3A281E]">
          <div
            style={{ width: `${latest.redWinRate}%` }}
            className="h-full bg-gradient-to-r from-[#8E1F20] to-[#C8372D] transition-all duration-300"
          />
          <div
            style={{ width: `${blackWinRate}%` }}
            className="h-full bg-gradient-to-r from-[#B8922E] to-[#D4AF37] transition-all duration-300"
          />
        </div>
      </div>

      {/* Recharts 实时走势面积图 */}
      <div className="w-full h-36 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="chuHanSplitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C8372D" stopOpacity={0.55} />
                <stop offset={off} stopColor="#C8372D" stopOpacity={0.08} />
                <stop offset={off} stopColor="#D4AF37" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="chuHanSplitStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#E25B4B" stopOpacity={1} />
                <stop offset={off} stopColor="#D4AF37" stopOpacity={1} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="stepLabel"
              stroke="#6E5A48"
              tick={{ fill: '#8C7A68', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#2E2018' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#6E5A48"
              tick={{ fill: '#8C7A68', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />

            {/* 楚河汉界 0 均势基准线 */}
            <ReferenceLine
              y={0}
              stroke="#6E5A48"
              strokeDasharray="3 3"
              strokeOpacity={0.75}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as EvaluationSnapshot;
                const isRedLead = data.netScore >= 0;
                return (
                  <div className="bg-[#1B120E] border border-[#4E3629] rounded-md px-3 py-2 shadow-xl text-xs space-y-1">
                    <div className="flex items-center justify-between gap-4 border-b border-[#322219] pb-1">
                      <span className="font-bold text-[#F4EFE6]">
                        {data.step === 0 ? data.moveNotation : `第 ${data.step} 着 · ${data.moveNotation}`}
                      </span>
                      <span
                        className={`font-mono tabular-nums font-bold ${
                          isRedLead ? 'text-[#E25B4B]' : 'text-[#D4AF37]'
                        }`}
                      >
                        {isRedLead ? `红优 +${data.netScore}` : `黑优 ${data.netScore}`}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#C2B09C] flex items-center gap-2 font-mono tabular-nums">
                      <span>红势 {data.redWinRate}%</span>
                      <span>·</span>
                      <span>黑势 {100 - data.redWinRate}%</span>
                    </div>
                    <div className="text-[11px] text-[#9C8976]">{data.summary}</div>
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="netScore"
              stroke="url(#chuHanSplitStroke)"
              strokeWidth={2}
              fill="url(#chuHanSplitFill)"
              animationDuration={260}
              dot={{
                r: 2.5,
                fill: '#150E0B',
                stroke: '#D4AF37',
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 4.5,
                fill: '#E25B4B',
                stroke: '#F4EFE6',
                strokeWidth: 1.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
