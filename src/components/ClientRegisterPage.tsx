import React, { useState } from 'react';
import { ChevronLeft, User, Mail, Lock, Loader2, Scissors } from 'lucide-react';
import { clientRepository } from '../services/store';
import { ClientProfile } from '../types';

interface ClientRegisterPageProps {
  atelierId: string;
  onBack: () => void;
  onSuccess: (client: ClientProfile) => void;
}

export const ClientRegisterPage: React.FC<ClientRegisterPageProps> = ({
  atelierId,
  onBack,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Preencha os campos obrigatórios.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const client = await clientRepository.registerClient(
        name.trim(),
        email.trim(),
        atelierId,
        phone.trim()
      );
      onSuccess(client);
    } catch (err: any) {
      setErrorMsg('Erro ao cadastrar conta de cliente.');
    } finally {
      setIsLoading(false);
    }
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
          <span className="text-xs font-bold tracking-wider uppercase">Voltar ao Login</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] block mb-2">
            NOVO POR AQUI?
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-white leading-tight">
            Crie sua conta<br />
            <span className="text-[#F2CA50]">de cliente</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1.5">
            Cadastre-se para acumular pontos de fidelidade e cortar de graça.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              SEU NOME COMPLETO
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#F2CA50]">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arthur Shelby"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white placeholder-white/20 border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
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
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white placeholder-white/20 border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              CRIE UMA SENHA
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
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white placeholder-white/20 border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm shadow-xl shadow-[#F2CA50]/15 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>CADASTRANDO...</span>
                </>
              ) : (
                <span>CRIAR MINHA CONTA</span>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center text-white/20 text-xs">
        EstiloExatoZap • Fidelidade & Atendimento
      </div>
    </div>
  );
};
