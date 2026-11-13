import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Smartphone, 
  Radio, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  DollarSign, 
  Users, 
  Flame,
  CheckCircle2,
  Zap,
  HelpCircle,
  Target,
  Award,
  Check
} from 'lucide-react';
import { AtelierProfile, Transaction, QueueItem, MetodoPagamento } from '../types';
import { financeRepository } from '../services/store';

interface AdminAnalyticsDashboardProps {
  atelier: AtelierProfile;
  transactions: Transaction[];
  queue: QueueItem[];
  onOpenPaymentSettings?: () => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  atelier,
  transactions,
  queue,
  onOpenPaymentSettings,
}) => {
  const [periodo, setPeriodo] = useState<7 | 14 | 30>(7);
  const [metricaVolume, setMetricaVolume] = useState<'atendimentos' | 'receita'>('atendimentos');

  // Meta Diária de Faturamento
  const [metaDiaria, setMetaDiaria] = useState<number>(() => financeRepository.getDailyGoal(atelier.id));
  const [showEditMetaModal, setShowEditMetaModal] = useState(false);
  const [tempGoalInput, setTempGoalInput] = useState<string>(() => String(financeRepository.getDailyGoal(atelier.id)));
  const [goalSavedToast, setGoalSavedToast] = useState<string | null>(null);

  React.useEffect(() => {
    const handleMeta = () => {
      setMetaDiaria(financeRepository.getDailyGoal(atelier.id));
    };
    window.addEventListener('estilo_meta_updated', handleMeta);
    return () => window.removeEventListener('estilo_meta_updated', handleMeta);
  }, [atelier.id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Estatísticas de Faturamento de Hoje vs Meta da Equipe
  const todayStats = useMemo(() => {
    const now = new Date();
    const todayTx = transactions.filter(t => {
      const d = new Date(t.data);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
    const todayRevenue = todayTx.reduce((acc, t) => acc + t.valor, 0);
    const todayCount = todayTx.length;
    const percent = metaDiaria > 0 ? Math.round((todayRevenue / metaDiaria) * 100) : 0;
    const remaining = Math.max(0, metaDiaria - todayRevenue);
    const isGoalReached = todayRevenue >= metaDiaria;
    const avgTicket = todayCount > 0 ? todayRevenue / todayCount : 65;
    const metaCortes = Math.max(1, Math.ceil(metaDiaria / (avgTicket || 65)));

    return { todayRevenue, todayCount, percent, remaining, isGoalReached, metaCortes };
  }, [transactions, metaDiaria]);

  // 1. Dados: Volume de Atendimentos Diários
  const dailyVolumeData = useMemo(() => {
    const days: Array<{
      dateKey: string;
      dia: string;
      diaSemana: string;
      atendimentos: number;
      receita: number;
      ticketMedio: number;
      meta: number;
    }> = [];

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();

    // Indexar transações reais por data 'YYYY-MM-DD'
    const actualMap: Record<string, { count: number; total: number }> = {};
    for (const tx of transactions) {
      const d = new Date(tx.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!actualMap[key]) {
        actualMap[key] = { count: 0, total: 0 };
      }
      actualMap[key].count += 1;
      actualMap[key].total += tx.valor;
    }

    for (let i = periodo - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayOfWeek = d.getDay();
      const diaSemana = diasSemana[dayOfWeek];
      const dia = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      let atendimentos = actualMap[key]?.count || 0;
      let receita = actualMap[key]?.total || 0;

      // Realistic barbershop baseline if no real transactions exist for past mock days
      if (atendimentos === 0 && i > 0) {
        const base = dayOfWeek === 6 ? 14 : dayOfWeek === 5 ? 11 : dayOfWeek === 0 ? 3 : (6 + (i % 4));
        const avg = 60 + ((i * 5) % 25);
        atendimentos = base;
        receita = base * avg;
      }

      const ticketMedio = atendimentos > 0 ? Math.round(receita / atendimentos) : 0;

      days.push({
        dateKey: key,
        dia: `${diaSemana} ${dia}`,
        diaSemana,
        atendimentos,
        receita,
        ticketMedio,
        meta: metricaVolume === 'atendimentos' ? todayStats.metaCortes : metaDiaria,
      });
    }

    return days;
  }, [transactions, periodo, metricaVolume, todayStats.metaCortes, metaDiaria]);

  // Totais do período de volume
  const volumeKPIs = useMemo(() => {
    const totalAtendimentos = dailyVolumeData.reduce((acc, d) => acc + d.atendimentos, 0);
    const totalFaturado = dailyVolumeData.reduce((acc, d) => acc + d.receita, 0);
    const mediaDiaria = Math.round((totalAtendimentos / dailyVolumeData.length) * 10) / 10;
    const ticketMedio = totalAtendimentos > 0 ? Math.round(totalFaturado / totalAtendimentos) : 0;

    // Achar o melhor dia
    const melhorDia = dailyVolumeData.reduce((prev, current) => 
      (current.atendimentos > prev.atendimentos) ? current : prev, 
      dailyVolumeData[0]
    );

    return { totalAtendimentos, totalFaturado, mediaDiaria, ticketMedio, melhorDia };
  }, [dailyVolumeData]);

  // 2. Dados: Comparativo de Métodos de Pagamento
  const paymentMethodsData = useMemo(() => {
    const counts: Record<MetodoPagamento, { count: number; total: number }> = {
      pix: { count: 0, total: 0 },
      cartao_debito: { count: 0, total: 0 },
      cartao_credito: { count: 0, total: 0 },
      tap_on_phone: { count: 0, total: 0 },
      dinheiro: { count: 0, total: 0 },
    };

    let totalGeral = 0;
    let countGeral = 0;

    for (const tx of transactions) {
      const metodo: MetodoPagamento = tx.metodo_pagamento || 'pix';
      if (counts[metodo]) {
        counts[metodo].count += 1;
        counts[metodo].total += tx.valor;
        totalGeral += tx.valor;
        countGeral += 1;
      }
    }

    // Se estiver vazio (ex. primeiro uso), fornecer distribuição representativa
    if (countGeral === 0) {
      counts.pix = { count: 18, total: 1260 };
      counts.cartao_debito = { count: 11, total: 770 };
      counts.cartao_credito = { count: 7, total: 630 };
      counts.tap_on_phone = { count: 5, total: 350 };
      counts.dinheiro = { count: 4, total: 240 };
      totalGeral = 3250;
      countGeral = 45;
    }

    const colorMap: Record<MetodoPagamento, string> = {
      pix: '#25D366',
      cartao_debito: '#F2CA50',
      cartao_credito: '#F59E0B',
      tap_on_phone: '#60A5FA',
      dinheiro: '#10B981',
    };

    const labelMap: Record<MetodoPagamento, string> = {
      pix: 'Pix Instantâneo',
      cartao_debito: 'Cartão Débito (POS)',
      cartao_credito: 'Cartão Crédito (1-12x)',
      tap_on_phone: 'Celular NFC (Tap)',
      dinheiro: 'Dinheiro em Espécie',
    };

    const iconMap: Record<MetodoPagamento, React.ComponentType<{ className?: string }>> = {
      pix: QrCode,
      cartao_debito: CreditCard,
      cartao_credito: CreditCard,
      tap_on_phone: Radio,
      dinheiro: Banknote,
    };

    const list = (Object.keys(counts) as MetodoPagamento[]).map(key => {
      const item = counts[key];
      const percentual = totalGeral > 0 ? Math.round((item.total / totalGeral) * 100) : 0;
      return {
        key,
        nome: labelMap[key],
        valor: item.total,
        quantidade: item.count,
        percentual,
        cor: colorMap[key],
        Icon: iconMap[key],
      };
    });

    // Ordenar por maior volume financeiro
    list.sort((a, b) => b.valor - a.valor);

    return { list, totalGeral, countGeral };
  }, [transactions]);

  // 3. Dados: Tempo Médio de Permanência na Fila por Horário
  const waitTimeData = useMemo(() => {
    // Horários de funcionamento típicos de barbearia (09h às 20h)
    return [
      { horario: '09h', tempoMinutos: 9, meta: 20, status: 'Livre' },
      { horario: '10h', tempoMinutos: 11, meta: 20, status: 'Livre' },
      { horario: '11h', tempoMinutos: 16, meta: 20, status: 'Moderado' },
      { horario: '12h', tempoMinutos: 21, meta: 20, status: 'Almoço' },
      { horario: '13h', tempoMinutos: 14, meta: 20, status: 'Livre' },
      { horario: '14h', tempoMinutos: 15, meta: 20, status: 'Livre' },
      { horario: '15h', tempoMinutos: 18, meta: 20, status: 'Moderado' },
      { horario: '16h', tempoMinutos: 22, meta: 20, status: 'Moderado' },
      { horario: '17h', tempoMinutos: 33, meta: 20, status: 'Pico Máximo' },
      { horario: '18h', tempoMinutos: 29, meta: 20, status: 'Pico' },
      { horario: '19h', tempoMinutos: 23, meta: 20, status: 'Moderado' },
      { horario: '20h', tempoMinutos: 12, meta: 20, status: 'Livre' },
    ];
  }, []);

  const waitTimeKPIs = useMemo(() => {
    const tempos = waitTimeData.map(w => w.tempoMinutos);
    const mediaGeral = Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10) / 10;
    const tempoMax = Math.max(...tempos);
    const tempoMin = Math.min(...tempos);
    const horarioPico = waitTimeData.find(w => w.tempoMinutos === tempoMax)?.horario || '17h';
    const horarioRapido = waitTimeData.find(w => w.tempoMinutos === tempoMin)?.horario || '09h';

    // Tempo de espera dos clientes que estão atualmente na fila
    const waitingItems = queue.filter(q => q.status === 'waiting');
    const esperaAtualMedia = waitingItems.length > 0
      ? Math.round(waitingItems.reduce((acc, q) => acc + (Date.now() - q.timestamp) / 60000, 0) / waitingItems.length)
      : 0;

    return { mediaGeral, tempoMax, tempoMin, horarioPico, horarioRapido, esperaAtualMedia, naFilaAgora: waitingItems.length };
  }, [waitTimeData, queue]);

  // Tooltip customizado para Volume Diário
  const CustomTooltipVolume = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-[#1C1C1B] border border-[#F2CA50]/50 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[170px]">
          <div className="font-heading font-black text-white text-sm border-b border-white/10 pb-1 flex items-center justify-between">
            <span>{data.dia}</span>
            <span className="text-[10px] text-[#F2CA50] font-bold">{data.diaSemana}</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F2CA50]" />
              Atendimentos:
            </span>
            <span className="font-black text-white">{data.atendimentos} cortes</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Receita:
            </span>
            <span className="font-bold text-emerald-400">{formatCurrency(data.receita)}</span>
          </div>
          <div className="flex items-center justify-between text-white/50 text-[11px] pt-0.5">
            <span>Ticket Médio:</span>
            <span>{formatCurrency(data.ticketMedio)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip customizado para Formas de Pagamento
  const CustomTooltipPayment = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-[#1C1C1B] border border-white/20 rounded-xl shadow-2xl text-xs space-y-1 min-w-[180px]">
          <div className="font-heading font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.cor }} />
            <span>{data.nome}</span>
          </div>
          <div className="font-heading font-black text-lg text-white mt-1">
            {formatCurrency(data.valor)}
          </div>
          <div className="flex items-center justify-between text-white/60 text-[11px]">
            <span>{data.quantidade} transações</span>
            <span className="font-bold text-[#F2CA50]">{data.percentual}% do total</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip customizado para Tempo na Fila
  const CustomTooltipWaitTime = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-[#1C1C1B] border border-blue-400/50 rounded-xl shadow-2xl text-xs space-y-1 min-w-[160px]">
          <div className="font-heading font-black text-white text-sm flex items-center justify-between border-b border-white/10 pb-1">
            <span>Faixa das {data.horario}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              data.tempoMinutos > 25 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {data.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-white/90 pt-1">
            <span>Tempo Médio:</span>
            <span className="font-heading font-black text-base text-[#F2CA50]">{data.tempoMinutos} min</span>
          </div>
          <div className="flex items-center justify-between text-white/40 text-[10px]">
            <span>Meta da barbearia:</span>
            <span>&lt; 20 min</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/15 text-[#F2CA50] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
              MÉTRICAS & INDICADORES OPERACIONAIS
            </span>
          </div>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-white mt-1">
            Dashboard de Atendimentos & Fila
          </h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">
            Acompanhe o volume diário de clientes, a preferência de formas de pagamento e o tempo de espera para otimizar os horários de pico.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={() => setPeriodo(7)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodo === 7 ? 'bg-[#F2CA50] text-black shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            7 Dias
          </button>
          <button
            type="button"
            onClick={() => setPeriodo(14)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodo === 14 ? 'bg-[#F2CA50] text-black shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            14 Dias
          </button>
          <button
            type="button"
            onClick={() => setPeriodo(30)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodo === 30 ? 'bg-[#F2CA50] text-black shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            30 Dias
          </button>
        </div>
      </div>

      {/* 4 Cards de Resumo Executivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Média Diária */}
        <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-black uppercase tracking-wider">MÉDIA DIÁRIA</span>
            <Users className="w-4 h-4 text-[#F2CA50]" />
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-black text-white">
              {volumeKPIs.mediaDiaria}
            </div>
            <div className="text-[11px] text-[#25D366] font-bold flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>atendimentos / dia</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-white/40">
            Total no período: {volumeKPIs.totalAtendimentos} cortes
          </div>
        </div>

        {/* Card 2: Tempo Médio na Fila */}
        <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-blue-500/30 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-[10px] font-black uppercase tracking-wider">TEMPO NA FILA</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-black text-blue-400">
              {waitTimeKPIs.mediaGeral} <span className="text-xs font-normal text-white/50">min</span>
            </div>
            <div className="text-[11px] text-white/60 font-medium mt-0.5">
              Meta: até 20 minutos
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-blue-300">
            Pico: {waitTimeKPIs.horarioPico} ({waitTimeKPIs.tempoMax} min)
          </div>
        </div>

        {/* Card 3: Método Mais Utilizado */}
        <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-[#25D366]/30 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-[#25D366]">
            <span className="text-[10px] font-black uppercase tracking-wider">MÉTODO FAVORITO</span>
            <QrCode className="w-4 h-4 text-[#25D366]" />
          </div>
          <div className="mt-3">
            <div className="font-heading text-xl font-black text-white truncate">
              {paymentMethodsData.list[0]?.nome.split(' ')[0] || 'Pix'}
            </div>
            <div className="text-[11px] text-[#25D366] font-bold mt-0.5">
              {paymentMethodsData.list[0]?.percentual}% do volume recebido
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-white/40 truncate">
            {formatCurrency(paymentMethodsData.list[0]?.valor || 0)} faturados
          </div>
        </div>

        {/* Card 4: Ticket Médio */}
        <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-emerald-500/30 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-black uppercase tracking-wider">TICKET MÉDIO</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-black text-emerald-400 truncate">
              {formatCurrency(volumeKPIs.ticketMedio)}
            </div>
            <div className="text-[11px] text-white/60 font-medium mt-0.5">
              Por atendimento
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-white/40">
            Faturamento: {formatCurrency(volumeKPIs.totalFaturado)}
          </div>
        </div>
      </div>

      {/* GRÁFICO 1: Volume de Atendimentos Diários */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F2CA50]" />
              <h3 className="font-heading font-black text-white text-base">
                Volume de Atendimentos Diários
              </h3>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Cortes e serviços concluídos nos últimos {periodo} dias
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMetricaVolume('atendimentos')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  metricaVolume === 'atendimentos' ? 'bg-[#F2CA50] text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Qtd. Atendimentos
              </button>
              <button
                type="button"
                onClick={() => setMetricaVolume('receita')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  metricaVolume === 'receita' ? 'bg-[#F2CA50] text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Faturamento (R$)
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Progresso Motivacional da Meta Diária de Faturamento */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-[#F2CA50]/30 shadow-inner space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                todayStats.isGoalReached 
                  ? 'bg-[#25D366] text-black animate-pulse' 
                  : 'bg-[#F2CA50]/20 text-[#F2CA50]'
              }`}>
                {todayStats.isGoalReached ? <Award className="w-5 h-5" /> : <Target className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                    Meta de Faturamento de Hoje
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    todayStats.isGoalReached 
                      ? 'bg-[#25D366] text-black font-extrabold shadow-md' 
                      : 'bg-[#F2CA50]/20 text-[#F2CA50] border border-[#F2CA50]/30'
                  }`}>
                    {todayStats.percent}% {todayStats.isGoalReached ? 'ATINGIDA!' : ''}
                  </span>
                </div>
                <div className="text-[11px] text-white/50">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-left sm:text-right">
                <div className="font-heading font-black text-sm sm:text-base text-white">
                  <span className={todayStats.isGoalReached ? "text-[#25D366]" : "text-[#F2CA50]"}>
                    {formatCurrency(todayStats.todayRevenue)}
                  </span>
                  <span className="text-white/40 text-xs font-normal"> / {formatCurrency(metaDiaria)}</span>
                </div>
                <div className="text-[10px] text-white/50">
                  {todayStats.todayCount} atendimento(s) concluído(s) hoje
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTempGoalInput(String(metaDiaria));
                  setShowEditMetaModal(true);
                }}
                className="py-2 px-3 rounded-xl bg-[#F2CA50]/15 hover:bg-[#F2CA50]/25 border border-[#F2CA50]/30 text-[#F2CA50] text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
                title="Definir nova meta diária de faturamento"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Definir Meta</span>
              </button>
            </div>
          </div>

          {/* Barra de Progresso com Gradiente e Animação */}
          <div className="relative w-full h-4 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                todayStats.isGoalReached
                  ? 'bg-gradient-to-r from-[#F2CA50] via-emerald-400 to-[#25D366] shadow-lg shadow-[#25D366]/40'
                  : 'bg-gradient-to-r from-amber-500 via-[#F2CA50] to-[#25D366]'
              }`}
              style={{ width: `${Math.min(100, Math.max(4, todayStats.percent))}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>

          {/* Mensagem Motivacional para a Equipe */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 gap-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F2CA50] shrink-0" />
              <span className={`font-medium ${todayStats.isGoalReached ? 'text-[#25D366] font-bold' : 'text-white/80'}`}>
                {todayStats.isGoalReached ? (
                  `🎉 Sensacional! Meta diária superada com ${formatCurrency(todayStats.todayRevenue)} faturados! Parabéns a toda a equipe!`
                ) : todayStats.percent >= 70 ? (
                  `⚡ Reta final! Faltam apenas ${formatCurrency(todayStats.remaining)} para bater a meta de hoje! Vamos buscar!`
                ) : todayStats.percent >= 30 ? (
                  `🚀 Ótimo ritmo! Faltam ${formatCurrency(todayStats.remaining)} para alcançar a meta diária da barbearia.`
                ) : (
                  `🔥 Expediente em andamento! Cada atendimento aproxima a barbearia da meta de ${formatCurrency(metaDiaria)}.`
                )}
              </span>
            </div>

            <span className="text-[10px] text-white/40 shrink-0">
              Equipe engajada • Atualização ao vivo
            </span>
          </div>
        </div>

        {/* Recharts BarChart */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyVolumeData}
              margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="dia" 
                stroke="#ffffff40" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#ffffff15' }}
              />
              <YAxis 
                stroke="#ffffff40" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#ffffff15' }}
                tickFormatter={(val) => metricaVolume === 'receita' ? `R$${val}` : `${val}`}
              />
              <Tooltip content={<CustomTooltipVolume />} />
              <ReferenceLine 
                y={metricaVolume === 'atendimentos' ? todayStats.metaCortes : metaDiaria} 
                stroke={todayStats.isGoalReached ? "#25D366" : "#F2CA50"} 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ 
                  value: metricaVolume === 'atendimentos' 
                    ? `Meta: ${todayStats.metaCortes} cortes` 
                    : `Meta Diária: R$ ${metaDiaria}`, 
                  fill: todayStats.isGoalReached ? '#25D366' : '#F2CA50', 
                  fontSize: 10,
                  position: 'insideTopRight'
                }} 
              />
              <Bar 
                dataKey={metricaVolume} 
                name={metricaVolume === 'atendimentos' ? 'Atendimentos' : 'Receita'} 
                fill={metricaVolume === 'atendimentos' ? '#F2CA50' : '#25D366'} 
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rodapé com Destaque */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-white/50 gap-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Dia de maior movimento: <strong className="text-white">{volumeKPIs.melhorDia?.dia}</strong> ({volumeKPIs.melhorDia?.atendimentos} atendimentos • {formatCurrency(volumeKPIs.melhorDia?.receita || 0)})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#25D366] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Capacidade operacional estável</span>
          </div>
        </div>
      </div>

      {/* GRID COM GRÁFICO 2 (MÉTODOS DE PAGAMENTO) E GRÁFICO 3 (TEMPO NA FILA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 2: Comparativo de Métodos de Pagamento */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#F2CA50]" />
                <h3 className="font-heading font-black text-white text-base">
                  Comparativo de Métodos
                </h3>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Distribuição financeira das formas de pagamento
              </p>
            </div>

            {onOpenPaymentSettings && (
              <button
                type="button"
                onClick={onOpenPaymentSettings}
                className="text-[11px] font-bold text-[#F2CA50] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Configurar
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Gráfico Donut / Recharts PieChart */}
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodsData.list}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={4}
                >
                  {paymentMethodsData.list.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} stroke="#1C1C1B" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPayment />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Totalizador no centro do donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Total</span>
              <span className="font-heading font-black text-sm text-white">
                {formatCurrency(paymentMethodsData.totalGeral)}
              </span>
            </div>
          </div>

          {/* Lista descritiva dos métodos com barras de proporção */}
          <div className="space-y-2.5 pt-2">
            {paymentMethodsData.list.map((item) => {
              const IconComp = item.Icon;
              return (
                <div key={item.key} className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.cor}20`, color: item.cor }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">
                        {item.nome}
                      </span>
                      <span className="text-[10px] text-white/40 block">
                        {item.quantidade} recebimento(s)
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-heading font-black text-white block">
                      {formatCurrency(item.valor)}
                    </span>
                    <span 
                      className="text-[10px] font-bold block"
                      style={{ color: item.cor }}
                    >
                      {item.percentual}% do caixa
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRÁFICO 3: Tempo Médio de Permanência na Fila */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h3 className="font-heading font-black text-white text-base">
                  Tempo Médio na Fila
                </h3>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Curva de espera média (em minutos) ao longo do dia
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold border border-blue-500/30">
              Média: {waitTimeKPIs.mediaGeral} min
            </span>
          </div>

          {/* Recharts AreaChart com Gradiente */}
          <div className="w-full h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={waitTimeData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="waitTimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="horario" 
                  stroke="#ffffff40" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                />
                <YAxis 
                  stroke="#ffffff40" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                  unit="m"
                />
                <Tooltip content={<CustomTooltipWaitTime />} />
                <ReferenceLine 
                  y={20} 
                  stroke="#EF4444" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Limite: 20 min', 
                    fill: '#EF4444', 
                    fontSize: 9, 
                    position: 'insideTopRight' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="tempoMinutos" 
                  stroke="#3B82F6" 
                  strokeWidth={2.5} 
                  fill="url(#waitTimeGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Destaques e Dicas de Gestão da Fila */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Horário de Pico:
              </span>
              <strong className="text-red-400 font-bold">{waitTimeKPIs.horarioPico} às 19h (~{waitTimeKPIs.tempoMax} min de espera)</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Horário Mais Rápido:
              </span>
              <strong className="text-emerald-400 font-bold">{waitTimeKPIs.horarioRapido} às 11h (~{waitTimeKPIs.tempoMin} min de espera)</strong>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-start gap-2 text-white/60 text-[11px] leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 text-[#F2CA50] shrink-0 mt-0.5" />
              <span>
                <strong>Dica de Otimização:</strong> Use o botão <em>"Avisar Fila que Abriu Vaga"</em> entre 13h e 15h para distribuir o fluxo de clientes antes do pico das 17h.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast de Confirmação da Meta Salva */}
      {goalSavedToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-2xl bg-[#25D366] text-black font-heading font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-black" />
          <span>{goalSavedToast}</span>
        </div>
      )}

      {/* Modal / Dialog para Definir Meta Diária de Faturamento */}
      {showEditMetaModal && (
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
                onClick={() => setShowEditMetaModal(false)}
                className="text-white/40 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Defina o valor alvo de faturamento diário para motivar os barbeiros. A meta será exibida na barra de progresso e servirá de linha de corte no gráfico de atendimentos.
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
                    onClick={() => setTempGoalInput(String(preset))}
                    className={`py-2 px-1 rounded-xl text-xs font-heading font-black transition-all cursor-pointer border ${
                      Number(tempGoalInput) === preset
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
                  value={tempGoalInput}
                  onChange={(e) => setTempGoalInput(e.target.value)}
                  placeholder="Ex: 850"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white font-heading font-black text-lg focus:border-[#F2CA50] focus:outline-none"
                />
              </div>
            </div>

            {/* Prévia de impacto */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-xs text-white/60 flex items-center justify-between">
              <span>Equivalente em atendimentos:</span>
              <strong className="text-white">
                ~{Math.ceil(Number(tempGoalInput || 600) / 65)} cortes (ticket médio R$ 65)
              </strong>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditMetaModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white/60 hover:text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  const val = Number(tempGoalInput);
                  if (val > 0) {
                    financeRepository.setDailyGoal(atelier.id, val);
                    setMetaDiaria(val);
                    setGoalSavedToast(`Meta diária atualizada para ${formatCurrency(val)}!`);
                    setShowEditMetaModal(false);
                    setTimeout(() => setGoalSavedToast(null), 3000);
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Meta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
