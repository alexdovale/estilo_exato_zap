import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, Users, User, Mail, Briefcase, X, Loader2 } from 'lucide-react';
import { StaffMember } from '../types';
import { teamRepository } from '../services/store';

interface TeamManagementModalProps {
  atelierId: string;
  onClose: () => void;
}

const ROLES = ['Barbeiro', 'Manicure', 'Extensionista', 'Recepcionista', 'Cabeleireiro', 'Esteticista'];

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  atelierId,
  onClose,
}) => {
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Barbeiro');
  const [isLoading, setIsLoading] = useState(false);

  const loadTeam = () => {
    setTeam(teamRepository.getTeam(atelierId));
  };

  useEffect(() => {
    loadTeam();
    const handleUpdate = () => loadTeam();
    window.addEventListener('estilo_store_updated', handleUpdate);
    return () => window.removeEventListener('estilo_store_updated', handleUpdate);
  }, [atelierId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await teamRepository.addStaffMember(atelierId, name.trim(), email.trim(), role);
      setName('');
      setEmail('');
      setRole('Barbeiro');
      setIsAddModalOpen(false);
      loadTeam();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    await teamRepository.removeStaff(id);
    loadTeam();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto">
      <div className="min-h-screen max-w-lg mx-auto p-6 sm:p-8 flex flex-col justify-between">
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
            </button>
            <span className="font-heading font-black text-xs uppercase tracking-widest text-[#F2CA50]">
              MINHA EQUIPE
            </span>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-3xl font-extrabold text-white">
              Colaboradores Ativos
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Gerencie quem tem acesso ao painel de atendimento da fila.
            </p>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {team.length === 0 ? (
              <div className="py-16 text-center text-white/30 text-sm">
                Nenhum colaborador cadastrado.
              </div>
            ) : (
              team.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl bg-[#1C1C1B] border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#F2CA50]/10 border border-[#F2CA50]/20 flex items-center justify-center text-[#F2CA50] font-heading font-black text-sm shrink-0">
                      {member.nome[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-heading font-bold text-white text-sm truncate">
                        {member.nome}
                      </div>
                      <div className="text-[10px] font-bold text-[#F2CA50] uppercase tracking-wider">
                        {member.cargo}
                      </div>
                      {member.email && (
                        <div className="text-[11px] text-white/30 truncate mt-0.5">
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    title="Remover colaborador"
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Floating Add Member Button */}
        <div className="pt-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F2CA50]/15 transition-transform active:scale-98"
          >
            <Plus className="w-5 h-5 text-black" />
            <span>NOVO MEMBRO</span>
          </button>
        </div>
      </div>

      {/* Add Member Bottom Sheet / Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C1B] border border-white/10 p-6 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider">
                NOVO COLABORADOR
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@barbearia.com"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  Cargo / Especialidade
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#1C1C1B]">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer"
                >
                  {isLoading ? 'CADASTRANDO...' : 'CADASTRAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
