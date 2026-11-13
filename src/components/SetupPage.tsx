import React, { useState } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Scissors, 
  Sparkles, 
  Users, 
  Plus, 
  Trash2, 
  ChevronRight, 
  LogOut, 
  Loader2, 
  Clock, 
  DollarSign,
  Phone,
  UserCheck
} from 'lucide-react';
import { setupRepository, authRepository } from '../services/store';

interface SetupPageProps {
  atelierId: string;
  onCompleted: () => void;
  onLogout: () => void;
}

const BRANCH_SUGGESTIONS = [
  'Barbearia',
  'Cabeleireiro',
  'Unhas',
  'Cílios / Sobrancelhas',
  'Estética',
  'Maquiagem',
  'Massoterapia',
  'Tatuagem / Piercing'
];

export const SetupPage: React.FC<SetupPageProps> = ({ atelierId, onCompleted, onLogout }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [location, setLocation] = useState({
    pais: 'Brasil',
    cep: '01310-100',
    cidade: 'São Paulo',
    endereco: 'Av. Paulista, 1000'
  });

  const [segmentation, setSegmentation] = useState({
    ramo: 'Barbearia',
    valor_base: '50.00',
    equipe_size: '1'
  });

  const [services, setServices] = useState<Array<{ nome: string; preco: number; duracao: number }>>([
    { nome: 'Corte Tradicional', preco: 45.0, duracao: 30 }
  ]);

  const [staff, setStaff] = useState<Array<{ nome: string; celular: string; cargo: string }>>([
    { nome: 'Profissional Principal', celular: '11999999999', cargo: 'Barbeiro' }
  ]);

  // Modal states for adding service / staff
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceTime, setNewServiceTime] = useState('30');

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    setServices([
      ...services,
      {
        nome: newServiceName.trim(),
        preco: parseFloat(newServicePrice) || 0,
        duracao: parseInt(newServiceTime) || 30
      }
    ]);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceTime('30');
    setIsServiceModalOpen(false);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    setStaff([
      ...staff,
      {
        nome: newStaffName.trim(),
        celular: newStaffPhone.trim(),
        cargo: segmentation.ramo || 'Profissional'
      }
    ]);
    setNewStaffName('');
    setNewStaffPhone('');
    setIsStaffModalOpen(false);
  };

  const handleFinalize = async () => {
    setIsLoading(true);
    try {
      await setupRepository.completeFullSetup(
        atelierId,
        location,
        segmentation,
        services,
        staff
      );
      onCompleted();
    } catch (e) {
      console.error('Error completing setup', e);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: 'Localização', icon: MapPin },
    { title: 'Segmentação', icon: Scissors },
    { title: 'Serviços', icon: Sparkles },
    { title: 'Profissionais', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#131313] text-white flex flex-col">
      {/* Top Bar */}
      <header className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img
            src="/COMPLETO.png"
            alt="Estilo Exato"
            className="h-10 object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-heading font-black tracking-widest text-[#F2CA50] text-sm uppercase">
            CONFIGURAÇÃO INICIAL
          </span>
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-6 sm:p-10 flex flex-col justify-between">
        {/* Stepper Progress Header */}
        <div>
          <div className="flex items-center justify-between mb-8">
            {steps.map((st, idx) => {
              const isPast = currentStep > idx;
              const isCurrent = currentStep === idx;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center relative">
                  <div className="flex items-center w-full">
                    <div 
                      className={`h-0.5 w-full ${idx === 0 ? 'invisible' : isPast || isCurrent ? 'bg-[#F2CA50]' : 'bg-white/10'}`} 
                    />
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isPast
                          ? 'bg-[#F2CA50] text-black font-extrabold'
                          : isCurrent
                          ? 'bg-[#F2CA50] text-black ring-4 ring-[#F2CA50]/20'
                          : 'bg-[#1C1C1B] text-white/40 border border-white/10'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div 
                      className={`h-0.5 w-full ${idx === steps.length - 1 ? 'invisible' : isPast ? 'bg-[#F2CA50]' : 'bg-white/10'}`} 
                    />
                  </div>
                  <span className={`text-[11px] font-bold mt-2 uppercase tracking-wider ${isCurrent ? 'text-[#F2CA50]' : 'text-white/40'}`}>
                    {st.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* STEP 1: LOCALIZAÇÃO */}
          {currentStep === 0 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-heading font-extrabold text-white">Localização do Atelier</h2>
                <p className="text-xs text-white/50 mt-1">Onde seus clientes vão encontrar seu estabelecimento.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">País</label>
                  <input
                    type="text"
                    value={location.pais}
                    onChange={(e) => setLocation({ ...location, pais: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">CEP</label>
                  <input
                    type="text"
                    value={location.cep}
                    onChange={(e) => setLocation({ ...location, cep: e.target.value })}
                    placeholder="00000-000"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Cidade</label>
                  <input
                    type="text"
                    value={location.cidade}
                    onChange={(e) => setLocation({ ...location, cidade: e.target.value })}
                    placeholder="Ex: São Paulo"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Endereço Completo</label>
                  <input
                    type="text"
                    value={location.endereco}
                    onChange={(e) => setLocation({ ...location, endereco: e.target.value })}
                    placeholder="Rua, número, bairro"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SEGMENTAÇÃO */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-heading font-extrabold text-white">Segmentação</h2>
                <p className="text-xs text-white/50 mt-1">Defina o ramo principal para adaptarmos a identidade do painel.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Ramo de Atuação</label>
                  <select
                    value={segmentation.ramo}
                    onChange={(e) => setSegmentation({ ...segmentation, ramo: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm cursor-pointer"
                  >
                    {BRANCH_SUGGESTIONS.map((branch) => (
                      <option key={branch} value={branch} className="bg-[#1C1C1B]">
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                    Valor médio do seu serviço principal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={segmentation.valor_base}
                    onChange={(e) => setSegmentation({ ...segmentation, valor_base: e.target.value })}
                    placeholder="50.00"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#1C1C1B] text-white border border-transparent focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SERVIÇOS */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-extrabold text-white">Menu de Serviços</h2>
                  <p className="text-xs text-white/50 mt-1">Serviços que seus clientes poderão solicitar.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {services.length === 0 ? (
                  <p className="text-xs text-white/30 italic">Nenhum serviço adicionado ainda.</p>
                ) : (
                  services.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#1C1C1B] border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-heading font-bold text-white text-sm">{s.nome}</div>
                        <div className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#F2CA50]" />
                          <span>{s.duracao} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-heading font-black text-[#F2CA50] text-sm">
                          R$ {s.preco.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setServices(services.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(true)}
                  className="w-full p-4 rounded-xl border border-dashed border-[#F2CA50]/40 hover:border-[#F2CA50] text-[#F2CA50] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADICIONAR NOVO SERVIÇO</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PROFISSIONAIS */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-heading font-extrabold text-white">Profissionais</h2>
                <p className="text-xs text-white/50 mt-1">Adicione você e sua equipe de atendimento.</p>
              </div>

              <div className="space-y-3 pt-2">
                {staff.length === 0 ? (
                  <p className="text-xs text-white/30 italic">Nenhum profissional cadastrado.</p>
                ) : (
                  staff.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#1C1C1B] border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F2CA50]/15 flex items-center justify-center text-[#F2CA50]">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-white text-sm">{p.nome}</div>
                          <div className="text-xs text-white/40">{p.celular || 'Sem celular'}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStaff(staff.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(true)}
                  className="w-full p-4 rounded-xl border border-dashed border-[#F2CA50]/40 hover:border-[#F2CA50] text-[#F2CA50] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADICIONAR PROFISSIONAL</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="pt-10 flex items-center gap-4">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="py-4 px-6 rounded-xl bg-[#1C1C1B] hover:bg-[#252524] text-white/70 hover:text-white font-heading font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
            >
              VOLTAR
            </button>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              if (currentStep < 3) {
                setCurrentStep(currentStep + 1);
              } else {
                handleFinalize();
              }
            }}
            className="flex-1 py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg shadow-[#F2CA50]/10 flex items-center justify-center gap-2 transition-transform transform active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>SALVANDO CONFIGURAÇÃO...</span>
              </>
            ) : currentStep === 3 ? (
              <span>FINALIZAR E IR PARA O PAINEL</span>
            ) : (
              <span>CONTINUAR</span>
            )}
          </button>
        </div>
      </main>

      {/* Modal Add Service */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C1B] border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-heading font-black text-white uppercase tracking-wide">
              NOVO SERVIÇO
            </h3>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Ex: Corte Degradê"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="50.00"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Tempo (min)</label>
                  <input
                    type="number"
                    value={newServiceTime}
                    onChange={(e) => setNewServiceTime(e.target.value)}
                    placeholder="30"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Staff */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C1B] border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-heading font-black text-white uppercase tracking-wide">
              NOVO PROFISSIONAL
            </h3>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">Nome do Profissional</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="Ex: 11999999999"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase"
                >
                  Salvar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
