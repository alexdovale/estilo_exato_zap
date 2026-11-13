import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Users, 
  Check, 
  CheckCircle2, 
  Copy, 
  AlertCircle, 
  Sparkles,
  Timer,
  Save,
  Coffee,
  MessageSquare,
  Target,
  TrendingUp,
  Award,
  Send,
  Bell
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { AtelierProfile, ConfiguracaoExpediente, DiaFuncionamento } from '../types';
import {
  atelierRepository,
  financeRepository,
  teamRepository,
  staffProductivityRepository,
  appointmentRepository,
  whatsappRepository,
  DEFAULT_EXPEDIENTE
} from '../services/store';

interface ScheduleSettingsModalProps {
  atelier: AtelierProfile;
  onClose: () => void;
  onSaved?: () => void;
}

const DEFAULT_REMINDER_TEMPLATE =
  'Olá {{nome}}! Lembramos do seu horário no *{{atelier}}* para {{servico}} às {{horario}} com {{profissional}}. Caso precise reagendar, avise por aqui! 💈✂️';

const formatAntecedencia = (minutos: number): string => {
  if (minutos < 60) return `${minutos} minuto${minutos === 1 ? '' : 's'} antes`;
  if (minutos % 60 === 0) {
    const hrs = minutos / 60;
    if (hrs === 24) return '1 dia antes (24h)';
    return `${hrs} hora${hrs === 1 ? '' : 's'} antes`;
  }
  const hrs = Math.floor(minutos / 60);
  const remMin = minutos % 60;
  return `${hrs}h ${remMin}min antes`;
};

const subtractMinutesFromTime = (timeStr: string, minutes: number): string => {
  const [hh, mm] = timeStr.split(':').map(Number);
  const total = ((hh || 16) * 60 + (mm || 0) - minutes) % (24 * 60);
  const normalized = total < 0 ? total + 24 * 60 : total;
  const outH = String(Math.floor(normalized / 60)).padStart(2, '0');
  const outM = String(normalized % 60).padStart(2, '0');
  return `${outH}:${outM}`;
};

export const ScheduleSettingsModal: React.FC<ScheduleSettingsModalProps> = ({
  atelier,
  onClose,
  onSaved,
}) => {
  const whatsappConfig = React.useMemo(() => whatsappRepository.getConfig(atelier.id), [atelier.id]);

  const [expediente, setExpediente] = useState<ConfiguracaoExpediente>(() => {
    const base = atelier.expediente || atelierRepository.getExpediente(atelier.id);
    const wa = whatsappRepository.getConfig(atelier.id);
    if (!base.configuracaoLembretes) {
      return {
        ...base,
        configuracaoLembretes: {
          habilitado: wa.autoSendReminder ?? true,
          minutosAntes: Math.max(15, Math.round((wa.reminderHoursBefore || 2) * 60)),
          segundoLembreteHabilitado: false,
          segundoLembreteMinutosAntes: 30,
          incluirInstrucaoConfirmacao: true,
          respeitarHorarioComercial: true,
          templatePersonalizado: wa.templateReminder || DEFAULT_REMINDER_TEMPLATE,
        },
      };
    }
    return base;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'expediente' | 'picos' | 'lembretes' | 'produtividade'>('expediente');
  const [customLeadUnit, setCustomLeadUnit] = useState<'minutes' | 'hours'>(() => {
    const mins = expediente.configuracaoLembretes?.minutosAntes ?? 120;
    return mins >= 60 && mins % 60 === 0 ? 'hours' : 'minutes';
  });
  const [customLeadValue, setCustomLeadValue] = useState<number>(() => {
    const mins = expediente.configuracaoLembretes?.minutosAntes ?? 120;
    return mins >= 60 && mins % 60 === 0 ? Math.round(mins / 60) : mins;
  });
  const [isDispatchingTest, setIsDispatchingTest] = useState(false);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const transactions = React.useMemo(() => financeRepository.getTransactions(atelier.id), [atelier.id]);
  const team = React.useMemo(() => teamRepository.getTeam(atelier.id), [atelier.id]);
  const staffStats = React.useMemo(() => staffProductivityRepository.getStats(atelier.id), [atelier.id]);
  const appointments = React.useMemo(
    () => appointmentRepository.getAppointments(atelier.id),
    [atelier.id, scheduleRefreshKey]
  );

  const reminderConfig = expediente.configuracaoLembretes || {
    habilitado: true,
    minutosAntes: 120,
    segundoLembreteHabilitado: false,
    segundoLembreteMinutosAntes: 30,
    incluirInstrucaoConfirmacao: true,
    respeitarHorarioComercial: true,
    templatePersonalizado: DEFAULT_REMINDER_TEMPLATE,
  };

  const upcomingReminders = React.useMemo(
    () => appointmentRepository.getUpcomingReminderSchedule(atelier.id, reminderConfig.minutosAntes),
    [atelier.id, reminderConfig.minutosAntes, scheduleRefreshKey]
  );

  const productivitySummary = React.useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const goalsMap = expediente.metasProdutividadeDiaria || {};

    const items = team.map((member, idx) => {
      const stat = staffStats.find((s) => s.staffId === member.id);
      const todayAppts = appointments.filter(
        (a) =>
          a.data === todayStr &&
          a.status !== 'cancelado' &&
          (a.staffId === member.id || (a.staffName && a.staffName.toLowerCase() === member.nome.toLowerCase()))
      ).length;

      const defaultGoal = member.cargo.toLowerCase().includes('recep') ? 12 : 10;
      const metaDiaria = Math.max(1, goalsMap[member.id] ?? defaultGoal);
      const baselineCompleted = stat ? Math.max(2, Math.min(metaDiaria + 2, stat.atendimentosCount)) : 5 + (idx % 4);
      const realizadosHoje = todayAppts > 0 ? todayAppts : baselineCompleted;
      const percentual = Math.round((realizadosHoje / metaDiaria) * 100);
      const firstName = member.nome.split(' ')[0];

      return {
        staffId: member.id,
        nome: member.nome,
        nomeCurto: firstName,
        cargo: member.cargo,
        metaDiaria,
        realizadosHoje,
        percentual,
        faturamentoEstimado: stat?.faturamentoTotal ?? realizadosHoje * 55,
      };
    });

    const totalMeta = items.reduce((acc, i) => acc + i.metaDiaria, 0);
    const totalRealizado = items.reduce((acc, i) => acc + i.realizadosHoje, 0);
    const percentualGeral = totalMeta > 0 ? Math.round((totalRealizado / totalMeta) * 100) : 0;

    return { items, totalMeta, totalRealizado, percentualGeral };
  }, [team, staffStats, appointments, expediente.metasProdutividadeDiaria]);

  const handleUpdateStaffGoal = (staffId: string, newGoal: number) => {
    const safeGoal = Math.max(1, Math.min(50, newGoal));
    setExpediente((prev) => ({
      ...prev,
      metasProdutividadeDiaria: {
        ...(prev.metasProdutividadeDiaria || {}),
        [staffId]: safeGoal,
      },
    }));
  };

  const handleApplyGoalToAll = (goal: number) => {
    const safeGoal = Math.max(1, Math.min(50, goal));
    const nextMap: Record<string, number> = { ...(expediente.metasProdutividadeDiaria || {}) };
    team.forEach((m) => {
      nextMap[m.id] = safeGoal;
    });
    setExpediente((prev) => ({
      ...prev,
      metasProdutividadeDiaria: nextMap,
    }));
    showToast(`Meta de ${safeGoal} atendimentos/dia aplicada a toda a equipe!`);
  };

  const peakAnalysis = React.useMemo(() => {
    const slotCounts: Record<string, number> = {
      'Segunda a Sexta • Manhã (09h - 12h)': 0,
      'Segunda a Sexta • Almoço (12h - 14h)': 0,
      'Segunda a Sexta • Tarde (14h - 18h)': 0,
      'Segunda a Sexta • Noite (18h - 21h)': 0,
      'Sábado & Domingo • Manhã (09h - 12h)': 0,
      'Sábado & Domingo • Tarde (12h - 19h)': 0,
    };

    let totalCount = transactions.length || 1;

    for (const tx of transactions) {
      const d = new Date(tx.data);
      const day = d.getDay();
      const hour = d.getHours();
      const isWeekend = day === 0 || day === 6;

      if (!isWeekend) {
        if (hour >= 9 && hour < 12) slotCounts['Segunda a Sexta • Manhã (09h - 12h)']++;
        else if (hour >= 12 && hour < 14) slotCounts['Segunda a Sexta • Almoço (12h - 14h)']++;
        else if (hour >= 14 && hour < 18) slotCounts['Segunda a Sexta • Tarde (14h - 18h)']++;
        else slotCounts['Segunda a Sexta • Noite (18h - 21h)']++;
      } else {
        if (hour >= 9 && hour < 12) slotCounts['Sábado & Domingo • Manhã (09h - 12h)']++;
        else slotCounts['Sábado & Domingo • Tarde (12h - 19h)']++;
      }
    }

    return Object.entries(slotCounts).map(([slot, count]) => ({
      slot,
      count,
      percentage: Math.round((count / totalCount) * 100),
      status: count > (totalCount * 0.25) ? 'Pico Intenso 🔴' : count > (totalCount * 0.15) ? 'Movimento Moderado 🟡' : 'Fluxo Tranquilo 🟢'
    }));
  }, [transactions]);

  // Status atual ao vivo
  const statusAoVivo = atelierRepository.getExpedienteStatus(atelier.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleUpdateDay = (
    diaSemana: DiaFuncionamento['diaSemana'],
    patch: Partial<DiaFuncionamento>
  ) => {
    setExpediente(prev => ({
      ...prev,
      dias: prev.dias.map(d => d.diaSemana === diaSemana ? { ...d, ...patch } : d),
    }));
  };

  const handleUpdateInterval = (
    diaSemana: DiaFuncionamento['diaSemana'],
    patch: Partial<NonNullable<DiaFuncionamento['intervalo']>>
  ) => {
    setExpediente(prev => ({
      ...prev,
      dias: prev.dias.map(d => {
        if (d.diaSemana === diaSemana) {
          const currentIntervalo = d.intervalo || { habilitado: true, inicio: '12:00', fim: '13:00' };
          return {
            ...d,
            intervalo: { ...currentIntervalo, ...patch },
          };
        }
        return d;
      }),
    }));
  };

  const handleReplicateMondayToFriday = () => {
    const monday = expediente.dias.find(d => d.diaSemana === 'seg') || expediente.dias[0];
    const weekdays: Array<DiaFuncionamento['diaSemana']> = ['ter', 'qua', 'qui', 'sex'];
    
    setExpediente(prev => ({
      ...prev,
      dias: prev.dias.map(d => {
        if (weekdays.includes(d.diaSemana)) {
          return {
            ...d,
            aberto: monday.aberto,
            inicio: monday.inicio,
            fim: monday.fim,
            intervalo: monday.intervalo ? { ...monday.intervalo } : undefined,
          };
        }
        return d;
      }),
    }));

    showToast('Horários de Segunda aplicados de Terça a Sexta!');
  };

  const handleSetCommercialDefaults = () => {
    setExpediente({
      ...DEFAULT_EXPEDIENTE,
      vagasPorDia: expediente.vagasPorDia,
      limiteFilaSimultanea: expediente.limiteFilaSimultanea,
      configuracaoLembretes: expediente.configuracaoLembretes,
      metasProdutividadeDiaria: expediente.metasProdutividadeDiaria,
    });
    showToast('Padrão comercial restaurado!');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await atelierRepository.updateExpediente(atelier.id, expediente);
      showToast('Horários, vagas e lembretes via WhatsApp salvos com sucesso!');
      if (onSaved) onSaved();
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculo de simulação de capacidade
  const duracao = expediente.duracaoEstimadaMinutos || 35;
  const vagas = expediente.vagasPorDia || 25;
  const totalHorasAtendimento = ((vagas * duracao) / 60).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 overflow-y-auto animate-fadeIn">
      <div className={`min-h-screen ${activeTab === 'produtividade' || activeTab === 'lembretes' ? 'max-w-3xl' : 'max-w-2xl'} mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between transition-all`}>
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
            </button>
            <div className="text-right">
              <span className="font-heading font-black text-xs uppercase tracking-widest text-[#F2CA50] block">
                EXPEDIENTE & VAGAS
              </span>
              <span className="text-[11px] text-white/50">{atelier.nome_negocio}</span>
            </div>
          </div>

          {/* Title Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-white">
                  Horários, Dias & Vagas
                </h1>
                <p className="text-xs text-white/60 mt-0.5">
                  Configure dias de atendimento, horários de abertura/fechamento, lembretes e metas da equipe.
                </p>
              </div>
            </div>

            {/* Live Open/Closed Status Badge */}
            <div className="hidden sm:block text-right">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                statusAoVivo.isOpen 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${statusAoVivo.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span>{statusAoVivo.isOpen ? 'Aberto Agora' : 'Fechado Agora'}</span>
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                Hoje: {statusAoVivo.horarioHoje}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#1C1C1B] border border-white/10 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('expediente')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'expediente'
                  ? 'bg-[#F2CA50] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Expediente</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('picos')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'picos'
                  ? 'bg-[#F2CA50] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Horários de Pico</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lembretes')}
              className={`py-2.5 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center leading-tight ${
                activeTab === 'lembretes'
                  ? 'bg-[#F2CA50] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Configuração de Lembretes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('produtividade')}
              className={`py-2.5 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center leading-tight ${
                activeTab === 'produtividade'
                  ? 'bg-[#F2CA50] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 shrink-0" />
              <span>Metas de Produtividade</span>
            </button>
          </div>

          {activeTab === 'produtividade' && (
            <div className="space-y-6 mb-8 animate-fadeIn">
              {/* Banner Resumo da Equipe */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-[#F2CA50]/15 via-[#1C1C1B] to-black border border-[#F2CA50]/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#F2CA50]/20 border border-[#F2CA50]/40 flex items-center justify-center text-[#F2CA50] shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-white text-base">
                        Metas Diárias de Produtividade por Profissional
                      </h3>
                      <p className="text-xs text-white/60">
                        Defina a meta diária de atendimentos de cada profissional e acompanhe o progresso em tempo real.
                      </p>
                    </div>
                  </div>

                  <div className="px-3.5 py-2 rounded-2xl bg-black/50 border border-white/10 text-right shrink-0">
                    <div className="text-[10px] uppercase font-bold text-white/50">Desempenho Geral Hoje</div>
                    <div className="font-heading font-black text-lg text-[#F2CA50]">
                      {productivitySummary.totalRealizado} / {productivitySummary.totalMeta}{' '}
                      <span className="text-xs text-emerald-400 font-bold">
                        ({productivitySummary.percentualGeral}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso Geral da Equipe */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white/60">Progresso Coletivo do Atelier</span>
                    <span className="text-[#F2CA50]">{productivitySummary.percentualGeral}% da meta diária</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-black/70 border border-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        productivitySummary.percentualGeral >= 100
                          ? 'bg-emerald-400'
                          : productivitySummary.percentualGeral >= 70
                          ? 'bg-[#F2CA50]'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, productivitySummary.percentualGeral))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Gráfico de Progresso Comparativo */}
              <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#F2CA50]" />
                    <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                      Gráfico de Progresso por Profissional
                    </h4>
                  </div>
                  <span className="text-[11px] text-white/45">
                    Atendimentos Realizados vs Meta Diária
                  </span>
                </div>

                {productivitySummary.items.length === 0 ? (
                  <div className="py-10 text-center text-xs text-white/40">
                    Nenhum profissional ativo cadastrado na equipe.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productivitySummary.items}
                        margin={{ top: 10, right: 16, left: -16, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis
                          dataKey="nomeCurto"
                          tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          contentStyle={{
                            backgroundColor: '#141413',
                            borderColor: 'rgba(242,202,80,0.4)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                          formatter={(value: any, name: any) => [
                            `${value} atend.`,
                            name === 'realizadosHoje' ? 'Realizados Hoje' : 'Meta Diária',
                          ]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                          formatter={(value) =>
                            value === 'realizadosHoje' ? 'Realizados Hoje' : 'Meta Diária'
                          }
                        />
                        <Bar
                          dataKey="realizadosHoje"
                          name="realizadosHoje"
                          fill="#25D366"
                          radius={[8, 8, 0, 0]}
                          barSize={26}
                        />
                        <Bar
                          dataKey="metaDiaria"
                          name="metaDiaria"
                          fill="#F2CA50"
                          radius={[8, 8, 0, 0]}
                          barSize={26}
                          fillOpacity={0.45}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Definição de Metas Individuais */}
              <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                      CONFIGURAÇÃO DE METAS INDIVIDUAIS
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">
                      Ajuste o objetivo diário de atendimentos por profissional ou aplique um padrão à equipe.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/40 mr-1">Padrão rápido:</span>
                    {[8, 10, 12, 15].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleApplyGoalToAll(preset)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#F2CA50]/20 text-white/75 hover:text-[#F2CA50] text-[11px] font-bold border border-white/10 transition-colors cursor-pointer"
                      >
                        {preset}/dia
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {productivitySummary.items.map((item) => {
                    const hitGoal = item.percentual >= 100;
                    const nearGoal = item.percentual >= 70 && item.percentual < 100;

                    return (
                      <div
                        key={item.staffId}
                        className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 hover:border-white/20 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-heading font-bold text-sm text-white">
                                {item.nome}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 font-semibold">
                                {item.cargo}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                                  hitGoal
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : nearGoal
                                    ? 'bg-[#F2CA50]/15 text-[#F2CA50] border-[#F2CA50]/30'
                                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {hitGoal ? (
                                  <>
                                    <Award className="w-3 h-3" />
                                    <span>Meta Batida!</span>
                                  </>
                                ) : nearGoal ? (
                                  <span>Em Ritmo</span>
                                ) : (
                                  <span>Abaixo da Meta</span>
                                )}
                              </span>
                            </div>
                            <div className="text-xs text-white/50 mt-1">
                              Realizados hoje: <strong className="text-white">{item.realizadosHoje}</strong> de{' '}
                              <strong className="text-[#F2CA50]">{item.metaDiaria}</strong> atendimentos ({item.percentual}%)
                            </div>
                          </div>

                          {/* Stepper de Meta Diária */}
                          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center bg-black/50 p-1.5 rounded-xl border border-white/10">
                            <span className="text-[10px] font-bold uppercase text-white/50 px-1.5">Meta/Dia:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStaffGoal(item.staffId, item.metaDiaria - 1)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              aria-label={`Meta diária de ${item.nome}`}
                              value={item.metaDiaria}
                              onChange={(e) => handleUpdateStaffGoal(item.staffId, parseInt(e.target.value, 10) || 1)}
                              className="w-12 text-center py-1 rounded-lg bg-black/70 border border-white/10 text-[#F2CA50] font-heading font-black text-sm focus:outline-none focus:border-[#F2CA50]"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateStaffGoal(item.staffId, item.metaDiaria + 1)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Barra de Progresso Individual */}
                        <div className="w-full h-2.5 rounded-full bg-black/70 border border-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              hitGoal ? 'bg-emerald-400' : nearGoal ? 'bg-[#F2CA50]' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(4, item.percentual))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lembretes' && (
            <div className="space-y-6 mb-8 animate-fadeIn">
              {/* Banner Resumo */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#1C1C1B] to-black border border-[#25D366]/30 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-white text-base">
                        Configuração de Lembretes Automáticos via WhatsApp
                      </h3>
                      <p className="text-xs text-white/60">
                        Defina o tempo exato de antecedência dos disparos automáticos para reduzir faltas e manter a agenda cheia.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        reminderConfig.habilitado
                          ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/40'
                          : 'bg-white/5 text-white/45 border-white/10'
                      }`}
                    >
                      {reminderConfig.habilitado
                        ? `Ativo • ${formatAntecedencia(reminderConfig.minutosAntes)}`
                        : 'Disparos Pausados'}
                    </span>
                    <span className="text-[10px] text-white/45">
                      Canal: {whatsappConfig.connected ? 'WhatsApp Business Conectado' : 'WhatsApp Aguardando Conexão'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Principal: Ativação e Tempo de Antecedência */}
              <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Ativar Disparo Automático de Lembretes via WhatsApp
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5">
                      Sincronizado automaticamente com o painel do WhatsApp Business do atelier.
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Ativar ou desativar lembretes automáticos via WhatsApp"
                    onClick={() =>
                      setExpediente((p) => ({
                        ...p,
                        configuracaoLembretes: {
                          ...reminderConfig,
                          habilitado: !reminderConfig.habilitado,
                        },
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      reminderConfig.habilitado ? 'bg-[#25D366]' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                        reminderConfig.habilitado ? 'translate-x-5' : 'translate-x-0 bg-neutral-400'
                      }`}
                    />
                  </button>
                </div>

                {reminderConfig.habilitado && (
                  <div className="space-y-5 pt-1">
                    {/* Presets Rápidos de Antecedência */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#F2CA50] uppercase tracking-wider mb-2">
                        Tempo de Antecedência para o Disparo
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          { label: '15 min antes', sub: 'Lembrete imediato', value: 15, unit: 'minutes' as const, raw: 15 },
                          { label: '30 min antes', sub: 'Cliente a caminho', value: 30, unit: 'minutes' as const, raw: 30 },
                          { label: '1 hora antes', sub: 'Mais utilizado', value: 60, unit: 'hours' as const, raw: 1 },
                          { label: '2 horas antes', sub: 'Confirmação no dia', value: 120, unit: 'hours' as const, raw: 2 },
                          { label: '4 horas antes', sub: 'Turno anterior', value: 240, unit: 'hours' as const, raw: 4 },
                          { label: '24 horas antes', sub: '1 dia de antecedência', value: 1440, unit: 'hours' as const, raw: 24 },
                        ].map((opt) => {
                          const isSelected = reminderConfig.minutosAntes === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setCustomLeadUnit(opt.unit);
                                setCustomLeadValue(opt.raw);
                                setExpediente((p) => ({
                                  ...p,
                                  configuracaoLembretes: {
                                    ...reminderConfig,
                                    minutosAntes: opt.value,
                                  },
                                }));
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/50 shadow-md'
                                  : 'bg-black/40 text-white/75 border-white/10 hover:border-white/25'
                              }`}
                            >
                              <Clock className="w-4 h-4 shrink-0" />
                              <div>
                                <div className="text-xs font-bold leading-tight">{opt.label}</div>
                                <div className="text-[10px] opacity-65">{opt.sub}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Antecedência Personalizada */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-white">
                          Antecedência Personalizada
                        </div>
                        <div className="text-[11px] text-white/50">
                          Defina qualquer intervalo exato entre 5 minutos e 72 horas antes do horário marcado.
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={customLeadUnit === 'minutes' ? 5 : 1}
                          max={customLeadUnit === 'minutes' ? 4320 : 72}
                          value={customLeadValue}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setCustomLeadValue(val);
                            const nextMins =
                              customLeadUnit === 'hours'
                                ? Math.min(4320, Math.max(5, val * 60))
                                : Math.min(4320, Math.max(5, val));
                            setExpediente((p) => ({
                              ...p,
                              configuracaoLembretes: {
                                ...reminderConfig,
                                minutosAntes: nextMins,
                              },
                            }));
                          }}
                          className="w-20 px-3 py-2 rounded-lg bg-black/70 border border-white/15 text-[#25D366] font-heading font-black text-sm text-center focus:outline-none focus:border-[#25D366]"
                        />
                        <select
                          value={customLeadUnit}
                          onChange={(e) => {
                            const nextUnit = e.target.value as 'minutes' | 'hours';
                            setCustomLeadUnit(nextUnit);
                            const convertedVal =
                              nextUnit === 'hours'
                                ? Math.max(1, Math.round(reminderConfig.minutosAntes / 60))
                                : reminderConfig.minutosAntes;
                            setCustomLeadValue(convertedVal);
                            const nextMins =
                              nextUnit === 'hours'
                                ? Math.min(4320, convertedVal * 60)
                                : Math.min(4320, Math.max(5, convertedVal));
                            setExpediente((p) => ({
                              ...p,
                              configuracaoLembretes: {
                                ...reminderConfig,
                                minutosAntes: nextMins,
                              },
                            }));
                          }}
                          className="px-3 py-2 rounded-lg bg-black/70 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-[#25D366] cursor-pointer"
                        >
                          <option value="minutes">minutos antes</option>
                          <option value="hours">horas antes</option>
                        </select>
                      </div>
                    </div>

                    {/* 2º Lembrete de Reforço & Regras */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-white">2º Lembrete de Reforço</div>
                            <div className="text-[10px] text-white/45">Envia um aviso extra próximo ao horário</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={reminderConfig.segundoLembreteHabilitado ?? false}
                            onChange={(e) =>
                              setExpediente((p) => ({
                                ...p,
                                configuracaoLembretes: {
                                  ...reminderConfig,
                                  segundoLembreteHabilitado: e.target.checked,
                                  segundoLembreteMinutosAntes: reminderConfig.segundoLembreteMinutosAntes || 30,
                                },
                              }))
                            }
                            className="w-4 h-4 rounded border-white/20 text-[#25D366] focus:ring-[#25D366] bg-black cursor-pointer"
                          />
                        </div>

                        {reminderConfig.segundoLembreteHabilitado && (
                          <select
                            value={reminderConfig.segundoLembreteMinutosAntes ?? 30}
                            onChange={(e) =>
                              setExpediente((p) => ({
                                ...p,
                                configuracaoLembretes: {
                                  ...reminderConfig,
                                  segundoLembreteMinutosAntes: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 text-xs font-bold text-[#25D366] focus:outline-none focus:border-[#25D366] cursor-pointer"
                          >
                            <option value={15}>15 minutos antes do atendimento</option>
                            <option value={30}>30 minutos antes do atendimento</option>
                            <option value={60}>1 hora antes do atendimento</option>
                            <option value={120}>2 horas antes do atendimento</option>
                          </select>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <div>
                            <div className="text-xs font-bold text-white">Botão de Confirmação Rápida</div>
                            <div className="text-[10px] text-white/45">Orienta responder 1 (Confirmar) ou 2 (Reagendar)</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={reminderConfig.incluirInstrucaoConfirmacao ?? true}
                            onChange={(e) =>
                              setExpediente((p) => ({
                                ...p,
                                configuracaoLembretes: {
                                  ...reminderConfig,
                                  incluirInstrucaoConfirmacao: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 rounded border-white/20 text-[#25D366] focus:ring-[#25D366] bg-black cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between gap-2 cursor-pointer pt-2 border-t border-white/5">
                          <div>
                            <div className="text-xs font-bold text-white">Respeitar Janela Comercial</div>
                            <div className="text-[10px] text-white/45">Evita disparos na madrugada (apenas 08h–21h)</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={reminderConfig.respeitarHorarioComercial ?? true}
                            onChange={(e) =>
                              setExpediente((p) => ({
                                ...p,
                                configuracaoLembretes: {
                                  ...reminderConfig,
                                  respeitarHorarioComercial: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 rounded border-white/20 text-[#25D366] focus:ring-[#25D366] bg-black cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Template + Preview em Tempo Real */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
                          Template da Mensagem de Lembrete
                        </label>
                        <textarea
                          rows={4}
                          value={reminderConfig.templatePersonalizado || DEFAULT_REMINDER_TEMPLATE}
                          onChange={(e) =>
                            setExpediente((p) => ({
                              ...p,
                              configuracaoLembretes: {
                                ...reminderConfig,
                                templatePersonalizado: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs focus:border-[#25D366] focus:outline-none leading-relaxed"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['{{nome}}', '{{servico}}', '{{horario}}', '{{profissional}}', '{{atelier}}'].map(
                            (variable) => (
                              <button
                                key={variable}
                                type="button"
                                onClick={() => {
                                  const current = reminderConfig.templatePersonalizado || DEFAULT_REMINDER_TEMPLATE;
                                  setExpediente((p) => ({
                                    ...p,
                                    configuracaoLembretes: {
                                      ...reminderConfig,
                                      templatePersonalizado: `${current} ${variable}`.trim(),
                                    },
                                  }));
                                }}
                                className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-[#25D366]/15 text-[#25D366] text-[10px] font-mono border border-white/10 transition-colors cursor-pointer"
                              >
                                + {variable}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Preview WhatsApp */}
                      <div className="p-3.5 rounded-2xl bg-[#0b141a] border border-white/10 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-white/50 border-b border-white/5 pb-2">
                          <span className="font-bold text-[#25D366] uppercase tracking-wider">
                            Pré-visualização no WhatsApp
                          </span>
                          <span>
                            Ex.: Agend. 16:00 → Disparo {subtractMinutesFromTime('16:00', reminderConfig.minutosAntes)}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl rounded-tl-none bg-[#005c4b] text-white text-xs leading-relaxed shadow whitespace-pre-line">
                          {(reminderConfig.templatePersonalizado || DEFAULT_REMINDER_TEMPLATE)
                            .replace(/{{nome}}/g, 'Lucas Ferreira')
                            .replace(/{{servico}}/g, 'Corte Degradê + Barba')
                            .replace(/{{horario}}/g, '16:00')
                            .replace(/{{profissional}}/g, team[0]?.nome || 'Marcos Silva')
                            .replace(/{{atelier}}/g, atelier.nome_negocio)}
                          {(reminderConfig.incluirInstrucaoConfirmacao ?? true) &&
                            '\n\nResponda *1* para confirmar presença ou *2* se precisar reagendar.'}
                          <div className="text-[9px] text-white/60 text-right mt-1">
                            {subtractMinutesFromTime('16:00', reminderConfig.minutosAntes)} ✓✓
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Próximos Disparos Programados & Ações */}
              <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                      FILA DE DISPAROS AUTOMÁTICOS
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">
                      Horários calculados para os agendamentos ativos com {formatAntecedencia(reminderConfig.minutosAntes)}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={isDispatchingTest}
                      onClick={async () => {
                        setIsDispatchingTest(true);
                        try {
                          const targetPhone = whatsappConfig.adminTestPhone || '11999998888';
                          const previewMsg = (reminderConfig.templatePersonalizado || DEFAULT_REMINDER_TEMPLATE)
                            .replace(/{{nome}}/g, 'Cliente Teste')
                            .replace(/{{servico}}/g, 'Corte Degradê Fade')
                            .replace(/{{horario}}/g, '16:00')
                            .replace(/{{profissional}}/g, team[0]?.nome || 'Equipe do Atelier')
                            .replace(/{{atelier}}/g, atelier.nome_negocio);
                          await whatsappRepository.sendMessage({
                            atelierId: atelier.id,
                            recipientName: 'Teste Admin',
                            recipientPhone: targetPhone,
                            type: 'lembrete',
                            customMessage: previewMsg,
                          });
                          showToast(`Lembrete de teste enviado via WhatsApp para ${targetPhone}!`);
                        } finally {
                          setIsDispatchingTest(false);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>Enviar Teste</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDispatchingTest || !reminderConfig.habilitado}
                      onClick={async () => {
                        setIsDispatchingTest(true);
                        try {
                          const res = await appointmentRepository.processPendingWhatsAppReminders(atelier.id, {
                            minutosAntes: reminderConfig.minutosAntes,
                            templatePersonalizado: reminderConfig.templatePersonalizado,
                            incluirInstrucaoConfirmacao: reminderConfig.incluirInstrucaoConfirmacao,
                            respeitarHorarioComercial: reminderConfig.respeitarHorarioComercial,
                          });
                          setScheduleRefreshKey((k) => k + 1);
                          showToast(
                            res.sentCount > 0
                              ? `${res.sentCount} lembrete(s) disparado(s) via WhatsApp!`
                              : 'Nenhum lembrete dentro da janela de envio neste momento.'
                          );
                        } finally {
                          setIsDispatchingTest(false);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Disparar Pendentes</span>
                    </button>
                  </div>
                </div>

                {upcomingReminders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-white/40">
                    Nenhum agendamento futuro ativo encontrado para programar lembretes no momento.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {upcomingReminders.slice(0, 6).map(({ appointment, dispatchAt, status }) => {
                      const dispatchDate = new Date(dispatchAt);
                      return (
                        <div
                          key={appointment.id}
                          className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">
                              {appointment.clientName}{' '}
                              <span className="text-white/40 font-normal">• {appointment.serviceName}</span>
                            </div>
                            <div className="text-[11px] text-white/50 mt-0.5">
                              Atendimento: {appointment.data.split('-').reverse().join('/')} às {appointment.horario} •
                              Disparo previsto:{' '}
                              <strong className="text-[#25D366]">
                                {dispatchDate.toLocaleDateString('pt-BR')} às{' '}
                                {dispatchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </strong>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 border self-start sm:self-center ${
                              status === 'enviado'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : status === 'pronto'
                                ? 'bg-[#25D366]/20 text-[#25D366] border-[#25D366]/40'
                                : 'bg-white/5 text-white/60 border-white/10'
                            }`}
                          >
                            {status === 'enviado'
                              ? 'Enviado ✓'
                              : status === 'pronto'
                              ? 'Pronto para Envio'
                              : 'Programado'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'picos' && (
            <div className="space-y-6 mb-8 animate-fadeIn">
              {/* Banner Explicativo */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#1C1C1B] to-black border border-[#F2CA50]/30 shadow-xl space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F2CA50]/20 border border-[#F2CA50]/40 flex items-center justify-center text-[#F2CA50] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-white text-base">
                      Inteligência de Demanda & Horários de Pico
                    </h3>
                    <p className="text-xs text-white/60">
                      Com base no histórico de {transactions.length} atendimentos registrados, o sistema identifica os períodos de maior fluxo para sugerir a alocação ideal de profissionais.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid de Horários e Demanda */}
              <div className="space-y-3">
                {peakAnalysis.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all shadow-md"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-heading font-bold text-white text-sm">
                          {item.slot}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          item.status.includes('Intenso') ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          item.status.includes('Moderado') ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-white/50">
                        Volume de atendimento: <strong>{item.count}</strong> registros ({item.percentage}% do total do atelier)
                      </div>
                      {/* Mini barra de proporção */}
                      <div className="w-full h-2 bg-black/80 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full rounded-full ${item.status.includes('Intenso') ? 'bg-red-400' : item.status.includes('Moderado') ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.max(8, item.percentage)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/60 border border-white/5 shrink-0 text-right sm:text-left min-w-[200px]">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Recomendação da IA:</div>
                      <div className="text-xs font-bold text-[#F2CA50] mt-0.5">
                        {item.status.includes('Intenso') ? '⚡ Alocar +2 Profissionais (Pico)' :
                         item.status.includes('Moderado') ? '⚖️ Equipe Padrão Adequada' :
                         '💡 Oportunidade para Promoções / Limpeza'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'expediente' && (
            <>
          <div className="mb-8 p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F2CA50]" />
                <h2 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                  Capacidade & Limite de Vagas
                </h2>
              </div>
              <span className="text-[10px] text-white/40">Controle de fluxo diário</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Vagas por Dia / Limite Máximo de Agendamentos */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                <label className="text-[11px] font-bold text-[#F2CA50] uppercase tracking-wider block mb-1">
                  Limite Máx. Agendamentos/Dia
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setExpediente(p => ({ ...p, vagasPorDia: Math.max(5, p.vagasPorDia - 1) }))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={expediente.vagasPorDia}
                    onChange={(e) => setExpediente(p => ({ ...p, vagasPorDia: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-16 text-center py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-heading font-black text-lg focus:outline-none focus:border-[#F2CA50]"
                  />
                  <button
                    type="button"
                    onClick={() => setExpediente(p => ({ ...p, vagasPorDia: p.vagasPorDia + 1 }))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-white/40 mt-1.5 block">
                  Capacidade operacional máxima diária
                </span>
              </div>

              {/* Limite Fila Simultânea */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                <label className="text-[11px] font-bold text-white/80 uppercase tracking-wider block mb-1">
                  Fila Simultânea
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setExpediente(p => ({ ...p, limiteFilaSimultanea: Math.max(2, p.limiteFilaSimultanea - 1) }))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={expediente.limiteFilaSimultanea}
                    onChange={(e) => setExpediente(p => ({ ...p, limiteFilaSimultanea: Math.max(2, parseInt(e.target.value) || 2) }))}
                    className="w-16 text-center py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-heading font-black text-lg focus:outline-none focus:border-[#F2CA50]"
                  />
                  <button
                    type="button"
                    onClick={() => setExpediente(p => ({ ...p, limiteFilaSimultanea: p.limiteFilaSimultanea + 1 }))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-white/40 mt-1.5 block">
                  Clientes aguardando ao mesmo tempo
                </span>
              </div>

              {/* Duração Estimada */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                <label className="text-[11px] font-bold text-white/80 uppercase tracking-wider block mb-1">
                  Tempo por Vaga
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={expediente.duracaoEstimadaMinutos}
                    onChange={(e) => setExpediente(p => ({ ...p, duracaoEstimadaMinutos: parseInt(e.target.value) || 35 }))}
                    className="w-full py-2 px-3 rounded-lg bg-black/60 border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-[#F2CA50] cursor-pointer"
                  >
                    <option value={20}>20 minutos (Rápido)</option>
                    <option value={30}>30 minutos (Padrão)</option>
                    <option value={35}>35 minutos (Degradê)</option>
                    <option value={45}>45 minutos (Completo)</option>
                    <option value={60}>60 minutos (VIP/Barboterapia)</option>
                  </select>
                </div>
                <span className="text-[10px] text-white/40 mt-1.5 block">
                  Tempo médio por atendimento
                </span>
              </div>
            </div>

            {/* Toggle Permitir fora do expediente & Summary */}
            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expediente.permitirFilaForaHorario}
                  onChange={(e) => setExpediente(p => ({ ...p, permitirFilaForaHorario: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 text-[#F2CA50] focus:ring-[#F2CA50] bg-black cursor-pointer"
                />
                <span className="text-xs text-white/80">
                  Permitir que clientes entrem na fila mesmo quando o atelier estiver fechado
                </span>
              </label>

              <div className="text-[11px] text-[#F2CA50] font-medium bg-[#F2CA50]/10 px-3 py-1.5 rounded-lg border border-[#F2CA50]/20 shrink-0">
                ⚡ Capacidade estimada: ~{totalHorasAtendimento}h de atendimento/dia
              </div>
            </div>
          </div>

          {/* Section 1.5: Recorrência de Agendamentos */}
          <div className="mb-8 p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F2CA50]" />
                <h2 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                  Recorrência de Agendamentos (Clientes Fiéis)
                </h2>
              </div>
              <span className="text-[10px] text-[#F2CA50] bg-[#F2CA50]/10 px-2 py-0.5 rounded-full font-bold">Fidelização</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Habilitar Serviços Recorrentes</div>
                  <div className="text-[11px] text-white/50 mt-0.5">Permite agendamentos automáticos semanais, quinzenais ou mensais.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpediente(p => ({
                    ...p,
                    recorrencia: {
                      ...(p.recorrencia || { frequenciaPadrao: 'semanal', permitirClienteSelecionar: true, descontoRecorrenciaPercentual: 10 }),
                      habilitado: !(p.recorrencia?.habilitado ?? true)
                    }
                  }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    (expediente.recorrencia?.habilitado ?? true) ? 'bg-[#F2CA50]' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                      (expediente.recorrencia?.habilitado ?? true) ? 'translate-x-5' : 'translate-x-0 bg-neutral-400'
                    }`}
                  />
                </button>
              </div>

              {(expediente.recorrencia?.habilitado ?? true) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                      Frequência Padrão
                    </label>
                    <select
                      value={expediente.recorrencia?.frequenciaPadrao || 'semanal'}
                      onChange={(e) => setExpediente(p => ({
                        ...p,
                        recorrencia: {
                          ...(p.recorrencia || { habilitado: true, permitirClienteSelecionar: true, descontoRecorrenciaPercentual: 10 }),
                          frequenciaPadrao: e.target.value as any
                        }
                      }))}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-[#F2CA50] cursor-pointer"
                    >
                      <option value="semanal">Semanal (A cada 7 dias)</option>
                      <option value="quinzenal">Quinzenal (A cada 15 dias)</option>
                      <option value="mensal">Mensal (A cada 30 dias)</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                      Desconto para Recorrentes
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={expediente.recorrencia?.descontoRecorrenciaPercentual ?? 10}
                        onChange={(e) => setExpediente(p => ({
                          ...p,
                          recorrencia: {
                            ...(p.recorrencia || { habilitado: true, frequenciaPadrao: 'semanal', permitirClienteSelecionar: true }),
                            descontoRecorrenciaPercentual: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-16 text-center py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-heading font-bold text-sm focus:outline-none focus:border-[#F2CA50]"
                      />
                      <span className="text-xs text-[#F2CA50] font-bold">% de desconto</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Permitir no App</div>
                      <div className="text-xs text-white mt-0.5">Cliente escolhe recorrência</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={expediente.recorrencia?.permitirClienteSelecionar ?? true}
                      onChange={(e) => setExpediente(p => ({
                        ...p,
                        recorrencia: {
                          ...(p.recorrencia || { habilitado: true, frequenciaPadrao: 'semanal', descontoRecorrenciaPercentual: 10 }),
                          permitirClienteSelecionar: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 rounded border-white/20 text-[#F2CA50] focus:ring-[#F2CA50] bg-black cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 1.6: Pausa Geral / Almoço Simultâneo da Equipe */}
          <div className="mb-8 p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#F2CA50]" />
                <h2 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                  Pausa Geral Simultânea (Almoço da Equipe)
                </h2>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">Bloqueio Geral</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Habilitar Pausa Simultânea</div>
                  <div className="text-[11px] text-white/50 mt-0.5">Bloqueia horários na agenda para todos os funcionários ao mesmo tempo.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpediente(p => ({
                    ...p,
                    pausaGeral: {
                      ...(p.pausaGeral || { inicio: '12:00', fim: '13:00' }),
                      habilitado: !(p.pausaGeral?.habilitado ?? true)
                    }
                  }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    (expediente.pausaGeral?.habilitado ?? true) ? 'bg-[#F2CA50]' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                      (expediente.pausaGeral?.habilitado ?? true) ? 'translate-x-5' : 'translate-x-0 bg-neutral-400'
                    }`}
                  />
                </button>
              </div>

              {(expediente.pausaGeral?.habilitado ?? true) && (
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-xl border border-white/10">
                    <span className="text-[11px] text-white/50 font-bold uppercase">Das</span>
                    <input
                      type="time"
                      value={expediente.pausaGeral?.inicio || '12:00'}
                      onChange={(e) => setExpediente(p => ({
                        ...p,
                        pausaGeral: {
                          ...(p.pausaGeral || { habilitado: true, fim: '13:00' }),
                          inicio: e.target.value
                        }
                      }))}
                      className="bg-transparent text-white text-xs font-bold focus:outline-none"
                    />
                    <span className="text-[11px] text-white/50 font-bold uppercase">às</span>
                    <input
                      type="time"
                      value={expediente.pausaGeral?.fim || '13:00'}
                      onChange={(e) => setExpediente(p => ({
                        ...p,
                        pausaGeral: {
                          ...(p.pausaGeral || { habilitado: true, inicio: '12:00' }),
                          fim: e.target.value
                        }
                      }))}
                      className="bg-transparent text-white text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-white/50">
                    Nenhum atendimento será agendado neste intervalo diário.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 1.7: Feriados e Datas Fechadas */}
          <div className="mb-8 p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <h2 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                  Feriados & Datas Específicas Fechadas
                </h2>
              </div>
              <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-bold">Bloqueio de Data</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  id="new-holiday-input"
                  className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2CA50]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('new-holiday-input') as HTMLInputElement;
                    if (input && input.value) {
                      const dateVal = input.value;
                      const currentList = expediente.diasExcecaoFechados || [];
                      if (!currentList.includes(dateVal)) {
                        setExpediente(p => ({
                          ...p,
                          diasExcecaoFechados: [...currentList, dateVal].sort()
                        }));
                        input.value = '';
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F2CA50] hover:bg-[#d4af37] text-black font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Adicionar Feriado / Fechamento
                </button>
              </div>

              {/* Lista de datas bloqueadas */}
              <div className="space-y-2">
                {(!expediente.diasExcecaoFechados || expediente.diasExcecaoFechados.length === 0) ? (
                  <div className="text-xs text-white/40 italic">Nenhum feriado ou data extra cadastrada.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {expediente.diasExcecaoFechados.map((dateStr) => (
                      <div
                        key={dateStr}
                        className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2"
                      >
                        <span>{dateStr.split('-').reverse().join('/')}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setExpediente(p => ({
                              ...p,
                              diasExcecaoFechados: (p.diasExcecaoFechados || []).filter(d => d !== dateStr)
                            }));
                          }}
                          className="text-red-400 hover:text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Dias de Funcionamento e Horários */}
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F2CA50]" />
                <h2 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                  Dias de Funcionamento & Horários
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReplicateMondayToFriday}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white/80 border border-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3 h-3 text-[#F2CA50]" />
                  <span>Copiar Seg p/ Seg-Sex</span>
                </button>
                <button
                  type="button"
                  onClick={handleSetCommercialDefaults}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white/60 hover:text-white border border-white/5 transition-colors cursor-pointer"
                >
                  Restaurar Padrão
                </button>
              </div>
            </div>

            {/* List of 7 Days */}
            <div className="space-y-3">
              {expediente.dias.map((dia) => {
                const isIntervalActive = dia.intervalo?.habilitado ?? false;

                return (
                  <div
                    key={dia.diaSemana}
                    className={`p-4 rounded-xl border transition-all ${
                      dia.aberto
                        ? 'bg-[#1C1C1B] border-white/10 shadow-md'
                        : 'bg-black/30 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Day Name & Open/Closed Switch */}
                      <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[150px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateDay(dia.diaSemana, { aberto: !dia.aberto })}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            dia.aberto ? 'bg-emerald-500' : 'bg-neutral-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                              dia.aberto ? 'translate-x-5' : 'translate-x-0 bg-neutral-400'
                            }`}
                          />
                        </button>
                        <div>
                          <span className="font-heading font-bold text-sm text-white block">
                            {dia.nome}
                          </span>
                          <span className={`text-[10px] font-bold ${dia.aberto ? 'text-emerald-400' : 'text-white/40'}`}>
                            {dia.aberto ? 'Aberto' : 'Fechado'}
                          </span>
                        </div>
                      </div>

                      {/* Hours Inputs */}
                      {dia.aberto ? (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/10">
                            <span className="text-[10px] text-white/40 uppercase font-bold">Das</span>
                            <input
                              type="time"
                              value={dia.inicio}
                              onChange={(e) => handleUpdateDay(dia.diaSemana, { inicio: e.target.value })}
                              className="bg-transparent text-white text-xs font-bold focus:outline-none"
                            />
                            <span className="text-[10px] text-white/40 uppercase font-bold">às</span>
                            <input
                              type="time"
                              value={dia.fim}
                              onChange={(e) => handleUpdateDay(dia.diaSemana, { fim: e.target.value })}
                              className="bg-transparent text-white text-xs font-bold focus:outline-none"
                            />
                          </div>

                          {/* Lunch Interval Toggle */}
                          <button
                            type="button"
                            onClick={() => handleUpdateInterval(dia.diaSemana, { habilitado: !isIntervalActive })}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                              isIntervalActive
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-white/5 text-white/40 border-white/5 hover:text-white/70'
                            }`}
                          >
                            <Coffee className="w-3 h-3" />
                            <span>Almoço</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-white/30 italic">
                          Atendimento suspenso neste dia
                        </div>
                      )}
                    </div>

                    {/* Lunch Break Expandable Inputs */}
                    {dia.aberto && isIntervalActive && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs">
                        <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                          <Coffee className="w-3 h-3" /> Intervalo / Pausa:
                        </span>
                        <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          <input
                            type="time"
                            value={dia.intervalo?.inicio || '12:00'}
                            onChange={(e) => handleUpdateInterval(dia.diaSemana, { inicio: e.target.value })}
                            className="bg-transparent text-white text-xs font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-white/40">até</span>
                          <input
                            type="time"
                            value={dia.intervalo?.fim || '13:00'}
                            onChange={(e) => handleUpdateInterval(dia.diaSemana, { fim: e.target.value })}
                            className="bg-transparent text-white text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-white/40 hidden sm:inline">
                          (Nenhum cliente é chamado nesse intervalo)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-white/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#F2CA50]" />
            <span>As regras de horários e vagas são aplicadas na fila pública e no painel.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#F2CA50] hover:bg-[#d4af37] text-black font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-[#F2CA50]/15 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {/* Temporary Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl bg-[#1C1C1B] border border-[#F2CA50] text-white text-xs font-bold flex items-center gap-2 shadow-2xl shadow-black/80 animate-slideDown">
            <Check className="w-4 h-4 text-[#F2CA50]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
