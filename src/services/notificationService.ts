// Real-time Queue & Push Notification Service
// Provides WebSocket connection, Server-Sent Events/polling fallback, Web Push Notifications, audio chime, and mobile vibration.

export interface PushNotificationPayload {
  title: string;
  body: string;
  type?: 'you_are_next' | 'slot_opened' | 'chair_called' | 'new_client_joined' | 'general';
  timestamp?: number;
}

export interface RealtimeServerEvent {
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

// 1. Audio Chime via Web Audio API (cross-platform, zero asset dependency)
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // Tone 2 (higher note, pleasant barber shop notification bell)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

// 2. Mobile Device Vibration
export function triggerDeviceVibration(pattern: number[] = [200, 100, 200]) {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Ignore unsupported
  }
}

const OWNER_PUSH_PREF_KEY = 'estilo_owner_push_enabled';

// 3. Web Push Notification Permission & Triggering
export const pushNotificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  isOwnerAlertsEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const raw = localStorage.getItem(OWNER_PUSH_PREF_KEY);
    return raw === null ? true : raw === 'true';
  },

  setOwnerAlertsEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OWNER_PUSH_PREF_KEY, String(enabled));
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch (e) {
      console.warn('Falha ao solicitar permissão de notificações:', e);
      return 'denied';
    }
  },

  send(payload: PushNotificationPayload) {
    // 1. Play auditory chime & vibrate mobile device
    playNotificationChime();
    triggerDeviceVibration([250, 100, 250]);

    // 2. Dispatch in-app UI banner event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('estilo_push_notification', {
          detail: {
            ...payload,
            timestamp: payload.timestamp || Date.now(),
          },
        })
      );
    }

    // 3. Trigger native browser push notification if permitted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const uniqueTag =
          payload.type === 'new_client_joined'
            ? `new_client_${payload.timestamp || Date.now()}`
            : payload.type || 'estilo_queue';

        const notif = new Notification(payload.title, {
          body: payload.body,
          icon: '/COMPLETO.png',
          badge: '/COMPLETO.png',
          tag: uniqueTag,
          silent: false,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        // Auto close after 10 seconds
        setTimeout(() => notif.close(), 10000);
      } catch (err) {
        console.warn('Erro ao disparar notificação nativa:', err);
      }
    }
  },
};

// 4. Real-time Broadcast Dispatcher (Calls backend to notify all connected clients)
export async function broadcastRealtimeEvent(params: {
  atelierId: string;
  type: 'you_are_next' | 'slot_opened' | 'chair_called' | 'queue_updated' | 'new_client_joined';
  targetClientPhone?: string;
  targetClientName?: string;
  title: string;
  message: string;
  data?: any;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/queue/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.ok;
  } catch (err) {
    console.error('Erro ao transmitir evento de fila em tempo real:', err);
    return false;
  }
}

// 5. Real-time Queue Monitor (WebSocket with automatic polling/SSE fallback)
export class QueueRealtimeMonitor {
  private atelierId: string;
  private clientPhone?: string;
  private clientName?: string;
  private isOwner: boolean;
  private ws: WebSocket | null = null;
  private pollIntervalId: any = null;
  private sseSource: EventSource | null = null;
  private lastPollTimestamp = Date.now();
  private processedEventIds = new Set<string>();
  private isDestroyed = false;
  private onEventCallback?: (event: RealtimeServerEvent) => void;

  constructor(options: {
    atelierId: string;
    clientPhone?: string;
    clientName?: string;
    isOwner?: boolean;
    onEvent?: (event: RealtimeServerEvent) => void;
  }) {
    this.atelierId = options.atelierId;
    this.clientPhone = options.clientPhone;
    this.clientName = options.clientName;
    this.isOwner = Boolean(options.isOwner);
    this.onEventCallback = options.onEvent;

    this.connectWebSocket();
    this.startPollingFallback();
  }

  public updateClientInfo(phone?: string, name?: string) {
    this.clientPhone = phone;
    this.clientName = name;
  }

  private connectWebSocket() {
    if (this.isDestroyed || typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/queue?atelierId=${encodeURIComponent(this.atelierId)}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[QueueRealtimeMonitor] WebSocket conectado à fila em tempo real.');
        // Stop high-frequency polling while WS is alive (keep a slower safety heartbeat)
      };

      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'event' && data.event) {
            this.handleServerEvent(data.event);
          }
        } catch (err) {
          // ignore
        }
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          // Reconnect with delay
          setTimeout(() => this.connectWebSocket(), 4000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[QueueRealtimeMonitor] WS connection error, using polling fallback.');
        this.ws?.close();
      };
    } catch (e) {
      console.warn('[QueueRealtimeMonitor] Falha ao iniciar WebSocket:', e);
    }
  }

  // Efficient polling fallback every 4 seconds to guarantee updates even in restricted iFrames
  private startPollingFallback() {
    this.pollIntervalId = setInterval(async () => {
      if (this.isDestroyed) return;
      try {
        const res = await fetch(`/api/queue/poll?atelierId=${encodeURIComponent(this.atelierId)}&since=${this.lastPollTimestamp}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.now) {
          this.lastPollTimestamp = data.now;
        }
        if (Array.isArray(data.events) && data.events.length > 0) {
          for (const ev of data.events) {
            this.handleServerEvent(ev);
          }
        }
      } catch (e) {
        // network silent fail
      }
    }, 4000);
  }

  private handleServerEvent(event: RealtimeServerEvent) {
    if (event.id) {
      if (this.processedEventIds.has(event.id)) {
        return;
      }
      this.processedEventIds.add(event.id);
      if (this.processedEventIds.size > 300) {
        const firstId = this.processedEventIds.values().next().value;
        if (firstId) this.processedEventIds.delete(firstId);
      }
    }

    if (this.onEventCallback) {
      this.onEventCallback(event);
    }

    // Notify store to refresh
    window.dispatchEvent(new CustomEvent('estilo_store_updated'));

    const myPhoneNorm = (this.clientPhone || '').replace(/\D/g, '');
    const targetPhoneNorm = (event.targetClientPhone || '').replace(/\D/g, '');
    const isTargetPhone = myPhoneNorm && targetPhoneNorm && (myPhoneNorm.includes(targetPhoneNorm) || targetPhoneNorm.includes(myPhoneNorm));
    const isTargetName = this.clientName && event.targetClientName && 
      this.clientName.toLowerCase().trim() === event.targetClientName.toLowerCase().trim();

    const isForMe = isTargetPhone || isTargetName;

    // Check notification rules
    if (event.type === 'new_client_joined') {
      if (this.isOwner && pushNotificationService.isOwnerAlertsEnabled()) {
        pushNotificationService.send({
          title: event.title || '🔔 Novo Cliente na Fila!',
          body: event.message || `${event.targetClientName || 'Um cliente'} acabou de entrar na fila do atelier.`,
          type: 'new_client_joined',
          timestamp: event.timestamp,
        });
      }
    } else if (event.type === 'you_are_next') {
      if (isForMe || (!event.targetClientPhone && !event.targetClientName)) {
        pushNotificationService.send({
          title: '✂️ Você é o Próximo!',
          body: event.message || 'Seu atendimento na barbearia vai começar em instantes. Fique por perto!',
          type: 'you_are_next',
        });
      }
    } else if (event.type === 'slot_opened') {
      // Vaga aberta notifica todos os clientes que estão monitorando a fila
      pushNotificationService.send({
        title: '🚪 Vaga Aberta na Cadeira!',
        body: event.message || 'Uma vaga acabou de abrir na cadeira! Venha agora para seu atendimento sem fila.',
        type: 'slot_opened',
      });
    } else if (event.type === 'chair_called') {
      if (isForMe) {
        pushNotificationService.send({
          title: '💈 Sua Vez Chegou!',
          body: event.message || 'O barbeiro está pronto na cadeira. Pode se dirigir agora!',
          type: 'chair_called',
        });
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }
  }
}
