import React from 'react';
import { 
  ChevronLeft, 
  Users, 
  BarChart3, 
  UtensilsCrossed, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Scissors,
  MessageSquare,
  Bell,
  Clock,
  ShieldAlert,
  Globe,
  Award
} from 'lucide-react';
import { AtelierProfile } from '../types';

interface ProfileModalProps {
  atelier: AtelierProfile;
  onClose: () => void;
  onOpenTeam: () => void;
  onOpenFinance: () => void;
  onOpenServices: () => void;
  onOpenPlans: () => void;
  onOpenWhatsApp: () => void;
  onOpenNotificationPermissions: () => void;
  onOpenScheduleSettings: () => void;
  onOpenAuditLog: () => void;
  onOpenCustomDomain: () => void;
  onOpenPaymentSettings?: () => void;
  onOpenLoyaltySettings?: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  atelier,
  onClose,
  onOpenTeam,
  onOpenFinance,
  onOpenServices,
  onOpenPlans,
  onOpenWhatsApp,
  onOpenNotificationPermissions,
  onOpenScheduleSettings,
  onOpenAuditLog,
  onOpenCustomDomain,
  onOpenPaymentSettings,
  onOpenLoyaltySettings,
  onLogout,
}) => {
  const isTrial = atelier.status_assinatura === 'trial';
  const diffDays = Math.max(
    0,
    Math.ceil((atelier.data_expiracao - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const handleContactSupport = () => {
    const phone = '5511999999999';
    window.open(`https://wa.me/${phone}?text=Olá, preciso de ajuda com o sistema EstiloExatoZap.`, '_blank');
  };

  const initialLetter = (atelier.nome_negocio || 'A')[0].toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto">
      <div className="min-h-screen max-w-lg mx-auto p-6 sm:p-8 flex flex-col justify-between">
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar ao Painel</span>
            </button>
            <span className="font-heading font-black text-xs uppercase tracking-widest text-[#F2CA50]">
              CONFIGURAÇÕES
            </span>
          </div>

          {/* User Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-[#F2CA50]/15 border-2 border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] font-heading font-black text-2xl shrink-0">
              {initialLetter}
            </div>
            <div className="min-w-0">
              <h2 className="font-heading font-black text-xl text-white truncate">
                {atelier.nome_negocio}
              </h2>
              <p className="text-xs text-white/40 truncate mt-0.5">
                {atelier.email}
              </p>
            </div>
          </div>

          {/* Subscription Black Card Style */}
          <div
            className={`w-full p-6 rounded-2xl relative overflow-hidden mb-8 transition-all shadow-2xl ${
              isTrial
                ? 'bg-gradient-to-br from-slate-900 via-neutral-900 to-black border border-white/10'
                : 'bg-gradient-to-br from-[#F2CA50] to-[#d4af37] text-black shadow-[#F2CA50]/10'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  isTrial ? 'text-white/50' : 'text-black/70'
                }`}
              >
                {isTrial ? 'PLANO TESTE' : 'ASSINATURA ATIVA'}
              </span>
              <ShieldCheck
                className={`w-5 h-5 ${isTrial ? 'text-white/30' : 'text-black/70'}`}
              />
            </div>

            <div
              className={`font-heading text-3xl font-black ${
                isTrial ? 'text-white' : 'text-black'
              }`}
            >
              {isTrial ? `${diffDays} Dias Restantes` : 'Plano Pro'}
            </div>

            <p
              className={`text-xs mt-1.5 leading-relaxed ${
                isTrial ? 'text-white/40' : 'text-black/60 font-medium'
              }`}
            >
              {isTrial
                ? 'Seu período de teste gratuito do EstiloExatoZap está ativo.'
                : 'Sua assinatura profissional está com renovação automática.'}
            </p>
          </div>

          {/* Management Menu Options */}
          <div className="space-y-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] mb-3">
                GESTÃO DO ATELIER
              </div>

              <div className="space-y-2">
                <button
                  onClick={onOpenTeam}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#F2CA50] group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm">
                        Gerenciar Equipe
                      </div>
                      <div className="text-[11px] text-white/40">
                        Adicionar barbeiros, cabeleireiros e recepção
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F2CA50] transition-colors" />
                </button>

                <button
                  onClick={onOpenFinance}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#F2CA50] group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm">
                        Relatórios Financeiros
                      </div>
                      <div className="text-[11px] text-white/40">
                        Faturamento diário, mensal e histórico
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F2CA50] transition-colors" />
                </button>

                <button
                  onClick={onOpenServices}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#F2CA50] group-hover:scale-105 transition-transform">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm">
                        Editar Menu de Serviços
                      </div>
                      <div className="text-[11px] text-white/40">
                        Valores, durações e catálogo de serviços
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F2CA50] transition-colors" />
                </button>

                <button
                  onClick={onOpenPlans}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#F2CA50] group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm">
                        Planos de Assinatura
                      </div>
                      <div className="text-[11px] text-white/40">
                        Clubes VIP, mensalidades e fidelidade
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F2CA50] transition-colors" />
                </button>

                {onOpenLoyaltySettings && (
                  <button
                    onClick={onOpenLoyaltySettings}
                    className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-[#F2CA50]/30 flex items-center justify-between text-left transition-colors cursor-pointer group shadow-lg shadow-[#F2CA50]/5"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-[#F2CA50]/10 flex items-center justify-center text-[#F2CA50] group-hover:scale-105 transition-transform">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                          <span>Cartão Fidelidade Digital</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-[#F2CA50]/20 text-[#F2CA50] text-[9px] font-bold uppercase">Pontos</span>
                        </div>
                        <div className="text-[11px] text-white/40">
                          Defina quantos pontos dão direito a um serviço gratuito
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F2CA50] transition-colors" />
                  </button>
                )}

                {onOpenPaymentSettings && (
                  <button
                    onClick={onOpenPaymentSettings}
                    className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-[#F2CA50]/30 flex items-center justify-between text-left transition-colors cursor-pointer group shadow-lg shadow-[#F2CA50]/5"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-[#F2CA50]/10 flex items-center justify-center text-[#F2CA50] group-hover:scale-105 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                          <span>Formas de Pagamento & Maquininhas</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-[#F2CA50]/20 text-[#F2CA50] text-[9px] font-bold uppercase">Caixa</span>
                        </div>
                        <div className="text-[11px] text-white/40">
                          Habilite métodos visíveis (Pix, Cartão, Celular NFC) e vincule maquininhas
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F2CA50] transition-colors" />
                  </button>
                )}

                <button
                  onClick={onOpenWhatsApp}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-[#25D366]/30 flex items-center justify-between text-left transition-colors cursor-pointer group shadow-lg shadow-[#25D366]/5"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>WhatsApp Business API</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] text-[9px] font-bold uppercase">Novo</span>
                      </div>
                      <div className="text-[11px] text-white/40">
                        Automação de lembretes e confirmações de horário
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#25D366] transition-colors" />
                </button>

                <button
                  onClick={onOpenNotificationPermissions}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-[#F2CA50]/30 flex items-center justify-between text-left transition-colors cursor-pointer group shadow-lg shadow-[#F2CA50]/5"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#F2CA50]/10 flex items-center justify-center text-[#F2CA50] group-hover:scale-105 transition-transform">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Permissões de Notificações</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-[#F2CA50]/20 text-[#F2CA50] text-[9px] font-bold uppercase">Push</span>
                      </div>
                      <div className="text-[11px] text-white/40">
                        Controle avisos de 'próximo da fila' e 'vaga aberta' por cliente
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F2CA50] transition-colors" />
                </button>

                <button
                  onClick={onOpenScheduleSettings}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#F2CA50] group-hover:scale-105 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Horários, Dias & Vagas</span>
                      </div>
                      <div className="text-[11px] text-white/40">
                        Dias de funcionamento, expediente e limite de vagas diárias
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#F2CA50] transition-colors" />
                </button>

                <button
                  onClick={onOpenAuditLog}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-blue-500/30 flex items-center justify-between text-left transition-colors cursor-pointer group shadow-lg shadow-blue-500/5"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Auditoria de Ações & Governança</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-bold uppercase">Logs</span>
                      </div>
                      <div className="text-[11px] text-white/40">
                        Rastreabilidade de alterações críticas e modificações no sistema
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-blue-400 transition-colors" />
                </button>

                <button
                  onClick={onOpenCustomDomain}
                  className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-indigo-500/30 flex items-center justify-between text-left transition-colors cursor-pointer group shadow-lg shadow-indigo-500/5"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Domínio Personalizado (Whitelabel)</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase">DNS</span>
                      </div>
                      <div className="text-[11px] text-white/40">
                        Vincule seu próprio endereço web ao portal público de agendamentos
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-indigo-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* Support */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] mb-3">
                SUPORTE E AJUDA
              </div>

              <button
                onClick={handleContactSupport}
                className="w-full p-4 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] border border-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#25D366]">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-white text-sm">
                      Falar com suporte no Zap
                    </div>
                    <div className="text-[11px] text-white/40">
                      Tire dúvidas e solicite novas funções
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#25D366] transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-10 pb-4 text-center">
          <button
            onClick={onLogout}
            className="py-3 px-6 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-heading font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>SAIR DA CONTA</span>
          </button>
          <div className="mt-4 text-[10px] text-white/20 tracking-wider">
            Versão 1.0.0 • EstiloExatoZap
          </div>
        </div>
      </div>
    </div>
  );
};
