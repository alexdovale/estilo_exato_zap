import React, { useState } from 'react';
import { Lock, QrCode, CreditCard, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { atelierRepository } from '../services/store';

interface ExpiredModalProps {
  atelierId: string;
  onPaymentSuccess: () => void;
  onLogout: () => void;
}

export const ExpiredModal: React.FC<ExpiredModalProps> = ({
  atelierId,
  onPaymentSuccess,
  onLogout,
}) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    // Simulate Mercado Pago transaction processing
    setTimeout(async () => {
      await atelierRepository.updateSubscription(atelierId, 'ativo', 30);
      setIsProcessing(false);
      setIsPaid(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-[#131313] text-white z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
          <Lock className="w-10 h-10" />
        </div>

        <div>
          <h2 className="font-heading text-3xl font-extrabold text-white">
            Acesso Suspenso
          </h2>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            Seu período de teste EstiloExatoZap terminou.
            <br />
            Realize o pagamento para liberar seu painel e continuar atendendo.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm shadow-xl shadow-[#F2CA50]/15 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
          >
            <span>PAGAR ASSINATURA (R$ 89,90)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="text-white/40 hover:text-white text-xs font-semibold py-2 cursor-pointer transition-colors"
          >
            Sair e voltar mais tarde
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C1B] border border-white/10 p-6 sm:p-8 space-y-6 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                  PAGAMENTO MERCADO PAGO
                </span>
                <h3 className="font-heading text-xl font-black text-white mt-0.5">
                  Assinatura Mensal Profissional
                </h3>
              </div>
              <div className="text-right">
                <span className="font-heading text-xl font-black text-[#F2CA50]">
                  R$ 89,90
                </span>
                <div className="text-[10px] text-white/40">/mês</div>
              </div>
            </div>

            {isPaid ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-heading text-xl font-black text-white">
                  Pagamento Confirmado!
                </h4>
                <p className="text-xs text-white/60">
                  Seu painel foi liberado por mais 30 dias. Redirecionando...
                </p>
              </div>
            ) : (
              <>
                {/* Method selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      paymentMethod === 'pix'
                        ? 'border-[#F2CA50] bg-[#F2CA50]/10 text-white'
                        : 'border-white/10 bg-black/40 text-white/60'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-[#F2CA50]" />
                    <span className="text-xs font-bold uppercase">PIX Instantâneo</span>
                    <span className="text-[10px] text-[#25D366] font-bold">Aprovação imediata</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#F2CA50] bg-[#F2CA50]/10 text-white'
                        : 'border-white/10 bg-black/40 text-white/60'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#F2CA50]" />
                    <span className="text-xs font-bold uppercase">Cartão de Crédito</span>
                    <span className="text-[10px] text-white/40">Até 12x</span>
                  </button>
                </div>

                {paymentMethod === 'pix' ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center space-y-3">
                    <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                      <QrCode className="w-32 h-32 text-black" />
                    </div>
                    <div className="text-xs text-white/60">
                      Escaneie o QR Code no app do seu banco ou use a chave Pix Copia e Cola.
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-white/70 select-all truncate">
                      00020126580014br.gov.bcb.pix0136estiloexato-mp-subscription-8990
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Número do Cartão: 0000 0000 0000 0000"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Validade: MM/AA"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="CVV: 123"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handlePay}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black text-xs font-heading font-black uppercase cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>PROCESSANDO...</span>
                      </>
                    ) : (
                      <span>CONFIRMAR PAGAMENTO</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
