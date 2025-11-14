import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import path from "path";
import os from "os";
import { CodeIndexer } from "./codeIndexer.js";
import { initModels } from "../models/initModels.js";
import { sequelize } from "../config/database.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiAppSingleton = null;
let aiServer = null;
let indexer = null;
let genAI = null;

function getAllowedOrigins() {
  const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
  const add = (process.env.ADDITIONAL_CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [FRONTEND, ...add];
}

function getProjectRoot() {
  // packages/backend/ai -> projectRoot = repoRoot
  return path.resolve(__dirname, "../../..");
}

function describeModels() {
  try {
    // Ensure models initialized
    initModels?.();
    const models = sequelize.models || {};
    const lines = [];
    for (const [name, model] of Object.entries(models)) {
      const attrs = model.rawAttributes || {};
      const cols = Object.keys(attrs).map((k) => {
        const type = attrs[k]?.type?.constructor?.name || attrs[k]?.type || "unknown";
        return `${k}: ${type}`;
      });
      lines.push(`Model ${name}:\n  Fields: ${cols.join(", ")}`);
    }
    return lines.join("\n\n");
  } catch (e) {
    console.error("[AI] Error describing models:", e);
    return "";
  }
}

function describeProject() {
  return `
Fitnexus – Nền tảng hỗ trợ tập luyện và dinh dưỡng

Kiến trúc Backend:
- Express.js (ES Modules), bảo mật bằng Helmet, CORS, morgan logs
- PostgreSQL + Sequelize ORM, mô hình hóa dữ liệu rõ ràng
- Xác thực: JWT + Passport session (Google OAuth)
- Upload tệp: Multer (tích hợp Cloudinary)
- Thanh toán: PayOS (tạo link, xác minh, webhook)
- Tác vụ nền: cron cho hết hạn gói tập

Tính năng chính:
1) Người dùng: đăng ký/đăng nhập, hồ sơ, phân quyền (user/trainer/admin)
2) Gói tập (Subscription): mua, gia hạn, theo dõi trạng thái
3) Kế hoạch tập (Plans/Workout): tạo, thêm bài tập, sắp xếp, theo dõi buổi tập
4) Dinh dưỡng (Nutrition): gợi ý kế hoạch dựa trên onboarding
5) Thông báo: realtime/Email, đánh dấu đã đọc
6) Quản trị: người dùng, doanh thu, nội dung

Kiến trúc Frontend:
- React + Vite, React Router, TailwindCSS, Icons (Lucide)
- API client: Axios (kèm refresh token)

Cấu trúc thư mục nổi bật:
- packages/backend: config, models, routes, middleware, services, ai
- packages/frontend: src/components, src/pages, src/lib, src/context
`;
}

export function createAiExpressApp() {
  if (aiAppSingleton) return aiAppSingleton;
  const app = express();

  app.use(express.json({ limit: "200kb" }));
  app.use(express.urlencoded({ extended: true, limit: "200kb" }));
  app.use(helmet());
  app.use(cors({ origin: getAllowedOrigins(), credentials: true }));
  if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

  if (process.env.GEMINI_API_KEY) {
    try {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log("[AI] Gemini API initialized");
    } catch (e) {
      console.error("[AI] Failed to initialize Gemini:", e);
    }
  } else {
    console.warn("[AI] GEMINI_API_KEY not set - AI will run in limited mode");
  }

  if (!indexer) {
    const projectRoot = getProjectRoot();
    indexer = new CodeIndexer({ rootDir: projectRoot });
    setImmediate(() => {
      try {
        indexer.build();
        console.log(`[AI] Indexed codebase: ${indexer.chunks.length} chunks`);
      } catch (e) {
        console.error("[AI] Index build error:", e);
      }
    });
  }

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      service: "ai",
      status: "ok",
      hostname: os.hostname(),
      gemini: !!genAI,
      index: indexer ? indexer.getStatus() : { ready: false },
    });
  });

  const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 8, // tối đa 8 yêu cầu/phút mỗi IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Quá nhiều yêu cầu chat. Vui lòng thử lại sau.",
    },
  });

  app.post("/chat", chatLimiter, async (req, res) => {
    const { message: rawMessage = "", history = [] } = req.body || {};
    let message = rawMessage;
    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "message is required" });
    }

    function levenshtein(a, b) {
      a = String(a || "");
      b = String(b || "");

      const m = a.length;
      const n = b.length;

      // nếu 1 trong 2 rỗng
      if (m === 0) return n;
      if (n === 0) return m;

      // tạo ma trận (n+1) cột
      const dp = Array.from({ length: n + 1 }, () => new Array(m + 1));

      // khởi tạo hàng 0, cột 0
      for (let i = 0; i <= m; i++) dp[0][i] = i;
      for (let j = 0; j <= n; j++) dp[j][0] = j;

      for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= m; i++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;

          dp[j][i] = Math.min(
            dp[j][i - 1] + 1, // insert
            dp[j - 1][i] + 1, // delete
            dp[j - 1][i - 1] + cost // replace
          );
        }
      }

      return dp[n][m];
    }

    const keywords = [
      "streak",
      "ai trainer",
      "nutrition",
      "subscription",
      "profile",
      "workout",
      "challenge",
      "plan",
      "meal",
      "history",
      // 3D modeling related
      "model3d",
      "3d",
      "3d model",
      "mô hình 3d",
      "modeling 3d",
    ];

    function resolveKeyword(input) {
      input = input.toLowerCase().trim();

      // exact match
      if (keywords.includes(input)) return input;

      // quick contains checks for 3D/modeling phrases
      const k3d = [
        "model3d",
        "3d model",
        "mô hình 3d",
        "mo hinh 3d",
        "modeling 3d",
        "3d",
      ];
      for (const k of k3d) {
        if (input.includes(k)) return "model3d";
      }

      // fuzzy match (approximate)
      let best = null;
      let bestScore = Infinity;

      for (const key of keywords) {
        const score = levenshtein(input, key);
        if (score < bestScore) {
          best = key;
          bestScore = score;
        }
      }

      // threshold: nếu sai chính tả nhẹ (khoảng cách <= 3 ký tự)
      if (bestScore <= 3) return best;

      return null;
    }

    const resolved = resolveKeyword(message, keywords);
    if (resolved) {
      message = `Người dùng hỏi: "${message}". Hệ thống xác định họ đang muốn nói về tính năng: "${resolved}".`;
    }

    const is3D =
      resolved === "model3d" ||
      ["3d", "3d model", "mô hình 3d", "modeling 3d"].includes(resolved);
    const top = indexer?.search(message, 8) || [];
    const contextBlocks = top.map((ch) => ch.text.substring(0, 800));

    const dbDesc = describeModels();
    const projDesc = describeProject();

    const systemPrompt = `Bạn là trợ lý AI cho ứng dụng Fitnexus (tập luyện, dinh dưỡng, kế hoạch tập, quản trị).

Yêu cầu trả lời:
- Ngắn gọn, dễ hiểu, tập trung vào: tính năng, cách thao tác, lợi ích cho người dùng.
- Trả lời bằng tiếng Việt , xuống dòng rõ ràng.
- Không dùng markdown: không dùng *, **, -, _, #.
- Nếu cần liệt kê, dùng bullet "•".
- Nếu thiếu dữ liệu, hãy nói rõ chưa có thông tin chi tiết và đưa ra hướng dẫn tổng quát.
- Không nhắc đến đường dẫn/tên file/thư mục, chi tiết mã nguồn hay tên bảng DB cụ thể.

Ngữ cảnh hệ thống (tóm tắt dự án):
${projDesc}

Mô hình dữ liệu (Sequelize Models, rút gọn):
${dbDesc || "(Không lấy được mô tả mô hình)"}
`;

    const systemPromptFinal = is3D
      ? `${systemPrompt}

Ghi chú về tính năng Mô hình 3D:
• Cho phép xem mô hình cơ thể người 3D, xoay/zoom để quan sát.
• Chọn nhóm cơ trực tiếp trên mô hình để xem bài tập liên quan (primary/secondary).
• Có chế độ xem thử; khi đăng nhập sẽ đầy đủ chức năng.
• Cách truy cập: mở mục "Mô hình 3D/Modeling 3D" trong ứng dụng và làm theo hướng dẫn trên màn hình.
`
      : systemPrompt;

    const userPromptWithContext = `${message}

Ngữ cảnh mã liên quan (top matches):
${contextBlocks.join("\n\n")}`;

    try {
      if (genAI) {
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        });

        const chatHistory = history.slice(-6).map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: systemPromptFinal }] },
            {
              role: "model",
              parts: [
                {
                  text: "Đã hiểu. Mình là trợ lý AI của Fitnexus và sẵn sàng hỗ trợ!",
                },
              ],
            },
            ...chatHistory,
          ],
        });

        const result = await chat.sendMessage(userPromptWithContext);
        let reply =
          result.response.text() || "Xin lỗi, mình chưa tạo được phản hồi.";
        reply = reply
          // bỏ **bold**
          .replace(/\*\*(.+?)\*\*/g, "$1")
          // đổi "- " đầu dòng thành bullet • (phòng khi nó vẫn dùng -)
          .replace(/^- /gm, "• ")
          // nếu vẫn còn sót dấu * lẻ, xoá luôn (tuỳ ông)
          .replace(/\*/g, "");
        return res.json({ success: true, data: { reply } });
      }

      // Fallback: return a heuristic answer with matched files
      const reply = top.length
        ? `Chưa cấu hình GEMINI_API_KEY nên mình chỉ có thể liệt kê các tệp liên quan (tham khảo):

${top.map((c, i) => `${i + 1}. ${c.path}`).join("\n")}

Để bật AI đầy đủ:
1) Lấy API key tại: https://makersuite.google.com/app/apikey
2) Thêm vào .env: GEMINI_API_KEY=your_key_here
3) (Tuỳ chọn) GEMINI_MODEL=gemini-1.5-flash`
        : `Chưa cấu hình GEMINI_API_KEY và không tìm thấy đoạn mã liên quan.

Hãy đặt biến môi trường GEMINI_API_KEY để kích hoạt tính năng AI.`;

      return res.json({ success: true, data: { reply } });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[AI] chat error:", err);
      return res.status(500).json({
        success: false,
        message: "AI chat error",
        error: String(err?.message || err),
      });
    }
  });

  aiAppSingleton = app;
  return app;
}

export function ensureAiApp() {
  return createAiExpressApp();
}

export function startAiServer() {
  if (aiServer) return aiServer;
  if (process.env.RENDER === "true") {
    // eslint-disable-next-line no-console
    console.log(
      "[AI] Render environment detected; using /api/ai route, standalone AI server disabled."
    );
    return null;
  }
  const app = ensureAiApp();
  const aiPort = parseInt(process.env.AI_PORT || "3002", 10);
  aiServer = http.createServer(app);
  aiServer.listen(aiPort, () => {
    // eslint-disable-next-line no-console
    console.log(`AI server is running on http://localhost:${aiPort}`);
  });
  aiServer.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[AI] server error:", err);
  });
  return aiServer;
}

