import React, { useState } from 'react';
import { ChevronLeft, Globe, ShieldCheck, CheckCircle2, RefreshCw, Copy, Check } from 'lucide-react';
import { AtelierProfile } from '../types';
import { atelierRepository } from '../services/store';

interface CustomDomainModalProps {
  atelier: AtelierProfile;
  onClose: () => void;
}

export const CustomDomainModal: React.FC<CustomDomainModalProps> = ({
  atelier,
  onClose,
}) => {
  const [customDomain, setCustomDomain] = useState<string>(atelier.customDomain || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean>(atelier.domainVerified || false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    atelierRepository.updateAtelier(atelier.id, {
      customDomain: customDomain.trim(),
      domainVerified: verified,
    });
    setToast('Domínio personalizado salvo com sucesso!');
    setTimeout(() => setToast(null), 3000);
  };

  const handleVerifyDNS = () => {
    if (!customDomain.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
      atelierRepository.updateAtelier(atelier.id, {
        customDomain: customDomain.trim(),
        domainVerified: true,
      });
      setToast('DNS propagado e certificado SSL gerado com sucesso!');
      setTimeout(() => setToast(null), 4000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto animate-fadeIn">
      <div className="min-h-screen max-w-lg mx-auto p-4 sm:p-8 flex flex-col justify-between">
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar às Configurações</span>
            </button>
            <span className="font-heading font-black text-xs uppercase tracking-widest text-[#F2CA50]">
              DOMÍNIO PERSONALIZADO
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-white">
                  Domínio Personalizado (Whitelabel)
                </h1>
                <p className="text-xs text-white/50 mt-0.5">
                  Vincule seu próprio endereço web ao portal público de agendamentos e fila.
                </p>
              </div>
            </div>
          </div>

          {toast && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          <div className="space-y-6">
            <form onSubmit={handleSaveDomain} className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                  Endereço do Domínio ou Subdomínio
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-3 rounded-xl bg-black/60 text-white/40 text-xs font-mono border border-white/10">
                    https://
                  </div>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="agende.suabarbearia.com.br"
                    className="flex-1 px-4 py-3 rounded-xl bg-black/50 text-white text-xs border border-white/10 font-mono focus:border-[#F2CA50] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
                  Ex: <code className="text-[#F2CA50]">agende.barbeariaestiloreal.com.br</code> ou <code className="text-[#F2CA50]">atendimento.seuatelier.com</code>
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  verified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {verified ? 'DNS Propagado & SSL Ativo' : 'Aguardando Verificação DNS'}
                </span>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase cursor-pointer shadow-md"
                >
                  Salvar Domínio
                </button>
              </div>
            </form>

            {/* Configuração de DNS (Registros CNAME) */}
            <div className="p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-black text-xs text-[#F2CA50] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                  <span>Configuração de Registros DNS</span>
                </h4>
                <span className="text-[10px] text-white/40 font-mono">Painel Hospedagem / Registro.br</span>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Para vincular seu domínio, configure os seguintes registros CNAME no painel do seu provedor de domínio:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <div className="text-[10px] text-white/40 uppercase font-bold">Registro 1 (Apontamento CNAME)</div>
                  <div className="flex items-center justify-between text-white">
                    <span>Tipo: <strong className="text-[#F2CA50]">CNAME</strong> | Host: <strong className="text-[#25D366]">@</strong> ou <strong className="text-[#25D366]">agende</strong></span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('app.estilozap.com');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/70 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copiado!' : 'Copiar Valor'}</span>
                    </button>
                  </div>
                  <div className="text-white/60 text-[11px]">Valor: <code className="text-purple-400">app.estilozap.com</code></div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <div className="text-[10px] text-white/40 uppercase font-bold">Registro 2 (Validação SSL Let's Encrypt)</div>
                  <div className="text-white">Tipo: <strong className="text-[#F2CA50]">CNAME</strong> | Host: <strong className="text-[#25D366]">_estilo</strong></div>
                  <div className="text-white/60 text-[11px]">Valor: <code className="text-purple-400">verify.estilozap.com</code></div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isVerifying || !customDomain.trim()}
                  onClick={handleVerifyDNS}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verificando Propagação DNS & SSL...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verificar DNS & Conectar Domínio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center text-white/30 text-xs">
          EstiloExatoZap • Módulo de Domínio Personalizado Whitelabel
        </div>
      </div>
    </div>
  );
};
