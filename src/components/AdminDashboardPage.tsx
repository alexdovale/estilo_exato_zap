import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Settings, 
  LogOut, 
  UserPlus, 
  Check, 
  Share2, 
  MessageSquare, 
  Scissors, 
  Clock, 
  Sparkles, 
  Smartphone, 
  DollarSign, 
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Bell,
  Calendar,
  Users,
  CreditCard,
  ArrowUpRight,
  Target,
  Award,
  Package,
  AlertTriangle,
  QrCode,
  BellRing,
  BellOff
} from 'lucide-react';
import { QueueItem, AtelierProfile, Appointment, Transaction, InventoryProduct } from '../types';
import { queueRepository, atelierRepository, financeRepository, whatsappRepository, clientRepository, appointmentRepository, inventoryRepository } from '../services/store';
import { broadcastRealtimeEvent } from '../services/notificationService';
import { CheckoutPaymentModal } from './CheckoutPaymentModal';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { QueueCheckInQrModal } from './QueueCheckInQrModal';
import { LoyaltySettingsModal } from './LoyaltySettingsModal';

interface AdminDashboardPageProps {
  atelier: AtelierProfile;
  isAdmin: boolean;
  onOpenFinanceReport: () => void;
  onOpenProfile: () => void;
  onOpenWhatsApp: () => void;
  onLogout: () => void;
  onOpenWalkIn: () => void;
  onViewPublicQueue: () => void;
  onOpenLocation?: () => void;
  onOpenClientPortal?: () => void;
  onOpenPaymentSettings?: () => void;
  onOpenInventory?: () => void;
  pushPermission?: NotificationPermission;
  ownerPushEnabled?: boolean;
  onRequestPushPermission?: () => Promise<void>;
  onToggleOwnerPush?: () => void;
  onTestOwnerPush?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  atelier,
  isAdmin,
  onOpenFinanceReport,
  onOpenProfile,
  onOpenWhatsApp,
  onLogout,
  onOpenWalkIn,
  onViewPublicQueue,
  onOpenLocation,
  onOpenClientPortal,
  onOpenPaymentSettings,
  onOpenInventory,
  pushPermission = 'default',
  ownerPushEnabled = true,
  onRequestPushPermission,
  onToggleOwnerPush,
  onTestOwnerPush,
}) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isNotifyingNext, setIsNotifyingNext] = useState<string | null>(null);
  const [isNotifyingSlot, setIsNotifyingSlot] = useState(false);
  const [activeFinishItem, setActiveFinishItem] = useState<QueueItem | null>(null);
  const [notificationToast, setNotificationToast] = useState<{ name: string; phone: string; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'fila' | 'dashboard'>('fila');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<InventoryProduct[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(() => financeRepository.getDailyGoal(atelier.id));
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoalVal, setTempGoalVal] = useState<string>(() => String(financeRepository.getDailyGoal(atelier.id)));

  const loadData = () => {
    const items = queueRepository.getQueue(atelier.id);
    setQueue(items);
    setAppointments(appointmentRepository.getAppointments(atelier.id));
    setTransactions(financeRepository.getTransactions(atelier.id));
    setLowStockProducts(inventoryRepository.getLowStockProducts(atelier.id));
    setDailyGoal(financeRepository.getDailyGoal(atelier.id));
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    const handleMeta = () => {
      setDailyGoal(financeRepository.getDailyGoal(atelier.id));
    };

    window.addEventListener('estilo_store_updated', handleUpdate);
    window.addEventListener('estilo_meta_updated', handleMeta);
    return () => {
      window.removeEventListener('estilo_store_updated', handleUpdate);
      window.removeEventListener('estilo_meta_updated', handleMeta);
    };
  }, [atelier.id]);

  // Faturamento Realizado Hoje
  const todayRevenue = transactions
    .filter(t => {
      const d = new Date(t.data);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((acc, t) => acc + t.valor, 0);

  const todayGoalPercent = dailyGoal > 0 ? Math.round((todayRevenue / dailyGoal) * 100) : 0;
  const isTodayGoalReached = todayRevenue >= dailyGoal;

  const inService = queue.filter((item) => item.status === 'in_service');
  const waiting = queue.filter((item) => item.status === 'waiting');

  // Call Next Client
  const handleCallNext = async (item: QueueItem) => {
    setIsNotifying(true);
    try {
      const message = await queueRepository.notifyClient(
        item.phone || '11999999999',
        item.clientName,
        atelier.nome_negocio
      );

      // Show toast on UI with WhatsApp simulated notification
      setNotificationToast({
        name: item.clientName,
        phone: item.phone || '',
        message,
      });

      // Move to chair
      await queueRepository.callNext(item.id);

      // Broadcast real-time chair_called event (WebSocket & Push)
      broadcastRealtimeEvent({
        atelierId: atelier.id,
        type: 'chair_called',
        targetClientPhone: item.phone,
        targetClientName: item.clientName,
        title: '💈 Sua Vez Chegou!',
        message: `Olá ${item.clientName}! O barbeiro está pronto na cadeira. Pode se dirigir agora!`,
      });

      // Automatic trigger for new #1 waiting client if present
      if (waiting.length > 1) {
        const nextInLine = waiting[1];
        if (nextInLine) {
          // Broadcast real-time you_are_next event (WebSocket & Push)
          broadcastRealtimeEvent({
            atelierId: atelier.id,
            type: 'you_are_next',
            targetClientPhone: nextInLine.phone,
            targetClientName: nextInLine.clientName,
            title: '✂️ Você é o Próximo!',
            message: `Olá ${nextInLine.clientName}! Você agora é o próximo da fila no ${atelier.nome_negocio}. Fique atento(a)!`,
          });

          const config = whatsappRepository.getConfig(atelier.id);
          if (config.autoSendYouAreNext && nextInLine.phone) {
            setTimeout(async () => {
              try {
                await queueRepository.notifyYouAreNext(
                  nextInLine.phone || '',
                  nextInLine.clientName,
                  atelier.nome_negocio
                );
              } catch (err) {
                console.error(err);
              }
            }, 800);
          }
        }
      }

      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsNotifying(false);
    }
  };

  // Notificar manualmente que o cliente é o próximo
  const handleNotifyYouAreNext = async (item: QueueItem) => {
    setIsNotifyingNext(item.id);
    try {
      // Verificar se o cliente tem permissão individual ativa
      const podeReceber = clientRepository.canClientReceive(item.phone || item.clientName, 'proximo');
      if (!podeReceber) {
        setNotificationToast({
          name: item.clientName,
          phone: item.phone || '',
          message: `⚠️ Aviso não enviado: O cliente ${item.clientName} desabilitou notificações de 'Próximo da Fila' nas configurações.`,
        });
        return;
      }

      // 1. Broadcast push em tempo real (WebSocket & Push nativo)
      broadcastRealtimeEvent({
        atelierId: atelier.id,
        type: 'you_are_next',
        targetClientPhone: item.phone,
        targetClientName: item.clientName,
        title: '✂️ Você é o Próximo!',
        message: `Olá ${item.clientName}! Você é o próximo da fila no ${atelier.nome_negocio}. Fique atento(a)!`,
      });

      // 2. Notificação via WhatsApp
      const message = await queueRepository.notifyYouAreNext(
        item.phone || '11999999999',
        item.clientName,
        atelier.nome_negocio
      );
      setNotificationToast({
        name: item.clientName,
        phone: item.phone || '',
        message,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsNotifyingNext(null);
    }
  };

  // Notificar clientes em espera que abriu vaga na cadeira
  const handleNotifySlotOpened = async () => {
    if (waiting.length === 0) return;
    setIsNotifyingSlot(true);
    try {
      // Filtrar apenas clientes que permitiram aviso de vaga aberta
      const clientesAutorizados = waiting.filter(item => 
        clientRepository.canClientReceive(item.phone || item.clientName, 'vaga_aberta')
      );

      if (clientesAutorizados.length === 0) {
        setNotificationToast({
          name: 'Aviso de Vaga Aberta',
          phone: 'Nenhum cliente apto',
          message: 'Os clientes na fila desabilitaram avisos de vaga aberta nas configurações individuais.',
        });
        return;
      }

      // 1. Broadcast push em tempo real para todos os clientes conectados
      broadcastRealtimeEvent({
        atelierId: atelier.id,
        type: 'slot_opened',
        title: '🚪 Vaga Aberta na Cadeira!',
        message: `Uma vaga acabou de abrir na cadeira do ${atelier.nome_negocio}! Venha agora ou acompanhe sua posição.`,
      });

      // 2. Envio de WhatsApp para os clientes autorizados da fila
      const { count, message } = await queueRepository.notifySlotOpened(
        clientesAutorizados,
        atelier.nome_negocio
      );
      setNotificationToast({
        name: `${count} cliente(s) notificado(s)`,
        phone: 'Aviso de Vaga Aberta',
        message: message || `Aviso de vaga aberta enviado para ${count} cliente(s) autorizados da fila!`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsNotifyingSlot(false);
    }
  };

  // Open finish modal
  const handleOpenFinishModal = (item: QueueItem) => {
    setActiveFinishItem(item);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/#/fila/${atelier.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white flex flex-col justify-between select-none">
      {/* Top AppBar matching Flutter AppBar */}
      <header className="sticky top-0 z-40 bg-[#131313]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/COMPLETO.png"
            alt="Estilo Exato"
            className="h-9 sm:h-11 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="font-heading font-black text-xs sm:text-sm tracking-wider text-[#F2CA50] uppercase">
              {atelier.nome_negocio}
            </h1>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold block">
              {isAdmin ? 'PAINEL ADMINISTRATIVO' : 'PAINEL DA EQUIPE'}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsQrModalOpen(true)}
            title="QR Code de Check-in na Recepção (Imprimir)"
            className="p-2 sm:p-2.5 rounded-xl text-[#F2CA50] hover:bg-[#F2CA50]/10 transition-colors cursor-pointer"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (pushPermission !== 'granted' && onRequestPushPermission) {
                  void onRequestPushPermission();
                } else if (onToggleOwnerPush) {
                  onToggleOwnerPush();
                }
              }}
              title={
                pushPermission === 'granted'
                  ? ownerPushEnabled
                    ? 'Notificações Push Ativas (Clique para pausar)'
                    : 'Notificações Push Pausadas (Clique para reativar)'
                  : pushPermission === 'denied'
                  ? 'Notificações bloqueadas nas permissões do navegador'
                  : 'Ativar Notificações Push de Novos Clientes'
              }
              className={`p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer relative ${
                pushPermission === 'granted' && ownerPushEnabled
                  ? 'text-[#25D366] hover:bg-[#25D366]/10'
                  : pushPermission === 'denied'
                  ? 'text-white/30 hover:bg-white/5'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              {pushPermission === 'granted' && ownerPushEnabled ? (
                <>
                  <BellRing className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                </>
              ) : pushPermission === 'denied' || !ownerPushEnabled ? (
                <BellOff className="w-5 h-5" />
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenFinanceReport}
              title="Relatórios Financeiros"
              className="p-2 sm:p-2.5 rounded-xl text-[#F2CA50] hover:bg-[#F2CA50]/10 transition-colors cursor-pointer"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          )}

          {isAdmin && onOpenInventory && (
            <button
              onClick={onOpenInventory}
              title="Gestão de Estoque de Produtos"
              className="p-2 sm:p-2.5 rounded-xl text-[#F2CA50] hover:bg-[#F2CA50]/10 transition-colors cursor-pointer relative"
            >
              <Package className="w-5 h-5" />
              {lowStockProducts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow">
                  {lowStockProducts.length}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsLoyaltyModalOpen(true)}
              title="Configurar Cartão Fidelidade Digital"
              className="p-2 sm:p-2.5 rounded-xl text-[#F2CA50] hover:bg-[#F2CA50]/10 transition-colors cursor-pointer"
            >
              <Award className="w-5 h-5" />
            </button>
          )}

          {isAdmin && onOpenPaymentSettings && (
            <button
              onClick={onOpenPaymentSettings}
              title="Configurações de Pagamento & Métodos Ativos"
              className="p-2 sm:p-2.5 rounded-xl text-[#F2CA50] hover:bg-[#F2CA50]/10 transition-colors cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenWhatsApp}
              title="Automação WhatsApp Business API"
              className="p-2 sm:p-2.5 rounded-xl text-[#25D366] hover:bg-[#25D366]/10 transition-colors cursor-pointer relative"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            </button>
          )}

          {onOpenLocation && (
            <button
              onClick={onOpenLocation}
              title="Localização & Como Chegar (Google Maps)"
              className="p-2 sm:p-2.5 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              <MapPin className="w-5 h-5" />
            </button>
          )}

          {onOpenClientPortal && (
            <button
              onClick={onOpenClientPortal}
              title="Acessar Área do Cliente (Visão do Cliente)"
              className="p-2 sm:p-2.5 rounded-xl text-[#F2CA50] hover:bg-[#F2CA50]/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <Sparkles className="w-5 h-5 text-[#F2CA50]" />
              <span className="hidden sm:inline">Tela Cliente</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenProfile}
              title="Configurações do Atelier"
              className="p-2 sm:p-2.5 rounded-xl text-[#F2CA50] hover:bg-[#F2CA50]/10 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onLogout}
            title="Sair da Conta"
            className="p-2 sm:p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col justify-between transition-all duration-300 ${dashboardTab === 'dashboard' ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="space-y-6">
          {/* Segmented View Control: Fila de Atendimento vs Dashboard Analítico */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setDashboardTab('fila')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                dashboardTab === 'fila'
                  ? 'bg-[#F2CA50] text-black shadow-lg shadow-[#F2CA50]/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Fila em Tempo Real ({waiting.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setDashboardTab('dashboard')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                dashboardTab === 'dashboard'
                  ? 'bg-[#F2CA50] text-black shadow-lg shadow-[#F2CA50]/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard Analítico</span>
            </button>
          </div>

          {dashboardTab === 'dashboard' ? (
            <AdminAnalyticsDashboard
              atelier={atelier}
              transactions={transactions}
              queue={queue}
              onOpenPaymentSettings={onOpenPaymentSettings}
            />
          ) : (
            <>
              {/* Header Count & Financial Shortcut */}
              <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/5">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                    {isAdmin ? 'PAINEL ADMINISTRATIVO' : 'PAINEL DA EQUIPE'}
                  </div>
                  <div className="font-heading text-3xl sm:text-4xl font-black text-white mt-1">
                    {waiting.length} {waiting.length === 1 ? 'cliente na fila' : 'clientes na fila'}
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenFinanceReport}
                    className="px-3.5 py-2 rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/30 hover:border-[#F2CA50] text-[#F2CA50] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    title="Abrir Painel Financeiro, Gráficos e Tendências de 30 Dias"
                  >
                    <TrendingUp className="w-4 h-4 text-[#F2CA50]" />
                    <span className="hidden sm:inline">Financeiro & Gráficos</span>
                    <span className="sm:hidden">Financeiro</span>
                  </button>
                )}
              </div>

              {/* Cards de Resumo em Tempo Real */}
              <div className="grid grid-cols-3 gap-3">
                {/* Card 1: Total de Atendimentos Hoje */}
                <div className="p-3.5 rounded-2xl bg-[#1C1C1B] border border-white/10 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-white/40">
                    <span className="text-[9px] font-black uppercase tracking-wider truncate">ATENDIMENTOS HOJE</span>
                    <Calendar className="w-3.5 h-3.5 text-[#F2CA50]" />
                  </div>
                  <div className="mt-2 font-heading text-xl sm:text-2xl font-black text-white">
                    {transactions.filter(t => new Date(t.data).toDateString() === new Date().toDateString()).length}
                  </div>
                  <span className="text-[10px] text-white/40 font-bold mt-0.5">
                    Concluídos hoje
                  </span>
                </div>

                {/* Card 2: Clientes na Fila */}
                <div className="p-3.5 rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/30 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-[#F2CA50]">
                    <span className="text-[9px] font-black uppercase tracking-wider truncate">NA FILA AGORA</span>
                    <Users className="w-3.5 h-3.5 text-[#F2CA50]" />
                  </div>
                  <div className="mt-2 font-heading text-xl sm:text-2xl font-black text-[#F2CA50]">
                    {waiting.length}
                  </div>
                  <span className="text-[10px] text-[#F2CA50]/70 font-bold mt-0.5">
                    Aguardando vez
                  </span>
                </div>

                {/* Card 3: Faturamento Acumulado */}
                <div className="p-3.5 rounded-2xl bg-[#1C1C1B] border border-emerald-500/30 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-[9px] font-black uppercase tracking-wider truncate">FATURADO MÊS</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="mt-2 font-heading text-lg sm:text-xl font-black text-emerald-400 truncate">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financeRepository.calculateStats(transactions).month)}
                  </div>
                  <span className="text-[10px] text-emerald-400/70 font-bold mt-0.5">
                    Acumulado do mês
                  </span>
                </div>
              </div>

              {/* Card de Meta Diária de Faturamento e Barra de Progresso Motivacional */}
              <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isTodayGoalReached ? 'bg-[#25D366] text-black shadow-md animate-pulse' : 'bg-[#F2CA50]/20 text-[#F2CA50]'
                    }`}>
                      {isTodayGoalReached ? <Award className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                          Meta Diária da Equipe
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isTodayGoalReached
                            ? 'bg-[#25D366] text-black font-extrabold shadow-sm'
                            : 'bg-[#F2CA50]/20 text-[#F2CA50] border border-[#F2CA50]/30'
                        }`}>
                          {todayGoalPercent}% {isTodayGoalReached ? 'ATINGIDA!' : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/50">
                        {isTodayGoalReached 
                          ? '🎉 Meta superada! Excelente trabalho da equipe!' 
                          : `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, dailyGoal - todayRevenue))} para bater a meta`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-heading font-black text-xs sm:text-sm text-white">
                      <span className={isTodayGoalReached ? 'text-[#25D366]' : 'text-[#F2CA50]'}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayRevenue)}
                      </span>
                      <span className="text-white/40 text-[11px] font-normal"> / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dailyGoal)}</span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempGoalVal(String(dailyGoal));
                          setShowGoalModal(true);
                        }}
                        className="text-[10px] text-[#F2CA50] hover:underline font-bold cursor-pointer block mt-0.5"
                      >
                        Definir Meta
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso com Gradiente */}
                <div className="relative w-full h-3.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                      isTodayGoalReached
                        ? 'bg-gradient-to-r from-[#F2CA50] via-emerald-400 to-[#25D366] shadow-md shadow-[#25D366]/40'
                        : 'bg-gradient-to-r from-amber-500 via-[#F2CA50] to-[#25D366]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, todayGoalPercent))}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-white/5">
                  <span className="text-white/40 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#F2CA50]" />
                    <span>Progresso de faturamento hoje</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setDashboardTab('dashboard')}
                    className="text-[#F2CA50] hover:text-[#ebd05d] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Ver no Gráfico</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card de Notificações Push em Tempo Real para o Proprietário */}
              {isAdmin && (
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                    pushPermission === 'granted' && ownerPushEnabled
                      ? 'bg-[#25D366]/10 border-[#25D366]/30'
                      : pushPermission === 'denied'
                      ? 'bg-[#1C1C1B] border-white/10'
                      : 'bg-[#F2CA50]/10 border-[#F2CA50]/35'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        pushPermission === 'granted' && ownerPushEnabled
                          ? 'bg-[#25D366]/20 text-[#25D366]'
                          : pushPermission === 'denied'
                          ? 'bg-white/5 text-white/40'
                          : 'bg-[#F2CA50]/20 text-[#F2CA50]'
                      }`}
                    >
                      {pushPermission === 'granted' && ownerPushEnabled ? (
                        <BellRing className="w-4 h-4" />
                      ) : pushPermission === 'denied' || !ownerPushEnabled ? (
                        <BellOff className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4 animate-bounce" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        {pushPermission === 'granted' && ownerPushEnabled
                          ? 'Alertas Push em Tempo Real Ativos'
                          : pushPermission === 'granted' && !ownerPushEnabled
                          ? 'Alertas Push Pausados'
                          : pushPermission === 'denied'
                          ? 'Permissão Push Bloqueada no Navegador'
                          : 'Ativar Alertas Push de Novos Clientes'}
                      </div>
                      <p className="text-[11px] text-white/60 truncate mt-0.5">
                        {pushPermission === 'granted' && ownerPushEnabled
                          ? 'Você será notificado imediatamente quando um cliente entrar na fila.'
                          : pushPermission === 'denied'
                          ? 'Libere as notificações na barra de endereço do navegador (alertas na tela continuam ativos).'
                          : 'Receba alertas no navegador e som de aviso ao entrar um novo cliente.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {pushPermission !== 'granted' && pushPermission !== 'denied' && onRequestPushPermission && (
                      <button
                        type="button"
                        onClick={() => void onRequestPushPermission()}
                        className="px-3 py-1.5 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-[10px] uppercase tracking-wider cursor-pointer transition-transform active:scale-95"
                      >
                        Ativar Push
                      </button>
                    )}

                    {pushPermission === 'granted' && onToggleOwnerPush && (
                      <button
                        type="button"
                        onClick={onToggleOwnerPush}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase border cursor-pointer ${
                          ownerPushEnabled
                            ? 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                            : 'bg-[#25D366] text-black border-[#25D366] font-black'
                        }`}
                      >
                        {ownerPushEnabled ? 'Pausar' : 'Reativar'}
                      </button>
                    )}

                    {onTestOwnerPush && (
                      <button
                        type="button"
                        onClick={onTestOwnerPush}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F2CA50] border border-[#F2CA50]/30 text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Testar Alerta
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Alerta Compacto de Estoque Baixo (Reposição) */}
              {isAdmin && onOpenInventory && lowStockProducts.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-heading font-black text-xs text-red-300 uppercase tracking-wider">
                        Alerta de Reposição ({lowStockProducts.length} {lowStockProducts.length === 1 ? 'produto' : 'produtos'})
                      </div>
                      <p className="text-[11px] text-white/70 truncate mt-0.5">
                        {lowStockProducts.map(p => `${p.nome} (${p.quantidadeAtual} ${p.unidade})`).join(' • ')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenInventory}
                    className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-heading font-black text-[10px] uppercase tracking-wider shrink-0 cursor-pointer transition-colors"
                  >
                    Gerenciar Estoque
                  </button>
                </div>
              )}

          {/* Status do Expediente & Vagas do Dia */}
          {(() => {
            const exp = atelierRepository.getExpedienteStatus(atelier.id);
            return (
              <div className="p-3.5 rounded-2xl bg-[#1C1C1B] border border-white/5 flex items-center justify-between gap-3 text-xs shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${exp.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">
                      {exp.currentDayName}: {exp.horarioHoje}
                    </span>
                    <span className="text-[11px] text-white/50 block truncate">
                      {exp.message}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-[#F2CA50] block">
                    Vagas Hoje
                  </span>
                  <span className="font-heading font-black text-sm text-white">
                    {exp.vagasRestantes} <span className="text-white/40 text-xs font-normal">/ {exp.totalVagas}</span>
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Section: ATENDIMENTO ATUAL */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
              ATENDIMENTO ATUAL
            </div>

                {inService.length > 0 ? (
                  <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/30 shadow-lg flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-green-400">
                          EM ATENDIMENTO
                        </span>
                      </div>
                      <h3 className="font-heading text-xl sm:text-2xl font-bold text-white truncate">
                        {inService[0].clientName}
                      </h3>
                      <p className="text-xs font-bold text-[#F2CA50] uppercase tracking-wider mt-0.5">
                        {inService[0].service}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenFinishModal(inService[0])}
                      className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-green-900/30 transition-transform active:scale-95 shrink-0 cursor-pointer"
                    >
                      FINALIZAR
                    </button>
                  </div>
                ) : (
                  <div className="w-full py-7 px-6 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                    <Scissors className="w-6 h-6 text-white/20 mb-2" />
                    <span className="font-heading font-black text-xs uppercase tracking-widest text-white/30">
                      CADEIRA DISPONÍVEL
                    </span>
                    <span className="text-[11px] text-white/20 mt-1">
                      Chame o próximo cliente da fila abaixo
                    </span>
                    {waiting.length > 0 && (
                      <button
                        type="button"
                        onClick={handleNotifySlotOpened}
                        disabled={isNotifyingSlot}
                        className="mt-3.5 py-2 px-3.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-xs font-heading font-black tracking-wider uppercase flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        title="Avisar a fila de espera no WhatsApp que a vaga abriu"
                      >
                        <Bell className="w-3.5 h-3.5 animate-bounce" />
                        <span>{isNotifyingSlot ? 'NOTIFICANDO FILA...' : 'AVISAR FILA QUE ABRIU VAGA'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Section: AGENDAMENTOS COM HORA MARCADA */}
              {appointments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>HORÁRIOS AGENDADOS ({appointments.filter(a => a.status === 'confirmado').length})</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {appointments.slice(0, 4).map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-xl bg-[#1C1C1B] border border-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-white truncate flex items-center gap-2">
                            <span>{apt.clientName}</span>
                            <span className="text-[10px] text-[#F2CA50] font-normal">
                              • {apt.serviceName}
                            </span>
                          </div>
                          <div className="text-[11px] text-white/50 truncate mt-0.5">
                            {apt.staffName || 'Barbeiro Disponível'}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-heading font-black text-xs text-[#F2CA50]">
                            {apt.data.split('-').reverse().slice(0, 2).join('/')} às {apt.horario}
                          </div>
                          <span className={`text-[9px] font-bold uppercase ${
                            apt.status === 'confirmado' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: FILA DE ESPERA */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    FILA DE ESPERA
                  </div>
                  <span className="text-xs text-[#F2CA50] font-bold">
                    {waiting.length} {waiting.length === 1 ? 'cliente' : 'clientes'}
                  </span>
                </div>

                {waiting.length === 0 ? (
                  <div className="py-10 text-center text-white/20 text-sm font-medium rounded-2xl bg-[#1C1C1B]/50 border border-white/5">
                    Fila vazia no momento
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {waiting.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-[#1C1C1B] border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="font-heading font-black text-[#F2CA50] text-lg w-7 shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-heading font-bold text-white text-sm truncate flex items-center gap-2">
                              <span>{item.clientName}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-[#F2CA50]/20 text-[#F2CA50] text-[9px] font-black uppercase tracking-wider border border-[#F2CA50]/30">
                                  Próximo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/40 truncate">
                              {item.service} • {item.origin === 'app' ? 'Agendado no App' : 'Presencial'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {idx === 0 && (
                            <button
                              type="button"
                              onClick={() => handleNotifyYouAreNext(item)}
                              disabled={isNotifyingNext === item.id}
                              title="Avisar cliente no WhatsApp que ele é o próximo!"
                              className="py-1.5 px-2.5 rounded-lg bg-[#F2CA50]/15 hover:bg-[#F2CA50]/25 text-[#F2CA50] text-[10px] font-heading font-black uppercase tracking-wider border border-[#F2CA50]/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Bell className="w-3 h-3 text-[#F2CA50]" />
                              <span>{isNotifyingNext === item.id ? 'Avisando...' : 'Avisar Próximo'}</span>
                            </button>
                          )}

                          {item.phone && (
                            <a
                              href={`https://wa.me/${item.phone.replace(/\D/g, '')}?text=Olá ${encodeURIComponent(item.clientName)}, sua vez está chegando no ${encodeURIComponent(atelier.nome_negocio)}!`}
                              target="_blank"
                              rel="noreferrer"
                              title="Conversar no WhatsApp"
                              className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => queueRepository.removeFromQueue(item.id)}
                            title="Remover da fila"
                            className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

        {/* Action Call Next Button */}
        <div className="pt-6 space-y-3">
          {waiting.length > 0 && inService.length === 0 && (
            <button
              onClick={() => handleCallNext(waiting[0])}
              disabled={isNotifying}
              className="w-full py-4 px-6 rounded-2xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm sm:text-base transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-[#F2CA50]/15 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {isNotifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>NOTIFICANDO NO WHATSAPP...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-black" />
                  <span>CHAMAR {waiting[0].clientName.toUpperCase()}</span>
                </>
              )}
            </button>
          )}

          {/* Share Link & QR Code Check-in Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-[#F2CA50]/15 hover:bg-[#F2CA50]/25 border border-[#F2CA50]/30 text-[#F2CA50] transition-colors flex items-center gap-2 text-xs font-heading font-black cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#F2CA50]" />
              <span>QR CODE RECEPÇÃO</span>
            </button>

            <button
              onClick={handleShareLink}
              className="py-2.5 px-4 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">LINK DA FILA COPIADO!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#F2CA50]" />
                  <span>COMPARTILHAR LINK DA FILA</span>
                </>
              )}
            </button>

              <button
                onClick={onViewPublicQueue}
                className="py-2.5 px-4 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#F2CA50]" />
                <span>VER FILA DO CLIENTE</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  </main>

      {/* Floating Action Button for Walk-in Registration */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={onOpenWalkIn}
          className="px-5 py-4 rounded-2xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider shadow-2xl shadow-black/80 flex items-center gap-2.5 cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus className="w-5 h-5 text-black" />
          <span>NOVO CLIENTE</span>
        </button>
      </div>

      {/* Notification Toast Simulated WhatsApp Notification */}
      {notificationToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#25D366] text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-slideUp">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold flex items-center justify-between">
              <span>WhatsApp Enviado com Sucesso! ✂️</span>
              <span className="text-[10px] opacity-75">agora</span>
            </div>
            <p className="mt-1 opacity-90 leading-relaxed font-sans">{notificationToast.message}</p>
          </div>
          <button
            onClick={() => setNotificationToast(null)}
            className="text-white/80 hover:text-white text-xs font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Checkout and Payment Modal (Pix QR Code, Maquininha de Cartão vinculada, Celular como Maquininha NFC, Dinheiro) */}
      {activeFinishItem && (
        <CheckoutPaymentModal
          item={activeFinishItem}
          atelier={atelier}
          initialServiceValue={50.0}
          onClose={() => setActiveFinishItem(null)}
          onSuccess={(tx, receiptMessage) => {
            setActiveFinishItem(null);
            loadData();
            if (receiptMessage) {
              setNotificationToast({
                name: tx.cliente_nome,
                phone: activeFinishItem.phone || 'WhatsApp',
                message: `Pagamento de ${tx.servico} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.valor)}) recebido! Comprovante enviado via WhatsApp.`,
              });
            } else {
              setNotificationToast({
                name: tx.cliente_nome,
                phone: 'Caixa / POS',
                message: `Atendimento finalizado e pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.valor)} recebido com sucesso!`,
              });
            }
          }}
        />
      )}

      {/* Modal para Definir Meta Diária de Faturamento no Dashboard Principal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#1C1C1B] border-2 border-[#F2CA50] rounded-3xl p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#F2CA50]" />
                <h3 className="font-heading font-black text-white text-base">
                  Definir Meta Diária da Equipe
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="text-white/40 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Defina o valor alvo de faturamento diário para motivar os barbeiros. A meta será exibida na barra de progresso em tempo real e no gráfico de atendimentos.
            </p>

            {/* Presets Rápidos */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">
                VALORES SUGERIDOS:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[400, 600, 800, 1000, 1200, 1500, 2000, 2500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTempGoalVal(String(preset))}
                    className={`py-2 px-1 rounded-xl text-xs font-heading font-black transition-all cursor-pointer border ${
                      Number(tempGoalVal) === preset
                        ? 'bg-[#F2CA50] text-black border-[#F2CA50] shadow-md'
                        : 'bg-black/40 text-white/70 border-white/10 hover:border-white/30'
                    }`}
                  >
                    R$ {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo Customizado */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">
                OU DIGITE UM VALOR PERSONALIZADO (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#F2CA50]">
                  R$
                </span>
                <input
                  type="number"
                  step="50"
                  min="50"
                  value={tempGoalVal}
                  onChange={(e) => setTempGoalVal(e.target.value)}
                  placeholder="Ex: 850"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white font-heading font-black text-lg focus:border-[#F2CA50] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white/60 hover:text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  const val = Number(tempGoalVal);
                  if (val > 0) {
                    financeRepository.setDailyGoal(atelier.id, val);
                    setDailyGoal(val);
                    setShowGoalModal(false);
                    setNotificationToast({
                      name: 'Meta Diária Atualizada',
                      phone: 'Configuração',
                      message: `A nova meta diária de faturamento foi definida para ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}!`,
                    });
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Meta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de QR Code de Check-in na Recepção */}
      {isQrModalOpen && (
        <QueueCheckInQrModal
          atelier={atelier}
          onClose={() => setIsQrModalOpen(false)}
          onViewPublicQueue={() => {
            setIsQrModalOpen(false);
            onViewPublicQueue();
          }}
        />
      )}

      {/* Modal de Configuração do Cartão Fidelidade Digital */}
      {isLoyaltyModalOpen && (
        <LoyaltySettingsModal
          atelier={atelier}
          onClose={() => {
            setIsLoyaltyModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
