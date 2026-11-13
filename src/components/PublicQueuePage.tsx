import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  User, 
  Phone, 
  CheckCircle2, 
  ArrowLeft, 
  Scissors, 
  Clock, 
  Sparkles, 
  Loader2, 
  Lock,
  MapPin,
  Bell
} from 'lucide-react';
import { AtelierProfile, QueueItem } from '../types';
import { clientRepository, queueRepository, atelierRepository } from '../services/store';
import { pushNotificationService, QueueRealtimeMonitor } from '../services/notificationService';

interface PublicQueuePageProps {
  atelierId: string;
  onBack: () => void;
  onGoToClientLogin: () => void;
  onGoToStaffLogin: () => void;
  onOpenLocation?: () => void;
}

export const PublicQueuePage: React.FC<PublicQueuePageProps> = ({
  atelierId,
  onBack,
  onGoToClientLogin,
  onGoToStaffLogin,
  onOpenLocation,
}) => {
  const [atelier, setAtelier] = useState<AtelierProfile | null>(null);
  const [currentServing, setCurrentServing] = useState<QueueItem | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [assignedTicket, setAssignedTicket] = useState<number | null>(null);

  const loadData = () => {
    const at = atelierRepository.getAtelier(atelierId);
    setAtelier(at);
    const serving = clientRepository.getCurrentServing(atelierId);
    setCurrentServing(serving);
  };

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(pushNotificationService.getPermission());

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('estilo_store_updated', handleUpdate);
    return () => window.removeEventListener('estilo_store_updated', handleUpdate);
  }, [atelierId]);

  // Real-time queue WebSocket / polling monitor
  useEffect(() => {
    const monitor = new QueueRealtimeMonitor({
      atelierId,
      clientPhone: phone,
      clientName: name,
      onEvent: () => {
        loadData();
      },
    });

    return () => monitor.destroy();
  }, [atelierId, phone, name]);

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsJoining(true);
    try {
      const item = await clientRepository.joinQueue(atelierId, name.trim(), phone.trim());
      setAssignedTicket(item.ticketNumber);

      // Auto-request push notification permission if default
      if (pushNotificationService.getPermission() === 'default') {
        pushNotificationService.requestPermission().then((perm) => {
          setNotifPermission(perm);
          if (perm === 'granted') {
            pushNotificationService.send({
              title: 'Entrou na Fila! ✂️',
              body: `Sua senha é #${item.ticketNumber}. Avisaremos você no celular quando for sua vez ou abrir vaga!`,
              type: 'general',
            });
          }
        });
      }

      setName('');
      setPhone('');
      setShowSuccessModal(true);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  if (!atelier) {
    return (
      <div className="min-h-screen bg-[#131313] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white/60 text-sm">Carregando dados da fila...</p>
        </div>
      </div>
    );
  }

  // Theme matching Flutter: Obsidian (Dark/Gold) vs Aura (Light/Brown)
  const isDark = atelier.tema !== 'aura';
  const primaryColor = isDark ? '#F2CA50' : '#72594A';
  const bgColor = isDark ? 'bg-[#131313]' : 'bg-[#FAF9F6]';
  const cardColor = isDark ? 'bg-[#1C1C1B]' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-[#1A1C1A]';
  const textMuted = isDark ? 'text-white/50' : 'text-[#1A1C1A]/60';
  const inputBg = isDark ? 'bg-black/40' : 'bg-black/5';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} flex flex-col justify-between select-none`}>
      {/* Top Navbar */}
      <header className={`sticky top-0 z-40 ${isDark ? 'bg-[#131313]/90' : 'bg-[#FAF9F6]/90'} backdrop-blur-md border-b ${isDark ? 'border-white/5' : 'border-black/5'} px-5 sm:px-8 py-4 flex items-center justify-between`}>
        <button
          onClick={onBack}
          className={`p-2 -ml-2 rounded-xl hover:bg-black/5 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold`}
          style={{ color: primaryColor }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="text-center">
          <h1 className="font-heading font-black text-sm tracking-widest uppercase" style={{ color: primaryColor }}>
            {atelier.nome_negocio}
          </h1>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>
            FILA VIRTUAL EM TEMPO REAL
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {onOpenLocation && (
            <button
              onClick={onOpenLocation}
              title="Ver no Google Maps & Trajeto"
              className={`p-2 rounded-xl text-xs font-bold hover:bg-black/5 transition-colors flex items-center gap-1 cursor-pointer`}
              style={{ color: primaryColor }}
            >
              <MapPin className="w-4 h-4 text-[#F2CA50]" />
              <span className="hidden sm:inline">Localização</span>
            </button>
          )}

          <button
            onClick={onGoToClientLogin}
            className={`p-2 -mr-2 rounded-xl text-xs font-bold hover:bg-black/5 transition-colors flex items-center gap-1 cursor-pointer`}
            style={{ color: primaryColor }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Área do Cliente</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto w-full p-6 sm:p-8 flex-1 flex flex-col justify-center space-y-6">
        {/* Live Status Card matching _buildLiveStatus */}
        <div
          className={`p-6 sm:p-8 rounded-3xl ${cardColor} border-2 shadow-2xl text-center space-y-4`}
          style={{ borderColor: `${primaryColor}40` }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold tracking-widest uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>AO VIVO</span>
          </div>

          <div>
            <div className={`font-heading text-3xl sm:text-4xl font-extrabold ${textColor}`}>
              {currentServing ? currentServing.clientName : 'Cadeira disponível'}
            </div>
            <div className={`text-xs font-black uppercase tracking-widest mt-1.5 ${textMuted}`}>
              {currentServing ? `Sendo atendido agora • ${currentServing.service}` : 'Próximo da fila será chamado'}
            </div>
          </div>

          {/* Status de Horário & Vagas do Dia */}
          {(() => {
            const exp = atelierRepository.getExpedienteStatus(atelier.id);
            return (
              <div className="pt-3 pb-1 border-t border-white/5 flex items-center justify-between text-xs px-2">
                <span className="text-white/70 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${exp.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span>{exp.currentDayName}: {exp.horarioHoje}</span>
                </span>
                <span className="font-bold text-[#F2CA50]">
                  {exp.vagasRestantes} vagas disponíveis
                </span>
              </div>
            );
          })()}

          {onOpenLocation && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenLocation}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#F2CA50]" />
                <span className="text-white/80">Ver Localização no Google Maps & Rotas</span>
              </button>
            </div>
          )}
        </div>

        {/* Join Virtual Queue Form matching _buildJoinForm */}
        <div className="space-y-4">
          <div>
            <span
              className="text-[10px] font-black uppercase tracking-widest block"
              style={{ color: primaryColor }}
            >
              ENTRAR NA FILA VIRTUAL
            </span>
            <h2 className={`font-heading text-2xl font-black mt-1 ${textColor}`}>
              Garanta seu atendimento
            </h2>
            <p className={`text-xs mt-0.5 ${textMuted}`}>
              Avisamos você no WhatsApp quando for a sua vez.
            </p>
          </div>

          <form onSubmit={handleJoinQueue} className="space-y-4 pt-2">
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
                Seu Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: primaryColor }}>
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gabriel Souza"
                  required
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl ${inputBg} ${textColor} border ${isDark ? 'border-white/10' : 'border-black/10'} focus:outline-none text-sm`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
                WhatsApp (com DDD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: primaryColor }}>
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl ${inputBg} ${textColor} border ${isDark ? 'border-white/10' : 'border-black/10'} focus:outline-none text-sm`}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isJoining}
                className="w-full py-4 px-6 rounded-xl font-heading font-black text-sm uppercase tracking-wider transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: primaryColor,
                  color: isDark ? '#000000' : '#FFFFFF',
                  boxShadow: `0 10px 25px -5px ${primaryColor}40`,
                }}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>ENTRANDO NA FILA...</span>
                  </>
                ) : (
                  <span>GARANTIR MEU LUGAR</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Link to Loyalty Portal */}
        <div className={`p-4 rounded-2xl ${cardColor} border ${isDark ? 'border-white/5' : 'border-black/5'} flex items-center justify-between`}>
          <div>
            <div className="font-heading font-bold text-xs uppercase tracking-wider" style={{ color: primaryColor }}>
              Programa de Fidelidade
            </div>
            <div className={`text-[11px] mt-0.5 ${textMuted}`}>
              Corte grátis a cada 10 atendimentos
            </div>
          </div>
          <button
            onClick={onGoToClientLogin}
            className="px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: primaryColor }}
          >
            Acessar Pontos
          </button>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="p-6 text-center text-xs tracking-widest font-semibold uppercase" style={{ color: `${primaryColor}60` }}>
        Desenvolvido por EstiloExatoZap
      </footer>

      {/* Success Bottom Sheet matching Flutter _showSuccessDialog */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#25D366] text-white p-8 text-center space-y-4 animate-slideUp">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>

            <div>
              <h3 className="font-heading text-2xl font-black uppercase tracking-wide">
                VOCÊ ESTÁ NA FILA!
              </h3>
              {assignedTicket && (
                <div className="mt-2 inline-block px-4 py-1 rounded-full bg-black/20 text-sm font-black tracking-widest">
                  SENHA #{assignedTicket}
                </div>
              )}
              <p className="text-sm mt-3 leading-relaxed opacity-95">
                Fique atento ao seu WhatsApp. Avisaremos quando sua vez estiver chegando para você se dirigir à cadeira!
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3.5 px-6 rounded-xl bg-white text-[#25D366] font-heading font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg hover:bg-white/90 transition-colors"
              >
                ENTENDI, OBRIGADO!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
