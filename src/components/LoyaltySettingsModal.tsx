import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Star,
  Gift,
  Check,
  CheckCircle2,
  Award,
  Users,
  Plus,
  Sparkles,
  Save,
  Scissors,
  Crown,
} from 'lucide-react';
import { AtelierProfile, ClientLoyaltyPlan, ClientProfile, LoyaltyConfig, ServiceItem } from '../types';
import { clientRepository, planRepository, serviceRepository } from '../services/store';

interface LoyaltySettingsModalProps {
  atelier: AtelierProfile;
  onClose: () => void;
}

export const LoyaltySettingsModal: React.FC<LoyaltySettingsModalProps> = ({
  atelier,
  onClose,
}) => {
  const [config, setConfig] = useState<LoyaltyConfig>(() =>
    clientRepository.getLoyaltyConfig(atelier.id)
  );
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [clientLoyaltyPlans, setClientLoyaltyPlans] = useState<ClientLoyaltyPlan[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = () => {
    setServices(serviceRepository.getServices(atelier.id));
    setClientLoyaltyPlans(
      planRepository.getClientLoyaltyPlans(atelier.id).filter((p) => p.ativo)
    );
    setClients(
      clientRepository
        .getAllClients(atelier.id)
        .slice()
        .sort((a, b) => b.pontos - a.pontos)
    );
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('estilo_store_updated', handleUpdate);
    return () => window.removeEventListener('estilo_store_updated', handleUpdate);
  }, [atelier.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      clientRepository.saveLoyaltyConfig({
        ...config,
        atelierId: atelier.id,
        servicoRecompensa:
          config.servicoRecompensa.trim() || 'Corte ou Serviço Padrão Grátis',
      });
      showToast(
        `Configuração salva! Meta atual: ${config.pontosNecessarios} pontos para ganhar "${config.servicoRecompensa.trim() || 'Serviço Grátis'}".`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGrantPoint = async (c: ClientProfile) => {
    const multiplier =
      c.planoAssinaturaStatus === 'ativo'
        ? Math.max(1, c.planoMultiplicadorPontos || 1)
        : 1;
    const basePts = Math.max(1, config.pontosPorAtendimento || 1);
    const pts = basePts * multiplier;
    await clientRepository.addPoints(
      c.id,
      pts,
      multiplier > 1
        ? `Crédito manual (${multiplier}x Plano ${c.planoAssinaturaNome || 'Assinante'})`
        : 'Crédito manual pelo administrador'
    );
    loadData();
    showToast(
      `+${pts} ponto(s) creditado(s) para ${c.nome}${multiplier > 1 ? ` (${multiplier}x pelo plano)` : ''}!`
    );
  };

  const handleAssignLoyaltyPlan = (c: ClientProfile, planId: string) => {
    const updated = clientRepository.assignLoyaltyPlan(c.id, planId || null, atelier.id);
    loadData();
    if (updated?.planoAssinaturaStatus === 'ativo' && updated.planoAssinaturaNome) {
      showToast(
        `${c.nome} vinculado(a) ao plano "${updated.planoAssinaturaNome}" (${updated.planoMultiplicadorPontos || 1}x pontos).`
      );
    } else {
      showToast(`Assinatura fidelidade removida de ${c.nome}.`);
    }
  };

  const readyToRedeemCount = clients.filter(
    (c) => c.pontos >= config.pontosNecessarios
  ).length;
  const previewEarnedCount = Math.min(
    config.pontosNecessarios,
    Math.max(1, Math.floor(config.pontosNecessarios * 0.6))
  );

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 overflow-y-auto animate-fadeIn">
      <div className="min-h-screen max-w-3xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between">
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
            </button>
            <div className="text-right">
              <span className="font-heading font-black text-xs uppercase tracking-widest text-[#F2CA50] block">
                CARTÃO FIDELIDADE DIGITAL
              </span>
              <span className="text-[11px] text-white/50">{atelier.nome_negocio}</span>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-white">
                  Regras do Cartão Fidelidade
                </h1>
                <p className="text-xs text-white/60 mt-0.5">
                  Configure quantos pontos o cliente precisa acumular para resgatar um serviço gratuito na tela do cliente.
                </p>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/25 text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-white/50">
                Prontos p/ Resgate
              </div>
              <div className="font-heading font-black text-lg text-[#F2CA50]">
                {readyToRedeemCount}{' '}
                <span className="text-xs text-white/50 font-normal">
                  de {clients.length} clientes
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Ativar / Desativar */}
            <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <div className="text-xs font-bold text-white">
                    Ativar Cartão Fidelidade Digital na Tela do Cliente
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    Pontua automaticamente a cada atendimento finalizado no caixa e libera voucher de resgate ao atingir a meta.
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Ativar ou desativar cartão fidelidade"
                  onClick={() => setConfig((prev) => ({ ...prev, ativo: !prev.ativo }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.ativo ? 'bg-[#F2CA50]' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                      config.ativo ? 'translate-x-5' : 'translate-x-0 bg-neutral-400'
                    }`}
                  />
                </button>
              </div>

              {/* Meta de Pontos & Pontos por Atendimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#F2CA50] block">
                    Pontos Necessários para Serviço Grátis
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          pontosNecessarios: Math.max(2, prev.pontosNecessarios - 1),
                        }))
                      }
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={config.pontosNecessarios}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          pontosNecessarios: Math.max(
                            2,
                            Math.min(30, parseInt(e.target.value, 10) || 2)
                          ),
                        }))
                      }
                      className="w-20 text-center py-2 rounded-xl bg-black/70 border border-[#F2CA50]/40 text-[#F2CA50] font-heading font-black text-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          pontosNecessarios: Math.min(30, prev.pontosNecessarios + 1),
                        }))
                      }
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                    <span className="text-xs text-white/60 font-semibold">pontos/selos</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[5, 6, 8, 10, 12, 15].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({ ...prev, pontosNecessarios: preset }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          config.pontosNecessarios === preset
                            ? 'bg-[#F2CA50] text-black border-[#F2CA50]'
                            : 'bg-white/5 text-white/70 border-white/10 hover:border-white/25'
                        }`}
                      >
                        {preset} pts
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-wider text-white/80 block">
                    Pontos Ganhos por Atendimento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({ ...prev, pontosPorAtendimento: pts }))
                        }
                        className={`py-2.5 px-2 rounded-xl border text-xs font-heading font-black transition-all cursor-pointer ${
                          config.pontosPorAtendimento === pts
                            ? 'bg-[#F2CA50]/20 text-[#F2CA50] border-[#F2CA50]'
                            : 'bg-black/50 text-white/65 border-white/10 hover:border-white/25'
                        }`}
                      >
                        +{pts} {pts === 1 ? 'ponto' : 'pontos'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/50">
                    Com +{config.pontosPorAtendimento} por visita, o cliente completa o cartão após{' '}
                    <strong className="text-white">
                      {Math.ceil(config.pontosNecessarios / Math.max(1, config.pontosPorAtendimento))}
                    </strong>{' '}
                    atendimento(s).
                  </p>
                </div>
              </div>

              {/* Serviço Gratuito de Recompensa */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#F2CA50] block">
                  Serviço Gratuito Concedido ao Completar o Cartão
                </label>
                <input
                  type="text"
                  value={config.servicoRecompensa}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, servicoRecompensa: e.target.value }))
                  }
                  placeholder="Ex: Corte Degradê Fade Grátis"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:border-[#F2CA50] focus:outline-none"
                />

                {services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {services.slice(0, 6).map((srv) => {
                      const label = `${srv.nome} Grátis`;
                      const active = config.servicoRecompensa === label;
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({ ...prev, servicoRecompensa: label }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                            active
                              ? 'bg-[#F2CA50]/20 text-[#F2CA50] border-[#F2CA50]/50'
                              : 'bg-white/5 text-white/65 border-white/10 hover:text-white'
                          }`}
                        >
                          <Scissors className="w-3 h-3" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Descrição / Regra */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 block mb-1.5">
                  Regra Exibida no Cartão do Cliente
                </label>
                <input
                  type="text"
                  value={config.regrasDescricao || ''}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, regrasDescricao: e.target.value }))
                  }
                  placeholder="Ex: Acumule pontos a cada atendimento finalizado e troque pelo serviço gratuito."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-[#F2CA50] focus:outline-none"
                />
              </div>
            </div>

            {/* Pré-visualização em Tempo Real */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C1C1B] via-[#171716] to-black border border-[#F2CA50]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PRÉ-VISUALIZAÇÃO DO CARTÃO FIDELIDADE DIGITAL DO CLIENTE</span>
                </div>
                <span className="text-xs font-heading font-black text-[#F2CA50]">
                  {previewEarnedCount} / {config.pontosNecessarios}
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
                {Array.from({ length: config.pontosNecessarios }).map((_, idx) => {
                  const isEarned = idx < previewEarnedCount;
                  const isFinalSlot = idx === config.pontosNecessarios - 1;
                  return (
                    <div
                      key={idx}
                      className={`h-11 rounded-xl flex items-center justify-center font-heading font-black text-xs transition-all ${
                        isEarned
                          ? 'bg-[#F2CA50] text-black shadow-md shadow-[#F2CA50]/20'
                          : isFinalSlot
                          ? 'bg-[#F2CA50]/10 border border-dashed border-[#F2CA50]/60 text-[#F2CA50]'
                          : 'bg-white/5 border border-white/10 text-white/30'
                      }`}
                    >
                      {isEarned ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isFinalSlot ? (
                        <Gift className="w-4 h-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/10">
                <span>
                  Prêmio ao completar:{' '}
                  <strong className="text-[#F2CA50]">
                    {config.servicoRecompensa || 'Serviço Gratuito'}
                  </strong>
                </span>
                <span className="text-[11px] text-white/45">
                  +{config.pontosPorAtendimento} ponto(s) por atendimento
                </span>
              </div>
            </div>

            {/* Saldo Atual dos Clientes */}
            <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#F2CA50]" />
                  <h2 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                    Pontuação Atual dos Clientes ({clients.length})
                  </h2>
                </div>
                <span className="text-[10px] text-white/40">
                  Meta: {config.pontosNecessarios} pts
                </span>
              </div>

              {clients.length === 0 ? (
                <div className="py-6 text-center text-xs text-white/40">
                  Nenhum cliente cadastrado ainda neste atelier.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {clients.map((c) => {
                    const ready = c.pontos >= config.pontosNecessarios;
                    const pct = Math.min(
                      100,
                      Math.round((c.pontos / Math.max(1, config.pontosNecessarios)) * 100)
                    );
                    const isPlanActive =
                      c.planoAssinaturaStatus === 'ativo' && Boolean(c.planoAssinaturaId);
                    const multiplier = isPlanActive
                      ? Math.max(1, c.planoMultiplicadorPontos || 1)
                      : 1;
                    const grantAmount =
                      Math.max(1, config.pontosPorAtendimento || 1) * multiplier;

                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-white truncate">
                              {c.nome}
                            </span>
                            <span className="text-[11px] font-heading font-black text-[#F2CA50]">
                              {c.pontos} / {config.pontosNecessarios} pts
                            </span>
                            {isPlanActive && c.planoAssinaturaNome && (
                              <span className="px-2 py-0.5 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/35 text-[9px] font-black uppercase inline-flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5" />
                                <span>
                                  {c.planoAssinaturaNome} • {multiplier}x
                                </span>
                              </span>
                            )}
                            {ready && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                                Pronto p/ Resgate!
                              </span>
                            )}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-black/70 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ready ? 'bg-emerald-400' : 'bg-[#F2CA50]'
                              }`}
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            aria-label={`Plano fidelidade de ${c.nome}`}
                            value={isPlanActive ? c.planoAssinaturaId || '' : ''}
                            onChange={(e) => handleAssignLoyaltyPlan(c, e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl bg-black/70 border border-white/15 text-[11px] text-white/85 font-semibold focus:border-[#F2CA50] focus:outline-none max-w-[175px] cursor-pointer"
                          >
                            <option value="">Sem plano ativo</option>
                            {clientLoyaltyPlans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.nome} ({plan.multiplicadorPontos}x)
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => void handleGrantPoint(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#F2CA50]/20 text-[#F2CA50] border border-[#F2CA50]/30 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+{grantAmount} pt</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-white/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#F2CA50]" />
            <span>Atualização imediata no Cartão Fidelidade Digital do cliente.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#F2CA50] hover:bg-[#d4af37] text-black font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-[#F2CA50]/15 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Regras'}</span>
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl bg-[#1C1C1B] border border-[#F2CA50] text-white text-xs font-bold flex items-center gap-2 shadow-2xl shadow-black/80 animate-slideDown">
            <Star className="w-4 h-4 text-[#F2CA50] fill-[#F2CA50]" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
