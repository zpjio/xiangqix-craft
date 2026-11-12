import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Compass, Play, RefreshCw } from 'lucide-react';
import { Camp, DeepAnalysisSummary, EvaluationSnapshot, Piece } from '../types/xiangqi';
import {
  BestMoveCandidate,
  findBestMoveCandidate,
  generateLocalDeepAnalysis,
  serializeBoardForAI,
} from '../utils/xiangqiRules';

interface DeepAnalysisPanelProps {
  pieces: Piece[];
  turn: Camp;
  currentEval: EvaluationSnapshot;
  moveCount: number;
  lastMoveNotation?: string;
  onExecuteSuggestedMove?: (candidate: BestMoveCandidate) => void;
}

export const DeepAnalysisPanel: React.FC<DeepAnalysisPanelProps> = ({
  pieces,
  turn,
  currentEval,
  moveCount,
  lastMoveNotation,
  onExecuteSuggestedMove,
}) => {
  // 本地实时推演基准结果（随棋子落点、悔棋、回放立即同步更新）
  const localAnalysis = useMemo(
    () => generateLocalDeepAnalysis(pieces, turn, currentEval),
    [pieces, turn, currentEval]
  );

  const bestCandidate = useMemo(
    () => findBestMoveCandidate(pieces, turn),
    [pieces, turn]
  );

  const [aiAnalysis, setAiAnalysis] = useState<DeepAnalysisSummary | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 当棋盘局面变化时，清除上一步缓存的云端 AI 点评，回退到最新实时局面的本地深度推演
  useEffect(() => {
    setAiAnalysis(null);
    setAiError(null);
  }, [pieces, turn]);

  const activeAnalysis: DeepAnalysisSummary = aiAnalysis || localAnalysis;

  // 调用后端 /api/xiangqi/analyze 使用 Gemini 模型进行深度文字点评与最佳着法分析
  const handleRequestAICommentary = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const boardSummary = serializeBoardForAI(pieces);
      const response = await fetch('/api/xiangqi/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardSummary,
          turn,
          lastMoveNotation: lastMoveNotation || '初阵整列',
          netScore: currentEval.netScore,
          redWinRate: currentEval.redWinRate,
          moveCount,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 评注服务暂不可用，已为您保留本地兵理推演结果');
      }

      const data = await response.json();
      if (data && data.commentary && data.bestMove) {
        setAiAnalysis({
          commentary: data.commentary,
          redPoint: data.redPoint || localAnalysis.redPoint,
          blackPoint: data.blackPoint || localAnalysis.blackPoint,
          bestMove: data.bestMove,
          bestMoveReason: data.bestMoveReason || localAnalysis.bestMoveReason,
          source: 'gemini-ai',
        });
      }
    } catch (err: unknown) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'AI 深度评注请求未完成，当前显示实时兵理推演'
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="bg-[#150E0B] border border-[#2E2018] rounded-lg p-3.5 space-y-3">
      {/* 标题栏与 AI 深度推演触发按钮 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span className="text-xs font-semibold tracking-wider text-[#D4AF37] truncate">
            深度分析总结 (AI DEEP ANALYSIS)
          </span>
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#241812] border border-[#3E2B20] text-[#C8A252] shrink-0">
            {activeAnalysis.source === 'gemini-ai' ? 'AI 国手评注' : '实时兵理推演'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleRequestAICommentary}
          disabled={isLoadingAI}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#2B1D16] hover:bg-[#3A271E] text-[#D4AF37] border border-[#D4AF37]/60 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          {isLoadingAI ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              推演中...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              AI 深度评注
            </>
          )}
        </button>
      </div>

      {/* 局面综合文字点评框 */}
      <div className="p-3 rounded-lg bg-[#1D130E] border border-[#34231A] space-y-2.5">
        <p className="text-xs text-[#F4EFE6] leading-relaxed font-serif-sc">
          「{activeAnalysis.commentary}」
        </p>

        {/* 红黑双方态势要点对比 */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2B1D16] text-[11px]">
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-[#9E2A2B]/25 border border-[#C8372D]/50 text-[#E25B4B] font-semibold shrink-0">
              红方
            </span>
            <span className="text-[#C2B09C] truncate" title={activeAnalysis.redPoint}>
              {activeAnalysis.redPoint}
            </span>
          </div>
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/45 text-[#D4AF37] font-semibold shrink-0">
              黑方
            </span>
            <span className="text-[#C2B09C] truncate" title={activeAnalysis.blackPoint}>
              {activeAnalysis.blackPoint}
            </span>
          </div>
        </div>
      </div>

      {/* 下一步最佳棋着建议卡片 */}
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#221610] border border-[#463023]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`px-2.5 py-1.5 rounded-md font-serif-sc font-bold text-sm tracking-widest border shrink-0 ${
              turn === 'red'
                ? 'bg-[#2E1614] border-[#C8372D] text-[#E25B4B]'
                : 'bg-[#261D12] border-[#D4AF37] text-[#D4AF37]'
            }`}
          >
            {activeAnalysis.bestMove}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#F4EFE6]">
                建议下一步最佳棋着
              </span>
              <span className="text-[10px] text-[#C8A252]">
                ({turn === 'red' ? '红方先行' : '黑方应手'})
              </span>
            </div>
            <p className="text-[11px] text-[#9C8976] truncate mt-0.5" title={activeAnalysis.bestMoveReason}>
              着法机要：{activeAnalysis.bestMoveReason}
            </p>
          </div>
        </div>

        {bestCandidate && onExecuteSuggestedMove && (
          <button
            type="button"
            onClick={() => onExecuteSuggestedMove(bestCandidate)}
            title={`在棋盘上执行建议着法：${bestCandidate.notation}`}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-[#9E2A2B] hover:bg-[#B43233] text-[#F4EFE6] border border-[#D4AF37]/40 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Play className="w-3 h-3" />
            试演此着
          </button>
        )}
      </div>

      {aiError && (
        <p className="text-[11px] text-[#C8A252]">
          提示：{aiError}
        </p>
      )}
    </div>
  );
};
