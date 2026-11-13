import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  Check, 
  Circle, 
  Zap, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Gift, 
  Clock, 
  Scissors,
  ArrowRight,
  MapPin,
  Bell,
  Calendar,
  CalendarPlus,
  XCircle,
  Radio,
  ListOrdered,
  User,
  MessageSquare,
  Send,
  ThumbsUp,
  Activity,
  Users,
  Award,
  History,
  Crown,
  Coffee,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ClientProfile, QueueItem, AtelierProfile, Appointment, ServiceItem, StaffMember, ServiceFeedback, RealtimeWaitEstimate, LoyaltyConfig, LoyaltyHistoryItem, ClientLoyaltyPlan, DayAvailabilitySummary } from '../types';
import {
  clientRepository,
  queueRepository,
  atelierRepository,
  appointmentRepository,
  serviceRepository,
  teamRepository,
  feedbackRepository,
  planRepository,
} from '../services/store';
import { pushNotificationService, QueueRealtimeMonitor } from '../services/notificationService';
import { ClientBookingModal } from './ClientBookingModal';

interface ClientHomePageProps {
  client: ClientProfile;
  atelierId: string;
  onLogout: () => void;
  onGoToPublicQueue: () => void;
  onOpenLocation?: () => void;
}

export const ClientHomePage: React.FC<ClientHomePageProps> = ({
  client,
  atelierId,
  onLogout,
  onGoToPublicQueue,
  onOpenLocation,
}) => {
  const [currentClient, setCurrentClient] = useState<ClientProfile>(client);
  const [atelier, setAtelier] = useState<AtelierProfile | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(pushNotificationService.getPermission());

  // Post-service feedback state
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [clientFeedbacks, setClientFeedbacks] = useState<ServiceFeedback[]>([]);
  const [atelierRating, setAtelierRating] = useState<{ average: number; total: number }>({ average: 5, total: 0 });
  const [selectedRating, setSelectedRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackService, setFeedbackService] = useState<string>('');
  const [feedbackStaff, setFeedbackStaff] = useState<string>('');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [waitEstimate, setWaitEstimate] = useState<RealtimeWaitEstimate>(() =>
    queueRepository.getRealtimeWaitEstimate(atelierId, client.nome, client.id)
  );
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(() =>
    clientRepository.getLoyaltyConfig(atelierId)
  );
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyHistoryItem[]>([]);
  const [loyaltyPlans, setLoyaltyPlans] = useState<ClientLoyaltyPlan[]>([]);
  const [showLoyaltyHistory, setShowLoyaltyHistory] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<{
    voucherCode: string;
    rewardName: string;
  } | null>(null);

  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Integrated online booking state (synced with ScheduleSettingsModal)
  const [bookingServiceId, setBookingServiceId] = useState<string>('');
  const [bookingStaffId, setBookingStaffId] = useState<string>(''); // '' = Qualquer profissional
  const [bookingDate, setBookingDate] = useState<string>(() => toLocalDateStr(new Date()));
  const [bookingTime, setBookingTime] = useState<string>('');
  const [bookingRecurrence, setBookingRecurrence] = useState<'unico' | 'semanal' | 'quinzenal' | 'mensal'>('unico');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [scheduleSyncTick, setScheduleSyncTick] = useState<number>(0);

  const loadData = () => {
    const refreshedClient = clientRepository.getClient(client.id) || client;
    setCurrentClient(refreshedClient);
    setAtelier(atelierRepository.getAtelier(atelierId));
    setQueue(queueRepository.getQueue(atelierId));
    setWaitEstimate(
      queueRepository.getRealtimeWaitEstimate(atelierId, refreshedClient.nome, refreshedClient.id)
    );
    setLoyaltyConfig(clientRepository.getLoyaltyConfig(atelierId));
    setLoyaltyHistory(clientRepository.getLoyaltyHistory(refreshedClient.id, atelierId));
    setLoyaltyPlans(planRepository.getClientLoyaltyPlans(atelierId).filter((p) => p.ativo));
    const clientApts = appointmentRepository.getClientAppointments(client.id, atelierId);
    setAppointments(clientApts);

    const catalog = serviceRepository.getServices(atelierId);
    const team = teamRepository.getTeam(atelierId);
    setServicesList(catalog);
    setStaffList(team);
    setBookingServiceId((prev) =>
      prev && catalog.some((s) => s.id === prev) ? prev : catalog[0]?.id || ''
    );
    setClientFeedbacks(feedbackRepository.getClientFeedbacks(client.id, atelierId));
    setAtelierRating(feedbackRepository.getAverageRating(atelierId));

    setFeedbackService((prev) => prev || clientApts[0]?.serviceName || catalog[0]?.nome || 'Corte Degradê Fade');
    setFeedbackStaff((prev) => prev || clientApts[0]?.staffName || team[0]?.nome || 'Profissional do Atelier');
    setScheduleSyncTick((t) => t + 1);
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    await appointmentRepository.cancelAppointment(apptId);
    setFeedbackMsg({
      text: 'Agendamento cancelado.',
      type: 'info',
    });
    loadData();
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('estilo_store_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const liveTicker = window.setInterval(handleUpdate, 15000);
    return () => {
      window.removeEventListener('estilo_store_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.clearInterval(liveTicker);
    };
  }, [client.id, atelierId]);

  // Real-time queue WebSocket / polling monitor
  useEffect(() => {
    const monitor = new QueueRealtimeMonitor({
      atelierId,
      clientPhone: currentClient.telefone,
      clientName: currentClient.nome,
      onEvent: () => {
        loadData();
      },
    });

    return () => monitor.destroy();
  }, [atelierId, currentClient.telefone, currentClient.nome]);

  const firstName = (currentClient.nome || 'Cliente').split(' ')[0].toUpperCase();
  const myQueueEntry = queue.find(
    (q) => q.clientName.toLowerCase() === currentClient.nome.toLowerCase() || q.clientUid === currentClient.id
  );
  const myPosition = waitEstimate.myPosition;
  const waitingQueue = queue.filter(q => q.status === 'waiting');
  const estimatedWaitMinutes = waitEstimate.estimatedMinutes;

  const handleJoinQueue = async () => {
    if (myQueueEntry) {
      setFeedbackMsg({
        text: `Você já está na fila na posição #${myPosition || 1}!`,
        type: 'info',
      });
      return;
    }

    setIsJoining(true);
    try {
      await clientRepository.joinQueue(
        atelierId,
        currentClient.nome,
        currentClient.telefone || '11999999999',
        currentClient.id
      );
      setFeedbackMsg({
        text: 'Você entrou na fila! Fique de olho no WhatsApp.',
        type: 'success',
      });
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsJoining(false);
    }
  };

  const handleRedeemReward = async () => {
    const res = await clientRepository.redeemReward(currentClient.id, atelierId);
    setActiveVoucher({
      voucherCode: res.voucherCode,
      rewardName: res.rewardName,
    });
    setFeedbackMsg({
      text: `Recompensa resgatada! Apresente o voucher ${res.voucherCode} ao profissional para ganhar: ${res.rewardName}.`,
      type: 'success',
    });
    loadData();
  };

  const activeSubscriptionPlan =
    currentClient.planoAssinaturaStatus === 'ativo' && currentClient.planoAssinaturaId
      ? loyaltyPlans.find((p) => p.id === currentClient.planoAssinaturaId) || null
      : null;
  const activeMultiplier =
    currentClient.planoAssinaturaStatus === 'ativo'
      ? Math.max(
          1,
          activeSubscriptionPlan?.multiplicadorPontos || currentClient.planoMultiplicadorPontos || 1
        )
      : 1;
  const pointsPerVisit =
    Math.max(1, loyaltyConfig.pontosPorAtendimento || 1) * activeMultiplier;

  const selectedBookingService =
    servicesList.find((s) => s.id === bookingServiceId) || servicesList[0] || null;
  const selectedBookingStaff = bookingStaffId
    ? staffList.find((s) => s.id === bookingStaffId) || null
    : null;

  const upcomingBookingDays = React.useMemo(() => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return Array.from({ length: 14 }).map((_, index) => {
      const d = new Date();
      d.setDate(d.getDate() + index);
      const dateStr = toLocalDateStr(d);
      const availability = appointmentRepository.getDayAvailability(
        atelierId,
        dateStr,
        bookingStaffId || undefined
      );
      return {
        dateStr,
        diaSemana: diasSemana[d.getDay()],
        diaNumero: d.getDate(),
        mesNome: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        isToday: index === 0,
        availability,
      };
    });
  }, [atelierId, bookingStaffId, scheduleSyncTick]);

  const currentDayAvailability: DayAvailabilitySummary = React.useMemo(
    () =>
      appointmentRepository.getDayAvailability(
        atelierId,
        bookingDate,
        bookingStaffId || undefined
      ),
    [atelierId, bookingDate, bookingStaffId, scheduleSyncTick]
  );

  const liveExpedienteStatus = React.useMemo(
    () => atelierRepository.getExpedienteStatus(atelierId),
    [atelierId, scheduleSyncTick]
  );

  useEffect(() => {
    const free = currentDayAvailability.availableSlots;
    if (free.length === 0) {
      if (bookingTime) setBookingTime('');
    } else if (!bookingTime || !free.includes(bookingTime)) {
      setBookingTime(free[0]);
    }
  }, [currentDayAvailability, bookingTime]);

  const recurrenceDiscountApplied =
    bookingRecurrence !== 'unico' &&
    currentDayAvailability.recorrenciaHabilitada &&
    currentDayAvailability.descontoRecorrenciaPercentual > 0
      ? currentDayAvailability.descontoRecorrenciaPercentual
      : 0;

  const finalBookingPrice = selectedBookingService
    ? Number((selectedBookingService.preco * (1 - recurrenceDiscountApplied / 100)).toFixed(2))
    : 0;

  const handleInlineConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingService || !bookingDate || !bookingTime) return;
    if (!currentDayAvailability.availableSlots.includes(bookingTime)) {
      setFeedbackMsg({
        text: 'Este horário acabou de ficar indisponível na agenda. Escolha outro horário livre.',
        type: 'info',
      });
      loadData();
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const created = await appointmentRepository.createAppointment({
        atelierId,
        clientId: currentClient.id,
        clientName: currentClient.nome,
        clientPhone: currentClient.telefone || '11999999999',
        clientEmail: currentClient.email,
        serviceId: selectedBookingService.id,
        serviceName: selectedBookingService.nome,
        servicePrice: finalBookingPrice,
        serviceDuration: selectedBookingService.duracao,
        staffId: selectedBookingStaff?.id,
        staffName: selectedBookingStaff ? selectedBookingStaff.nome : 'Qualquer Barbeiro Disponível',
        data: bookingDate,
        horario: bookingTime,
        recorrencia: bookingRecurrence,
        observacoes: bookingNotes.trim() || undefined,
      });

      pushNotificationService.send({
        title: '✂️ Agendamento Online Confirmado!',
        body: `${created.serviceName} marcado para ${created.data.split('-').reverse().join('/')} às ${created.horario}.`,
        type: 'general',
      });

      setBookingNotes('');
      setBookingRecurrence('unico');
      setFeedbackMsg({
        text: `Agendamento confirmado para ${created.data.split('-').reverse().join('/')} às ${created.horario} (${created.serviceName})!`,
        type: 'success',
      });
      loadData();
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Add demo visit to test fidelity
  const handleAddDemoPoint = async () => {
    await clientRepository.addPoints(
      currentClient.id,
      pointsPerVisit,
      activeMultiplier > 1
        ? `Atendimento realizado (${activeMultiplier}x Plano ${activeSubscriptionPlan?.nome || currentClient.planoAssinaturaNome || 'Assinante'})`
        : 'Atendimento realizado no atelier'
    );
    loadData();
  };

  const handleSelectLoyaltyPlan = (planId: string | null) => {
    const updated = clientRepository.assignLoyaltyPlan(currentClient.id, planId, atelierId);
    setShowPlanSelector(false);
    if (!planId || !updated || updated.planoAssinaturaStatus !== 'ativo') {
      setFeedbackMsg({
        text: 'Assinatura do clube fidelidade cancelada.',
        type: 'info',
      });
    } else {
      setFeedbackMsg({
        text: `Assinatura "${updated.planoAssinaturaNome}" ativada! Agora você acumula ${updated.planoMultiplicadorPontos || 1}x pontos por atendimento.`,
        type: 'success',
      });
    }
    loadData();
  };

  const quickFeedbackTags = [
    'Corte Impecável',
    'Pontualidade',
    'Atendimento Top',
    'Ambiente Limpo',
    'Mão Leve',
  ];

  const ratingLabels: Record<number, string> = {
    1: '1/5 • Precisa melhorar',
    2: '2/5 • Regular',
    3: '3/5 • Bom',
    4: '4/5 • Muito bom',
    5: '5/5 • Excelente!',
  };

  const handleToggleFeedbackTag = (tag: string) => {
    setFeedbackTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);

    try {
      feedbackRepository.addFeedback({
        atelierId,
        clientId: currentClient.id,
        clientName: currentClient.nome,
        serviceName: feedbackService || 'Atendimento no Atelier',
        staffName: feedbackStaff || 'Profissional do Atelier',
        nota: selectedRating,
        comentario:
          feedbackComment.trim() ||
          (feedbackTags.length > 0
            ? `Destaques: ${feedbackTags.join(', ')}.`
            : `Avaliação de ${selectedRating} estrela(s) para o atendimento.`),
        tags: feedbackTags,
      });

      setFeedbackComment('');
      setFeedbackTags([]);
      setSelectedRating(5);
      setFeedbackMsg({
        text: `Obrigado pela sua avaliação (${selectedRating} ★)! Seu feedback foi enviado para ${feedbackStaff || 'o profissional'}.`,
        type: 'success',
      });
      loadData();
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#131313]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/COMPLETO.png"
            alt="Estilo Exato"
            className="h-10 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-heading font-black text-xs text-[#F2CA50] uppercase tracking-wider">
            {atelier ? atelier.nome_negocio : 'Estilo Exato'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onOpenLocation && (
            <button
              onClick={onOpenLocation}
              title="Localização & Como Chegar (Google Maps)"
              className="p-2 rounded-xl text-[#F2CA50] hover:bg-[#F2CA50]/10 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <MapPin className="w-4 h-4 text-[#F2CA50]" />
              <span className="hidden sm:inline">Como Chegar</span>
            </button>
          )}

          <button
            onClick={onLogout}
            title="Sair da Conta"
            className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto w-full p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-8">
        <div>
          {/* Greeting matching Flutter ClientHomePage */}
          <div className="mb-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] block">
              BEM-VINDO,
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl font-black text-white mt-1 leading-tight tracking-tight">
              {firstName}
            </h1>
          </div>

          {/* Banner de status da fila ao vivo para o cliente */}
          {myQueueEntry && (
            <div
              className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                myPosition === 1
                  ? 'bg-[#F2CA50]/15 border-[#F2CA50]/50 text-white shadow-lg shadow-[#F2CA50]/10 animate-pulse'
                  : myQueueEntry.status === 'in_service'
                  ? 'bg-green-500/15 border-green-500/40 text-white shadow-lg shadow-green-500/10'
                  : 'bg-black/40 border-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    myPosition === 1 ? 'bg-[#F2CA50] text-black' : 'bg-white/10 text-[#F2CA50]'
                  }`}
                >
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-heading font-black text-sm flex items-center gap-2">
                    {myPosition === 1 ? (
                      <span className="text-[#F2CA50]">VOCÊ É O PRÓXIMO DA FILA! ✂️⚡</span>
                    ) : myQueueEntry.status === 'in_service' ? (
                      <span className="text-green-400">EM ATENDIMENTO NA CADEIRA 💈</span>
                    ) : (
                      <span>SUA VEZ NA FILA: POSIÇÃO #{myPosition}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    {myPosition === 1
                      ? 'Fique atento(a) e por perto da barbearia, seu atendimento começará em instantes.'
                      : myQueueEntry.status === 'in_service'
                      ? 'Aproveite seu corte e relaxe com seu barbeiro!'
                      : 'Avisaremos você no WhatsApp assim que abrir vaga e você for o próximo.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Widget em Tempo Real: Estimativa de Espera Atual */}
          <div className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-[#1C1C1B] via-[#181817] to-black border border-[#F2CA50]/25 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                  ESTIMATIVA DE ESPERA EM TEMPO REAL
                </span>
              </div>
              <span className="text-[10px] font-semibold text-white/40">
                {new Date(waitEstimate.calculatedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                {waitEstimate.myStatus === 'in_service' ? (
                  <div className="font-heading text-3xl sm:text-4xl font-black text-emerald-400 leading-none">
                    Na Cadeira
                  </div>
                ) : waitEstimate.estimatedMinutes === 0 ? (
                  <div className="font-heading text-3xl sm:text-4xl font-black text-emerald-400 leading-none">
                    Imediato
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-4xl sm:text-5xl font-black text-white leading-none">
                      ~{waitEstimate.estimatedMinutes}
                    </span>
                    <span className="font-heading text-base font-bold text-[#F2CA50] uppercase">
                      min
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-white/60 mt-1.5">
                  {waitEstimate.myStatus === 'in_service'
                    ? 'Seu atendimento já está em andamento agora.'
                    : waitEstimate.myStatus === 'waiting'
                    ? waitEstimate.peopleAhead === 0
                      ? 'Você é o próximo! Cadeira liberando em breve.'
                      : `Faltam ${waitEstimate.peopleAhead} ${waitEstimate.peopleAhead === 1 ? 'pessoa' : 'pessoas'} à sua frente na fila.`
                    : waitEstimate.estimatedMinutes === 0
                    ? 'Há profissional disponível para atender você imediatamente.'
                    : 'Previsão caso você entre na fila neste momento.'}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                  waitEstimate.paceStatus === 'livre'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : waitEstimate.paceStatus === 'moderado'
                    ? 'bg-[#F2CA50]/15 text-[#F2CA50] border-[#F2CA50]/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {waitEstimate.paceStatus === 'livre'
                  ? 'Fluxo Livre'
                  : waitEstimate.paceStatus === 'moderado'
                  ? 'Movimento Moderado'
                  : 'Horário Intenso'}
              </span>
            </div>

            {/* Métricas baseadas nos atendimentos do dia */}
            <div className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-white/10">
              <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-white/45 font-bold uppercase">
                  <Activity className="w-3 h-3 text-[#F2CA50]" />
                  <span>Média Hoje</span>
                </div>
                <div className="font-heading font-black text-sm text-white mt-1">
                  {waitEstimate.avgServiceMinutesToday} min
                </div>
                <div className="text-[10px] text-white/40 truncate">
                  {waitEstimate.todayCompletedCount > 0
                    ? `${waitEstimate.todayCompletedCount} atend. hoje`
                    : 'Base padrão'}
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-white/45 font-bold uppercase">
                  <ListOrdered className="w-3 h-3 text-[#F2CA50]" />
                  <span>Na Fila</span>
                </div>
                <div className="font-heading font-black text-sm text-white mt-1">
                  {waitEstimate.waitingCount} {waitEstimate.waitingCount === 1 ? 'pessoa' : 'pessoas'}
                </div>
                <div className="text-[10px] text-white/40 truncate">
                  {waitEstimate.inServiceCount} em atendimento
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-white/45 font-bold uppercase">
                  <Users className="w-3 h-3 text-[#F2CA50]" />
                  <span>{waitEstimate.myStatus === 'waiting' ? 'Sua Vez' : 'Equipe'}</span>
                </div>
                <div className="font-heading font-black text-sm text-white mt-1">
                  {waitEstimate.myStatus === 'waiting'
                    ? `#${waitEstimate.myPosition}`
                    : `${waitEstimate.activeBarbersCount} ${waitEstimate.activeBarbersCount === 1 ? 'ativo' : 'ativos'}`}
                </div>
                <div className="text-[10px] text-white/40 truncate">
                  {waitEstimate.myStatus === 'waiting'
                    ? `${waitEstimate.peopleAhead} à frente`
                    : `${waitEstimate.activeBarbersCount} ${waitEstimate.activeBarbersCount === 1 ? 'cadeira' : 'cadeiras'}`}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-white/40">
                Cálculo automático pela média dos atendimentos de hoje
              </span>
              <button
                type="button"
                onClick={onGoToPublicQueue}
                className="text-[#F2CA50] hover:underline font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Ver Fila Ao Vivo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {feedbackMsg && (
            <div
              className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
                feedbackMsg.type === 'success'
                  ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                  : 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button
                onClick={() => setFeedbackMsg(null)}
                className="opacity-70 hover:opacity-100 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {onOpenLocation && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-black/50 border border-blue-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Localização do Atelier & Trajeto</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">Google Maps</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Veja o mapa ao vivo e tire dúvidas de trajeto com IA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenLocation}
                className="py-2 px-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-heading font-black text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
              >
                Abrir Mapa
              </button>
            </div>
          )}

          {/* Banner de Notificações Push em Tempo Real */}
          {pushNotificationService.isSupported() && (
            <div className="mb-6 p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notifPermission === 'granted'
                    ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                    : 'bg-[#F2CA50]/15 border border-[#F2CA50]/30 text-[#F2CA50]'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>Notificações Push no Celular</span>
                    {notifPermission === 'granted' ? (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                        Ativas em Tempo Real
                      </span>
                    ) : (
                      <span className="text-[10px] bg-[#F2CA50]/20 text-[#F2CA50] px-2 py-0.5 rounded-full font-bold">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50 mt-0.5 truncate">
                    {notifPermission === 'granted'
                      ? 'Você receberá alertas sonoros e push quando for o próximo ou abrir vaga.'
                      : 'Ative para receber avisos instantâneos quando for sua vez ou abrir vaga.'}
                  </p>
                </div>
              </div>

              {notifPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await pushNotificationService.requestPermission();
                    setNotifPermission(res);
                    if (res === 'granted') {
                      pushNotificationService.send({
                        title: 'Notificações Ativadas! 🔔',
                        body: 'Você receberá avisos em tempo real no seu dispositivo quando for o próximo da fila ou abrir vaga!',
                        type: 'general',
                      });
                    }
                  }}
                  className="py-2 px-3.5 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Ativar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    pushNotificationService.send({
                      title: 'Teste de Alerta Push 🔔',
                      body: 'Notificação em tempo real funcionando perfeitamente no seu dispositivo!',
                      type: 'general',
                    });
                  }}
                  className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-[11px] font-bold border border-white/10 shrink-0 cursor-pointer transition-colors"
                >
                  Testar
                </button>
              )}
            </div>
          )}

          {/* Section: CARTÃO FIDELIDADE DIGITAL */}
          {loyaltyConfig.ativo && (() => {
            const targetPoints = Math.max(2, loyaltyConfig.pontosNecessarios || 10);
            const currentPoints = Math.max(0, currentClient.pontos || 0);
            const canRedeem = currentPoints >= targetPoints;
            const remaining = Math.max(0, targetPoints - currentPoints);
            const progressPercent = Math.min(100, Math.round((currentPoints / targetPoints) * 100));

            return (
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#1C1C1B] via-[#171716] to-black border border-[#F2CA50]/25 shadow-2xl relative overflow-hidden space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#F2CA50] flex-wrap">
                      <Award className="w-3.5 h-3.5" />
                      <span>CARTÃO FIDELIDADE DIGITAL</span>
                      {currentClient.planoAssinaturaStatus === 'ativo' && currentClient.planoAssinaturaNome && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F2CA50] text-black text-[9px] font-black inline-flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" />
                          <span>
                            {currentClient.planoAssinaturaNome} • {activeMultiplier}x
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      Prêmio: <strong className="text-white">{loyaltyConfig.servicoRecompensa}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2CA50]/15 border border-[#F2CA50]/30 text-[#F2CA50] shrink-0">
                    <Star className="w-3.5 h-3.5 fill-[#F2CA50]" />
                    <span className="font-heading font-black text-xs">
                      {currentPoints} / {targetPoints}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-white/50">
                    <span>
                      +{pointsPerVisit} pt(s) por atendimento realizado
                      {activeMultiplier > 1 ? ` (${activeMultiplier}x pelo plano)` : ''}
                    </span>
                    <span className="text-[#F2CA50]">{progressPercent}% completo</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/70 border border-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        canRedeem ? 'bg-emerald-400' : 'bg-[#F2CA50]'
                      }`}
                      style={{ width: `${Math.max(4, progressPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Grade Dinâmica de Selos do Cartão Fidelidade */}
                <div className={`grid gap-2.5 sm:gap-3 py-1 ${targetPoints <= 8 ? 'grid-cols-4' : 'grid-cols-5'}`}>
                  {Array.from({ length: targetPoints }).map((_, index) => {
                    const isEarned = index < currentPoints;
                    const isFinalGift = index === targetPoints - 1;
                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                          isEarned
                            ? 'bg-[#F2CA50] text-black shadow-lg shadow-[#F2CA50]/25 scale-[1.03]'
                            : isFinalGift
                            ? 'bg-[#F2CA50]/10 border border-dashed border-[#F2CA50]/60 text-[#F2CA50]'
                            : 'bg-white/5 border border-white/5 text-white/25'
                        }`}
                      >
                        {isEarned ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : isFinalGift ? (
                          <Gift className="w-4 h-4" />
                        ) : (
                          <span className="font-heading font-bold text-[11px] opacity-60">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Voucher Ativo após Resgate */}
                {activeVoucher && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        VOUCHER ATIVO PARA APRESENTAR NO ATELIER
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {activeVoucher.rewardName}
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-black/70 border border-emerald-400/40 font-mono font-black text-xs text-emerald-300 tracking-wider shrink-0">
                      {activeVoucher.voucherCode}
                    </span>
                  </div>
                )}

                <div className="text-center pt-1">
                  {canRedeem ? (
                    <div className="space-y-3">
                      <div className="font-heading font-black text-sm sm:text-base text-[#F2CA50] uppercase tracking-wide">
                        PARABÉNS! VOCÊ GANHOU: {loyaltyConfig.servicoRecompensa.toUpperCase()} 🎉
                      </div>
                      <button
                        type="button"
                        onClick={handleRedeemReward}
                        className="py-3 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-transform active:scale-95"
                      >
                        RESGATAR SERVIÇO GRÁTIS AGORA
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-white/75">
                      Faltam <span className="text-[#F2CA50] font-black">{remaining}</span> ponto(s) para ganhar{' '}
                      <span className="text-white">{loyaltyConfig.servicoRecompensa}</span>.
                    </div>
                  )}
                </div>

                {/* Rodapé: Extrato + Simular Atendimento */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowLoyaltyHistory((prev) => !prev)}
                    className="text-[11px] text-[#F2CA50] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{showLoyaltyHistory ? 'Ocultar Extrato' : `Extrato de Pontos (${loyaltyHistory.length})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddDemoPoint}
                    className="text-[10px] text-white/35 hover:text-white/65 font-medium py-1 px-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    + Simular Atendimento (+{pointsPerVisit} pt)
                  </button>
                </div>

                {showLoyaltyHistory && (
                  <div className="space-y-2 pt-2 border-t border-white/5 max-h-44 overflow-y-auto">
                    {loyaltyHistory.length === 0 ? (
                      <p className="text-[11px] text-white/40 text-center py-2">
                        Nenhuma movimentação registrada ainda. Seus próximos atendimentos aparecerão aqui!
                      </p>
                    ) : (
                      loyaltyHistory.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2 text-[11px]"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">{item.descricao}</div>
                            <div className="text-[10px] text-white/40">
                              {new Date(item.timestamp).toLocaleDateString('pt-BR')}
                              {item.voucherCodigo ? ` • Voucher: ${item.voucherCodigo}` : ''}
                            </div>
                          </div>
                          <span
                            className={`font-heading font-black shrink-0 ${
                              item.tipo === 'ganho' ? 'text-emerald-400' : 'text-[#F2CA50]'
                            }`}
                          >
                            {item.pontos > 0 ? `+${item.pontos}` : item.pontos} pt
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Section: PLANO DE ASSINATURA & FIDELIDADE */}
          {loyaltyPlans.length > 0 && (
            <div className="mt-6 p-6 rounded-3xl bg-[#1C1C1B] border border-[#F2CA50]/20 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                    <Crown className="w-3.5 h-3.5" />
                    <span>PLANO DE ASSINATURA &amp; FIDELIDADE</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {currentClient.planoAssinaturaStatus === 'ativo'
                      ? 'Seu clube mensal acelera seus pontos no Cartão Fidelidade.'
                      : 'Assine um clube mensal para multiplicar seus pontos e ganhar benefícios VIP.'}
                  </p>
                </div>

                {currentClient.planoAssinaturaStatus === 'ativo' && (
                  <button
                    type="button"
                    onClick={() => setShowPlanSelector((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-[#F2CA50] shrink-0 cursor-pointer transition-colors"
                  >
                    {showPlanSelector ? 'Fechar Opções' : 'Trocar Plano'}
                  </button>
                )}
              </div>

              {currentClient.planoAssinaturaStatus === 'ativo' && !showPlanSelector && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F2CA50]/15 via-black/60 to-black border border-[#F2CA50]/35 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-black text-base text-white">
                          {activeSubscriptionPlan?.nome || currentClient.planoAssinaturaNome}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                          Assinatura Ativa
                        </span>
                      </div>
                      {activeSubscriptionPlan?.descricao && (
                        <p className="text-xs text-white/60 mt-1">
                          {activeSubscriptionPlan.descricao}
                        </p>
                      )}
                    </div>
                    {activeSubscriptionPlan && (
                      <div className="text-right shrink-0">
                        <div className="font-heading font-black text-lg text-[#F2CA50]">
                          R$ {activeSubscriptionPlan.precoMensal.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-white/45">/mês</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 text-[11px] font-bold text-[#F2CA50]">
                      {activeMultiplier}x Pontos Fidelidade
                    </span>
                    {activeSubscriptionPlan && (
                      <>
                        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-white/85">
                          {activeSubscriptionPlan.cortesInclusosMes === 0
                            ? 'Atendimentos ilimitados/mês'
                            : `${activeSubscriptionPlan.cortesInclusosMes} cortes inclusos/mês`}
                        </span>
                        {activeSubscriptionPlan.descontoExtrasPercentual > 0 && (
                          <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-white/85">
                            {activeSubscriptionPlan.descontoExtrasPercentual}% OFF em extras
                          </span>
                        )}
                        {activeSubscriptionPlan.prioridadeFila && (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                            Prioridade na Fila
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-white/45">
                      Renovação mensal • Multiplicador ativo automaticamente
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectLoyaltyPlan(null)}
                      className="text-red-400/80 hover:text-red-400 font-bold cursor-pointer"
                    >
                      Cancelar Assinatura
                    </button>
                  </div>
                </div>
              )}

              {(currentClient.planoAssinaturaStatus !== 'ativo' || showPlanSelector) && (
                <div className="space-y-3">
                  {loyaltyPlans.map((plan) => {
                    const isCurrent =
                      currentClient.planoAssinaturaStatus === 'ativo' &&
                      currentClient.planoAssinaturaId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isCurrent
                            ? 'bg-[#F2CA50]/10 border-[#F2CA50]/50'
                            : 'bg-black/45 border-white/10 hover:border-[#F2CA50]/35'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-heading font-black text-sm text-white">
                                {plan.nome}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-black uppercase">
                                {plan.multiplicadorPontos}x Pontos
                              </span>
                            </div>
                            <p className="text-[11px] text-white/55 mt-1">{plan.descricao}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-heading font-black text-base text-[#F2CA50]">
                              R$ {plan.precoMensal.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-white/40">/mês</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/80 font-semibold">
                            {plan.cortesInclusosMes === 0
                              ? 'Cortes ilimitados'
                              : `${plan.cortesInclusosMes} corte(s)/mês`}
                          </span>
                          {plan.descontoExtrasPercentual > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/80 font-semibold">
                              {plan.descontoExtrasPercentual}% OFF em extras
                            </span>
                          )}
                          {plan.prioridadeFila && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-bold">
                              Prioridade na Fila
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleSelectLoyaltyPlan(plan.id)}
                          className={`w-full py-2.5 px-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-[#F2CA50] hover:bg-[#ebd05d] text-black shadow-md active:scale-[0.99]'
                          }`}
                        >
                          {isCurrent
                            ? 'Plano Atual Ativo'
                            : currentClient.planoAssinaturaStatus === 'ativo'
                            ? 'Mudar Para Este Plano'
                            : 'Assinar Plano & Ativar Fidelidade'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Current Queue Status if user is in line */}
          {myQueueEntry && (
            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-[#F2CA50]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F2CA50]/15 flex items-center justify-center text-[#F2CA50]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-heading font-bold text-xs uppercase text-[#F2CA50]">
                    VOCÊ ESTÁ NA FILA!
                  </div>
                  <div className="text-xs text-white/70">
                    {myQueueEntry.status === 'in_service' ? (
                      <span className="text-green-400 font-bold">É a sua vez! Pode se dirigir à cadeira ✂️</span>
                    ) : (
                      <span>Sua posição atual: <strong className="text-white">#{myPosition}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white">
                {myQueueEntry.status === 'in_service' ? 'Na Cadeira' : 'Aguardando'}
              </span>
            </div>
          )}

          {/* Section: AÇÕES PRINCIPAIS DO CLIENTE (Agendar & Fila) */}
          <div className="mt-8 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] block">
              COMO DESEJA SER ATENDIDO?
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Botão 1: AGENDAR HORÁRIO */}
              <button
                type="button"
                onClick={() => {
                  const section = document.getElementById('agendamento-online-integrado');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    setIsBookingModalOpen(true);
                  }
                }}
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#F2CA50] via-[#eed16b] to-[#d4af37] text-black shadow-xl shadow-[#F2CA50]/15 flex flex-col justify-between text-left cursor-pointer transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                    <CalendarPlus className="w-6 h-6 text-black" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-black text-[#F2CA50] text-[10px] font-black uppercase tracking-wider">
                    Agenda Ao Vivo
                  </span>
                </div>
                <div>
                  <div className="font-heading font-black text-lg uppercase tracking-wide text-black">
                    AGENDAR HORÁRIO
                  </div>
                  <p className="text-black/75 text-xs font-semibold mt-1">
                    Reserve direto pela disponibilidade em tempo real do atelier.
                  </p>
                </div>
              </button>

              {/* Botão 2: ENTRAR NA FILA REMOTAMENTE */}
              <button
                type="button"
                onClick={handleJoinQueue}
                disabled={isJoining || myQueueEntry?.status === 'in_service'}
                className="p-5 sm:p-6 rounded-2xl bg-[#1C1C1B] hover:bg-[#252524] border border-white/10 hover:border-[#F2CA50]/40 text-white shadow-xl flex flex-col justify-between text-left cursor-pointer transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#F2CA50] group-hover:scale-110 transition-transform">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] text-[10px] font-bold uppercase tracking-wider">
                    {myQueueEntry
                      ? `Posição #${myPosition || 1}`
                      : estimatedWaitMinutes === 0
                      ? 'Atendimento Imediato'
                      : `~${estimatedWaitMinutes} min de espera`}
                  </span>
                </div>
                <div>
                  <div className="font-heading font-black text-lg uppercase tracking-wide text-white">
                    {myQueueEntry ? 'VOCÊ ESTÁ NA FILA' : 'ENTRAR NA FILA REMOTAMENTE'}
                  </div>
                  <p className="text-white/60 text-xs mt-1">
                    {myQueueEntry
                      ? 'Avisaremos você por mensagem e push quando for a sua vez.'
                      : `Fila virtual ao vivo: ${waitingQueue.length} pessoas aguardando. Entre antes de sair de casa!`}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section: AGENDAMENTO ONLINE INTEGRADO */}
          <div id="agendamento-online-integrado" className="mt-8 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>AGENDAMENTO ONLINE INTEGRADO</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                    liveExpedienteStatus.isOpen
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>
                    Agenda Sincronizada • Hoje: {liveExpedienteStatus.horarioHoje}
                  </span>
                </span>
              </div>
            </div>

            <form
              onSubmit={handleInlineConfirmBooking}
              className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1C1C1B] via-[#171716] to-black border border-[#F2CA50]/25 shadow-2xl space-y-5"
            >
              {/* 1. Seleção de Serviço */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-white/80">
                    1. Escolha o Serviço
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(true)}
                    className="text-[10px] font-bold text-[#F2CA50] hover:underline cursor-pointer"
                  >
                    Abrir Assistente Passo a Passo
                  </button>
                </div>

                {servicesList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white/50">
                    Nenhum serviço cadastrado no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {servicesList.map((srv) => {
                      const active = selectedBookingService?.id === srv.id;
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => setBookingServiceId(srv.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            active
                              ? 'bg-[#F2CA50]/15 border-[#F2CA50] shadow-md shadow-[#F2CA50]/10'
                              : 'bg-black/45 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-heading font-bold text-xs text-white truncate">
                              {srv.nome}
                            </div>
                            <div className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-[#F2CA50]" />
                              <span>{srv.duracao} min</span>
                            </div>
                          </div>
                          <span className="font-heading font-black text-xs text-[#F2CA50] shrink-0">
                            R$ {srv.preco.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Seleção de Profissional */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-white/80 block">
                  2. Profissional
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingStaffId('')}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      bookingStaffId === ''
                        ? 'bg-[#F2CA50] text-black border-[#F2CA50]'
                        : 'bg-black/45 text-white/75 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Qualquer Disponível</span>
                  </button>
                  {staffList.map((member) => {
                    const active = bookingStaffId === member.id;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setBookingStaffId(member.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          active
                            ? 'bg-[#F2CA50] text-black border-[#F2CA50]'
                            : 'bg-black/45 text-white/75 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{member.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Calendário de Dias Sincronizado com ScheduleSettingsModal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-white/80">
                    3. Data Disponível (Próximos 14 Dias)
                  </label>
                  <span className="text-[10px] text-white/45">
                    Grade a cada {currentDayAvailability.slotDurationMinutes} min
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {upcomingBookingDays.map((day) => {
                    const isSelected = bookingDate === day.dateStr;
                    const isClosed = !day.availability.isOpen;
                    const isFull =
                      day.availability.isOpen && day.availability.availableSlots.length === 0;
                    const freeCount = day.availability.availableSlots.length;

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => setBookingDate(day.dateStr)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#F2CA50] text-black border-[#F2CA50] shadow-lg shadow-[#F2CA50]/20 scale-[1.03]'
                            : isClosed || isFull
                            ? 'bg-black/25 border-white/5 text-white/35 hover:border-white/15'
                            : 'bg-black/45 border-white/10 text-white hover:border-[#F2CA50]/45'
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase">
                          {day.isToday ? 'Hoje' : day.diaSemana}
                        </span>
                        <span className="text-sm font-black font-heading leading-tight mt-0.5">
                          {day.diaNumero}
                        </span>
                        <span
                          className={`text-[9px] font-bold mt-0.5 ${
                            isSelected
                              ? 'text-black/80'
                              : isClosed
                              ? 'text-red-400/70'
                              : isFull
                              ? 'text-amber-400/80'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isClosed ? 'Fechado' : isFull ? 'Sem vaga' : `${freeCount} liv.`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resumo das Regras da Agenda para o Dia Selecionado */}
              <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-3 text-white/70">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#F2CA50]" />
                    <span>Expediente: <strong className="text-white">{currentDayAvailability.horarioDia}</strong></span>
                  </span>
                  {currentDayAvailability.pausaLabel && (
                    <span className="flex items-center gap-1 text-amber-300/90">
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Pausa: {currentDayAvailability.pausaLabel}</span>
                    </span>
                  )}
                </div>

                {currentDayAvailability.isOpen && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#F2CA50]">
                    {currentDayAvailability.vagasRestantesDia} de {currentDayAvailability.vagasTotaisDia} vagas diárias livres
                  </span>
                )}
              </div>

              {/* 4. Grade de Horários Disponíveis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-white/80">
                    4. Horários em Tempo Real
                  </label>
                  <span className="text-[11px] font-bold text-[#F2CA50]">
                    {currentDayAvailability.availableSlots.length} horário(s) livre(s)
                  </span>
                </div>

                {!currentDayAvailability.isOpen || currentDayAvailability.availableSlots.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-black/45 border border-white/10 text-center space-y-1.5">
                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                    <p className="text-xs font-bold text-white/80">
                      {currentDayAvailability.reasonClosed ||
                        'Todos os horários disponíveis para este dia já foram preenchidos.'}
                    </p>
                    <p className="text-[11px] text-white/50">
                      Selecione outra data acima para visualizar os horários livres da agenda do atelier.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1">
                    {currentDayAvailability.slots
                      .filter((s) => s.reason !== 'pausa')
                      .map((slot) => {
                        const isSelected = slot.available && bookingTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => slot.available && setBookingTime(slot.time)}
                            className={`py-2 px-2 rounded-xl border text-xs font-heading font-bold transition-all text-center ${
                              !slot.available
                                ? 'bg-black/25 border-white/5 text-white/25 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#F2CA50] text-black border-[#F2CA50] shadow-md shadow-[#F2CA50]/20 cursor-pointer'
                                : 'bg-black/50 border-white/10 text-white hover:border-[#F2CA50]/50 cursor-pointer'
                            }`}
                          >
                            <div>{slot.time}</div>
                            {!slot.available && (
                              <div className="text-[9px] font-normal no-underline text-white/30">
                                {slot.reason === 'lotado' ? 'Lotado' : 'Ocupado'}
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Recorrência configurada no ScheduleSettingsModal */}
              {currentDayAvailability.recorrenciaHabilitada &&
                currentDayAvailability.permitirClienteRecorrencia && (
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#F2CA50]" />
                        <span>Frequência do Atendimento</span>
                      </span>
                      {currentDayAvailability.descontoRecorrenciaPercentual > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">
                          {currentDayAvailability.descontoRecorrenciaPercentual}% OFF para recorrentes
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { id: 'unico', label: 'Apenas 1x' },
                          { id: 'semanal', label: 'Semanal' },
                          { id: 'quinzenal', label: 'Quinzenal' },
                          { id: 'mensal', label: 'Mensal' },
                        ] as const
                      ).map((opt) => {
                        const active = bookingRecurrence === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setBookingRecurrence(opt.id)}
                            className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                              active
                                ? 'bg-[#F2CA50]/20 text-[#F2CA50] border-[#F2CA50]'
                                : 'bg-black/40 text-white/65 border-white/10 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Observação e Confirmação */}
              <div className="space-y-3 pt-1">
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Observação opcional (ex: disfarçado na zero, barba desenhada...)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#F2CA50]"
                />

                <button
                  type="submit"
                  disabled={
                    isSubmittingBooking ||
                    !selectedBookingService ||
                    !bookingTime ||
                    !currentDayAvailability.isOpen
                  }
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmittingBooking
                      ? 'Confirmando Agendamento...'
                      : bookingTime && selectedBookingService
                      ? `Confirmar ${bookingDate.split('-').reverse().join('/')} às ${bookingTime} • R$ ${finalBookingPrice.toFixed(2)}`
                      : 'Selecione um Horário Livre'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Section: MEUS AGENDAMENTOS */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] block">
                MEUS AGENDAMENTOS
              </span>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="text-xs text-[#F2CA50] hover:underline font-bold cursor-pointer"
              >
                + Novo Horário
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#1C1C1B] border border-white/5 text-center space-y-2">
                <Calendar className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-xs text-white/70 font-medium">
                  Você ainda não possui horários agendados.
                </p>
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(true)}
                  className="mt-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#F2CA50] text-xs font-bold border border-[#F2CA50]/20 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Agendar Meu Primeiro Horário</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => {
                  const isCancelado = apt.status === 'cancelado';
                  return (
                    <div
                      key={apt.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCancelado
                          ? 'bg-black/40 border-white/5 opacity-50'
                          : 'bg-[#1C1C1B] border-white/10 shadow-lg'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                            <span>{apt.serviceName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isCancelado
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <div className="text-xs text-white/50 mt-1 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-[#F2CA50]" />
                            <span>{apt.staffName || 'Barbeiro Disponível'}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-heading font-black text-sm text-[#F2CA50]">
                            R$ {apt.servicePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-white/80">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#F2CA50]" />
                            <strong className="text-white">{apt.data.split('-').reverse().join('/')}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#F2CA50]" />
                            <strong className="text-white">{apt.horario}</strong>
                          </span>
                        </div>

                        {!isCancelado && (
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="text-[11px] text-red-400/80 hover:text-red-400 font-bold hover:underline cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: FEEDBACK PÓS-ATENDIMENTO */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>FEEDBACK PÓS-ATENDIMENTO</span>
              </span>

              {atelierRating.total > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#F2CA50]/15 border border-[#F2CA50]/30 text-[#F2CA50] text-[10px] font-black flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#F2CA50]" />
                  <span>
                    {atelierRating.average.toFixed(1)} ({atelierRating.total})
                  </span>
                </span>
              )}
            </div>

            <form
              onSubmit={handleSubmitFeedback}
              className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-4"
            >
              <div>
                <h3 className="font-heading font-bold text-white text-sm">
                  Como foi o seu atendimento?
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Escolha de 1 a 5 estrelas e deixe um recado rápido para o profissional.
                </p>
              </div>

              {/* Seleção do Serviço e Profissional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Serviço Prestado
                  </label>
                  <select
                    value={feedbackService}
                    onChange={(e) => setFeedbackService(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/50 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs cursor-pointer"
                  >
                    {servicesList.map((srv) => (
                      <option key={srv.id} value={srv.nome}>
                        {srv.nome}
                      </option>
                    ))}
                    {servicesList.length === 0 && (
                      <option value="Atendimento no Atelier">Atendimento no Atelier</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Profissional
                  </label>
                  <select
                    value={feedbackStaff}
                    onChange={(e) => setFeedbackStaff(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/50 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs cursor-pointer"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.nome}>
                        {st.nome} ({st.cargo})
                      </option>
                    ))}
                    {staffList.length === 0 && (
                      <option value="Profissional do Atelier">Profissional do Atelier</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Seletor de Nota de 1 a 5 */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {([1, 2, 3, 4, 5] as const).map((starValue) => {
                    const active = (hoverRating || selectedRating) >= starValue;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(starValue)}
                        aria-label={`Nota ${starValue} de 5`}
                        className="p-1.5 rounded-xl hover:bg-white/5 transition-transform active:scale-90 cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            active
                              ? 'text-[#F2CA50] fill-[#F2CA50] drop-shadow'
                              : 'text-white/20'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-heading font-bold text-[#F2CA50]">
                  {ratingLabels[hoverRating || selectedRating]}
                </span>
              </div>

              {/* Destaques Rápidos */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                  Destaques Rápidos (opcional)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickFeedbackTags.map((tag) => {
                    const isSelected = feedbackTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleFeedbackTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#F2CA50]/20 text-[#F2CA50] border-[#F2CA50]/50'
                            : 'bg-black/40 text-white/60 border-white/10 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comentário Rápido */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  Comentário Rápido para o Profissional
                </label>
                <textarea
                  rows={2}
                  maxLength={280}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Ex: Corte ficou exatamente como eu pedi, atendimento excelente!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="w-full py-3.5 px-5 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F2CA50]/15 transition-transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingFeedback ? 'ENVIANDO...' : 'ENVIAR AVALIAÇÃO'}</span>
              </button>
            </form>

            {/* Avaliações Recentes do Cliente */}
            {clientFeedbacks.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#F2CA50]" />
                  <span>SUAS AVALIAÇÕES RECENTES ({clientFeedbacks.length})</span>
                </div>

                {clientFeedbacks.slice(0, 4).map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3.5 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-heading font-bold text-white truncate">
                        {fb.serviceName} <span className="text-white/40 font-normal">• {fb.staffName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < fb.nota ? 'text-[#F2CA50] fill-[#F2CA50]' : 'text-white/15'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {fb.comentario && (
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        &ldquo;{fb.comentario}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap gap-1">
                        {fb.tags?.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/60 font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-white/35 shrink-0">
                        {new Date(fb.criadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 text-white/20 text-xs">
          EstiloExatoZap v1.0 • Clube de Fidelidade & Agendamentos
        </div>
      </main>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <ClientBookingModal
          atelierId={atelierId}
          client={currentClient}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={(newAppt) => {
            setIsBookingModalOpen(false);
            setFeedbackMsg({
              text: `Horário agendado com sucesso para ${newAppt.data.split('-').reverse().join('/')} às ${newAppt.horario}!`,
              type: 'success',
            });
            loadData();
          }}
        />
      )}
    </div>
  );
};
