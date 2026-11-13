import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Bell, 
  BellOff, 
  Check, 
  CheckCircle2, 
  Smartphone, 
  User, 
  SlidersHorizontal,
  Flame,
  Info,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ClientProfile, ClientNotificationPreferences } from '../types';
import { clientRepository } from '../services/store';

interface ClientNotificationPermissionsModalProps {
  atelierId: string;
  onClose: () => void;
}

export const ClientNotificationPermissionsModal: React.FC<ClientNotificationPermissionsModalProps> = ({
  atelierId,
  onClose,
}) => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'next_disabled' | 'slot_disabled'>('all');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [somAlerta, setSomAlerta] = useState<string>(() => localStorage.getItem('estilo_som_alerta') || 'sino_suave');
  const [alertaVisual, setAlertaVisual] = useState<string>(() => localStorage.getItem('estilo_alerta_visual') || 'piscar_borda');

  const handleSaveAlertSettings = (newSom: string, newVisual: string) => {
    setSomAlerta(newSom);
    setAlertaVisual(newVisual);
    localStorage.setItem('estilo_som_alerta', newSom);
    localStorage.setItem('estilo_alerta_visual', newVisual);
    showToast('Preferências de som e alerta visual salvas!');
  };

  const loadClients = () => {
    const list = clientRepository.getAllClients(atelierId);
    setClients(list);
  };

  useEffect(() => {
    loadClients();
  }, [atelierId]);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 2800);
  };

  const handleTogglePreference = async (
    clientId: string,
    field: keyof ClientNotificationPreferences,
    currentValue: boolean
  ) => {
    const newValue = !currentValue;
    await clientRepository.updateClientNotificationPreferences(clientId, {
      [field]: newValue,
    });
    loadClients();
    showToast('Preferência salva com sucesso!');
  };

  const handleBulkEnable = async (field: 'permitirAvisoProximo' | 'permitirAvisoVagaAberta', value: boolean) => {
    await clientRepository.bulkUpdateNotifications({ [field]: value }, atelierId);
    loadClients();
    const label = field === 'permitirAvisoProximo' ? 'Próximo da Fila' : 'Vaga Aberta';
    showToast(`${value ? 'Habilitado' : 'Desabilitado'} "${label}" para todos os clientes!`);
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchSearch = 
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.telefone && c.telefone.includes(searchTerm)) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchSearch) return false;

    const notif = c.notificacoes || { permitirAvisoProximo: true, permitirAvisoVagaAberta: true };
    if (filterType === 'next_disabled') {
      return notif.permitirAvisoProximo === false;
    }
    if (filterType === 'slot_disabled') {
      return notif.permitirAvisoVagaAberta === false;
    }
    return true;
  });

  const totalClients = clients.length;
  const countNextEnabled = clients.filter(c => (c.notificacoes?.permitirAvisoProximo ?? true)).length;
  const countSlotEnabled = clients.filter(c => (c.notificacoes?.permitirAvisoVagaAberta ?? true)).length;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 overflow-y-auto animate-fadeIn">
      <div className="min-h-screen max-w-2xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
            </button>
            <div className="text-right">
              <span className="font-heading font-black text-xs uppercase tracking-widest text-[#F2CA50] block">
                ADMINISTRAÇÃO
              </span>
              <span className="text-[11px] text-white/50">Permissões de Notificação</span>
            </div>
          </div>

          {/* Title and Intro */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-white">
                  Controle de Push dos Clientes
                </h1>
                <p className="text-xs text-white/60 mt-0.5">
                  Gerencie individualmente quem recebe avisos de <strong>'Próximo da Fila'</strong> e <strong>'Vaga Aberta'</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
            <div className="p-3.5 rounded-xl bg-[#1C1C1B] border border-white/5 text-center">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                Clientes
              </div>
              <div className="font-heading font-black text-lg sm:text-xl text-white mt-1">
                {totalClients}
              </div>
              <div className="text-[10px] text-white/30 mt-0.5">cadastrados</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1C1C1B] border border-[#F2CA50]/20 text-center">
              <div className="text-[10px] font-bold text-[#F2CA50] uppercase tracking-wider">
                Próximo da Fila
              </div>
              <div className="font-heading font-black text-lg sm:text-xl text-[#F2CA50] mt-1">
                {countNextEnabled} / {totalClients}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">notificação ativa</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1C1C1B] border border-[#25D366]/20 text-center">
              <div className="text-[10px] font-bold text-[#25D366] uppercase tracking-wider">
                Vaga Aberta
              </div>
              <div className="font-heading font-black text-lg sm:text-xl text-[#25D366] mt-1">
                {countSlotEnabled} / {totalClients}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">notificação ativa</div>
            </div>
          </div>

          {/* Seletor de Sons e Alertas Visuais para 'Próximo da Fila' */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/30 shadow-xl mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#F2CA50]" />
                <h3 className="font-heading font-black text-white text-sm uppercase tracking-wider">
                  Sons & Alertas Visuais para 'Próximo da Fila'
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#F2CA50]/15 text-[#F2CA50]">
                Personalização
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                  Tipo de Som de Alerta
                </label>
                <select
                  value={somAlerta}
                  onChange={(e) => handleSaveAlertSettings(e.target.value, alertaVisual)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                >
                  <option value="sino_suave">Sino Dourado Suave 🔔</option>
                  <option value="metal_classico">Alerta Metálico Clássico ⚡</option>
                  <option value="sinal_digital">Sinal Digital de Atendimento 🔊</option>
                  <option value="silencioso">Silencioso (Apenas Notificação Visual)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                  Efeito de Alerta Visual
                </label>
                <select
                  value={alertaVisual}
                  onChange={(e) => handleSaveAlertSettings(somAlerta, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                >
                  <option value="piscar_borda">Piscar Borda Dourada Destacada</option>
                  <option value="banner_destacado">Banner Flutuante no Topo da Tela</option>
                  <option value="nenhum">Nenhum Efeito Especial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Bulk Actions */}
          <div className="p-4 rounded-xl bg-[#1C1C1B] border border-white/10 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#F2CA50]" />
                Ações Rápidas em Massa
              </span>
              <span className="text-[10px] text-white/40">
                Aplica a todos os clientes cadastrados
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleBulkEnable('permitirAvisoProximo', true)}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white border border-white/5 transition-colors cursor-pointer text-center"
              >
                Ativar 'Próximo' Todos
              </button>
              <button
                onClick={() => handleBulkEnable('permitirAvisoProximo', false)}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white/70 border border-white/5 transition-colors cursor-pointer text-center"
              >
                Pausar 'Próximo' Todos
              </button>
              <button
                onClick={() => handleBulkEnable('permitirAvisoVagaAberta', true)}
                className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-bold text-[#25D366] border border-[#25D366]/20 transition-colors cursor-pointer text-center"
              >
                Ativar 'Vaga' Todos
              </button>
              <button
                onClick={() => handleBulkEnable('permitirAvisoVagaAberta', false)}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white/70 border border-white/5 transition-colors cursor-pointer text-center"
              >
                Pausar 'Vaga' Todos
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente por nome, telefone ou e-mail..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1C1C1B] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#F2CA50] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#F2CA50] text-black'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Todos ({clients.length})
              </button>
              <button
                onClick={() => setFilterType('next_disabled')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterType === 'next_disabled'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                'Próximo' Pausado ({clients.filter(c => c.notificacoes?.permitirAvisoProximo === false).length})
              </button>
              <button
                onClick={() => setFilterType('slot_disabled')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterType === 'slot_disabled'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                'Vaga Aberta' Pausado ({clients.filter(c => c.notificacoes?.permitirAvisoVagaAberta === false).length})
              </button>
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-3">
            {filteredClients.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#1C1C1B] border border-white/5 text-center text-white/40 text-xs">
                Nenhum cliente encontrado com os filtros atuais.
              </div>
            ) : (
              filteredClients.map((client) => {
                const notif = client.notificacoes || {
                  permitirAvisoProximo: true,
                  permitirAvisoVagaAberta: true,
                  pushHabilitado: true,
                };
                const nextActive = notif.permitirAvisoProximo !== false;
                const slotActive = notif.permitirAvisoVagaAberta !== false;
                const initial = (client.nome || 'C')[0].toUpperCase();

                return (
                  <div
                    key={client.id}
                    className="p-4 rounded-xl bg-[#1C1C1B] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    {/* Client Info Header */}
                    <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] flex items-center justify-center font-heading font-black text-sm shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-bold text-white text-sm truncate">
                              {client.nome}
                            </h3>
                            {client.pontos > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#F2CA50]/10 text-[#F2CA50] text-[9px] font-bold">
                                {client.pontos} pts
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/40 truncate flex items-center gap-2 mt-0.5">
                            <span>{client.telefone || 'Sem telefone'}</span>
                            <span>•</span>
                            <span className="truncate">{client.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Device Push Status Pill */}
                      <div className="shrink-0 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          notif.pushHabilitado !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-white/5 text-white/40'
                        }`}>
                          <Smartphone className="w-3 h-3" />
                          <span>{notif.pushHabilitado !== false ? 'Push Pronto' : 'Sem Push'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Dual Toggle Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Toggle 1: Próximo da Fila */}
                      <div className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                        nextActive
                          ? 'bg-[#F2CA50]/5 border-[#F2CA50]/30'
                          : 'bg-black/30 border-white/5'
                      }`}>
                        <div className="pr-2 min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Bell className={`w-3.5 h-3.5 ${nextActive ? 'text-[#F2CA50]' : 'text-white/30'}`} />
                            <span>Aviso: Próximo da Fila</span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5 leading-tight">
                            {nextActive 
                              ? 'Recebe push quando chegar na vez #1' 
                              : 'Avisos de próximo desabilitados'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePreference(client.id, 'permitirAvisoProximo', nextActive)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            nextActive ? 'bg-[#F2CA50]' : 'bg-neutral-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                              nextActive ? 'translate-x-5' : 'translate-x-0 bg-neutral-400'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Toggle 2: Vaga Aberta */}
                      <div className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                        slotActive
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-black/30 border-white/5'
                      }`}>
                        <div className="pr-2 min-w-0">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Flame className={`w-3.5 h-3.5 ${slotActive ? 'text-[#25D366]' : 'text-white/30'}`} />
                            <span>Aviso: Vaga Aberta</span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5 leading-tight">
                            {slotActive 
                              ? 'Recebe alerta quando liberar vaga' 
                              : 'Avisos de vaga aberta pausados'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePreference(client.id, 'permitirAvisoVagaAberta', slotActive)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            slotActive ? 'bg-[#25D366]' : 'bg-neutral-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                              slotActive ? 'translate-x-5' : 'translate-x-0 bg-neutral-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-white/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>As permissões são salvas em tempo real no sistema.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#F2CA50] hover:bg-[#d4af37] text-black font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-[#F2CA50]/10"
          >
            Concluir
          </button>
        </div>

        {/* Temporary Save Toast */}
        {saveToast && (
          <div className="fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl bg-[#1C1C1B] border border-[#F2CA50] text-white text-xs font-bold flex items-center gap-2 shadow-2xl shadow-black/80 animate-slideDown">
            <Check className="w-4 h-4 text-[#F2CA50]" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};
