import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  Sparkles,
  Flame
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  AreaChart, 
  BarChart, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { DailyTrendPoint } from '../types';

interface AdminTrendsDashboardProps {
  data: DailyTrendPoint[];
}

export const AdminTrendsDashboard: React.FC<AdminTrendsDashboardProps> = ({ data }) => {
  const [activeView, setActiveView] = useState<'combinado' | 'receita' | 'volume'>('combinado');

  // Calculate 30-day KPIs
  const summary = useMemo(() => {
    let totalReceita = 0;
    let totalVolume = 0;
    let maxReceitaDay: DailyTrendPoint | null = null;
    let maxVolumeDay: DailyTrendPoint | null = null;

    for (const d of data) {
      totalReceita += d.receita;
      totalVolume += d.volume;

      if (!maxReceitaDay || d.receita > maxReceitaDay.receita) {
        maxReceitaDay = d;
      }
      if (!maxVolumeDay || d.volume > maxVolumeDay.volume) {
        maxVolumeDay = d;
      }
    }

    const ticketMedioGeral = totalVolume > 0 ? totalReceita / totalVolume : 0;
    const mediaDiariaAtendimentos = Math.round((totalVolume / (data.length || 1)) * 10) / 10;
    const mediaDiariaReceita = Math.round((totalReceita / (data.length || 1)));

    return {
      totalReceita,
      totalVolume,
      ticketMedioGeral,
      mediaDiariaAtendimentos,
      mediaDiariaReceita,
      maxReceitaDay,
      maxVolumeDay,
    };
  }, [data]);

  // Format currency in BRL
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: DailyTrendPoint = payload[0].payload;
      return (
        <div className="bg-[#1C1C1B] border border-white/10 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="font-heading font-black text-white text-xs">
              {label} ({point.diaSemana})
            </span>
            <span className="text-[10px] uppercase font-bold text-white/40">30 Dias</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="w-2 h-2 rounded-full bg-[#F2CA50]" />
                Faturamento:
              </span>
              <span className="font-heading font-extrabold text-[#F2CA50]">
                {formatCurrency(point.receita)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                Atendimentos:
              </span>
              <span className="font-heading font-extrabold text-[#25D366]">
                {point.volume} clientes
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 border-t border-white/5">
              <span>Ticket Médio:</span>
              <span className="font-mono text-white/80">
                {formatCurrency(point.ticketMedio)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl bg-[#1C1C1B] border border-white/10 p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg sm:text-xl font-black text-white">
                Tendências dos Últimos 30 Dias
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] text-[10px] font-bold border border-[#F2CA50]/30 uppercase tracking-wider">
                Volume & Receita
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Histórico diário de serviços prestados e faturamento consolidado da barbearia.
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('combinado')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeView === 'combinado'
                ? 'bg-[#F2CA50] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Combinado
          </button>
          <button
            type="button"
            onClick={() => setActiveView('receita')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeView === 'receita'
                ? 'bg-[#F2CA50] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Faturamento (R$)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('volume')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeView === 'volume'
                ? 'bg-[#F2CA50] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Volume (Cortes)
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Faturamento Total */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-black uppercase tracking-wider">FATURAMENTO (30D)</span>
            <DollarSign className="w-4 h-4 text-[#F2CA50]" />
          </div>
          <div className="font-heading text-xl sm:text-2xl font-black text-white">
            {formatCurrency(summary.totalReceita)}
          </div>
          <div className="text-[11px] text-green-400 flex items-center gap-1 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Média {formatCurrency(summary.mediaDiariaReceita)}/dia</span>
          </div>
        </div>

        {/* KPI 2: Total Atendimentos */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-black uppercase tracking-wider">ATENDIMENTOS (30D)</span>
            <Users className="w-4 h-4 text-[#25D366]" />
          </div>
          <div className="font-heading text-xl sm:text-2xl font-black text-white">
            {summary.totalVolume} <span className="text-xs text-white/40 font-normal">cortes</span>
          </div>
          <div className="text-[11px] text-white/50 font-bold">
            ~{summary.mediaDiariaAtendimentos} atendimentos/dia
          </div>
        </div>

        {/* KPI 3: Ticket Médio */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-black uppercase tracking-wider">TICKET MÉDIO</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-heading text-xl sm:text-2xl font-black text-white">
            {formatCurrency(summary.ticketMedioGeral)}
          </div>
          <div className="text-[11px] text-white/50 font-bold">
            por cliente atendido
          </div>
        </div>

        {/* KPI 4: Dia de Pico */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-[10px] font-black uppercase tracking-wider">PICO DE MOVIMENTO</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="font-heading text-base sm:text-lg font-black text-white truncate">
            {summary.maxReceitaDay ? `${summary.maxReceitaDay.label} (${summary.maxReceitaDay.diaSemana})` : 'N/A'}
          </div>
          <div className="text-[11px] text-[#F2CA50] font-bold truncate">
            {summary.maxReceitaDay ? `${formatCurrency(summary.maxReceitaDay.receita)} • ${summary.maxReceitaDay.volume} cortes` : '-'}
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Chart Area */}
      <div className="pt-2">
        <div className="h-72 sm:h-80 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            {activeView === 'combinado' ? (
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2CA50" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F2CA50" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                  interval={3}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                  tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase' }}
                  formatter={(value) => value === 'receita' ? 'Faturamento Diário (R$)' : 'Volume de Serviços (Qtd)'}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="volume" 
                  name="volume" 
                  fill="#25D366" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={16} 
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="receita" 
                  name="receita" 
                  stroke="#F2CA50" 
                  strokeWidth={2.5} 
                  fill="url(#goldGradient)" 
                />
              </ComposedChart>
            ) : activeView === 'receita' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldOnly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2CA50" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#F2CA50" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                  interval={3}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                  tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  name="receita" 
                  stroke="#F2CA50" 
                  strokeWidth={3} 
                  fill="url(#goldOnly)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                  interval={3}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="volume" 
                  name="volume" 
                  fill="#25D366" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={20} 
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend and Quick Insight Bar */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#25D366]" />
              <span className="text-white/80 font-bold">Barra Verde: Volume de Atendimentos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#F2CA50]" />
              <span className="text-white/80 font-bold">Linha Dourada: Faturamento Diário (R$)</span>
            </div>
          </div>

          <div className="text-[11px] text-[#F2CA50] flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#F2CA50]" />
            <span>Atualização contínua com cada atendimento finalizado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
