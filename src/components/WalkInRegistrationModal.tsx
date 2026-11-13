import React, { useState } from 'react';
import { X, User, Phone, Loader2, Sparkles, Clock } from 'lucide-react';
import { queueRepository, atelierRepository } from '../services/store';

interface WalkInRegistrationModalProps {
  atelierId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const WalkInRegistrationModal: React.FC<WalkInRegistrationModalProps> = ({
  atelierId,
  onClose,
  onSuccess,
}) => {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('Presencial');
  const [isLoading, setIsLoading] = useState(false);
  const exp = atelierRepository.getExpedienteStatus(atelierId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setIsLoading(true);
    try {
      await queueRepository.addWalkInClient(
        atelierId,
        clientName.trim(),
        phone.trim(),
        service
      );
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1C1C1B] border border-white/10 p-6 sm:p-8 space-y-6 animate-slideUp">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
              REGISTRO WALK-IN
            </span>
            <h2 className="font-heading text-2xl font-extrabold text-white mt-1">
              Adicionar à Fila
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Cadastre o cliente que acabou de chegar presencialmente.
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] text-[#F2CA50]">
              <Clock className="w-3.5 h-3.5" />
              <span>Vagas hoje: {exp.vagasRestantes} de {exp.totalVagas} disponíveis</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-[#F2CA50]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              NOME DO CLIENTE
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F2CA50]">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Arthur Shelby"
                required
                autoFocus
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/40 text-white placeholder-white/20 border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              WHATSAPP / CELULAR
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F2CA50]">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/40 text-white placeholder-white/20 border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
              />
            </div>
            <p className="text-[10px] text-white/40 mt-1">
              Opcional. Usado para avisar quando a vez chegar.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              SERVIÇO SOLICITADO
            </label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Ex: Corte Tradicional"
              className="w-full px-4 py-3.5 rounded-xl bg-black/40 text-white placeholder-white/20 border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm transition-transform active:scale-98 shadow-lg shadow-[#F2CA50]/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>CONFIRMANDO...</span>
                </>
              ) : (
                <span>CONFIRMAR NA FILA</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
