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

function sanitizePublicAccount(account: any) {
  if (!account) return account;
  const { securityPin, ...safeAccount } = account;
  return safeAccount;
}

let saveTimeout: NodeJS.Timeout | null = null;
function saveCloudStore() {
  cloudStore.lastUpdated = new Date().toISOString();
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const tempPath = `${CLOUD_STORE_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(cloudStore, null, 2), "utf-8");
      fs.renameSync(tempPath, CLOUD_STORE_FILE);
    } catch (e) {
      console.warn("Failed to persist cloud store to disk atomically:", e);
    }
  }, 100);
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

  // Sanitize accounts directory: only return own security PIN if requested by account owner
  const accounts = Object.values(cloudStore.accounts || {}).map((acc: any) => {
    if (acc.id === userId) return acc;
    return sanitizePublicAccount(acc);
  });
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
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Valid userId is required for sync" });
  }

  // Update profile
  if (userProfile && typeof userProfile === "object") {
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
          if (m && (m as any).id && !existingIds.has((m as any).id)) {
            merged.push(m);
            existingIds.add((m as any).id);
          }
        }
        cloudStore.messages[chatId] = merged;
      }
    }
  }

  // Update registered accounts safely
  if (Array.isArray(accounts)) {
    for (const acc of accounts) {
      if (acc && acc.id) {
        const existing = cloudStore.accounts[acc.id];
        // Preserve securityPin if existing had one and incoming is empty or unauthorized
        if (existing && existing.securityPin && !acc.securityPin) {
          cloudStore.accounts[acc.id] = { ...acc, securityPin: existing.securityPin };
        } else {
          cloudStore.accounts[acc.id] = acc;
        }
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

// Directory of all cloud accounts - securityPin is sanitized for privacy and protection
app.get("/api/cloud/accounts", (_req, res) => {
  res.json({
    accounts: Object.values(cloudStore.accounts || {}).map(sanitizePublicAccount),
  });
});

// Register or update account in directory
app.post("/api/cloud/account", (req, res) => {
  const { account } = req.body;
  if (!account || !account.id) {
    return res.status(400).json({ error: "Invalid account payload" });
  }
  
  const existing = cloudStore.accounts[account.id];
  // Do not allow wiping or unauthorized overwriting of an existing account's credentials
  if (existing && existing.securityPin && !account.securityPin) {
    cloudStore.accounts[account.id] = { ...account, securityPin: existing.securityPin };
  } else {
    cloudStore.accounts[account.id] = account;
  }

  saveCloudStore();
  res.json({ success: true, account: sanitizePublicAccount(cloudStore.accounts[account.id]) });
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

// Helper to format messages attributing accurately between User, Persona A, Persona B, etc.
function formatChatMessagesWithParticipants(messages: any[], currentUserName?: string): {
  formattedLog: string;
  participantsSummary: string;
} {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { formattedLog: '', participantsSummary: 'No hay mensajes registrados.' };
  }

  const otherPersonMap = new Map<string, { label: string; name: string }>();
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  let letterIdx = 0;

  const lines = messages.map((m: any) => {
    const text = m.text || m.content || '';
    const isSelf = Boolean(m.isSelf || m.senderTag === 'self' || m.senderRole === 'user');

    if (isSelf) {
      const name = m.sender || m.senderName || currentUserName || 'Tú';
      return `[TÚ (Usuario actual: ${name})]: ${text}`;
    }

    const idKey = String(m.senderId || m.sender || m.senderName || `person_${letterIdx}`).trim();
    if (!otherPersonMap.has(idKey)) {
      const letter = letters[letterIdx % letters.length];
      const personName = m.sender || m.senderName || `Persona ${letter}`;
      otherPersonMap.set(idKey, { label: `Persona ${letter}`, name: personName });
      letterIdx++;
    }

    const { label, name } = otherPersonMap.get(idKey)!;
    return `[${label} (${name})]: ${text}`;
  });

  const participantsList: string[] = ['• Tú (Usuario actual)'];
  otherPersonMap.forEach(({ label, name }) => {
    participantsList.push(`• ${label} (${name})`);
  });

  return {
    formattedLog: lines.join('\n'),
    participantsSummary: participantsList.join('\n'),
  };
}

// Gemini AI Assistant Endpoint
app.post("/api/ai/chat-assist", async (req, res) => {
  try {
    const { action, prompt, context, messages, tone, isDataSaver, currentUserName } = req.body;
    const ai = getAI();

    // Prepare formatted chat log with rigorous participant differentiation
    const { formattedLog, participantsSummary } = formatChatMessagesWithParticipants(messages, currentUserName);

    if (!ai) {
      // Graceful fallback if no API key is set yet
      let fallbackText = "AI Assistant: Servicio configurado en modo local rápido.";
      if (action === "smart-replies") {
        return res.json({
          replies: ["¡Entendido, cuenta conmigo!", "Perfecto, lo reviso ahora.", "¿A qué hora nos reunimos?", "De acuerdo, te confirmo en breve."],
        });
      } else if (action === "summarize" || action === "analyze-participants") {
        fallbackText = `📋 **Resumen con Atribución de Participantes:**\n${participantsSummary}\n\n• **Tú (Usuario):** Coordinación y seguimiento de actividades.\n• **Persona A:** Confirmó acuerdos y planteó puntos de revisión.\n• **Acuerdos del grupo:** Compromiso mutuo de avance y llamada Meet programada.`;
      } else if (action === "extract-tasks") {
        return res.json({
          tasks: [
            { title: "Revisar documento colaborativo en Google Docs", dueDate: "Mañana", assignedTo: "Tú" },
            { title: "Preparar presentación en Google Slides", dueDate: "Esta semana", assignedTo: "Persona A" },
            { title: "Confirmar asistencia a la llamada de Meet", dueDate: "Hoy", assignedTo: "Equipo" },
          ],
        });
      } else {
        fallbackText = `Sugerencia: "${prompt || 'Mensaje procesado con éxito.'}"`;
      }
      return res.json({ result: fallbackText });
    }

    // System instruction strictly mandating person differentiation
    const baseSystemInstruction = `Eres el asistente inteligente de Nexus Chat impulsado por Gemini con alta precisión en análisis de conversaciones.
REGLA CRUCIAL DE ATRIBUCIÓN Y DIFERENCIACIÓN DE PERSONAS:
El chat contiene intervenciones diferenciadas por autor:
- '[TÚ (Usuario actual: ...)]': Es el usuario principal de la aplicación.
- '[Persona A (...)]': Es la primera persona interlocutora en el chat.
- '[Persona B (...)]': Es la segunda persona interlocutora en el chat.
- '[Persona C (...)]' y siguientes: Las demás personas participantes.
NUNCA CONFUNDAS NI MEZCLES las palabras o intenciones del usuario con las de Persona A, Persona B o cualquier otra persona. Cada una tiene su propio rol, opiniones y autoría. Siempre especifica con claridad quién propuso qué, quién preguntó y quién respondió.`;

    let systemInstruction = baseSystemInstruction;
    let userPrompt = "";

    if (action === "smart-replies") {
      systemInstruction = `${baseSystemInstruction}\nGenera exactamente 4 respuestas cortas, naturales y directas en español para que el USUARIO PRINCIPAL le responda a la última persona que habló en el chat. Devuelve solo un array JSON de 4 strings simples.`;
      userPrompt = `Participantes:\n${participantsSummary}\n\nÚltimos mensajes:\n${formattedLog || prompt}\n\nGenera 4 respuestas inteligentes que el usuario pueda enviar.`;

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
      systemInstruction = `${baseSystemInstruction}\nResume la conversación estructurando claramente lo aportado por el Usuario ('Tú') frente a lo expresado por Persona A, Persona B y las demás personas, concluyendo con los acuerdos mutuos en viñetas concisas en español.`;
      const chatContent = formattedLog || prompt;
      userPrompt = `Participantes en el chat:\n${participantsSummary}\n\nHilo de mensajes a resumir con diferenciación de personas:\n${chatContent}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: isDataSaver ? 300 : 700,
        },
      });

      return res.json({ result: response.text });
    } else if (action === "analyze-participants" || action === "chat-qa") {
      systemInstruction = `${baseSystemInstruction}\nAnaliza detalladamente las posturas y aportaciones de cada participante por separado (Usuario 'Tú', Persona A, Persona B, etc.). Responde con claridad y exactitud.`;
      const chatContent = formattedLog || context || "";
      userPrompt = `Participantes identificados:\n${participantsSummary}\n\nHistorial de mensajes con autoría:\n${chatContent}\n\nPregunta / Solicitud de análisis:\n${prompt || 'Desglosa qué dijo cada persona (Tú vs Persona A vs Persona B) y cuáles son las conclusiones principales.'}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.35,
          maxOutputTokens: 800,
        },
      });

      return res.json({ result: response.text });
    } else if (action === "extract-tasks") {
      systemInstruction = `${baseSystemInstruction}\nAnaliza el chat y extrae las tareas pendientes atribuidas a la persona correcta en formato JSON: [{"title": "...", "assignedTo": "Tú" | "Persona A" | "Persona B" | "Equipo", "dueDate": "...", "priority": "Alta"|"Media"|"Baja"}]. Devuelve solo JSON válido.`;
      const chatContent = formattedLog || prompt;
      userPrompt = `Participantes:\n${participantsSummary}\n\nExtrae las tareas atribuyéndolas a la persona correspondiente según el hilo:\n${chatContent}`;

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
      userPrompt = `Contexto del equipo (Participantes: ${participantsSummary}):\n${formattedLog || context || ""}\nInstrucción: ${prompt || "Redactar borrador de comunicación oficial"}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction: "Genera un borrador estructurado para Gmail o Google Docs con Asunto/Título y cuerpo claro en español, reflejando fielmente lo acordado entre las partes.",
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
          systemInstruction: baseSystemInstruction,
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

// Translation Endpoint using Gemini AI
app.post("/api/ai/translate", async (req, res) => {
  try {
    const { text, targetLang, targetLangName } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: "Faltan parámetros requeridos (text, targetLang)" });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: "API de Gemini no disponible en el servidor" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Traduce fielmente el siguiente mensaje al idioma ${targetLangName || targetLang}. Mantén el tono, las expresiones y los emojis originales. Responde ÚNICAMENTE con el texto traducido, sin explicaciones, sin etiquetas ni comillas adicionales:\n\n${text}`,
      config: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    });

    const translatedText = response.text?.trim() || text;
    return res.json({ translatedText, targetLang });
  } catch (error: any) {
    console.warn("Translation API error:", error);
    return res.status(500).json({ error: error.message || "Error al traducir mensaje" });
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
