import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Enable CORS for cross-origin requests from GitHub Pages or preview domains
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "15mb" }));

// Persistent Cloud Store for cross-device synchronization
const CLOUD_STORE_FILE = path.join(process.cwd(), "cloud_storage.json");

interface CloudDataStore {
  users: Record<string, any>;
  chats: Record<string, any[]>;
  messages: Record<string, any[]>;
  accounts: Record<string, any>;
  callLogs: Record<string, any[]>;
  workspace: Record<string, any[]>;
  lastUpdated: string;
}

let cloudStore: CloudDataStore = {
  users: {},
  chats: {},
  messages: {},
  accounts: {},
  callLogs: {},
  workspace: {},
  lastUpdated: new Date().toISOString(),
};

// Load existing store from disk if present
try {
  if (fs.existsSync(CLOUD_STORE_FILE)) {
    const raw = fs.readFileSync(CLOUD_STORE_FILE, "utf-8");
    cloudStore = JSON.parse(raw);
    console.log("Loaded cloud store from disk with", Object.keys(cloudStore.chats).length, "chat groups");
  }
} catch (e) {
  console.warn("Could not load cloud store from disk, starting fresh:", e);
}

function saveCloudStore() {
  try {
    cloudStore.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CLOUD_STORE_FILE, JSON.stringify(cloudStore, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to persist cloud store to disk:", e);
  }
}

// -------------------------------------------------------------
// Cloud Sync Endpoints (Cross-Device Sync for all data)
// -------------------------------------------------------------

// Fetch synced state for a user (chats, messages, profile, directory)
app.get("/api/cloud/sync/:userId", (req, res) => {
  const { userId } = req.params;
  const userProfile = cloudStore.users[userId] || null;
  const userChats = cloudStore.chats[userId] || [];
  
  // Collect all messages for user's chats
  const chatMessages: Record<string, any[]> = {};
  for (const c of userChats) {
    if (c.id && cloudStore.messages[c.id]) {
      chatMessages[c.id] = cloudStore.messages[c.id];
    }
  }

  const accounts = Object.values(cloudStore.accounts || {});
  const callLogs = cloudStore.callLogs[userId] || [];
  const workspaceItems = cloudStore.workspace[userId] || [];

  res.json({
    success: true,
    userProfile,
    chats: userChats,
    messages: chatMessages,
    accounts,
    callLogs,
    workspaceItems,
    serverTime: new Date().toISOString(),
    lastUpdated: cloudStore.lastUpdated,
  });
});

// Full state sync from client to cloud
app.post("/api/cloud/sync", (req, res) => {
  const { userId, userProfile, chats, messages, accounts, callLogs, workspaceItems } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required for sync" });
  }

  // Update profile
  if (userProfile) {
    cloudStore.users[userId] = {
      ...cloudStore.users[userId],
      ...userProfile,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  // Update user's chats list
  if (Array.isArray(chats)) {
    cloudStore.chats[userId] = chats;
  }

  // Update messages per chat
  if (messages && typeof messages === "object") {
    for (const [chatId, msgList] of Object.entries(messages)) {
      if (Array.isArray(msgList)) {
        const existing = cloudStore.messages[chatId] || [];
        const existingIds = new Set(existing.map((m: any) => m.id));
        const merged = [...existing];
        
        for (const m of msgList) {
          if (!existingIds.has((m as any).id)) {
            merged.push(m);
            existingIds.add((m as any).id);
          }
        }
        cloudStore.messages[chatId] = merged;
      }
    }
  }

  // Update registered accounts
  if (Array.isArray(accounts)) {
    for (const acc of accounts) {
      if (acc.id) {
        cloudStore.accounts[acc.id] = acc;
      }
    }
  }

  if (Array.isArray(callLogs)) {
    cloudStore.callLogs[userId] = callLogs;
  }

  if (Array.isArray(workspaceItems)) {
    cloudStore.workspace[userId] = workspaceItems;
  }

  saveCloudStore();
  res.json({ success: true, timestamp: cloudStore.lastUpdated });
});

// Sync a single new message immediately
app.post("/api/cloud/message", (req, res) => {
  const { message, recipientUserIds } = req.body;
  if (!message || !message.chatId || !message.id) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  const chatId = message.chatId;
  const existing = cloudStore.messages[chatId] || [];
  
  // Deduplicate
  const idx = existing.findIndex((m: any) => m.id === message.id);
  if (idx >= 0) {
    existing[idx] = message;
  } else {
    existing.push(message);
  }
  cloudStore.messages[chatId] = existing;

  // Also ensure chat's lastMessage is updated across all members
  const memberIds: string[] = Array.isArray(recipientUserIds) ? recipientUserIds : [];
  if (message.senderId && !memberIds.includes(message.senderId)) {
    memberIds.push(message.senderId);
  }

  for (const uid of memberIds) {
    const userChats = cloudStore.chats[uid];
    if (Array.isArray(userChats)) {
      const cIdx = userChats.findIndex((c: any) => c.id === chatId);
      if (cIdx >= 0) {
        userChats[cIdx].lastMessage = message;
      }
    }
  }

  saveCloudStore();
  res.json({ success: true, message, timestamp: new Date().toISOString() });
});

// Directory of all cloud accounts
app.get("/api/cloud/accounts", (_req, res) => {
  res.json({
    accounts: Object.values(cloudStore.accounts || {}),
  });
});

// Register or update account in directory
app.post("/api/cloud/account", (req, res) => {
  const { account } = req.body;
  if (!account || !account.id) {
    return res.status(400).json({ error: "Invalid account payload" });
  }
  cloudStore.accounts[account.id] = account;
  saveCloudStore();
  res.json({ success: true, account });
});

// Lazy AI Client Initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Gemini AI Assistant Endpoint
app.post("/api/ai/chat-assist", async (req, res) => {
  try {
    const { action, prompt, context, messages, tone, isDataSaver } = req.body;
    const ai = getAI();

    if (!ai) {
      // Graceful fallback if no API key is set yet
      let fallbackText = "AI Assistant: Servicio configurado en modo local rápido.";
      if (action === "smart-replies") {
        return res.json({
          replies: ["¡Entendido, cuenta conmigo!", "Perfecto, lo reviso ahora.", "¿A qué hora nos reunimos?", "De acuerdo, te confirmo en breve."],
        });
      } else if (action === "summarize") {
        fallbackText = "Resumen del chat:\n• Acuerdos de equipo confirmados\n• Se definieron tareas clave de colaboración\n• Enlace de Google Meet listo para la próxima sesión";
      } else if (action === "extract-tasks") {
        return res.json({
          tasks: [
            { title: "Revisar documento colaborativo en Google Docs", dueDate: "Mañana" },
            { title: "Preparar presentación en Google Slides", dueDate: "Esta semana" },
            { title: "Confirmar asistencia a la llamada de Meet", dueDate: "Hoy" },
          ],
        });
      } else {
        fallbackText = `Sugerencia: "${prompt || 'Mensaje procesado con éxito.'}"`;
      }
      return res.json({ result: fallbackText });
    }

    // Build system instructions and prompt based on action
    let systemInstruction = "Eres un asistente de comunicación ejecutiva y colaboración de equipos en Nexus Chat.";
    let userPrompt = "";

    if (action === "smart-replies") {
      systemInstruction = "Genera exactamente 4 respuestas cortas, naturales y directas en español para el último mensaje del chat. Devuelve solo un array JSON de 4 strings simples.";
      const lastMessages = Array.isArray(messages) ? messages.slice(-5).map((m: any) => `${m.sender}: ${m.text}`).join("\n") : (prompt || "");
      userPrompt = `Mensajes recientes:\n${lastMessages}\nGenera 4 respuestas rápidas adecuadas para responder.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      try {
        const parsed = JSON.parse(response.text || "[]");
        return res.json({ replies: Array.isArray(parsed) ? parsed.slice(0, 4) : [response.text] });
      } catch {
        return res.json({
          replies: ["¡Enterado!", "Perfecto, gracias.", "Lo reviso ahora mismo.", "Hablemos por Google Meet."],
        });
      }
    } else if (action === "summarize") {
      systemInstruction = "Eres un sintetizador ultra-eficiente de equipos. Resume la conversación del chat en 3 viñetas concisas con decisiones, acuerdos y próximos pasos clave en español.";
      const chatLog = Array.isArray(messages) ? messages.map((m: any) => `[${m.sender}]: ${m.text}`).join("\n") : prompt;
      userPrompt = `Resume este hilo de mensajes de equipo:\n${chatLog}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: isDataSaver ? 250 : 600,
        },
      });

      return res.json({ result: response.text });
    } else if (action === "extract-tasks") {
      systemInstruction = "Analiza el chat y extrae tareas accionables para el equipo en formato JSON: [{\"title\": \"...\", \"dueDate\": \"...\", \"priority\": \"Alta\"|\"Media\"|\"Baja\"}]. Devuelve solo JSON válido.";
      const chatLog = Array.isArray(messages) ? messages.map((m: any) => `[${m.sender}]: ${m.text}`).join("\n") : prompt;
      userPrompt = `Extrae las tareas pendientes de este chat:\n${chatLog}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      try {
        const tasks = JSON.parse(response.text || "[]");
        return res.json({ tasks });
      } catch {
        return res.json({ tasks: [] });
      }
    } else if (action === "rewrite-tone") {
      const toneLabel = tone === "formal" ? "formal y profesional" : tone === "concise" ? "ultra conciso y directo (ahorro de texto)" : "amigable y colaborativo";
      userPrompt = `Reescribe este borrador de mensaje en un tono ${toneLabel}, manteniendo el significado exacto:\n"${prompt}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction: "Reescribe el texto de acuerdo con las especificaciones. Responde ÚNICAMENTE con el texto reescrito, sin introducciones ni comillas adicionales.",
          temperature: 0.4,
        },
      });

      return res.json({ result: response.text?.trim() });
    } else if (action === "draft-email-or-doc") {
      userPrompt = `Contexto del equipo:\n${context || ""}\nInstrucción: ${prompt || "Redactar borrador de comunicación oficial"}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction: "Genera un borrador estructurado para Gmail o Google Docs con Asunto/Título y cuerpo claro en español.",
          temperature: 0.5,
        },
      });
      return res.json({ result: response.text });
    } else {
      // General Gemini query
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "Eres el asistente inteligente de Nexus Chat. Responde con claridad, precisión y formato limpio.",
          temperature: 0.6,
        },
      });
      return res.json({ result: response.text });
    }
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return res.status(500).json({ error: error.message || "Error procesando con IA" });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus Chat & Team Hub running on port ${PORT}`);
  });
}

startServer();
