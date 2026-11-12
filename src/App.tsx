/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RotateCcw,
  Undo2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  BookmarkCheck,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import {
  BoardTheme,
  Camp,
  EvaluationSnapshot,
  FontScheme,
  ImpactEffect,
  MoveRecord,
  Piece,
  PieceCraftStyle,
  Position,
  SavedBoardSnapshot,
} from './types/xiangqi';
import {
  BestMoveCandidate,
  CLASSICAL_PRESETS,
  createInitialPieces,
  evaluateBoardPosition,
  formatChineseNotation,
  generatePresetDemoMoves,
  getLegalMovesForPiece,
  getPieceAt,
  getPresetInitialEvaluations,
  playPieceLiftSound,
  playWoodClackSound,
  reconstructBoardAtStep,
  WoodAcousticReport,
} from './utils/xiangqiRules';
import { XiangqiBoard } from './components/XiangqiBoard';
import { PieceShowcasePanel } from './components/PieceShowcasePanel';
import { PositionEvalChart } from './components/PositionEvalChart';
import { DeepAnalysisPanel } from './components/DeepAnalysisPanel';

export default function App() {
  // 棋局状态与棋谱回放时间轴
  const [pieces, setPieces] = useState<Piece[]>(() => createInitialPieces());
  const [turn, setTurn] = useState<Camp>('red');
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [recordedMoves, setRecordedMoves] = useState<MoveRecord[]>(() =>
    generatePresetDemoMoves('standard')
  );
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [capturedByRed, setCapturedByRed] = useState<Piece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<Piece[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('standard');

  // 视觉设计方案切换状态
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('xuan-rosewood');
  const [craftStyle, setCraftStyle] = useState<PieceCraftStyle>('boxwood-ebony');
  const [fontScheme, setFontScheme] = useState<FontScheme>('kaiti-serif');
  const [useTraditionalChar, setUseTraditionalChar] = useState<boolean>(true);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [inspectBareBoard, setInspectBareBoard] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastAcousticReport, setLastAcousticReport] = useState<WoodAcousticReport | null>(null);
  const [impactEffect, setImpactEffect] = useState<ImpactEffect | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationSnapshot[]>(() =>
    getPresetInitialEvaluations('standard', createInitialPieces())
  );

  // 棋局收藏/快照 (localStorage 持久化)
  const SNAPSHOT_STORAGE_KEY = 'xiangqix_ui_saved_snapshots_v1';
  const [savedSnapshots, setSavedSnapshots] = useState<SavedBoardSnapshot[]>(() => {
    try {
      const raw = window.localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage access errors
    }
    return [];
  });
  const [customSnapshotName, setCustomSnapshotName] = useState<string>('');
  const [justSavedToast, setJustSavedToast] = useState<boolean>(false);

  // 当前已执行的有效棋谱历史 (0 .. currentStep)
  const moveHistory = useMemo(
    () => recordedMoves.slice(0, currentStep),
    [recordedMoves, currentStep]
  );

  const selectedPiece = useMemo(
    () => pieces.find((p) => p.id === selectedPieceId) || null,
    [pieces, selectedPieceId]
  );

  const legalMoves: Position[] = useMemo(() => {
    if (!selectedPiece) return [];
    return getLegalMovesForPiece(selectedPiece, pieces);
  }, [selectedPiece, pieces]);

  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  // 根据目标步数 (0 .. recordedMoves.length) 同步还原棋盘、俘子、执子方与评估曲线
  const syncBoardToStep = useCallback(
    (
      targetStep: number,
      movesSource: MoveRecord[] = recordedMoves,
      presetId: string = activePresetId,
      triggerFX: boolean = true
    ) => {
      const preset = CLASSICAL_PRESETS.find((p) => p.id === presetId) || CLASSICAL_PRESETS[0];
      const basePieces = preset.pieces();
      const clamped = Math.max(0, Math.min(targetStep, movesSource.length));
      const state = reconstructBoardAtStep(basePieces, movesSource, clamped);

      setPieces(state.pieces);
      setCapturedByRed(state.capturedByRed);
      setCapturedByBlack(state.capturedByBlack);
      setTurn(state.turn);
      setCurrentStep(clamped);
      setSelectedPieceId(null);

      if (clamped === 0) {
        setEvaluations(getPresetInitialEvaluations(presetId, basePieces));
      } else {
        setEvaluations(state.evaluations);
      }

      if (triggerFX && state.lastMove) {
        const isCaptureMove = Boolean(state.lastMove.captured);
        if (soundEnabled) {
          const rep = playWoodClackSound({
            isCapture: isCaptureMove,
            row: state.lastMove.to.row,
            col: state.lastMove.to.col,
          });
          if (rep) setLastAcousticReport(rep);
        }
        setImpactEffect({
          id: Date.now(),
          row: state.lastMove.to.row,
          col: state.lastMove.to.col,
          camp: state.lastMove.piece.camp,
          isCapture: isCaptureMove,
        });
      }
    },
    [recordedMoves, activePresetId, soundEnabled]
  );

  // 自动演示定时器：按照棋谱记录顺序自动移动棋子
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (currentStep >= recordedMoves.length) {
      setIsAutoPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      syncBoardToStep(currentStep + 1, recordedMoves, activePresetId, true);
    }, 920);

    return () => window.clearTimeout(timer);
  }, [isAutoPlaying, currentStep, recordedMoves, activePresetId, syncBoardToStep]);

  // 切换「自动演示 / 暂停演示」
  const handleToggleAutoPlay = () => {
    setInspectBareBoard(false);
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      return;
    }
    // 若当前已在棋谱末尾，则从第 0 步重新开始自动演武
    if (currentStep >= recordedMoves.length) {
      syncBoardToStep(0, recordedMoves, activePresetId, false);
    }
    setIsAutoPlaying(true);
  };

  // 手动拖动回放进度滑块或点击步进按钮
  const handleScrubStep = (nextStep: number) => {
    setIsAutoPlaying(false);
    setInspectBareBoard(false);
    syncBoardToStep(nextStep, recordedMoves, activePresetId, nextStep > currentStep);
  };

  // 处理交叉点点击（选子、换子、走子、吃子）
  const handleSelectIntersection = (row: number, col: number) => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
    }

    const clickedPiece = getPieceAt(pieces, row, col);

    // 若已选中本方棋子，且点击位置属于合法落点
    if (selectedPiece) {
      const isLegal = legalMoves.some((m) => m.row === row && m.col === col);
      if (isLegal) {
        const notation = formatChineseNotation(
          selectedPiece,
          { row: selectedPiece.row, col: selectedPiece.col },
          { row, col }
        );

        const nextPieces = pieces
          .filter((p) => !(p.row === row && p.col === col))
          .map((p) => (p.id === selectedPiece.id ? { ...p, row, col } : p));

        const isCaptureMove = Boolean(clickedPiece && clickedPiece.camp !== selectedPiece.camp);
        if (isCaptureMove && clickedPiece) {
          if (selectedPiece.camp === 'red') {
            setCapturedByRed((prev) => [...prev, clickedPiece]);
          } else {
            setCapturedByBlack((prev) => [...prev, clickedPiece]);
          }
        }

        if (soundEnabled) {
          const report = playWoodClackSound({
            isCapture: isCaptureMove,
            row,
            col,
          });
          if (report) setLastAcousticReport(report);
        }

        setImpactEffect({
          id: Date.now(),
          row,
          col,
          camp: selectedPiece.camp,
          isCapture: isCaptureMove,
        });

        const newRecord: MoveRecord = {
          piece: selectedPiece,
          from: { row: selectedPiece.row, col: selectedPiece.col },
          to: { row, col },
          captured: clickedPiece,
          notation,
        };

        const nextStepIndex = currentStep + 1;
        const updatedTimeline = [...recordedMoves.slice(0, currentStep), newRecord];

        setPieces(nextPieces);
        setRecordedMoves(updatedTimeline);
        setCurrentStep(nextStepIndex);
        setEvaluations((prev) => {
          const nextStep = prev.length > 0 ? prev[prev.length - 1].step + 1 : 1;
          return [...prev, evaluateBoardPosition(nextPieces, nextStep, notation)];
        });
        setSelectedPieceId(null);
        setTurn((prev) => (prev === 'red' ? 'black' : 'red'));
        return;
      }
    }

    // 若点击了一枚棋子，允许选中并触发轻柔提子音效
    if (clickedPiece) {
      if (clickedPiece.id === selectedPieceId) {
        setSelectedPieceId(null);
      } else {
        setSelectedPieceId(clickedPiece.id);
        if (soundEnabled) {
          playPieceLiftSound(clickedPiece.row, clickedPiece.col);
        }
        if (clickedPiece.camp !== turn) {
          setTurn(clickedPiece.camp);
        }
      }
    } else {
      setSelectedPieceId(null);
    }
  };

  // 悔棋（回退一步）
  const handleUndo = () => {
    if (currentStep === 0) return;
    setIsAutoPlaying(false);
    syncBoardToStep(currentStep - 1, recordedMoves, activePresetId, false);
  };

  // 一键试演深度分析推荐的最佳棋着
  const handleExecuteSuggestedMove = (candidate: BestMoveCandidate) => {
    setIsAutoPlaying(false);
    setInspectBareBoard(false);

    const { piece, from, to, captured, notation } = candidate;
    const nextPieces = pieces
      .filter((p) => !(p.row === to.row && p.col === to.col))
      .map((p) => (p.id === piece.id ? { ...p, row: to.row, col: to.col } : p));

    const isCaptureMove = Boolean(captured);
    if (isCaptureMove && captured) {
      if (piece.camp === 'red') {
        setCapturedByRed((prev) => [...prev, captured]);
      } else {
        setCapturedByBlack((prev) => [...prev, captured]);
      }
    }

    if (soundEnabled) {
      const report = playWoodClackSound({
        isCapture: isCaptureMove,
        row: to.row,
        col: to.col,
      });
      if (report) setLastAcousticReport(report);
    }

    setImpactEffect({
      id: Date.now(),
      row: to.row,
      col: to.col,
      camp: piece.camp,
      isCapture: isCaptureMove,
    });

    const newRecord: MoveRecord = {
      piece,
      from,
      to,
      captured,
      notation,
    };

    const nextStepIndex = currentStep + 1;
    const updatedTimeline = [...recordedMoves.slice(0, currentStep), newRecord];

    setPieces(nextPieces);
    setRecordedMoves(updatedTimeline);
    setCurrentStep(nextStepIndex);
    setEvaluations((prev) => {
      const nextStep = prev.length > 0 ? prev[prev.length - 1].step + 1 : 1;
      return [...prev, evaluateBoardPosition(nextPieces, nextStep, notation)];
    });
    setSelectedPieceId(null);
    setTurn((prev) => (prev === 'red' ? 'black' : 'red'));
  };

  // 切换经典棋局预设
  const handleLoadPreset = (presetId: string) => {
    const preset = CLASSICAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setIsAutoPlaying(false);
    const presetPieces = preset.pieces();
    const demoMoves = generatePresetDemoMoves(presetId);
    setActivePresetId(presetId);
    setPieces(presetPieces);
    setTurn('red');
    setSelectedPieceId(null);
    setRecordedMoves(demoMoves);
    setCurrentStep(0);
    setCapturedByRed([]);
    setCapturedByBlack([]);
    setEvaluations(getPresetInitialEvaluations(presetId, presetPieces));
    setInspectBareBoard(false);
  };

  // 保存当前棋局快照 (pieces, currentStep, recordedMoves 等) 到 localStorage
  const handleSaveSnapshot = () => {
    const presetObj = CLASSICAL_PRESETS.find((p) => p.id === activePresetId);
    const presetShortName = presetObj ? presetObj.name.split(' · ')[0] : '自定棋局';
    const lastMoveStr = lastMove ? ` · ${lastMove.notation}` : ' · 初阵';
    const defaultTitle = `${presetShortName}（第 ${currentStep} 着${lastMoveStr}）`;
    const finalTitle = customSnapshotName.trim() || defaultTitle;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const createdAt = `${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newSnapshot: SavedBoardSnapshot = {
      id: `snap-${Date.now()}`,
      title: finalTitle,
      createdAt,
      presetId: activePresetId,
      pieces: pieces.map((p) => ({ ...p })),
      currentStep,
      recordedMoves: recordedMoves.map((m) => ({
        ...m,
        piece: { ...m.piece },
        from: { ...m.from },
        to: { ...m.to },
        captured: m.captured ? { ...m.captured } : undefined,
      })),
      turn,
      capturedByRed: capturedByRed.map((p) => ({ ...p })),
      capturedByBlack: capturedByBlack.map((p) => ({ ...p })),
      evaluations: evaluations.map((e) => ({ ...e })),
    };

    const nextList = [newSnapshot, ...savedSnapshots];
    setSavedSnapshots(nextList);
    setCustomSnapshotName('');
    setJustSavedToast(true);
    window.setTimeout(() => setJustSavedToast(false), 1800);

    try {
      window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore storage quota errors
    }
  };

  // 一键恢复珍藏的棋局快照
  const handleRestoreSnapshot = (snap: SavedBoardSnapshot) => {
    setIsAutoPlaying(false);
    setInspectBareBoard(false);
    setActivePresetId(snap.presetId || 'standard');
    setPieces(snap.pieces.map((p) => ({ ...p })));
    setCurrentStep(snap.currentStep);
    setRecordedMoves(snap.recordedMoves.map((m) => ({ ...m })));
    setTurn(snap.turn);
    setCapturedByRed((snap.capturedByRed || []).map((p) => ({ ...p })));
    setCapturedByBlack((snap.capturedByBlack || []).map((p) => ({ ...p })));
    if (snap.evaluations && snap.evaluations.length > 0) {
      setEvaluations(snap.evaluations.map((e) => ({ ...e })));
    } else {
      setEvaluations([
        evaluateBoardPosition(snap.pieces, snap.currentStep, '恢复珍藏'),
      ]);
    }
    setSelectedPieceId(null);

    if (soundEnabled) {
      const rep = playWoodClackSound({ isCapture: false, row: 4, col: 4 });
      if (rep) setLastAcousticReport(rep);
    }
  };

  // 删除单条珍藏快照
  const handleDeleteSnapshot = (id: string) => {
    const nextList = savedSnapshots.filter((s) => s.id !== id);
    setSavedSnapshots(nextList);
    try {
      window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div className="min-h-screen bg-[#16110E] text-[#EBE3D5] flex flex-col">
      {/* 顶部导航栏 (遵循 3-Zone Top Bar Contract) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-[#34231A] bg-[#19120F]">
        <a
          href="#board-workspace"
          className="text-lg font-bold tracking-wider text-[#F4EFE6] whitespace-nowrap shrink-0"
        >
          象棋考工 · XiangqiX UI
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#C2B09C]">
          <a
            href="#board-workspace"
            className="hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
          >
            九路十线对弈台
          </a>
          <a
            href="#piece-atlas"
            className="hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
          >
            十四子微距图鉴
          </a>
          <a
            href="#svg-blueprint"
            className="hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
          >
            SVG 棋盘制式解构
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setInspectBareBoard((v) => !v)}
            className="px-4 py-2 text-xs font-medium text-[#F4EFE6] bg-[#9E2A2B] hover:bg-[#B43233] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            {inspectBareBoard ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {inspectBareBoard ? '恢复三十二子' : '纯享素盘制式'}
          </button>
        </div>
      </header>

      {/* 核心一屏工作区：左侧棋盘舞台 + 右侧东方视觉工艺与古谱控制台 */}
      <main
        id="board-workspace"
        className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* 左侧（7列）：SVG + DOM + CSS 混合架构中国象棋棋盘 */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* 棋盘上方阵营状态条 */}
          <div className="w-full max-w-[660px] flex items-center justify-between mb-3 px-2 text-xs text-[#C2B09C]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#D4AF37]">北岸 · 黑方（將/士/象）</span>
              <span aria-hidden="true">·</span>
              <span>外圆内八角玄甲制式</span>
            </div>
            <div className="flex items-center gap-2">
              <span>已俘红子：{capturedByBlack.length} 枚</span>
              <span aria-hidden="true">·</span>
              <span>已俘黑子：{capturedByRed.length} 枚</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E25B4B]">南岸 · 红方（帥/仕/相）</span>
            </div>
          </div>

          {/* 棋盘组件 */}
          <XiangqiBoard
            pieces={inspectBareBoard ? [] : pieces}
            selectedPieceId={selectedPieceId}
            legalMoves={inspectBareBoard ? [] : legalMoves}
            lastMove={inspectBareBoard ? null : lastMove}
            impactEffect={inspectBareBoard ? null : impactEffect}
            boardTheme={boardTheme}
            craftStyle={craftStyle}
            fontScheme={fontScheme}
            useTraditionalChar={useTraditionalChar}
            showCoordinates={showCoordinates}
            onSelectIntersection={handleSelectIntersection}
          />
        </div>

        {/* 右侧（5列）：视觉工艺定制与棋谱控制台 */}
        <aside className="lg:col-span-5 bg-[#1F1612] border border-[#3E2B20] rounded-xl p-6 space-y-6">
          {/* 当前执子与对局控制 */}
          <div className="flex items-center justify-between border-b border-[#34231A] pb-4">
            <div>
              <span className="text-xs text-[#C8A252] tracking-wider">
                SVG + DOM + CSS 混合渲染架构
              </span>
              <h1 className="text-xl font-bold text-[#F4EFE6] mt-0.5">
                {inspectBareBoard
                  ? '九路十线 · 楚河汉界纯棋盘检视'
                  : turn === 'red'
                  ? '当前行棋：红方执子（阳春朱砂）'
                  : '当前行棋：黑方执子（玄甲泥金）'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleAutoPlay}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isAutoPlaying
                    ? 'bg-[#9E2A2B] border-[#D4AF37] text-[#F4EFE6]'
                    : 'bg-[#2C1E18] border-[#D4AF37]/70 text-[#D4AF37] hover:bg-[#3A271F]'
                }`}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    暂停演示
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    自动演示
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                title={soundEnabled ? '关闭落子木音' : '开启落子木音'}
                className="p-2 rounded-lg bg-[#16100D] border border-[#34231A] text-[#C2B09C] hover:text-[#F4EFE6] cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={currentStep === 0}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#16100D] border border-[#34231A] text-[#EBE3D5] hover:border-[#D4AF37] disabled:opacity-40 cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Undo2 className="w-3.5 h-3.5" />
                悔棋
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset(activePresetId)}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#16100D] border border-[#34231A] text-[#EBE3D5] hover:border-[#D4AF37] cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置
              </button>
            </div>
          </div>

          {/* 1. 棋盘整体材质方案切换 */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold tracking-wider text-[#D4AF37]">
                壹 · 棋盘案几与宣纸色系 (BOARD MATERIAL)
              </label>
              <button
                type="button"
                onClick={() => setShowCoordinates((c) => !c)}
                className="text-xs text-[#B8A692] hover:text-[#F4EFE6] underline cursor-pointer"
              >
                {showCoordinates ? '隐藏九路坐标' : '显示九路坐标'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'xuan-rosewood', name: '熟宣紫檀', desc: '陈年宣纸 · 小叶紫檀' },
                { id: 'imperial-lacquer', name: '宫廷大漆', desc: '黑漆推光 · 赤金描线' },
                { id: 'song-celadon', name: '宋韵汝窑', desc: '天青冰裂 · 雅致松烟' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBoardTheme(item.id as BoardTheme)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    boardTheme === item.id
                      ? 'bg-[#2E1F18] border-[#D4AF37] text-[#F4EFE6]'
                      : 'bg-[#150E0B] border-[#2E2018] text-[#B8A692] hover:border-[#52392B]'
                  }`}
                >
                  <div className="text-xs font-bold whitespace-nowrap">{item.name}</div>
                  <div className="text-[11px] text-[#9C8976] mt-0.5 truncate">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. 棋子木雕与玉石工艺切换 */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[#D4AF37] mb-2.5">
              贰 · 棋子胎骨与阴刻填彩 (PIECE CRAFTING)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'boxwood-ebony', name: '黄杨乌木', desc: '红黄杨 · 黑乌木填金' },
                { id: 'ebony-gilt', name: '乌木泥金', desc: '红黑双乌 · 朱金阴刻' },
                { id: 'mutton-jade', name: '羊脂白玉', desc: '温润籽料 · 朱墨入骨' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCraftStyle(item.id as PieceCraftStyle)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    craftStyle === item.id
                      ? 'bg-[#2E1F18] border-[#D4AF37] text-[#F4EFE6]'
                      : 'bg-[#150E0B] border-[#2E2018] text-[#B8A692] hover:border-[#52392B]'
                  }`}
                >
                  <div className="text-xs font-bold whitespace-nowrap">{item.name}</div>
                  <div className="text-[11px] text-[#9C8976] mt-0.5 truncate">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. 汉字书法字体方案与繁简切换 */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold tracking-wider text-[#D4AF37]">
                叁 · 汉字书法碑帖方案 (CALLIGRAPHY FONT)
              </label>
              <button
                type="button"
                onClick={() => setUseTraditionalChar((t) => !t)}
                className="px-2.5 py-0.5 text-xs rounded bg-[#2C1E18] text-[#D4AF37] border border-[#52392B] cursor-pointer"
              >
                当前：{useTraditionalChar ? '传统正体（帥/將/傌/砲）' : '规范简体（帅/将/马/炮）'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'kaiti-serif', name: '颜楷宋骨', desc: '端庄雄浑 · 极佳易读' },
                { id: 'calligraphy-brush', name: '行楷飞白', desc: '毛笔顿挫 · 气韵生动' },
                { id: 'seal-script', name: '古印草意', desc: '金石写意 · 狂草风骨' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFontScheme(item.id as FontScheme)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    fontScheme === item.id
                      ? 'bg-[#2E1F18] border-[#D4AF37] text-[#F4EFE6]'
                      : 'bg-[#150E0B] border-[#2E2018] text-[#B8A692] hover:border-[#52392B]'
                  }`}
                >
                  <div className="text-xs font-bold whitespace-nowrap">{item.name}</div>
                  <div className="text-[11px] text-[#9C8976] mt-0.5 truncate">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. 经典古谱阵型切换 */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[#D4AF37] mb-2.5">
              肆 · 传世古谱与中局陈列 (CLASSICAL PRESETS)
            </label>
            <div className="space-y-2">
              {CLASSICAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                    activePresetId === preset.id && !inspectBareBoard
                      ? 'bg-[#2E1F18] border-[#D4AF37] text-[#F4EFE6]'
                      : 'bg-[#150E0B] border-[#2E2018] text-[#B8A692] hover:border-[#52392B]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{preset.name}</div>
                    <div className="text-[11px] text-[#9C8976]">{preset.subtitle}</div>
                  </div>
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* 5. 物理木纹声学与盘心/边界共鸣试听 */}
          <div className="bg-[#150E0B] border border-[#2E2018] rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[#D4AF37]">
                伍 · 空间木纹声学试听 (SPATIAL WOOD ACOUSTICS)
              </span>
              {lastAcousticReport && (
                <span className="text-[11px] font-mono tabular-nums text-[#C8A252]">
                  {lastAcousticReport.baseFreqHz}Hz · {lastAcousticReport.decayMs}ms
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const rep = playWoodClackSound({ isCapture: false, row: 6, col: 4 });
                  if (rep) setLastAcousticReport(rep);
                  setImpactEffect({
                    id: Date.now(),
                    row: 6,
                    col: 4,
                    camp: 'red',
                    isCapture: false,
                  });
                }}
                className="px-2.5 py-2 rounded border border-[#34231A] bg-[#1F1510] hover:border-[#D4AF37] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#F4EFE6] whitespace-nowrap">盘心空腔音</div>
                <div className="text-[10px] text-[#9C8976] truncate">中宫河界 · 朱砂微尘</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rep = playWoodClackSound({ isCapture: false, row: 0, col: 0 });
                  if (rep) setLastAcousticReport(rep);
                  setImpactEffect({
                    id: Date.now(),
                    row: 0,
                    col: 0,
                    camp: 'black',
                    isCapture: false,
                  });
                }}
                className="px-2.5 py-2 rounded border border-[#34231A] bg-[#1F1510] hover:border-[#D4AF37] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#F4EFE6] whitespace-nowrap">边廓实木音</div>
                <div className="text-[10px] text-[#9C8976] truncate">紫檀外框 · 泥金木屑</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rep = playWoodClackSound({ isCapture: true, row: 2, col: 1 });
                  if (rep) setLastAcousticReport(rep);
                  setImpactEffect({
                    id: Date.now(),
                    row: 2,
                    col: 1,
                    camp: 'red',
                    isCapture: true,
                  });
                }}
                className="px-2.5 py-2 rounded border border-[#34231A] bg-[#1F1510] hover:border-[#C8372D] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#E25B4B] whitespace-nowrap">双子交击音</div>
                <div className="text-[10px] text-[#9C8976] truncate">吃子重击 · 飞屑激荡</div>
              </button>
            </div>

            {lastAcousticReport ? (
              <div className="text-[11px] text-[#B8A692] flex items-center justify-between pt-1 border-t border-[#261A14]">
                <span className="truncate">{lastAcousticReport.variantName}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#D4AF37] truncate">{lastAcousticReport.zoneLabel}</span>
              </div>
            ) : (
              <p className="text-[11px] text-[#8C7A68]">
                落子自动根据交叉点坐标（盘心 vs 边廓）计算空腔共振频率、木纹泛音与左右声道声像。
              </p>
            )}
          </div>

          {/* 6. 基于 Recharts 的实时楚汉形势评估走势图 */}
          <PositionEvalChart evaluations={evaluations} />

          {/* 6.5 深度分析总结模块：AI 局面文字点评与下一步最佳棋着建议 */}
          <DeepAnalysisPanel
            pieces={pieces}
            turn={turn}
            currentEval={
              evaluations.length > 0
                ? evaluations[evaluations.length - 1]
                : evaluateBoardPosition(pieces, currentStep, '初阵')
            }
            moveCount={moveHistory.length}
            lastMoveNotation={lastMove?.notation}
            onExecuteSuggestedMove={handleExecuteSuggestedMove}
          />

          {/* 7. 显眼的总步数统计计数器与当前回合棋手席位 + 传统中文纵线记谱卷轴 */}
          <div className="bg-[#150E0B] border border-[#2E2018] rounded-lg p-3.5 space-y-3">
            {/* 显眼的总步数统计与当前回合红黑棋手名称面板 */}
            <div className="grid grid-cols-12 gap-3 p-3 rounded-lg bg-[#1D130E] border border-[#3E2B20]">
              {/* 左侧 5 列：显眼的总步数统计计数器 */}
              <div className="col-span-5 flex flex-col justify-center border-r border-[#34231A] pr-3">
                <span className="text-[11px] text-[#B8A692] tracking-wider">
                  当前总步数统计
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-bold font-mono tabular-nums text-[#F4EFE6] leading-none">
                    {moveHistory.length}
                  </span>
                  <span className="text-xs font-semibold text-[#D4AF37]">
                    步 (着)
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[#8C7A68] mt-1">
                  第 {Math.floor(moveHistory.length / 2) + 1} 回合 ·{' '}
                  {lastMove ? `末着 ${lastMove.notation}` : '尚未落子'}
                </span>
              </div>

              {/* 右侧 7 列：当前回合对应的红黑方棋手名称与阵营 */}
              <div className="col-span-7 flex flex-col justify-center pl-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#B8A692] tracking-wider">
                    当前回合执子棋手
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      turn === 'red' ? 'text-[#E25B4B]' : 'text-[#D4AF37]'
                    }`}
                  >
                    {turn === 'red' ? '红方行棋' : '黑方行棋'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mt-1.5">
                  {/* 迷你阵营帅/将印记 */}
                  <span
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-serif-sc font-black text-sm border ${
                      turn === 'red'
                        ? 'piece-token-red text-[#A62222] border-[#9E2A2B]'
                        : 'piece-token-black text-[#DFB654] border-[#D4AF37]'
                    }`}
                  >
                    {turn === 'red'
                      ? useTraditionalChar
                        ? '帥'
                        : '帅'
                      : useTraditionalChar
                      ? '將'
                      : '将'}
                  </span>

                  <div className="min-w-0">
                    <div
                      className={`text-sm font-bold truncate ${
                        turn === 'red' ? 'text-[#F4EFE6]' : 'text-[#F4EFE6]'
                      }`}
                    >
                      {turn === 'red'
                        ? '红方 · 汉中王（南军统帅）'
                        : '黑方 · 西楚霸王（北军统帅）'}
                    </div>
                    <div className="text-[11px] text-[#9C8976] truncate">
                      {turn === 'red'
                        ? '执阳春朱砂子 · 九路汉字记谱'
                        : '执玄甲泥金子 · 九路数字记谱'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 自动演示控制条与回放进度控制滑块 */}
            <div className="p-3 rounded-lg bg-[#1A110D] border border-[#34231A] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleAutoPlay}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isAutoPlaying
                        ? 'bg-[#9E2A2B] border-[#D4AF37] text-[#F4EFE6]'
                        : 'bg-[#2B1D16] border-[#D4AF37]/80 text-[#D4AF37] hover:bg-[#3A271E]'
                    }`}
                  >
                    {isAutoPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        暂停演示
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        自动演示
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScrubStep(currentStep - 1)}
                    disabled={currentStep <= 0}
                    title="回退一着"
                    className="p-1.5 rounded bg-[#140D0A] border border-[#34231A] text-[#C2B09C] hover:text-[#F4EFE6] disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrubStep(currentStep + 1)}
                    disabled={currentStep >= recordedMoves.length}
                    title="前进一着"
                    className="p-1.5 rounded bg-[#140D0A] border border-[#34231A] text-[#C2B09C] hover:text-[#F4EFE6] disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-xs font-mono tabular-nums text-[#C8A252]">
                  回放进度：{currentStep} / {recordedMoves.length} 着
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono tabular-nums text-[#8C7A68] shrink-0">
                  初阵
                </span>
                <input
                  type="range"
                  min={0}
                  max={recordedMoves.length}
                  value={currentStep}
                  onChange={(e) => handleScrubStep(Number(e.target.value))}
                  aria-label="棋谱回放进度控制滑块"
                  className="w-full h-1.5 bg-[#2B1D16] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <span className="text-[11px] font-mono tabular-nums text-[#8C7A68] shrink-0">
                  {recordedMoves.length}着
                </span>
              </div>
            </div>

            {/* 传统中文纵线记谱卷轴列表（支持点击任意着法直接跳转回放） */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#C8A252] mb-2">
                <span>柒 · 传统四字纵线棋谱卷轴 (MOVE NOTATION)</span>
                <span className="font-mono tabular-nums text-[#9C8976]">
                  已演进 {currentStep} / 共 {recordedMoves.length} 着
                </span>
              </div>
              {recordedMoves.length === 0 ? (
                <p className="text-xs text-[#8C7A68]">
                  点击棋盘上任意棋子即可查看合法落点（青白玉点为行棋位，朱砂框为击杀位），落子自动生成如「炮二平五」、「馬８進７」之传统记谱。
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto text-xs">
                  {recordedMoves.map((m, idx) => {
                    const stepNum = idx + 1;
                    const isCurrentStep = stepNum === currentStep;
                    const isPassed = stepNum <= currentStep;
                    return (
                      <button
                        key={`move-${idx}`}
                        type="button"
                        onClick={() => handleScrubStep(stepNum)}
                        className={`px-2 py-0.5 rounded font-serif-sc transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                          isCurrentStep
                            ? 'bg-[#2E1F18] border-[#D4AF37] text-[#F4EFE6] font-bold'
                            : isPassed
                            ? 'bg-[#1B120E] border-[#2E2018] hover:border-[#52392B]'
                            : 'bg-[#120C09] border-transparent opacity-45 hover:opacity-80'
                        }`}
                      >
                        <span className="text-[#8C7A68] font-mono tabular-nums mr-1">
                          {stepNum}.
                        </span>
                        <span
                          className={
                            m.piece.camp === 'red' ? 'text-[#E25B4B]' : 'text-[#D4AF37]'
                          }
                        >
                          {m.notation}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 8. 棋局收藏/快照与「我的珍藏」列表 (localStorage 持久化) */}
          <div className="bg-[#150E0B] border border-[#2E2018] rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[#D4AF37]">
                捌 · 棋局收藏与我的珍藏 (BOARD SNAPSHOTS)
              </span>
              <span className="text-[11px] font-mono tabular-nums text-[#9C8976]">
                已藏 {savedSnapshots.length} 局
              </span>
            </div>

            {/* 保存快照输入与按钮 */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSnapshotName}
                onChange={(e) => setCustomSnapshotName(e.target.value)}
                placeholder="输入快照名称（留空自动按步数命名）"
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-md bg-[#1D130E] border border-[#34231A] text-[#F4EFE6] placeholder:text-[#786655] focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={handleSaveSnapshot}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#9E2A2B] hover:bg-[#B43233] text-[#F4EFE6] border border-[#D4AF37]/40 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {justSavedToast ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    已收入珍藏
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    收藏快照
                  </>
                )}
              </button>
            </div>

            {/* 我的珍藏列表 */}
            <div className="pt-1 border-t border-[#261A14]">
              <div className="text-[11px] font-medium text-[#C8A252] mb-2">
                我的珍藏 · 一键恢复对局进度
              </div>

              {savedSnapshots.length === 0 ? (
                <p className="text-xs text-[#8C7A68] py-2">
                  尚无收藏快照。点击上方「收藏快照」即可将当前盘面棋子、步数进度与棋谱序列持久化保存至本地浏览器。
                </p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                  {savedSnapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-[#1D130E] border border-[#34231A] hover:border-[#52392B] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F4EFE6] truncate">
                            {snap.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#9C8976] font-mono tabular-nums mt-0.5">
                          <span>
                            进度 {snap.currentStep}/{snap.recordedMoves.length} 着
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            存子 {snap.pieces.length} 枚
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{snap.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(snap)}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-[#2B1D16] hover:bg-[#3A271E] text-[#D4AF37] border border-[#D4AF37]/60 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <FolderOpen className="w-3 h-3" />
                          恢复
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          title="删除此条珍藏"
                          aria-label={`删除珍藏 ${snap.title}`}
                          className="p-1.5 rounded bg-[#140D0A] hover:bg-[#2E1616] text-[#9C8976] hover:text-[#E25B4B] border border-[#34231A] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* 第二屏：14枚红黑棋子全图鉴与微距结构解剖 */}
      <div id="piece-atlas">
        <PieceShowcasePanel
          craftStyle={craftStyle}
          fontScheme={fontScheme}
          useTraditionalChar={useTraditionalChar}
        />
      </div>

      {/* 第三屏：SVG 棋盘制式解构说明（九路十线、九宫米字格、十四星位折角花标、楚河汉界） */}
      <section
        id="svg-blueprint"
        className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 py-10 border-t border-[#3A281E]"
      >
        <div className="mb-6">
          <p className="text-xs tracking-[0.25em] text-[#C8A252] mb-2">
            03. 棋盘 SVG 几何制式与文化规制 · SVG BOARD SPECIFICATION
          </p>
          <h2 className="text-2xl font-bold text-[#F4EFE6]">
            九路十线 · 九宫米字 · 楚河汉界 · 十四星位折角花标
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#1F1612] border border-[#3E2B20] rounded-xl p-5">
            <h3 className="text-base font-bold text-[#D4AF37] mb-2">01. 九路十线（交点落子）</h3>
            <p className="text-xs text-[#C2B09C] leading-relaxed">
              严格区别于国际象棋的 8×8 黑白方格，中国象棋由 9 条纵线与 10 条横线相交构成 90 个交叉点。棋子落于「线之交点」，体现东方兵学「脉络枢纽、经纬纵横」的空间观。
            </p>
          </div>
          <div className="bg-[#1F1612] border border-[#3E2B20] rounded-xl p-5">
            <h3 className="text-base font-bold text-[#D4AF37] mb-2">02. 楚河汉界（断纵通边）</h3>
            <p className="text-xs text-[#C2B09C] leading-relaxed">
              第 4 横线与第 5 横线之间为鸿沟河界。除左右两翼边线（一、九路）上下贯通外，中间七条纵线在此断开，内置浅淡汉代水波纹与「楚河」「漢界」行楷榜书及「观棋不语」朱文印。
            </p>
          </div>
          <div className="bg-[#1F1612] border border-[#3E2B20] rounded-xl p-5">
            <h3 className="text-base font-bold text-[#D4AF37] mb-2">03. 南北九宫（米字斜线）</h3>
            <p className="text-xs text-[#C2B09C] leading-relaxed">
              南北中军各取四路至六路、纵深三线构成 3×3 九宫格，内绘虚实相间的米字斜交叉线，中宫交点嵌菱形暗金花钿，限定「帥/將」与「仕/士」的护卫疆域。
            </p>
          </div>
          <div className="bg-[#1F1612] border border-[#3E2B20] rounded-xl p-5">
            <h3 className="text-base font-bold text-[#D4AF37] mb-2">04. 十四星位（全花与半花）</h3>
            <p className="text-xs text-[#C2B09C] leading-relaxed">
              4 个炮位与 6 个中路兵卒位绘制完整四象限「直角折角花标」；而位于棋盘左右边线（第 1 路与第 9 路）的 4 个边兵/边卒位，严格遵循传统规制仅向棋盘内侧绘制「半花折角」。
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-auto py-6 px-6 border-t border-[#2B1D16] text-center text-xs text-[#8C7A68]">
        楚河漢界 · 中国象棋东方视觉设计系统 · SVG 矢量制式 + DOM 交叉点拓扑 + CSS 旋木阴刻渲染架构
      </footer>
    </div>
  );
}
