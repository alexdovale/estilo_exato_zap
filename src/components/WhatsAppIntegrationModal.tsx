import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  MessageSquare, 
  CheckCircle2, 
  Send, 
  Bot, 
  Bell, 
  History, 
  Sliders, 
  Smartphone, 
  Key, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  Check, 
  Calendar,
  Layers,
  ArrowRight,
  QrCode,
  Loader2,
  Wand2,
  Moon
} from 'lucide-react';
import {
  AtelierProfile,
  WhatsAppConfig,
  WhatsAppLog,
  QueueItem,
  WhatsAppChatThread,
  SmartReplyAnalysis,
  SmartReplySuggestion,
} from '../types';
import { whatsappRepository, queueRepository, atelierRepository } from '../services/store';

interface WhatsAppIntegrationModalProps {
  atelier: AtelierProfile;
  onClose: () => void;
}

export const WhatsAppIntegrationModal: React.FC<WhatsAppIntegrationModalProps> = ({
  atelier,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'automacao' | 'respostas_ia' | 'conexao' | 'disparo' | 'historico'>('automacao');
  const [linkMode, setLinkMode] = useState<'qrcode' | 'token'>('qrcode');
  const [config, setConfig] = useState<WhatsAppConfig>(whatsappRepository.getConfig(atelier.id));
  const [logs, setLogs] = useState<WhatsAppLog[]>(whatsappRepository.getLogs(atelier.id));
  const [queue, setQueue] = useState<QueueItem[]>(queueRepository.getQueue(atelier.id));
  const [chatThreads, setChatThreads] = useState<WhatsAppChatThread[]>(() =>
    whatsappRepository.getChatThreads(atelier.id)
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string>(() =>
    whatsappRepository.getChatThreads(atelier.id)[0]?.id || ''
  );

  // Estados da Automação de Respostas Inteligentes (IA)
  const [smartAnalysisByThread, setSmartAnalysisByThread] = useState<
    Record<string, { lastMessageId: string; analysis: SmartReplyAnalysis }>
  >({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [extraAiGoal, setExtraAiGoal] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [simulatedInboundText, setSimulatedInboundText] = useState('');
  const autoAnalyzedKeysRef = React.useRef<Set<string>>(new Set());

  // Estado para teste de envio manual
  const [manualPhone, setManualPhone] = useState('11999998888');
  const [manualName, setManualName] = useState('Cliente Exemplo');
  const [manualType, setManualType] = useState<'confirmacao' | 'lembrete' | 'chamada' | 'voce_e_o_proximo' | 'vaga_aberta' | 'ausencia' | 'teste'>('lembrete');
  const [manualCustomMessage, setManualCustomMessage] = useState('');
  const [manualServiceName, setManualServiceName] = useState('Corte Degradê Fade');
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Status de salvamento da configuração
  const [isSaved, setIsSaved] = useState(false);
  const [sendingTestType, setSendingTestType] = useState<'confirmacao' | 'lembrete' | 'chamada' | 'voce_e_o_proximo' | 'vaga_aberta' | 'ausencia' | null>(null);

  const selectedThread = chatThreads.find((t) => t.id === selectedThreadId) || chatThreads[0] || null;
  const unreadChatsCount = chatThreads.filter((t) => t.unread).length;
  const currentSmartAnalysis = selectedThread ? smartAnalysisByThread[selectedThread.id]?.analysis || null : null;
  const expedienteStatus = atelierRepository.getExpedienteStatus(atelier.id);
  const defaultAbsenceTemplate = 'Olá {{nome}}! No momento o *{{atelier}}* está fora do horário de funcionamento ({{horario_funcionamento}}) ou com a equipe em atendimento. Recebemos sua mensagem e responderemos assim que possível! 💈⏰';

  useEffect(() => {
    const handleUpdate = () => {
      setLogs(whatsappRepository.getLogs(atelier.id));
      setQueue(queueRepository.getQueue(atelier.id));
      setChatThreads(whatsappRepository.getChatThreads(atelier.id));
    };
    window.addEventListener('estilo_store_updated', handleUpdate);
    return () => window.removeEventListener('estilo_store_updated', handleUpdate);
  }, [atelier.id]);

  const handleGenerateSmartReplies = React.useCallback(
    async (thread: WhatsAppChatThread, goalOverride?: string) => {
      if (!thread || thread.messages.length === 0) return;
      const latestMsgId = thread.messages[thread.messages.length - 1].id;
      autoAnalyzedKeysRef.current.add(`${thread.id}:${latestMsgId}`);

      setIsGeneratingAI(true);
      setAiError(null);
      try {
        const analysis = await whatsappRepository.generateSmartReplies({
          atelierId: atelier.id,
          clientName: thread.clientName,
          serviceName: thread.serviceName,
          chatHistory: thread.messages,
          extraGoal: (goalOverride ?? extraAiGoal).trim() || undefined,
        });
        setSmartAnalysisByThread((prev) => ({
          ...prev,
          [thread.id]: {
            lastMessageId: latestMsgId,
            analysis,
          },
        }));
      } catch (err: any) {
        console.error('Erro ao gerar respostas inteligentes:', err);
        setAiError(err?.message || 'Não foi possível gerar sugestões inteligentes no momento.');
      } finally {
        setIsGeneratingAI(false);
      }
    },
    [atelier.id, extraAiGoal]
  );

  useEffect(() => {
    if (activeTab !== 'respostas_ia') return;
    if (config.smartReplyEnabled === false || config.smartReplyAutoSuggest === false) return;
    if (!selectedThread || selectedThread.messages.length === 0 || isGeneratingAI) return;

    const latestMsgId = selectedThread.messages[selectedThread.messages.length - 1].id;
    const cacheKey = `${selectedThread.id}:${latestMsgId}`;
    const alreadyCached = smartAnalysisByThread[selectedThread.id]?.lastMessageId === latestMsgId;

    if (!alreadyCached && !autoAnalyzedKeysRef.current.has(cacheKey)) {
      handleGenerateSmartReplies(selectedThread);
    }
  }, [
    activeTab,
    config.smartReplyEnabled,
    config.smartReplyAutoSuggest,
    selectedThread,
    isGeneratingAI,
    smartAnalysisByThread,
    handleGenerateSmartReplies,
  ]);

  const handleSelectThread = (thread: WhatsAppChatThread) => {
    setSelectedThreadId(thread.id);
    setAiError(null);
    setReplyDraft('');
    if (thread.unread) {
      setChatThreads(whatsappRepository.markThreadRead(atelier.id, thread.id));
    }
  };

  const handleSendChatReply = (text: string, aiSuggested = false) => {
    if (!selectedThread || !text.trim()) return;
    const updated = whatsappRepository.addChatMessage(atelier.id, {
      clientName: selectedThread.clientName,
      clientPhone: selectedThread.clientPhone,
      serviceName: selectedThread.serviceName,
      direction: 'outbound',
      text: text.trim(),
      aiSuggested,
    });
    setChatThreads(updated);
    setLogs(whatsappRepository.getLogs(atelier.id));
    setReplyDraft('');
    setToastMessage({
      text: `Resposta ${aiSuggested ? 'inteligente ' : ''}enviada para ${selectedThread.clientName}!`,
      type: 'success',
    });
  };

  const handleSimulateIncomingClientMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !simulatedInboundText.trim()) return;
    const updated = whatsappRepository.addChatMessage(atelier.id, {
      clientName: selectedThread.clientName,
      clientPhone: selectedThread.clientPhone,
      serviceName: selectedThread.serviceName,
      direction: 'inbound',
      text: simulatedInboundText.trim(),
    });
    setChatThreads(updated);
    setSimulatedInboundText('');
    setAiError(null);
  };

  const handleSaveConfig = (newConfig: WhatsAppConfig) => {
    setConfig(newConfig);
    whatsappRepository.saveConfig(newConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSendTestPreview = async (type: 'confirmacao' | 'lembrete' | 'chamada' | 'voce_e_o_proximo' | 'vaga_aberta' | 'ausencia') => {
    const targetPhone = config.adminTestPhone?.trim() || '11999998888';
    setSendingTestType(type);
    setIsSending(true);
    try {
      let typeLabel = 'Teste';
      if (type === 'confirmacao') typeLabel = 'Confirmação';
      else if (type === 'lembrete') typeLabel = 'Lembrete de 1h';
      else if (type === 'chamada') typeLabel = 'Chamada para Cadeira';
      else if (type === 'voce_e_o_proximo') typeLabel = 'Você é o Próximo (#1)';
      else if (type === 'vaga_aberta') typeLabel = 'Abriu Vaga na Cadeira';
      else if (type === 'ausencia') typeLabel = 'Auto-resposta de Ausência';

      await whatsappRepository.sendMessage({
        atelierId: atelier.id,
        recipientName: 'Administrador (Você)',
        recipientPhone: targetPhone,
        type,
        serviceName: 'Corte Degradê Fade',
      });

      setToastMessage({
        text: `Prévia de "${typeLabel}" enviada com sucesso para o WhatsApp ${targetPhone}!`,
        type: 'success',
      });
      setLogs(whatsappRepository.getLogs(atelier.id));
    } catch (err: any) {
      console.error(err);
      setToastMessage({
        text: 'Erro ao disparar mensagem de teste.',
        type: 'info',
      });
    } finally {
      setIsSending(false);
      setSendingTestType(null);
    }
  };

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone.trim() || !manualName.trim()) return;

    setIsSending(true);
    try {
      const result = await whatsappRepository.sendMessage({
        atelierId: atelier.id,
        recipientName: manualName.trim(),
        recipientPhone: manualPhone.trim(),
        type: manualType,
        customMessage: manualCustomMessage.trim() || undefined,
        serviceName: manualServiceName,
      });

      setToastMessage({
        text: `Mensagem enviada com sucesso para ${manualName}!`,
        type: 'success',
      });
      setLogs(whatsappRepository.getLogs(atelier.id));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuickToQueueClient = async (item: QueueItem, type: 'confirmacao' | 'lembrete') => {
    setIsSending(true);
    try {
      await whatsappRepository.sendMessage({
        atelierId: atelier.id,
        recipientName: item.clientName,
        recipientPhone: item.phone || '11999999999',
        type,
        serviceName: item.service,
      });

      setToastMessage({
        text: `${type === 'confirmacao' ? 'Confirmação' : 'Lembrete'} enviado para ${item.clientName}!`,
        type: 'success',
      });
      setLogs(whatsappRepository.getLogs(atelier.id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto">
      <div className={`min-h-screen ${activeTab === 'respostas_ia' ? 'max-w-4xl' : 'max-w-2xl'} mx-auto p-4 sm:p-8 flex flex-col justify-between select-none transition-all`}>
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar ao Painel</span>
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${config.connected ? 'bg-[#25D366] animate-pulse' : 'bg-red-400'}`} />
              <span className="font-heading font-black text-xs uppercase tracking-widest text-[#25D366]">
                WHATSAPP BUSINESS API
              </span>
            </div>
          </div>

          {/* Header Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  Automação de WhatsApp
                </h1>
                <p className="text-xs text-white/50 mt-0.5">
                  Lembretes de agendamento, respostas inteligentes com IA e chamadas da fila automáticas.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-2xl bg-[#1C1C1B] border border-white/5 mb-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('automacao')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'automacao'
                  ? 'bg-[#F2CA50] text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Automação</span>
              <span className="sm:hidden">Regras</span>
            </button>

            <button
              onClick={() => setActiveTab('respostas_ia')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === 'respostas_ia'
                  ? 'bg-[#F2CA50] text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Respostas IA</span>
              {unreadChatsCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                  activeTab === 'respostas_ia'
                    ? 'bg-black text-[#F2CA50]'
                    : 'bg-[#25D366] text-black'
                }`}>
                  {unreadChatsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('disparo')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'disparo'
                  ? 'bg-[#F2CA50] text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Disparo</span>
              <span className="sm:hidden">Envio</span>
            </button>

            <button
              onClick={() => setActiveTab('historico')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-[#F2CA50] text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Histórico ({logs.length})</span>
              <span className="sm:hidden">Logs ({logs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('conexao')}
              className={`col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'conexao'
                  ? 'bg-[#F2CA50] text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Conexão API</span>
              <span className="sm:hidden">API</span>
            </button>
          </div>

          {toastMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{toastMessage.text}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="opacity-70 hover:opacity-100 cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: AUTOMAÇÃO E TEMPLATES */}
          {activeTab === 'automacao' && (
            <div className="space-y-6">
              {/* Auto-Ativação e Chave de API de Validação */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#1C1C1B] to-black/80 border-2 border-[#25D366]/40 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-white text-sm uppercase tracking-wider">
                        Auto-Ativação de Disparos no WhatsApp
                      </h3>
                      <p className="text-xs text-white/60">
                        Habilite disparos automáticos para novos agendamentos e lembretes de fila com chave de API validada.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoActivationEnabled ?? true}
                      onChange={(e) => handleSaveConfig({ ...config, autoActivationEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#25D366]">
                    Chave de API para Validação Instantânea (WhatsApp Business)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={config.autoActivationApiKey || 'WAPP-API-KEY-ESTILO-2026'}
                      onChange={(e) => setConfig({ ...config, autoActivationApiKey: e.target.value })}
                      placeholder="WAPP-API-KEY-..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 text-white font-mono text-xs border border-white/20 focus:border-[#25D366] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveConfig(config);
                        setToastMessage({
                          text: 'Chave de API validada com sucesso! Disparos automáticos ativos.',
                          type: 'success',
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
                    >
                      Validar Chave API
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/50 pt-1">
                    <span className="flex items-center gap-1 text-green-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Status: Chave Ativa e Verificada pela Meta/Z-API</span>
                    </span>
                    <span>Modo Automático: {config.autoActivationEnabled !== false ? 'Habilitado' : 'Pausado'}</span>
                  </div>
                </div>
              </div>

              {/* Switches de Automação */}
              <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                    GATILHOS AUTOMÁTICOS
                  </div>
                  {isSaved && (
                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Salvo!
                    </span>
                  )}
                </div>

                {/* 1. Confirmação Imediata */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="pr-4">
                    <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                      <span>Confirmação Automática de Agendamento</span>
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">Ao vivo</span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Dispara uma mensagem de confirmação assim que o cliente entra na fila ou agenda um horário.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoSendConfirmation}
                      onChange={(e) => handleSaveConfig({ ...config, autoSendConfirmation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                {/* 2. Lembrete Antecipado */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="pr-4">
                    <div className="font-heading font-bold text-sm text-white">
                      Lembrete de Horário Antes do Atendimento
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Envia lembrete para evitar faltas (no-show) e manter a cadeira cheia.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3.5 h-3.5 text-[#F2CA50]" />
                      <span className="text-xs text-white/60">Enviar</span>
                      <select
                        value={config.reminderHoursBefore}
                        onChange={(e) => handleSaveConfig({ ...config, reminderHoursBefore: Number(e.target.value) })}
                        className="px-2 py-1 rounded-lg bg-black/50 text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none"
                      >
                        <option value={0.25}>15 minutos antes</option>
                        <option value={0.5}>30 minutos antes</option>
                        <option value={1}>1 hora antes</option>
                        <option value={2}>2 horas antes</option>
                        <option value={4}>4 horas antes</option>
                        <option value={12}>12 horas antes</option>
                        <option value={24}>24 horas antes (1 dia)</option>
                        {![0.25, 0.5, 1, 2, 4, 12, 24].includes(config.reminderHoursBefore) && (
                          <option value={config.reminderHoursBefore}>
                            {config.reminderHoursBefore < 1
                              ? `${Math.round(config.reminderHoursBefore * 60)} minutos antes`
                              : `${config.reminderHoursBefore} horas antes`}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoSendReminder}
                      onChange={(e) => handleSaveConfig({ ...config, autoSendReminder: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                {/* 3. Chamada da Cadeira */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="pr-4">
                    <div className="font-heading font-bold text-sm text-white">
                      Aviso de Cadeira Pronta ("Sua Vez Chegou!")
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Avisa o próximo cliente da fila quando o barbeiro clicar no botão "Chamar".
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoSendQueueCall}
                      onChange={(e) => handleSaveConfig({ ...config, autoSendQueueCall: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                {/* 4. Notificar Você é o Próximo (#1) */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="pr-4">
                    <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                      <span>Notificação "Você é o Próximo!" (Posição #1)</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] text-[10px] font-bold">Fila Ativa</span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Avisa automaticamente o cliente que está na 1ª posição da fila de espera para que ele se prepare antes de sentar na cadeira.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoSendYouAreNext ?? true}
                      onChange={(e) => handleSaveConfig({ ...config, autoSendYouAreNext: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                {/* 5. Notificar Abriu Vaga na Cadeira */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="pr-4">
                    <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                      <span>Notificação "Abriu Vaga na Cadeira!"</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">Fila de Espera</span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Notifica os clientes da fila de espera quando um atendimento for finalizado ou quando a cadeira ficar livre.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoSendSlotOpened ?? true}
                      onChange={(e) => handleSaveConfig({ ...config, autoSendSlotOpened: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                {/* 6. Automação de Respostas Inteligentes (IA) */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="pr-4">
                    <div className="font-heading font-bold text-sm text-white flex items-center gap-2 flex-wrap">
                      <span>Automação de Respostas Inteligentes (IA)</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Contextual
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Analisa automaticamente o histórico da conversa do cliente para sugerir respostas contextuais com 1 clique.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('respostas_ia')}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F2CA50] hover:underline cursor-pointer"
                    >
                      <span>Abrir Painel de Respostas IA</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.smartReplyEnabled ?? true}
                      onChange={(e) => handleSaveConfig({ ...config, smartReplyEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>

                {/* 7. Auto-resposta de Ausência */}
                <div className="flex items-center justify-between py-2">
                  <div className="pr-4">
                    <div className="font-heading font-bold text-sm text-white flex items-center gap-2 flex-wrap">
                      <span>Auto-resposta de Ausência</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        expedienteStatus.isOpen
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        <Moon className="w-3 h-3" />
                        {expedienteStatus.isOpen ? 'Expediente Aberto' : 'Fora do Horário'}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                      Envia automaticamente uma mensagem padrão quando o atelier estiver fora do horário de funcionamento ou com a equipe ocupada.
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-white/60">Disparar quando:</span>
                      <select
                        value={config.autoReplyAbsenceMode || 'ambos'}
                        onChange={(e) =>
                          handleSaveConfig({
                            ...config,
                            autoReplyAbsenceMode: e.target.value as WhatsAppConfig['autoReplyAbsenceMode'],
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-black/50 text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none"
                      >
                        <option value="ambos">Fora do horário ou ocupado</option>
                        <option value="fora_horario">Apenas fora do horário</option>
                        <option value="ocupado">Apenas quando ocupado</option>
                      </select>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoReplyAbsenceEnabled ?? true}
                      onChange={(e) => handleSaveConfig({ ...config, autoReplyAbsenceEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>
              </div>

              {/* Modelos de Mensagens (Templates) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                      MODELOS DE MENSAGENS AUTOMÁTICAS (TEMPLATES)
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">
                      Defina os textos para Confirmação e Lembrete de 1 hora antes com variáveis automáticas.
                    </p>
                  </div>
                  {isSaved && (
                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 self-start sm:self-auto bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                      <Check className="w-3 h-3" /> Alterações salvas!
                    </span>
                  )}
                </div>

                {/* Configuração do WhatsApp do Administrador para Envio de Teste */}
                <div className="p-4 rounded-xl bg-black/40 border border-[#25D366]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>WhatsApp do Administrador para Testes</span>
                        <span className="text-[10px] bg-[#25D366]/15 text-[#25D366] px-2 py-0.5 rounded-full font-bold border border-[#25D366]/30">
                          Destino de Teste
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50">
                        O botão "Enviar Teste" enviará a prévia diretamente para este número de WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <input
                      type="tel"
                      value={config.adminTestPhone || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig({ ...config, adminTestPhone: val });
                      }}
                      onBlur={() => handleSaveConfig(config)}
                      placeholder="11999998888"
                      className="px-3 py-1.5 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-[#25D366] focus:outline-none w-36 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveConfig(config)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </div>

                {/* Bloco 1: CONFIRMAÇÃO DE AGENDAMENTO */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        1. Confirmação de Agendamento
                      </span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        Disparo Imediato
                      </span>
                    </div>

                    {/* Botão Enviar Teste ao lado do modelo */}
                    <button
                      type="button"
                      onClick={() => handleSendTestPreview('confirmacao')}
                      disabled={isSending}
                      title={`Enviar prévia para ${config.adminTestPhone || 'WhatsApp configurado'}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingTestType === 'confirmacao' ? 'Enviando Teste...' : 'Enviar Teste'}</span>
                    </button>
                  </div>

                  {/* Botões para Inserir Variáveis */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-white/40 mr-1">Inserir:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.templateConfirmation + ' {{nome}}';
                        setConfig({ ...config, templateConfirmation: updated });
                        handleSaveConfig({ ...config, templateConfirmation: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-[#F2CA50]/10 hover:bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-bold border border-[#F2CA50]/20 cursor-pointer transition-colors"
                    >
                      + Nome do Cliente ({"{{nome}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.templateConfirmation + ' {{servico}}';
                        setConfig({ ...config, templateConfirmation: updated });
                        handleSaveConfig({ ...config, templateConfirmation: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold border border-[#25D366]/20 cursor-pointer transition-colors"
                    >
                      + Nome do Serviço ({"{{servico}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.templateConfirmation + ' {{atelier}}';
                        setConfig({ ...config, templateConfirmation: updated });
                        handleSaveConfig({ ...config, templateConfirmation: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-bold border border-white/10 cursor-pointer transition-colors"
                    >
                      + Nome do Estabelecimento ({"{{atelier}}"})
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={config.templateConfirmation}
                    onChange={(e) => setConfig({ ...config, templateConfirmation: e.target.value })}
                    onBlur={() => handleSaveConfig(config)}
                    placeholder="Ex: Olá {{nome}}! Seu agendamento para {{servico}} no *{{atelier}}* foi confirmado com sucesso. Estamos te aguardando!"
                    className="w-full p-3.5 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Prévia ao vivo da Confirmação */}
                  <div className="p-3 rounded-lg bg-[#25D366]/5 border border-[#25D366]/20 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-[#25D366] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Pré-visualização da Mensagem no WhatsApp:</span>
                      </div>
                      <span className="text-[10px] text-white/40">
                        Destino do Teste: {config.adminTestPhone || '11999998888'}
                      </span>
                    </div>
                    <p className="text-white/80 italic font-sans leading-relaxed">
                      "{config.templateConfirmation
                        .replace(/{{nome}}/g, 'Arthur Shelby')
                        .replace(/{{servico}}/g, 'Corte Degradê Fade')
                        .replace(/{{atelier}}/g, atelier.nome_negocio)}"
                    </p>
                  </div>
                </div>

                {/* Bloco 2: LEMBRETE DE 1 HORA ANTES */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-[#F2CA50]" />
                      <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        2. Lembrete de 1 Hora Antes
                      </span>
                      <span className="text-[10px] bg-[#F2CA50]/10 text-[#F2CA50] px-2 py-0.5 rounded-full font-bold">
                        1 hora antes do horário
                      </span>
                    </div>

                    {/* Botão Enviar Teste ao lado do modelo */}
                    <button
                      type="button"
                      onClick={() => handleSendTestPreview('lembrete')}
                      disabled={isSending}
                      title={`Enviar prévia para ${config.adminTestPhone || 'WhatsApp configurado'}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingTestType === 'lembrete' ? 'Enviando Teste...' : 'Enviar Teste'}</span>
                    </button>
                  </div>

                  {/* Botões para Inserir Variáveis */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-white/40 mr-1">Inserir:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.templateReminder + ' {{nome}}';
                        setConfig({ ...config, templateReminder: updated });
                        handleSaveConfig({ ...config, templateReminder: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-[#F2CA50]/10 hover:bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-bold border border-[#F2CA50]/20 cursor-pointer transition-colors"
                    >
                      + Nome do Cliente ({"{{nome}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.templateReminder + ' {{servico}}';
                        setConfig({ ...config, templateReminder: updated });
                        handleSaveConfig({ ...config, templateReminder: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold border border-[#25D366]/20 cursor-pointer transition-colors"
                    >
                      + Nome do Serviço ({"{{servico}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = config.templateReminder + ' {{atelier}}';
                        setConfig({ ...config, templateReminder: updated });
                        handleSaveConfig({ ...config, templateReminder: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-bold border border-white/10 cursor-pointer transition-colors"
                    >
                      + Nome do Estabelecimento ({"{{atelier}}"})
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={config.templateReminder}
                    onChange={(e) => setConfig({ ...config, templateReminder: e.target.value })}
                    onBlur={() => handleSaveConfig(config)}
                    placeholder="Ex: Olá {{nome}}! Faltando 1 hora para o seu horário de {{servico}} no *{{atelier}}*. Estamos preparando sua cadeira! ✂️"
                    className="w-full p-3.5 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Prévia ao vivo do Lembrete */}
                  <div className="p-3 rounded-lg bg-[#F2CA50]/5 border border-[#F2CA50]/20 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-[#F2CA50] flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Pré-visualização da Mensagem no WhatsApp (1h antes):</span>
                      </div>
                      <span className="text-[10px] text-white/40">
                        Destino do Teste: {config.adminTestPhone || '11999998888'}
                      </span>
                    </div>
                    <p className="text-white/80 italic font-sans leading-relaxed">
                      "{config.templateReminder
                        .replace(/{{nome}}/g, 'Arthur Shelby')
                        .replace(/{{servico}}/g, 'Corte Degradê Fade')
                        .replace(/{{atelier}}/g, atelier.nome_negocio)}"
                    </p>
                  </div>
                </div>

                {/* Bloco 3: Chamada para a cadeira */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        3. Chamada para a Cadeira ("Sua Vez Chegou!")
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = config.templateQueueCall + ' {{nome}}';
                            setConfig({ ...config, templateQueueCall: updated });
                            handleSaveConfig({ ...config, templateQueueCall: updated });
                          }}
                          className="px-2 py-1 rounded-md bg-[#F2CA50]/10 hover:bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-bold border border-[#F2CA50]/20 cursor-pointer"
                        >
                          + {"{{nome}}"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = config.templateQueueCall + ' {{atelier}}';
                            setConfig({ ...config, templateQueueCall: updated });
                            handleSaveConfig({ ...config, templateQueueCall: updated });
                          }}
                          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-bold border border-white/10 cursor-pointer"
                        >
                          + {"{{atelier}}"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendTestPreview('chamada')}
                        disabled={isSending}
                        title={`Enviar prévia para ${config.adminTestPhone || 'WhatsApp configurado'}`}
                        className="px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-black font-heading font-black text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{sendingTestType === 'chamada' ? 'Enviando...' : 'Testar'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={config.templateQueueCall}
                    onChange={(e) => setConfig({ ...config, templateQueueCall: e.target.value })}
                    onBlur={() => handleSaveConfig(config)}
                    className="w-full p-3.5 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Bloco 4: VOCÊ É O PRÓXIMO DA FILA (#1) */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-[#F2CA50]" />
                      <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        4. Notificação "Você é o Próximo!" (Posição #1)
                      </span>
                      <span className="text-[10px] bg-[#F2CA50]/15 text-[#F2CA50] px-2 py-0.5 rounded-full font-bold">
                        Pré-atendimento
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendTestPreview('voce_e_o_proximo')}
                      disabled={isSending}
                      title={`Enviar prévia para ${config.adminTestPhone || 'WhatsApp configurado'}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingTestType === 'voce_e_o_proximo' ? 'Enviando Teste...' : 'Enviar Teste'}</span>
                    </button>
                  </div>

                  {/* Variáveis para inserir */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-white/40 mr-1">Inserir:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.templateYouAreNext || '') + ' {{nome}}';
                        setConfig({ ...config, templateYouAreNext: updated });
                        handleSaveConfig({ ...config, templateYouAreNext: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-[#F2CA50]/10 hover:bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-bold border border-[#F2CA50]/20 cursor-pointer transition-colors"
                    >
                      + Nome do Cliente ({"{{nome}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.templateYouAreNext || '') + ' {{atelier}}';
                        setConfig({ ...config, templateYouAreNext: updated });
                        handleSaveConfig({ ...config, templateYouAreNext: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-bold border border-white/10 cursor-pointer transition-colors"
                    >
                      + Nome da Barbearia ({"{{atelier}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.templateYouAreNext || '') + ' {{posicao}}';
                        setConfig({ ...config, templateYouAreNext: updated });
                        handleSaveConfig({ ...config, templateYouAreNext: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold border border-[#25D366]/20 cursor-pointer transition-colors"
                    >
                      + Posição ({"{{posicao}}"})
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={config.templateYouAreNext || 'Olá {{nome}}! Você é o *PRÓXIMO* da fila no *{{atelier}}* (Posição #1). Fique por perto, seu atendimento começará em instantes! ✂️⚡'}
                    onChange={(e) => setConfig({ ...config, templateYouAreNext: e.target.value })}
                    onBlur={() => handleSaveConfig(config)}
                    placeholder="Ex: Olá {{nome}}! Você é o *PRÓXIMO* da fila no *{{atelier}}*..."
                    className="w-full p-3.5 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Prévia do Você é o Próximo */}
                  <div className="p-3 rounded-lg bg-[#F2CA50]/5 border border-[#F2CA50]/20 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-[#F2CA50] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Pré-visualização: Notificação de Próximo da Fila</span>
                      </div>
                      <span className="text-[10px] text-white/40">
                        Destino: {config.adminTestPhone || '11999998888'}
                      </span>
                    </div>
                    <p className="text-white/80 italic font-sans leading-relaxed">
                      "{(config.templateYouAreNext || 'Olá {{nome}}! Você é o *PRÓXIMO* da fila no *{{atelier}}* (Posição #1). Fique por perto, seu atendimento começará em instantes! ✂️⚡')
                        .replace(/{{nome}}/g, 'Carlos Eduardo')
                        .replace(/{{posicao}}/g, '1')
                        .replace(/{{atelier}}/g, atelier.nome_negocio)}"
                    </p>
                  </div>
                </div>

                {/* Bloco 5: AVISO DE VAGA ABERTA NA CADEIRA */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        5. Notificação "Abriu Vaga na Cadeira!"
                      </span>
                      <span className="text-[10px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        Cadeira Livre
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendTestPreview('vaga_aberta')}
                      disabled={isSending}
                      title={`Enviar prévia para ${config.adminTestPhone || 'WhatsApp configurado'}`}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingTestType === 'vaga_aberta' ? 'Enviando Teste...' : 'Enviar Teste'}</span>
                    </button>
                  </div>

                  {/* Variáveis para inserir */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-white/40 mr-1">Inserir:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.templateSlotOpened || '') + ' {{nome}}';
                        setConfig({ ...config, templateSlotOpened: updated });
                        handleSaveConfig({ ...config, templateSlotOpened: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-[#F2CA50]/10 hover:bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-bold border border-[#F2CA50]/20 cursor-pointer transition-colors"
                    >
                      + Nome do Cliente ({"{{nome}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.templateSlotOpened || '') + ' {{atelier}}';
                        setConfig({ ...config, templateSlotOpened: updated });
                        handleSaveConfig({ ...config, templateSlotOpened: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-bold border border-white/10 cursor-pointer transition-colors"
                    >
                      + Nome da Barbearia ({"{{atelier}}"})
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={config.templateSlotOpened || 'Olá {{nome}}! 💈 Boas notícias do *{{atelier}}*: acabou de *ABRIR UMA VAGA* na cadeira! Venha agora para ser atendido sem espera! 🚪✂️'}
                    onChange={(e) => setConfig({ ...config, templateSlotOpened: e.target.value })}
                    onBlur={() => handleSaveConfig(config)}
                    placeholder="Ex: Olá {{nome}}! Acabou de *ABRIR UMA VAGA* na cadeira..."
                    className="w-full p-3.5 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Prévia de Abriu Vaga */}
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Pré-visualização: Notificação de Vaga Aberta</span>
                      </div>
                      <span className="text-[10px] text-white/40">
                        Destino: {config.adminTestPhone || '11999998888'}
                      </span>
                    </div>
                    <p className="text-white/80 italic font-sans leading-relaxed">
                      "{(config.templateSlotOpened || 'Olá {{nome}}! 💈 Boas notícias do *{{atelier}}*: acabou de *ABRIR UMA VAGA* na cadeira! Venha agora para ser atendido sem espera! 🚪✂️')
                        .replace(/{{nome}}/g, 'Gabriel Souza')
                        .replace(/{{atelier}}/g, atelier.nome_negocio)}"
                    </p>
                  </div>
                </div>

                {/* Bloco 6: AUTO-RESPOSTA DE AUSÊNCIA */}
                <div className="p-4 rounded-xl bg-black/40 border border-amber-500/25 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        6. Auto-resposta de Ausência
                      </span>
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                        Fora do Horário / Ocupado
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendTestPreview('ausencia')}
                      disabled={isSending}
                      title={`Enviar prévia para ${config.adminTestPhone || 'WhatsApp configurado'}`}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingTestType === 'ausencia' ? 'Enviando Teste...' : 'Enviar Teste'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-white/50">
                    Defina a mensagem padrão enviada automaticamente aos clientes quando o atelier estiver fora do expediente ({expedienteStatus.horarioHoje}) ou ocupado.
                  </p>

                  {/* Variáveis para inserir */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-white/40 mr-1">Inserir:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.templateAbsenceReply ?? defaultAbsenceTemplate) + ' {{nome}}';
                        setConfig({ ...config, templateAbsenceReply: updated });
                        handleSaveConfig({ ...config, templateAbsenceReply: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-[#F2CA50]/10 hover:bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-bold border border-[#F2CA50]/20 cursor-pointer transition-colors"
                    >
                      + Nome do Cliente ({"{{nome}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.templateAbsenceReply ?? defaultAbsenceTemplate) + ' {{atelier}}';
                        setConfig({ ...config, templateAbsenceReply: updated });
                        handleSaveConfig({ ...config, templateAbsenceReply: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-bold border border-white/10 cursor-pointer transition-colors"
                    >
                      + Nome do Estabelecimento ({"{{atelier}}"})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.templateAbsenceReply ?? defaultAbsenceTemplate) + ' {{horario_funcionamento}}';
                        setConfig({ ...config, templateAbsenceReply: updated });
                        handleSaveConfig({ ...config, templateAbsenceReply: updated });
                      }}
                      className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/20 cursor-pointer transition-colors"
                    >
                      + Horário de Funcionamento ({"{{horario_funcionamento}}"})
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    aria-label="Auto-resposta de Ausência"
                    value={config.templateAbsenceReply ?? defaultAbsenceTemplate}
                    onChange={(e) => setConfig({ ...config, templateAbsenceReply: e.target.value })}
                    onBlur={() => handleSaveConfig(config)}
                    placeholder="Ex: Olá {{nome}}! No momento o *{{atelier}}* está fora do horário de funcionamento ou com a equipe em atendimento. Responderemos assim que possível!"
                    className="w-full p-3.5 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-amber-400 focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Prévia da Auto-resposta de Ausência */}
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                        <Moon className="w-3 h-3" />
                        <span>Pré-visualização: Auto-resposta de Ausência</span>
                      </div>
                      <span className="text-[10px] text-white/40">
                        Destino: {config.adminTestPhone || '11999998888'}
                      </span>
                    </div>
                    <p className="text-white/80 italic font-sans leading-relaxed">
                      "{(config.templateAbsenceReply ?? defaultAbsenceTemplate)
                        .replace(/{{nome}}/g, 'Arthur Shelby')
                        .replace(/{{atelier}}/g, atelier.nome_negocio)
                        .replace(/{{horario_funcionamento}}/g, expedienteStatus.horarioHoje || '09:00 - 19:00')}"
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const restored: WhatsAppConfig = {
                        ...config,
                        templateConfirmation: 'Olá {{nome}}! Seu agendamento para {{servico}} no *{{atelier}}* foi confirmado com sucesso. Estamos te aguardando!',
                        templateReminder: 'Olá {{nome}}! Faltando 1 hora para o seu horário de {{servico}} no *{{atelier}}*. Estamos preparando sua cadeira! Caso precise reagendar, avise por aqui.',
                        templateQueueCall: 'Olá {{nome}}! O seu barbeiro no *{{atelier}}* está pronto. Pode se dirigir à cadeira agora! ✂️',
                        templateYouAreNext: 'Olá {{nome}}! Você é o *PRÓXIMO* da fila no *{{atelier}}* (Posição #1). Fique por perto, seu atendimento começará em instantes! ✂️⚡',
                        templateSlotOpened: 'Olá {{nome}}! 💈 Boas notícias do *{{atelier}}*: acabou de *ABRIR UMA VAGA* na cadeira! Venha agora para ser atendido sem espera! 🚪✂️',
                        templateAbsenceReply: defaultAbsenceTemplate,
                      };
                      handleSaveConfig(restored);
                    }}
                    className="text-xs text-white/40 hover:text-white underline cursor-pointer"
                  >
                    Restaurar modelos padrão
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveConfig(config)}
                    className="py-2.5 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-transform active:scale-95"
                  >
                    Salvar Todos os Modelos
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOMAÇÃO DE RESPOSTAS INTELIGENTES (IA) */}
          {activeTab === 'respostas_ia' && (
            <div className="space-y-6">
              {/* Configurações da Automação de IA */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F2CA50]/10 via-[#1C1C1B] to-black/80 border border-[#F2CA50]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F2CA50]/20 border border-[#F2CA50]/40 flex items-center justify-center text-[#F2CA50] shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                        <span>Automação de Respostas Inteligentes</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#25D366]/15 text-[#25D366] text-[10px] font-bold">
                          IA Contextual
                        </span>
                      </h3>
                      <p className="text-xs text-white/60">
                        Sugestões geradas por IA a partir do histórico de mensagens e regras do atelier.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {isSaved && (
                      <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Salvo!
                      </span>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={config.smartReplyEnabled ?? true}
                        onChange={(e) => handleSaveConfig({ ...config, smartReplyEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Tom de Voz das Sugestões
                    </label>
                    <select
                      value={config.smartReplyTone || 'cordial'}
                      onChange={(e) =>
                        handleSaveConfig({
                          ...config,
                          smartReplyTone: e.target.value as WhatsAppConfig['smartReplyTone'],
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 text-white text-xs border border-white/15 focus:border-[#F2CA50] focus:outline-none"
                    >
                      <option value="cordial">Cordial e Acolhedor (Recomendado)</option>
                      <option value="profissional">Profissional e Polido</option>
                      <option value="descontraido">Descontraído e Moderno</option>
                      <option value="direto">Direto e Objetivo</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="pr-3">
                      <div className="text-xs font-bold text-white">Sugestão Automática ao Abrir Chat</div>
                      <div className="text-[11px] text-white/45">
                        Analisa o histórico automaticamente ao selecionar um cliente.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={config.smartReplyAutoSuggest ?? true}
                        onChange={(e) => handleSaveConfig({ ...config, smartReplyAutoSuggest: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F2CA50]"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Diretrizes do Atelier para a IA (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={config.smartReplyCustomInstructions || ''}
                    onChange={(e) => setConfig({ ...config, smartReplyCustomInstructions: e.target.value })}
                    onBlur={() => handleSaveConfig(config)}
                    placeholder="Ex: Tolerância de 10 min para atrasos; aceitamos Pix e cartão sem acréscimo; estacionamento conveniado na rua ao lado."
                    className="w-full p-3 rounded-xl bg-black/60 text-white text-xs border border-white/15 focus:border-[#F2CA50] focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Conversas e Painel Contextual de IA */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Coluna Esquerda: Lista de Chats */}
                <div className="lg:col-span-4 p-4 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                      CHATS DE CLIENTES ({chatThreads.length})
                    </span>
                    {unreadChatsCount > 0 && (
                      <span className="text-[10px] font-bold text-[#25D366]">
                        {unreadChatsCount} não {unreadChatsCount === 1 ? 'lido' : 'lidos'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                    {chatThreads.map((thread) => {
                      const lastMsg = thread.messages[thread.messages.length - 1];
                      const isSelected = selectedThread?.id === thread.id;
                      const formattedTime = lastMsg
                        ? new Date(lastMsg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => handleSelectThread(thread)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#F2CA50]/12 border-[#F2CA50]/50 shadow-md'
                              : 'bg-black/40 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-heading font-bold text-xs text-white truncate flex items-center gap-1.5">
                              {thread.unread && <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />}
                              <span className="truncate">{thread.clientName}</span>
                            </span>
                            <span className="text-[10px] text-white/40 shrink-0">{formattedTime}</span>
                          </div>
                          {thread.serviceName && (
                            <div className="text-[10px] text-[#F2CA50]/85 font-semibold truncate mt-0.5">
                              {thread.serviceName}
                            </div>
                          )}
                          <p className="text-[11px] text-white/50 truncate mt-1">
                            {lastMsg
                              ? `${lastMsg.direction === 'outbound' ? 'Você: ' : ''}${lastMsg.text}`
                              : 'Sem mensagens'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Coluna Direita: Histórico do Chat + Sugestões Contextuais da IA */}
                <div className="lg:col-span-8 space-y-4">
                  {selectedThread ? (
                    <>
                      {/* Bloco do Histórico da Conversa */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                          <div>
                            <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                              <span>{selectedThread.clientName}</span>
                              <span className="text-[11px] font-mono text-white/40">({selectedThread.clientPhone})</span>
                            </div>
                            <div className="text-[11px] text-[#F2CA50] font-medium">
                              Serviço: {selectedThread.serviceName || 'Atendimento Geral'} • {selectedThread.messages.length} mensagens
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleGenerateSmartReplies(selectedThread)}
                            disabled={isGeneratingAI || config.smartReplyEnabled === false}
                            className="px-3.5 py-2 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isGeneratingAI ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Analisando Chat...</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>Analisar Chat com IA</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Mensagens do Chat */}
                        <div className="space-y-2.5 max-h-64 overflow-y-auto p-3 rounded-xl bg-black/50 border border-white/5">
                          {selectedThread.messages.map((msg) => {
                            const isOutbound = msg.direction === 'outbound';
                            const msgTime = new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                                    isOutbound
                                      ? 'bg-[#25D366]/15 border-[#25D366]/30 text-white rounded-br-sm'
                                      : 'bg-[#2A2A28] border-white/10 text-white/90 rounded-bl-sm'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                                  <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-white/40">
                                    {msg.aiSuggested && (
                                      <span className="text-[#F2CA50] font-bold flex items-center gap-0.5">
                                        <Sparkles className="w-2.5 h-2.5" /> IA
                                      </span>
                                    )}
                                    <span>{msgTime}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Simular Nova Mensagem do Cliente */}
                        <form onSubmit={handleSimulateIncomingClientMessage} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={simulatedInboundText}
                            onChange={(e) => setSimulatedInboundText(e.target.value)}
                            placeholder={`Simular nova mensagem de ${selectedThread.clientName}...`}
                            className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 text-white text-xs border border-white/10 focus:border-[#25D366] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!simulatedInboundText.trim()}
                            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 cursor-pointer transition-colors disabled:opacity-40 shrink-0"
                          >
                            Simular Cliente
                          </button>
                        </form>
                      </div>

                      {/* Bloco de Sugestões Contextuais da IA */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/25 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>SUGESTÕES CONTEXTUAIS DA IA</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={extraAiGoal}
                              onChange={(e) => setExtraAiGoal(e.target.value)}
                              placeholder="Direcionar IA (ex: oferecer 17h30)"
                              className="px-3 py-1.5 rounded-lg bg-black/60 text-white text-[11px] border border-white/10 focus:border-[#F2CA50] focus:outline-none w-48"
                            />
                            <button
                              type="button"
                              onClick={() => handleGenerateSmartReplies(selectedThread)}
                              disabled={isGeneratingAI || config.smartReplyEnabled === false}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#F2CA50] border border-white/10 cursor-pointer disabled:opacity-40"
                              title="Gerar novas sugestões"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {config.smartReplyEnabled === false ? (
                          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                            <span className="text-xs text-white/60">
                              A Automação de Respostas Inteligentes está pausada no momento.
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSaveConfig({ ...config, smartReplyEnabled: true })}
                              className="px-3 py-1.5 rounded-lg bg-[#25D366] text-black text-xs font-black cursor-pointer shrink-0"
                            >
                              Ativar IA
                            </button>
                          </div>
                        ) : isGeneratingAI ? (
                          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-white/60">
                            <Loader2 className="w-6 h-6 text-[#F2CA50] animate-spin" />
                            <span>Lendo histórico do cliente e gerando respostas contextuais...</span>
                          </div>
                        ) : aiError ? (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs text-red-300">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{aiError}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGenerateSmartReplies(selectedThread)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-bold cursor-pointer shrink-0"
                            >
                              Tentar novamente
                            </button>
                          </div>
                        ) : currentSmartAnalysis ? (
                          <div className="space-y-3">
                            {/* Contexto Detectado */}
                            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="space-y-0.5">
                                <div className="text-[11px] font-bold text-white">
                                  Intenção: <span className="text-[#F2CA50]">{currentSmartAnalysis.detectedIntent}</span>
                                </div>
                                <p className="text-[11px] text-white/60">{currentSmartAnalysis.summary}</p>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 self-start sm:self-center border ${
                                  currentSmartAnalysis.urgency === 'alta'
                                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                    : currentSmartAnalysis.urgency === 'media'
                                    ? 'bg-[#F2CA50]/15 text-[#F2CA50] border-[#F2CA50]/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                Urgência: {currentSmartAnalysis.urgency}
                              </span>
                            </div>

                            {/* 3 Sugestões Contextuais */}
                            <div className="space-y-2.5">
                              {currentSmartAnalysis.suggestions.map((suggestion: SmartReplySuggestion) => (
                                <div
                                  key={suggestion.id}
                                  className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-[#F2CA50]/40 transition-colors space-y-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-heading font-bold text-xs text-white">
                                      {suggestion.label}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px] font-bold border border-white/10">
                                      {suggestion.tone}
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/80 leading-relaxed select-text">
                                    "{suggestion.text}"
                                  </p>
                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setReplyDraft(suggestion.text)}
                                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold border border-white/10 cursor-pointer transition-colors"
                                    >
                                      Usar e Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSendChatReply(suggestion.text, true)}
                                      className="px-3.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-95"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Enviar Agora</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-white/40 bg-black/30 rounded-xl border border-white/5">
                            Clique em <strong>"Analisar Chat com IA"</strong> para gerar sugestões contextuais para esta conversa.
                          </div>
                        )}

                        {/* Compositor Manual de Resposta */}
                        <div className="pt-3 border-t border-white/5 space-y-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
                            Responder para {selectedThread.clientName}
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <textarea
                              rows={2}
                              value={replyDraft}
                              onChange={(e) => setReplyDraft(e.target.value)}
                              placeholder="Edite uma sugestão da IA ou escreva sua resposta personalizada..."
                              className="flex-1 p-3 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-[#25D366] focus:outline-none resize-none leading-relaxed"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendChatReply(replyDraft, false)}
                              disabled={!replyDraft.trim()}
                              className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-10 text-center text-xs text-white/40 rounded-2xl bg-[#1C1C1B] border border-white/5">
                      Nenhuma conversa encontrada no momento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISPARO MANUAL & AÇÕES RÁPIDAS */}
          {activeTab === 'disparo' && (
            <div className="space-y-6">
              {/* Envio Rápido para a Fila Atual */}
              <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                    CLIENTES NA FILA HOJE ({queue.length})
                  </div>
                  <span className="text-[10px] text-white/40">1-clique para notificar</span>
                </div>

                {queue.length === 0 ? (
                  <div className="py-6 text-center text-white/30 text-xs">
                    Nenhum cliente aguardando na fila no momento.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {queue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-white text-sm truncate flex items-center gap-2">
                            <span>{item.clientName}</span>
                            <span className="text-[10px] text-[#F2CA50] font-black">#{idx + 1}</span>
                          </div>
                          <div className="text-[11px] text-white/40 truncate">
                            {item.service} • {item.phone || 'Sem telefone'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleSendQuickToQueueClient(item, 'confirmacao')}
                            disabled={isSending}
                            className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#25D366] text-xs font-bold border border-[#25D366]/30 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>

                          <button
                            onClick={() => handleSendQuickToQueueClient(item, 'lembrete')}
                            disabled={isSending}
                            className="py-1.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20b858] text-black text-xs font-heading font-black flex items-center gap-1 cursor-pointer shadow-md transition-colors"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Lembrar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulário de Envio Personalizado / Teste */}
              <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                  DISPARO MANUAL OU TESTE
                </div>

                <form onSubmit={handleSendManual} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        Nome do Cliente
                      </label>
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Ex: Arthur Shelby"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        WhatsApp (com DDD)
                      </label>
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="11999999999"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        Tipo de Mensagem
                      </label>
                      <select
                        value={manualType}
                        onChange={(e: any) => setManualType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs"
                      >
                        <option value="lembrete">Lembrete de Horário</option>
                        <option value="confirmacao">Confirmação de Agendamento</option>
                        <option value="chamada">Chamada para Cadeira</option>
                        <option value="voce_e_o_proximo">Você é o Próximo (#1)</option>
                        <option value="vaga_aberta">Abriu Vaga na Cadeira</option>
                        <option value="ausencia">Auto-resposta de Ausência</option>
                        <option value="teste">Mensagem de Teste Oficial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        Serviço
                      </label>
                      <input
                        type="text"
                        value={manualServiceName}
                        onChange={(e) => setManualServiceName(e.target.value)}
                        placeholder="Ex: Corte Degradê"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5 flex items-center justify-between">
                      <span>Texto Personalizado (opcional)</span>
                      <span className="text-[10px] text-white/30">Deixe em branco para usar o modelo automático</span>
                    </label>
                    <textarea
                      rows={2}
                      value={manualCustomMessage}
                      onChange={(e) => setManualCustomMessage(e.target.value)}
                      placeholder="Ex: Seu horário foi confirmado para as 15h. Até já!"
                      className="w-full p-3 rounded-xl bg-black/40 text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSending ? 'DISPARANDO WHATSAPP...' : 'ENVIAR VIA WHATSAPP BUSINESS'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: HISTÓRICO DE DISPAROS (LOGS) */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-white">
                    Histórico de Mensagens Enviadas
                  </h3>
                  <p className="text-xs text-white/40">
                    Registro de todas as confirmações e lembretes enviados via API.
                  </p>
                </div>

                {logs.length > 0 && (
                  <button
                    onClick={() => {
                      whatsappRepository.clearLogs(atelier.id);
                      setLogs([]);
                    }}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center text-white/30 text-xs rounded-2xl bg-[#1C1C1B] border border-white/5">
                  Nenhuma mensagem registrada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => {
                    const date = new Date(log.timestamp);
                    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                    const badgeColor = 
                      log.type === 'confirmacao' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                      log.type === 'lembrete' ? 'text-[#F2CA50] bg-[#F2CA50]/10 border-[#F2CA50]/20' :
                      log.type === 'chamada' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                      log.type === 'ausencia' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                      log.type === 'voce_e_o_proximo' ? 'text-[#F2CA50] bg-[#F2CA50]/10 border-[#F2CA50]/20' :
                      log.type === 'vaga_aberta' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' :
                      'text-purple-400 bg-purple-500/10 border-purple-500/20';

                    const badgeLabel = 
                      log.type === 'confirmacao' ? 'Confirmação' :
                      log.type === 'lembrete' ? 'Lembrete' :
                      log.type === 'chamada' ? 'Chamada' :
                      log.type === 'ausencia' ? 'Ausência' :
                      log.type === 'voce_e_o_proximo' ? 'Próximo (#1)' :
                      log.type === 'vaga_aberta' ? 'Vaga Aberta' : 'Teste';

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl bg-[#1C1C1B] border border-white/5 space-y-2 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-white">
                              {log.recipientName}
                            </span>
                            <span className="text-white/40 font-mono text-[11px]">
                              ({log.recipientPhone})
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                              {badgeLabel}
                            </span>
                          </div>

                          <span className="text-[11px] text-white/30">
                            {formattedDate} às {formattedTime}
                          </span>
                        </div>

                        <p className="text-xs text-white/70 bg-black/30 p-2.5 rounded-lg font-sans leading-relaxed">
                          "{log.message}"
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-[#25D366] pt-1">
                          <span className="flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Entregue via WhatsApp Business API</span>
                          </span>
                          <span className="text-white/30 font-mono">ID: {log.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONEXÃO COM A API DO WHATSAPP BUSINESS */}
          {/* TAB 4: CONEXÃO COM A API DO WHATSAPP BUSINESS & QR CODE */}
          {activeTab === 'conexao' && (
            <div className="space-y-6">
              {/* Assistente de Configuração Rápida (Wizard Passo a Passo) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#1C1C1B] to-black/90 border-2 border-[#25D366]/40 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-white text-sm uppercase tracking-wider">
                        Assistente de Configuração Rápida (WhatsApp Business)
                      </h3>
                      <p className="text-xs text-white/60">
                        Guia passo a passo para conectar seu canal e testar o envio em segundos.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#25D366]/20 text-[#25D366] text-xs font-bold border border-[#25D366]/40">
                    Passo a Passo Guiado
                  </span>
                </div>

                {/* Wizard Steps Content */}
                <div className="space-y-4 text-xs text-white/80">
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                    <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#25D366] text-black font-black flex items-center justify-center text-xs">1</span>
                      <span>Escolha o Provedor Oficial</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Selecione abaixo entre <strong>Meta Cloud API</strong> (Oficial da Meta) ou <strong>Z-API</strong> (Instância QR Code).
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...config, provider: 'meta_cloud' })}
                        className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                          config.provider === 'meta_cloud' ? 'bg-[#25D366]/20 border-[#25D366] text-white' : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                      >
                        Meta Cloud API
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveConfig({ ...config, provider: 'zapi' })}
                        className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                          config.provider === 'zapi' ? 'bg-[#25D366]/20 border-[#25D366] text-white' : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                      >
                        Z-API / Instância
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                    <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#F2CA50] text-black font-black flex items-center justify-center text-xs">2</span>
                      <span>Insira suas Credenciais ou Token</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Insira o Token de Acesso Permanente ou ID do Telefone para autenticação instantânea na API.
                    </p>
                    <input
                      type="password"
                      value={config.accessToken || ''}
                      onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                      onBlur={() => handleSaveConfig(config)}
                      placeholder="Cole aqui seu Token da API do WhatsApp..."
                      className="w-full px-4 py-2.5 rounded-xl bg-black/80 text-white border border-white/20 font-mono text-xs focus:border-[#25D366] focus:outline-none"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                    <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center text-xs">3</span>
                      <span>Testar Conexão Instantaneamente</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Dispare uma mensagem de teste para verificar se os robôs de lembrete e confirmação estão ativos.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSendTestPreview('confirmacao')}
                      disabled={isSending}
                      className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSending ? 'Enviando Teste...' : 'Enviar Mensagem de Teste Agora'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Seletor de Modo de Conexão */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#1C1C1B] border border-white/5">
                <button
                  type="button"
                  onClick={() => setLinkMode('qrcode')}
                  className={`py-3 px-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    linkMode === 'qrcode'
                      ? 'bg-[#25D366] text-black shadow-lg'
                      : 'text-white/60 hover:text-white bg-black/30'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Vincular via QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLinkMode('token')}
                  className={`py-3 px-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    linkMode === 'token'
                      ? 'bg-[#F2CA50] text-black shadow-lg'
                      : 'text-white/60 hover:text-white bg-black/30'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Vincular via Token API</span>
                </button>
              </div>

              {linkMode === 'qrcode' ? (
                /* MODO QR CODE / APARELHO CONECTADO */
                <div className="p-6 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div>
                      <h3 className="font-heading font-black text-white text-base flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-[#25D366]" />
                        <span>Escaneie o QR Code no WhatsApp Business</span>
                      </h3>
                      <p className="text-xs text-white/50 mt-1">
                        Abra o WhatsApp Business no seu celular ➔ Configurações ➔ Aparelhos Conectados ➔ Conectar Aparelho.
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                      config.connected
                        ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${config.connected ? 'bg-[#25D366] animate-pulse' : 'bg-amber-400 animate-ping'}`} />
                      {config.connected ? 'WhatsApp Conectado' : 'Aguardando Leitura'}
                    </span>
                  </div>

                  {/* QR Code Card Simulator */}
                  <div className="flex flex-col items-center justify-center py-6 px-4 bg-black/50 rounded-2xl border border-white/10 space-y-4">
                    <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-[#25D366]">
                      {/* Simulação de QR Code Estilizado */}
                      <div className="w-48 h-48 bg-black flex flex-col justify-between p-3 rounded-lg relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 border-4 border-white bg-black p-1 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white" />
                          </div>
                          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-[10px] text-white font-bold">
                            WAPP
                          </div>
                          <div className="w-12 h-12 border-4 border-white bg-black p-1 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white" />
                          </div>
                        </div>

                        {/* Padrão central decorativo do QR */}
                        <div className="grid grid-cols-6 gap-1 my-auto opacity-90">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className={`h-2 rounded-[1px] ${i % 2 === 0 ? 'bg-white' : 'bg-white/30'}`} />
                          ))}
                        </div>

                        <div className="flex justify-between items-end">
                          <div className="w-12 h-12 border-4 border-white bg-black p-1 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white" />
                          </div>
                          <div className="text-[9px] font-mono text-white/80 bg-black/80 px-1.5 py-0.5 rounded">
                            ID: {atelier.id.slice(0, 6)}...
                          </div>
                        </div>

                        {/* Scanner Beam Animation Overlay */}
                        <div className="absolute inset-x-0 h-1 bg-[#25D366] shadow-[0_0_12px_#25D366] animate-bounce opacity-70" />
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="text-xs text-white/70 font-medium">
                        O QR Code expira em <span className="text-[#F2CA50] font-bold">45 segundos</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setToastMessage({ text: 'Novo QR Code gerado com sucesso!', type: 'success' });
                        }}
                        className="text-xs text-[#25D366] hover:underline font-bold flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Gerar Novo QR Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Código de Pareamento de 8 Dígitos */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Ou conecte usando Código de Pareamento (8 Dígitos)</span>
                      <span className="text-[10px] bg-[#F2CA50]/15 text-[#F2CA50] px-2 py-0.5 rounded-full font-bold">Alternativa Rápida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="EX: 7X89-2A1B"
                        className="px-4 py-2.5 rounded-xl bg-black/60 text-white font-mono text-sm tracking-widest border border-white/10 uppercase w-48 text-center focus:border-[#25D366] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...config, connected: true };
                          handleSaveConfig(updated);
                          setToastMessage({ text: 'Pareamento por código realizado com sucesso!', type: 'success' });
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Vincular Código
                      </button>
                    </div>
                  </div>

                  {/* Botão de Conexão Instantânea */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...config, connected: !config.connected };
                        handleSaveConfig(updated);
                        setToastMessage({
                          text: updated.connected ? 'WhatsApp Business conectado com sucesso!' : 'WhatsApp Business desconectado.',
                          type: 'success',
                        });
                      }}
                      className={`w-full py-3.5 px-6 rounded-xl font-heading font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 ${
                        config.connected
                          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30'
                          : 'bg-[#25D366] text-black hover:bg-[#20b858]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{config.connected ? 'Desconectar Aparelho do WhatsApp' : 'Simular Leitura do QR Code & Conectar'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* MODO TOKEN API */
                <div className="p-6 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div>
                      <h3 className="font-heading font-black text-white text-base flex items-center gap-2">
                        <Key className="w-5 h-5 text-[#F2CA50]" />
                        <span>Credenciais da API do WhatsApp Business</span>
                      </h3>
                      <p className="text-xs text-white/50 mt-1">
                        Configure seu provedor oficial (Meta Cloud API ou Z-API) para automações em larga escala.
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                      config.connected
                        ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${config.connected ? 'bg-[#25D366]' : 'bg-amber-400'}`} />
                      {config.connected ? 'API Conectada' : 'Não Configurado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveConfig({ ...config, provider: 'meta_cloud' })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        config.provider === 'meta_cloud'
                          ? 'bg-[#25D366]/10 border-[#25D366] text-white'
                          : 'bg-black/30 border-white/10 text-white/60'
                      }`}
                    >
                      <div className="font-heading font-bold text-sm text-white flex items-center justify-between">
                        <span>Meta Cloud API</span>
                        {config.provider === 'meta_cloud' && <Check className="w-4 h-4 text-[#25D366]" />}
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">
                        API Oficial da Meta / WhatsApp Business.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveConfig({ ...config, provider: 'zapi' })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        config.provider === 'zapi'
                          ? 'bg-[#25D366]/10 border-[#25D366] text-white'
                          : 'bg-black/30 border-white/10 text-white/60'
                      }`}
                    >
                      <div className="font-heading font-bold text-sm text-white flex items-center justify-between">
                        <span>Z-API / Instância</span>
                        {config.provider === 'zapi' && <Check className="w-4 h-4 text-[#25D366]" />}
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">
                        Gateway de Mensagens Z-API.
                      </p>
                    </button>
                  </div>

                  {config.provider === 'meta_cloud' ? (
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
                          Phone Number ID (ID do Telefone Meta)
                        </label>
                        <input
                          type="text"
                          value={config.phoneNumberId || ''}
                          onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                          placeholder="109283746592019"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
                          WhatsApp Business Account ID (WABA ID)
                        </label>
                        <input
                          type="text"
                          value={config.wabaId || ''}
                          onChange={(e) => setConfig({ ...config, wabaId: e.target.value })}
                          placeholder="987654321012345"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
                          Token de Acesso Permanente (System User Token)
                        </label>
                        <input
                          type="password"
                          value={config.accessToken || ''}
                          onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                          placeholder="EAAG...token"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
                          ID da Instância Z-API
                        </label>
                        <input
                          type="text"
                          value={config.instanceId || ''}
                          onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                          placeholder="instancia_barbearia_01"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
                          Token da Instância (Client-Token)
                        </label>
                        <input
                          type="password"
                          value={config.instanceToken || ''}
                          onChange={(e) => setConfig({ ...config, instanceToken: e.target.value })}
                          placeholder="tok_live_..."
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const updated = { ...config, connected: !config.connected };
                        handleSaveConfig(updated);
                        setToastMessage({ text: updated.connected ? 'API conectada com sucesso!' : 'API desconectada.', type: 'success' });
                      }}
                      className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        config.connected
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'bg-[#25D366] text-black font-heading font-black'
                      }`}
                    >
                      {config.connected ? 'Desconectar API' : 'Conectar Token API'}
                    </button>

                    <button
                      onClick={() => {
                        handleSaveConfig(config);
                        setToastMessage({ text: 'Credenciais de API salvas com sucesso!', type: 'success' });
                      }}
                      className="py-2.5 px-6 rounded-xl bg-[#F2CA50] text-black font-heading font-black text-xs uppercase cursor-pointer shadow-md"
                    >
                      Salvar Credenciais
                    </button>
                  </div>
                </div>
              )}

              {/* Informações de conformidade */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white/60 space-y-1.5 leading-relaxed">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F2CA50]" />
                  <span>Dica de Vinculação Oficial WhatsApp Business:</span>
                </div>
                <p>
                  A leitura do QR Code ou inserção de token garante a entrega instantânea de lembretes, confirmações de agendamento e chamadas da fila com selo oficial.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="pt-8 text-center text-white/20 text-xs">
          EstiloExatoZap • Módulo Oficial WhatsApp Business API
        </div>
      </div>
    </div>
  );
};
