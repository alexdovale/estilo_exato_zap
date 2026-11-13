import React, { useState } from 'react';
import { ChevronLeft, Scissors, Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import { clientRepository } from '../services/store';
import { ClientProfile } from '../types';

interface ClientLoginPageProps {
  atelierId: string;
  onBack: () => void;
  onSuccess: (client: ClientProfile) => void;
  onGoToRegister: () => void;
}

export const ClientLoginPage: React.FC<ClientLoginPageProps> = ({
  atelierId,
  onBack,
  onSuccess,
  onGoToRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Preencha todos os campos para acessar.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const client = await clientRepository.clientLogin(email.trim());
      onSuccess(client);
    } catch (err: any) {
      setErrorMsg('Erro ao entrar. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = () => {
    if (!email.trim()) {
      setErrorMsg('Digite seu e-mail para recuperar a senha.');
      return;
    }
    setSuccessMsg('Link de recuperação enviado para o seu e-mail!');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#131313] text-white flex flex-col justify-between p-6 sm:p-10 select-none">
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
            }}
          />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-extrabold text-white">
            Área do Cliente
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1.5 max-w-xs mx-auto">
            Acesse para agendar horários, entrar na fila virtual e acompanhar seus pontos de fidelidade.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
              SEU E-MAIL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#F2CA50]">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#1C1C1B] text-white placeholder-white/20 border border-transparent focus:border-[#F2CA50] focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
              SUA SENHA
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRecover}
              className="text-xs text-[#F2CA50] hover:underline cursor-pointer"
            >
              Esqueceu a senha?
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm shadow-xl shadow-[#F2CA50]/15 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ACESSANDO...</span>
                </>
              ) : (
                <span>ACESSAR ÁREA DO CLIENTE</span>
              )}
            </button>
          </div>
        </form>

        {/* Demo Fast Account for customer testing */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-3">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">
            Acesso Rápido para Testes
          </span>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const client = await clientRepository.clientLogin('arthur.shelby@exemplo.com');
                  onSuccess(client);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#F2CA50]/30 text-xs text-[#F2CA50] font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Entrar como Arthur Shelby (6 Pontos Fidelidade)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const client = await clientRepository.clientLogin('carlos.edu@exemplo.com');
                  onSuccess(client);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/70 hover:text-white font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Entrar como Carlos Eduardo (Cliente Cadastrado)</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-white/50">
            <span>Novo por aqui?</span>
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-[#F2CA50] font-bold hover:underline cursor-pointer"
            >
              Criar conta grátis
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-white/20 text-xs">
        EstiloExatoZap • Fidelidade & Atendimento
      </div>
    </div>
  );
};
