import React, { useState } from 'react';
import { ChevronLeft, Scissors, Store, Mail, Lock, Loader2 } from 'lucide-react';
import { authRepository } from '../services/store';

interface RegisterPageProps {
  onBack: () => void;
  onSuccess: (atelierId: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBack, onSuccess }) => {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Preencha todos os campos para continuar.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const atelier = await authRepository.registerAtelier(
        email.trim(),
        password.trim(),
        businessName.trim()
      );
      onSuccess(atelier.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar estabelecimento.');
    } finally {
      setIsLoading(false);
    }
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

      {/* Main Form Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/COMPLETO.png"
            alt="Estilo Exato"
            className="h-16 sm:h-20 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const fallback = document.getElementById('register-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div id="register-fallback" className="hidden flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/40">
            <Scissors className="w-7 h-7 text-[#F2CA50]" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold leading-tight text-white">
            Crie sua conta<br />
            <span className="text-[#F2CA50]">e ganhe 14 dias</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-2">
            Cadastre seu atelier ou barbearia e teste todas as funcionalidades sem compromisso.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Business Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
              NOME DO NEGÓCIO
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#F2CA50]">
                <Store className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Barbearia do João"
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#1C1C1B] text-white placeholder-white/20 border border-transparent focus:border-[#F2CA50] focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
              E-MAIL
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

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#F2CA50]/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>CRIANDO CONTA...</span>
                </>
              ) : (
                <span>COMEÇAR TESTE GRÁTIS</span>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center text-white/30 text-xs">
        Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.
      </div>
    </div>
  );
};
