import React, { useState } from 'react';
import { ChevronLeft, Scissors, Mail, Lock, Loader2, KeyRound } from 'lucide-react';
import { authRepository } from '../services/store';

interface StaffLoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const StaffLoginPage: React.FC<StaffLoginPageProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dialogInfo, setDialogInfo] = useState<{ title: string; message: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await authRepository.login(email.trim(), password.trim());
      onSuccess();
    } catch (err: any) {
      setErrorMsg('E-mail ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Digite seu e-mail no campo acima para receber o link de recuperação.');
      return;
    }

    try {
      await authRepository.sendPasswordResetEmail(email.trim());
      setDialogInfo({
        title: 'E-mail Enviado!',
        message: `Enviamos um link de recuperação para ${email.trim()}. Verifique sua caixa de entrada e spam.`,
      });
    } catch (e: any) {
      setErrorMsg('Erro ao enviar e-mail de recuperação.');
    }
  };

  const fillDemoOwner = () => {
    setEmail('dono@estiloreal.com');
    setPassword('senha123');
  };

  const fillDemoStaff = () => {
    setEmail('rodrigo@estilo.com');
    setPassword('senha123');
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white flex flex-col justify-between p-6 sm:p-10">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/COMPLETO.png"
            alt="Estilo Exato"
            className="h-16 sm:h-20 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const fallback = document.getElementById('login-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div id="login-fallback" className="hidden flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/40">
            <Scissors className="w-7 h-7 text-[#F2CA50]" />
          </div>
        </div>

        {/* Badge & Title */}
        <div className="mb-8">
          <div className="inline-block px-3 py-1 rounded bg-[#F2CA50]/10 border border-[#F2CA50]/20 mb-3">
            <span className="text-[#F2CA50] text-[10px] font-black uppercase tracking-widest">
              ACESSO DA EQUIPE
            </span>
          </div>

          <h1 className="font-heading text-3xl font-extrabold text-white">
            Bem-vindo de volta
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Acesse seu painel para gerenciar a fila.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
              E-MAIL PROFISSIONAL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#F2CA50]">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#1C1C1B] text-white placeholder-white/20 border border-transparent focus:border-[#F2CA50] focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
              SENHA
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#F2CA50]">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#1C1C1B] text-white placeholder-white/20 border border-transparent focus:border-[#F2CA50] focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRecoverPassword}
              className="text-xs text-[#F2CA50] hover:underline font-medium cursor-pointer"
            >
              Esqueci minha senha
            </button>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#F2CA50]/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ENTRANDO...</span>
                </>
              ) : (
                <span>ACESSAR PAINEL</span>
              )}
            </button>
          </div>
        </form>

        {/* Demo Fast Fill Buttons for Testing */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider mb-3 text-center">
            Acesso Rápido de Demonstração
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoOwner}
              className="py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#F2CA50]" />
              <span>Dono (Demo)</span>
            </button>
            <button
              type="button"
              onClick={fillDemoStaff}
              className="py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#F2CA50]" />
              <span>Equipe (Demo)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dialog for password reset */}
      {dialogInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1C1C1B] border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-heading font-bold text-white">{dialogInfo.title}</h3>
            <p className="text-sm text-white/70">{dialogInfo.message}</p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDialogInfo(null)}
                className="px-5 py-2.5 rounded-xl bg-[#F2CA50] text-black font-heading font-bold text-xs uppercase cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-white/20 text-xs">
        EstiloExatoZap • Painel de Gestão e Fila
      </div>
    </div>
  );
};
