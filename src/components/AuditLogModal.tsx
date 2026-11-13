import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ShieldAlert, 
  Search, 
  Clock, 
  User, 
  Tag, 
  FileText, 
  CheckCircle2,
  Filter,
  Download
} from 'lucide-react';
import { AuditLogItem } from '../types';
import { auditRepository, atelierRepository } from '../services/store';

interface AuditLogModalProps {
  atelierId: string;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  atelierId,
  onClose,
}) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadLogs = () => {
    setLogs(auditRepository.getLogs(atelierId));
  };

  useEffect(() => {
    loadLogs();
    const handleUpdate = () => loadLogs();
    window.addEventListener('estilo_store_updated', handleUpdate);
    return () => window.removeEventListener('estilo_store_updated', handleUpdate);
  }, [atelierId]);

  const uniqueUsers = Array.from(new Set(logs.map(l => l.usuario)));
  const uniqueActions = Array.from(new Set(logs.map(l => l.acao)));

  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalhes.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchSearch) return false;
    if (selectedCategory !== 'all' && log.categoria !== selectedCategory) return false;
    if (selectedUser !== 'all' && log.usuario !== selectedUser) return false;
    if (selectedAction !== 'all' && log.acao !== selectedAction) return false;
    return true;
  });

  const getCategoryBadge = (cat: AuditLogItem['categoria']) => {
    switch (cat) {
      case 'configuracao':
        return { label: 'Configuração', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      case 'financeiro':
        return { label: 'Financeiro / Stripe', color: 'bg-[#F2CA50]/15 text-[#F2CA50] border-[#F2CA50]/30' };
      case 'whatsapp':
        return { label: 'WhatsApp / Push', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'equipe':
        return { label: 'Equipe', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'seguranca':
        return { label: 'Segurança', color: 'bg-red-500/15 text-red-400 border-red-500/30' };
      default:
        return { label: 'Geral', color: 'bg-white/10 text-white/70 border-white/10' };
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Auditoria-Acoes-${atelierId}-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessToast('Relatório de auditoria exportado com sucesso!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 overflow-y-auto animate-fadeIn">
      <div className="min-h-screen max-w-3xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between">
        <div>
          {/* Top Bar Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar ao Painel</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="py-2 px-3.5 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Log</span>
              </button>
            </div>
          </div>

          {/* Title and Intro */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="font-heading font-black text-[10px] uppercase tracking-widest text-[#F2CA50]">
                  PAINEL DE SEGURANÇA & GOVERNANÇA
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-black text-white mt-0.5">
                  Auditoria de Ações Críticas
                </h1>
              </div>
            </div>
            <p className="text-xs text-white/60 mt-2">
              Registro completo de rastreabilidade: visualize quem alterou, quando e quais configurações foram modificadas na conta do atelier.
            </p>
          </div>

          {successToast && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ação, usuário ou detalhes da alteração..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1C1C1B] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#F2CA50] transition-colors"
              />
            </div>

            {/* Filtros Avançados por Usuário e Ação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">
                  Filtrar por Usuário Responsável
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1B] border border-white/10 text-white text-xs focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos os Usuários ({uniqueUsers.length})</option>
                  {uniqueUsers.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">
                  Filtrar por Ação Específica
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1B] border border-white/10 text-white text-xs focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas as Ações ({uniqueActions.length})</option>
                  {uniqueActions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { key: 'all', label: 'Todas as Ações' },
                { key: 'configuracao', label: 'Configuração' },
                { key: 'financeiro', label: 'Financeiro' },
                { key: 'whatsapp', label: 'WhatsApp / Push' },
                { key: 'equipe', label: 'Equipe' },
                { key: 'seguranca', label: 'Segurança' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === tab.key
                      ? 'bg-[#F2CA50] text-black shadow-md'
                      : 'bg-[#1C1C1B] text-white/60 hover:text-white border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs List */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#1C1C1B] border border-white/5 text-center text-white/40 text-xs space-y-2">
                <FileText className="w-8 h-8 text-white/20 mx-auto" />
                <p>Nenhum registro de auditoria encontrado com os filtros atuais.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const badge = getCategoryBadge(log.categoria);
                const date = new Date(log.timestamp);
                const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <div
                    key={log.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 hover:border-[#F2CA50]/30 transition-all space-y-3 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <h3 className="font-heading font-black text-white text-sm sm:text-base">
                          {log.acao}
                        </h3>
                      </div>

                      <div className="text-[11px] text-white/40 flex items-center gap-1.5 shrink-0 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#F2CA50]" />
                        <span>{formattedDate} às {formattedTime}</span>
                      </div>
                    </div>

                    <p className="text-xs text-white/80 font-sans leading-relaxed">
                      {log.detalhes}
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-[11px] text-white/50">
                      <User className="w-3.5 h-3.5 text-[#F2CA50]" />
                      <span>Responsável: <strong className="text-white">{log.usuario}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-white/40">
            Total de {filteredLogs.length} registros de auditoria exibidos.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black uppercase tracking-wider cursor-pointer shadow-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
