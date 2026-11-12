import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 中国象棋局面 AI 深度分析总结与最佳着法推荐接口
  app.post('/api/xiangqi/analyze', async (req, res) => {
    try {
      const { boardSummary, turn, lastMoveNotation, netScore, redWinRate, moveCount } = req.body;

      const turnText = turn === 'red' ? '红方（南军）' : '黑方（北军）';
      const prompt = `你是一位精通《橘中秘》《梅花谱》的中国象棋特级大师。请根据以下当前棋局状态，给出简短凝练的深度局面点评，并为当前执子方（${turnText}）推荐下一步最佳棋着。

当前对局信息：
- 当前步数：第 ${moveCount ?? 0} 着
- 上一着棋谱：${lastMoveNotation || '初阵整列'}
- 当前轮谁行棋：${turnText}
- 实时子力与位置净分差：${netScore >= 0 ? `红方领先 +${netScore}` : `黑方领先 ${netScore}`}（红方胜势占比 ${redWinRate}%）
- 棋盘在场棋子坐标分布：
${boardSummary}

请用典雅精炼的中国象棋术语输出 JSON 格式结果。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            '你是中国象棋国手级评注家。点评须简明扼要（总评不超过48字），分别指出红黑双方子力态势（如“红方中路得势，双车通联；黑方屏风马稳固，右翼待发”），并给出符合中国象棋传统四字记谱规范的下一步最佳着法（如“俥一平二”、“馬８進７”、“炮五進四”）及简短理由。',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              commentary: {
                type: Type.STRING,
                description: '对当前局面的简短文字点评（如：红方占据中路优势，黑方车马灵活）',
              },
              redPoint: {
                type: Type.STRING,
                description: '红方阵型与攻防要点简析（15字以内）',
              },
              blackPoint: {
                type: Type.STRING,
                description: '黑方阵型与攻防要点简析（15字以内）',
              },
              bestMove: {
                type: Type.STRING,
                description: '建议下一步最佳四字传统棋着（如：俥一平二、馬８進７）',
              },
              bestMoveReason: {
                type: Type.STRING,
                description: '该最佳棋着的战术意图（25字以内）',
              },
            },
            required: ['commentary', 'redPoint', 'blackPoint', 'bestMove', 'bestMoveReason'],
          },
        },
      });

      const text = (response.text ?? '{}').trim();
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'AI 棋局推演请求失败';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
