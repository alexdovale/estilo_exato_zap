import React from 'react';
import { Scissors, Store, BadgeCheck, Users, Sparkles, Smartphone, Calendar, UserCheck } from 'lucide-react';

interface WelcomePageProps {
  onSelectProprietario: () => void;
  onSelectJaTenhoConta: () => void;
  onOpenPublicQueue: () => void;
  onOpenClientPortal: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onSelectProprietario,
  onSelectJaTenhoConta,
  onOpenPublicQueue,
  onOpenClientPortal,
}) => {
  return (
    <div className="relative min-h-screen bg-[#131313] text-white flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none">
      {/* Glow decorative circle in background */}
      <div 
        className="absolute -top-36 -right-24 w-96 h-96 rounded-full bg-[#F2CA50]/5 blur-3xl pointer-events-none"
      />
      <div 
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#F2CA50]/5 blur-3xl pointer-events-none"
      />

      {/* Top Header & Branding */}
      <div className="flex flex-col items-center pt-6 sm:pt-10 z-10">
        <div className="flex items-center justify-center mb-3">
          <img
            src="/COMPLETO.png"
            alt="Estilo Exato Zap"
            className="h-20 sm:h-24 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const fallback = document.getElementById('logo-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div id="logo-fallback" className="hidden flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/40 flex items-center justify-center">
              <Scissors className="w-8 h-8 text-[#F2CA50]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest text-[#F2CA50]">ESTILO EXATO</h1>
              <span className="text-xs uppercase tracking-widest text-white/50">SISTEMA INTELIGENTE DE FILA</span>
            </div>
          </div>
        </div>

        <p className="text-white/60 text-sm italic font-light tracking-wide text-center">
          "O seu negócio e o seu cliente no tempo exato."
        </p>
      </div>

      {/* Main Options Cards */}
      <div className="max-w-md w-full mx-auto my-auto py-6 space-y-3.5 z-10">
        {/* Option 1: SOU CLIENTE (Área do Cliente com Agendamento & Login) */}
        <button
          onClick={onOpenClientPortal}
          className="w-full text-left p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#F2CA50] via-[#eed16b] to-[#d4af37] hover:bg-[#ebd05d] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-[#F2CA50]/15 flex items-center gap-4 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
            <Calendar className="w-7 h-7 text-black group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-black text-base sm:text-lg tracking-wide uppercase truncate">
                SOU CLIENTE
              </h2>
              <span className="text-[10px] font-black bg-black text-[#F2CA50] px-2 py-0.5 rounded-full uppercase shrink-0">
                Agendar & Entrar
              </span>
            </div>
            <p className="text-black/80 text-xs sm:text-sm mt-0.5 leading-snug">
              Agende seu corte, acompanhe a fila e veja seus pontos de fidelidade.
            </p>
          </div>
        </button>

        {/* Option 2: Sou Proprietário (Gestão do Atelier) */}
        <button
          onClick={onSelectProprietario}
          className="w-full text-left p-5 sm:p-6 rounded-2xl bg-[#1C1C1B] hover:bg-[#252524] border border-[#F2CA50]/30 hover:border-[#F2CA50]/60 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center gap-4 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#F2CA50]/10 border border-[#F2CA50]/20 flex items-center justify-center shrink-0">
            <Store className="w-7 h-7 text-[#F2CA50] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-white text-base sm:text-lg tracking-wide uppercase truncate">
                SOU PROPRIETÁRIO
              </h2>
              <span className="text-[10px] font-bold bg-white/10 text-[#F2CA50] px-2 py-0.5 rounded-full uppercase shrink-0">
                14 dias grátis
              </span>
            </div>
            <p className="text-white/50 text-xs sm:text-sm mt-0.5 leading-snug">
              Quero cadastrar meu negócio e gerenciar filas e equipe.
            </p>
          </div>
        </button>

        {/* Option 3: Barbeiros & Funcionários (Já Tenho Conta) */}
        <button
          onClick={onSelectJaTenhoConta}
          className="w-full text-left p-5 sm:p-6 rounded-2xl bg-[#1C1C1B]/80 hover:bg-[#252524] border border-white/5 hover:border-white/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-md flex items-center gap-4 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white/70 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-bold text-white text-sm sm:text-base tracking-wide uppercase">
              BARBEIRO OU FUNCIONÁRIO
            </h2>
            <p className="text-white/40 text-xs mt-0.5 leading-snug">
              Acesso restrito da equipe para chamar fila e atender clientes.
            </p>
          </div>
        </button>

        {/* Option 4: Acompanhar Fila Pública sem login */}
        <div className="pt-1">
          <button
            onClick={onOpenPublicQueue}
            className="w-full p-3.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/15 transition-all text-center flex items-center justify-center gap-2 text-xs font-bold text-white/60 hover:text-white cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#F2CA50]" />
            <span>Ver Fila Pública ao Vivo do Atelier</span>
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center pb-4 text-white/20 text-xs tracking-wider z-10">
        Versão 1.0.0 • EstiloExatoZap • Gestão Inteligente
      </div>
    </div>
  );
};
