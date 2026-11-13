import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize server-side Gemini client with user-agent for telemetry as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint to provide the Google Maps API Key to the frontend
app.get('/api/maps/config', (_req, res) => {
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  res.json({ apiKey });
});

// Server-side Maps Grounding with Gemini 3.8 Flash
app.post('/api/maps/grounding', async (req, res) => {
  try {
    const { prompt, location } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config,
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      success: true,
      text,
      groundingChunks,
    });
  } catch (err: any) {
    console.error('Error in Maps Grounding:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Falha ao processar consulta com Google Maps Grounding.',
    });
  }
});

// Server-side WhatsApp Smart Replies powered by Gemini 4 Hydrogen
app.post('/api/whatsapp/smart-replies', async (req, res) => {
  try {
    const {
      atelierName,
      clientName,
      serviceName,
      tone,
      customInstructions,
      chatHistory,
      extraGoal,
    } = req.body;

    if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'O histórico de conversa do cliente é obrigatório para gerar sugestões contextuais.',
      });
    }

    const toneDescriptions: Record<string, string> = {
      cordial: 'cordial, acolhedor, educado e atencioso',
      profissional: 'profissional, polido, claro e objetivo',
      descontraido: 'descontraído, amigável e moderno, no estilo de barbearia/atelier premium sem perder o respeito',
      direto: 'curto, rápido, prático e direto ao ponto',
    };

    const toneDesc = toneDescriptions[tone || 'cordial'] || toneDescriptions.cordial;

    const formattedHistory = chatHistory
      .map((msg: { direction: string; text: string; timestamp?: number }) => {
        const sender = msg.direction === 'inbound' ? `Cliente (${clientName || 'Cliente'})` : `Estabelecimento (${atelierName || 'Atelier'})`;
        return `- ${sender}: "${msg.text}"`;
      })
      .join('\n');

    const systemInstruction = `Você é um assistente especialista em atendimento ao cliente via WhatsApp para o estabelecimento "${atelierName || 'Barbearia / Atelier'}".
Sua tarefa é analisar o histórico recente do chat com o cliente e sugerir 3 respostas contextuais prontas para envio no WhatsApp, escritas em Português do Brasil.
Regras:
- Tom de voz obrigatório: ${toneDesc}.
- Seja natural, útil e adaptado ao contexto real da conversa (ex: se o cliente pediu atraso, responda sobre tolerância ou reagendamento; se perguntou preço ou Pix, responda claramente; se confirmou, agradeça com simpatia).
- Use formatação leve de WhatsApp quando fizer sentido (*negrito* pontual e no máximo 1-2 emojis discretos), mantendo mensagens concisas e prontas para enviar.
- Cada uma das 3 sugestões deve oferecer uma abordagem levemente distinta (ex: Sugestão 1: Resposta principal recomendada; Sugestão 2: Alternativa proativa/flexível; Sugestão 3: Versão rápida e objetiva).
${customInstructions ? `- Instruções específicas do administrador do estabelecimento: ${customInstructions}` : ''}`;

    const prompt = `Cliente: ${clientName || 'Cliente'}
Serviço associado: ${serviceName || 'Não especificado'}
${extraGoal ? `Objetivo adicional do atendente para esta resposta: ${extraGoal}\n` : ''}
Histórico da conversa no WhatsApp (do mais antigo para o mais recente):
${formattedHistory}

Analise a conversa acima e retorne a intenção detectada, o nível de urgência, um resumo breve do contexto em 1 frase e exatamente 3 sugestões de resposta contextual.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedIntent: {
              type: Type.STRING,
              description: 'Intenção principal detectada na última mensagem ou contexto do cliente em português.',
            },
            urgency: {
              type: Type.STRING,
              description: 'Nível de urgência da resposta: baixa, media ou alta.',
            },
            summary: {
              type: Type.STRING,
              description: 'Resumo curto (1 frase) do que o cliente precisa.',
            },
            suggestions: {
              type: Type.ARRAY,
              description: 'Exatamente 3 sugestões contextuais de resposta para WhatsApp.',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: {
                    type: Type.STRING,
                    description: 'Rótulo curto da estratégia de resposta (máx 4 palavras, ex: Confirmar tolerância).',
                  },
                  tone: {
                    type: Type.STRING,
                    description: 'Estilo da sugestão (ex: Recomendada, Flexível, Rápida).',
                  },
                  text: {
                    type: Type.STRING,
                    description: 'Texto completo pronto para envio no WhatsApp.',
                  },
                },
                required: ['id', 'label', 'tone', 'text'],
              },
            },
          },
          required: ['detectedIntent', 'urgency', 'summary', 'suggestions'],
        },
      },
    });

    const rawText = (response.text || '{}').trim();
    const parsed = JSON.parse(rawText);

    const normalizedUrgency =
      parsed.urgency === 'alta' || parsed.urgency === 'media' || parsed.urgency === 'baixa'
        ? parsed.urgency
        : 'media';

    res.json({
      success: true,
      analysis: {
        detectedIntent: parsed.detectedIntent || 'Atendimento ao cliente',
        urgency: normalizedUrgency,
        summary: parsed.summary || 'Análise contextual concluída.',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
      },
    });
  } catch (err: any) {
    console.error('Error in WhatsApp Smart Replies:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Não foi possível gerar sugestões inteligentes via IA no momento.',
    });
  }
});

// ==========================================
// REAL-TIME QUEUE & PUSH NOTIFICATION SYSTEM
// ==========================================

export interface RealtimeQueueEvent {
  id: string;
  atelierId: string;
  type: 'you_are_next' | 'slot_opened' | 'chair_called' | 'queue_updated' | 'new_client_joined';
  targetClientPhone?: string;
  targetClientName?: string;
  title: string;
  message: string;
  timestamp: number;
  data?: any;
}

// In-memory ring buffer of events for polling and reconnect recovery
const recentEvents: RealtimeQueueEvent[] = [];
const sseClients = new Map<string, Set<express.Response>>();
const wsClients = new Map<string, Set<WebSocket>>();

function broadcastEvent(event: RealtimeQueueEvent) {
  recentEvents.push(event);
  if (recentEvents.length > 200) {
    recentEvents.shift();
  }

  // 1. Broadcast to WebSockets
  const sockets = wsClients.get(event.atelierId);
  if (sockets) {
    const payload = JSON.stringify({ type: 'event', event });
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          console.error('[WS] Send error:', e);
        }
      }
    }
  }

  // 2. Broadcast to SSE clients
  const sseResponses = sseClients.get(event.atelierId);
  if (sseResponses) {
    const sseData = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of sseResponses) {
      try {
        res.write(sseData);
      } catch (e) {
        console.error('[SSE] Write error:', e);
      }
    }
  }

  console.log(`[Realtime Broadcast] Atelier: ${event.atelierId} | Type: ${event.type} | Title: "${event.title}"`);
}

// REST endpoint to broadcast real-time queue events (called by admin or system actions)
app.post('/api/queue/events', (req, res) => {
  const { atelierId, type, targetClientPhone, targetClientName, title, message, data } = req.body;

  if (!atelierId || !type) {
    return res.status(400).json({ error: 'atelierId e type são obrigatórios.' });
  }

  const event: RealtimeQueueEvent = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    atelierId,
    type,
    targetClientPhone,
    targetClientName,
    title: title || 'Atualização da Fila',
    message: message || '',
    timestamp: Date.now(),
    data,
  };

  broadcastEvent(event);
  res.json({ success: true, event });
});

// Polling fallback endpoint (returns events since a given timestamp)
app.get('/api/queue/poll', (req, res) => {
  const atelierId = req.query.atelierId as string;
  const since = Number(req.query.since || 0);

  if (!atelierId) {
    return res.status(400).json({ error: 'atelierId é obrigatório.' });
  }

  const matched = recentEvents.filter(
    (e) => e.atelierId === atelierId && e.timestamp > since
  );

  res.json({
    success: true,
    events: matched,
    now: Date.now(),
  });
});

// Server-Sent Events (SSE) stream endpoint for real-time connection
app.get('/api/queue/stream', (req, res) => {
  const atelierId = (req.query.atelierId as string) || 'default';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(atelierId)) {
    sseClients.set(atelierId, new Set());
  }
  const clients = sseClients.get(atelierId)!;
  clients.add(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', atelierId, timestamp: Date.now() })}\n\n`);

  // Heartbeat ping every 25 seconds
  const interval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(interval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(interval);
    clients.delete(res);
  });
});

// Mount Vite middleware for dev or serve static files in production
async function startServer() {
  const server = http.createServer(app);

  // Initialize WebSocket Server on same port and HTTP server
  const wss = new WebSocketServer({ server, path: '/ws/queue' });

  wss.on('connection', (ws, req) => {
    let currentAtelierId = 'default';

    // Read atelierId from URL query param if present
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const paramAtelier = url.searchParams.get('atelierId');
      if (paramAtelier) {
        currentAtelierId = paramAtelier;
      }
    } catch (e) {
      // ignore
    }

    if (!wsClients.has(currentAtelierId)) {
      wsClients.set(currentAtelierId, new Set());
    }
    wsClients.get(currentAtelierId)!.add(ws);

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Conectado ao serviço de fila em tempo real (WebSocket)',
      atelierId: currentAtelierId,
      timestamp: Date.now(),
    }));

    // Handle messages (e.g. subscribe to different atelier)
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'subscribe' && msg.atelierId) {
          // Remove from old
          wsClients.get(currentAtelierId)?.delete(ws);
          currentAtelierId = msg.atelierId;
          if (!wsClients.has(currentAtelierId)) {
            wsClients.set(currentAtelierId, new Set());
          }
          wsClients.get(currentAtelierId)!.add(ws);
          ws.send(JSON.stringify({ type: 'subscribed', atelierId: currentAtelierId }));
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (err) {
        // ignore invalid json
      }
    });

    ws.on('close', () => {
      wsClients.get(currentAtelierId)?.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('[WS Client Error]:', err.message);
      wsClients.get(currentAtelierId)?.delete(ws);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: Number(PORT) },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server with WebSockets and Real-time Queue running on http://localhost:${PORT}`);
  });
}

startServer();
