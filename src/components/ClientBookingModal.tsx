import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { ServiceItem, StaffMember, ClientProfile, AtelierProfile, Appointment } from '../types';
import { serviceRepository, teamRepository, appointmentRepository, atelierRepository } from '../services/store';
import { pushNotificationService } from '../services/notificationService';

interface ClientBookingModalProps {
  atelierId: string;
  client: ClientProfile;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
}

export const ClientBookingModal: React.FC<ClientBookingModalProps> = ({
  atelierId,
  client,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  
  // Selection state
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null); // null = Qualquer profissional
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateStr(new Date()));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    const srvs = serviceRepository.getServices(atelierId);
    setServices(srvs);
    if (srvs.length > 0 && !selectedService) {
      setSelectedService(srvs[0]);
    }

    const team = teamRepository.getTeam(atelierId);
    setStaffList(team);
  }, [atelierId]);

  // Recalcular horários disponíveis ao mudar data, barbeiro ou configurações da agenda
  useEffect(() => {
    const refreshSlots = () => {
      if (!selectedDate) return;
      const slots = appointmentRepository.getAvailableTimeSlots(
        atelierId,
        selectedDate,
        selectedStaff?.id
      );
      setAvailableSlots(slots);
      setSelectedTime((prev) => {
        if (slots.length === 0) return '';
        if (prev && slots.includes(prev)) return prev;
        return slots[0];
      });
    };

    refreshSlots();
    window.addEventListener('estilo_store_updated', refreshSlots);
    return () => window.removeEventListener('estilo_store_updated', refreshSlots);
  }, [atelierId, selectedDate, selectedStaff]);

  // Gera os próximos 7 dias para seleção
  const nextDays = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() + index);
    const dateStr = toLocalDateStr(d);
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      dateStr,
      diaSemana: diasSemana[d.getDay()],
      diaNumero: d.getDate(),
      mesNome: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      isToday: index === 0,
    };
  });

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      const newAppt = await appointmentRepository.createAppointment({
        atelierId,
        clientId: client.id,
        clientName: client.nome,
        clientPhone: client.telefone || '11999999999',
        clientEmail: client.email,
        serviceId: selectedService.id,
        serviceName: selectedService.nome,
        servicePrice: selectedService.preco,
        serviceDuration: selectedService.duracao,
        staffId: selectedStaff?.id,
        staffName: selectedStaff ? selectedStaff.nome : 'Qualquer Barbeiro Disponível',
        data: selectedDate,
        horario: selectedTime,
        observacoes,
      });

      // Disparar Push Notification nativa de confirmação
      pushNotificationService.send({
        title: '✂️ Agendamento Confirmado!',
        body: `Seu horário para ${selectedService.nome} foi agendado para ${selectedDate.split('-').reverse().join('/')} às ${selectedTime}!`,
        type: 'general',
      });

      onSuccess(newAppt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] block">
                NOVO AGENDAMENTO
              </span>
              <h2 className="font-heading font-black text-lg text-white">
                Reserve seu Horário
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-black/20 border-b border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step >= 1 ? 'bg-[#F2CA50] text-black' : 'bg-white/10 text-white/40'
            }`}>
              1
            </span>
            <span className={step === 1 ? 'font-bold text-white' : 'text-white/40'}>Serviço</span>
          </div>

          <span className="text-white/20">→</span>

          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step >= 2 ? 'bg-[#F2CA50] text-black' : 'bg-white/10 text-white/40'
            }`}>
              2
            </span>
            <span className={step === 2 ? 'font-bold text-white' : 'text-white/40'}>Profissional</span>
          </div>

          <span className="text-white/20">→</span>

          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step >= 3 ? 'bg-[#F2CA50] text-black' : 'bg-white/10 text-white/40'
            }`}>
              3
            </span>
            <span className={step >= 3 ? 'font-bold text-white' : 'text-white/40'}>Data & Hora</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Escolha do Serviço */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Escolha o Serviço Desejado</h3>
                <p className="text-xs text-white/50 mt-0.5">Selecione o corte ou procedimento que deseja realizar.</p>
              </div>

              <div className="space-y-2.5">
                {services.map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#F2CA50]/10 border-[#F2CA50] shadow-md shadow-[#F2CA50]/5'
                          : 'bg-black/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#F2CA50] text-black' : 'bg-white/5 text-white/60'
                        }`}>
                          <Scissors className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-sm text-white">{srv.nome}</div>
                          <div className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-[#F2CA50]" />
                            <span>{srv.duracao} minutos</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-heading font-black text-sm sm:text-base text-[#F2CA50]">
                          R$ {srv.preco.toFixed(2)}
                        </span>
                        {isSelected && (
                          <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-end gap-1 mt-0.5">
                            <Check className="w-3 h-3" /> Selecionado
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Escolha do Barbeiro */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Selecione o Profissional</h3>
                <p className="text-xs text-white/50 mt-0.5">Escolha seu barbeiro de preferência ou o primeiro disponível.</p>
              </div>

              <div className="space-y-2.5">
                {/* Opção Qualquer Profissional */}
                <div
                  onClick={() => setSelectedStaff(null)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedStaff === null
                      ? 'bg-[#F2CA50]/10 border-[#F2CA50] shadow-md shadow-[#F2CA50]/5'
                      : 'bg-black/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedStaff === null ? 'bg-[#F2CA50] text-black' : 'bg-white/5 text-[#F2CA50]'
                    }`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-sm text-white">Qualquer Barbeiro Disponível</div>
                      <div className="text-xs text-white/40 mt-0.5">Maior disponibilidade e rapidez</div>
                    </div>
                  </div>
                  {selectedStaff === null && (
                    <Check className="w-5 h-5 text-[#F2CA50]" />
                  )}
                </div>

                {/* Lista de Membros da Equipe */}
                {staffList.map((member) => {
                  const isSelected = selectedStaff?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#F2CA50]/10 border-[#F2CA50] shadow-md shadow-[#F2CA50]/5'
                          : 'bg-black/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#F2CA50] text-black' : 'bg-white/5 text-white/60'
                        }`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-sm text-white">{member.nome}</div>
                          <div className="text-xs text-[#F2CA50]/80 mt-0.5 font-medium">{member.cargo}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-[#F2CA50]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Data e Horário */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Seleção de Dia */}
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                  Escolha o Dia
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {nextDays.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#F2CA50] text-black border-[#F2CA50] shadow-lg shadow-[#F2CA50]/15 scale-105'
                            : 'bg-black/40 border-white/5 text-white hover:border-white/20'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase">{d.diaSemana}</span>
                        <span className="text-base font-black font-heading mt-0.5">{d.diaNumero}</span>
                        <span className="text-[9px] opacity-70 uppercase">{d.mesNome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seleção de Horário */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Horários Disponíveis
                  </label>
                  <span className="text-[11px] text-white/40">
                    {availableSlots.length} horários livres
                  </span>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                    <p className="text-xs text-white/60">
                      Não há horários livres para esta data ou o atelier está fechado.
                    </p>
                    <p className="text-[11px] text-[#F2CA50]">
                      Por favor, escolha outro dia acima.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-heading transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-[#F2CA50] text-black border-[#F2CA50] shadow-md shadow-[#F2CA50]/20'
                              : 'bg-black/40 border-white/5 text-white/90 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Observações Opcionais */}
              <div>
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Observações ou Pedido Especial (Opcional)
                </label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Barba desenhada, disfarçado na zero..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#F2CA50]"
                />
              </div>

              {/* Resumo do Agendamento */}
              {selectedService && selectedTime && (
                <div className="p-4 rounded-2xl bg-[#F2CA50]/5 border border-[#F2CA50]/20 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#F2CA50]">
                    RESUMO DO HORÁRIO
                  </div>
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>{selectedService.nome}</span>
                    <strong className="text-[#F2CA50]">R$ {selectedService.preco.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Profissional:</span>
                    <span className="text-white font-medium">{selectedStaff ? selectedStaff.nome : 'Qualquer Barbeiro'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Data e Horário:</span>
                    <span className="text-white font-medium">
                      {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation */}
        <div className="p-5 sm:p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((p) => (p - 1) as any)}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !selectedService}
              onClick={() => setStep((p) => (p + 1) as any)}
              className="px-6 py-2.5 rounded-xl bg-[#F2CA50] hover:bg-[#d4af37] text-black font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#F2CA50]/15 disabled:opacity-50"
            >
              <span>Avançar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !selectedTime}
              onClick={handleConfirmBooking}
              className="px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-[#25D366]/20 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
