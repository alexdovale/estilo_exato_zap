import React, { useState } from 'react';
import { 
  ChevronLeft, 
  CreditCard, 
  QrCode, 
  Radio, 
  Banknote, 
  Sliders, 
  Check, 
  Plus, 
  Trash2, 
  Wifi, 
  Bluetooth, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Zap,
  Smartphone
} from 'lucide-react';
import { AtelierProfile, PaymentMethodsConfig, MetodoPagamento, MaquininhaCartao, MaquininhaMarca } from '../types';
import { paymentMethodsRepository, cardMachineRepository } from '../services/store';

interface PaymentSettingsModalProps {
  atelier: AtelierProfile;
  onClose: () => void;
  onUpdated?: () => void;
}

export const PaymentSettingsModal: React.FC<PaymentSettingsModalProps> = ({
  atelier,
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'methods' | 'machines'>('methods');
  
  // Methods configuration
  const [config, setConfig] = useState<PaymentMethodsConfig>(() => 
    paymentMethodsRepository.getConfig(atelier.id)
  );

  // Machines configuration
  const [machines, setMachines] = useState<MaquininhaCartao[]>(() => 
    cardMachineRepository.getMachines(atelier.id)
  );

  // New machine form
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newMarca, setNewMarca] = useState<MaquininhaMarca>('stone');
  const [newModelo, setNewModelo] = useState('');
  const [newConexao, setNewConexao] = useState<'wifi' | 'bluetooth' | 'tap_on_phone' | 'standalone'>('wifi');
  const [newTaxaDebito, setNewTaxaDebito] = useState(1.39);
  const [newTaxaCredito, setNewTaxaCredito] = useState(3.19);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCount = [
    config.pixHabilitado,
    config.cartaoDebitoHabilitado,
    config.cartaoCreditoHabilitado,
    config.tapOnPhoneHabilitado,
    config.dinheiroHabilitado,
  ].filter(Boolean).length;

  const handleToggle = (key: keyof Omit<PaymentMethodsConfig, 'atelierId' | 'metodoPadrao'>) => {
    // Prevent disabling the last remaining payment method
    if (config[key] && activeCount <= 1) {
      setToastMessage('Ao menos 1 método de pagamento deve permanecer ativo no estabelecimento.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const updated = {
      ...config,
      [key]: !config[key],
    };

    // If disabled method was the default, pick the next available
    if (!updated[key]) {
      const methodMap: Record<string, MetodoPagamento> = {
        pixHabilitado: 'pix',
        cartaoDebitoHabilitado: 'cartao_debito',
        cartaoCreditoHabilitado: 'cartao_credito',
        tapOnPhoneHabilitado: 'tap_on_phone',
        dinheiroHabilitado: 'dinheiro',
      };
      if (updated.metodoPadrao === methodMap[key]) {
        if (updated.pixHabilitado) updated.metodoPadrao = 'pix';
        else if (updated.cartaoDebitoHabilitado) updated.metodoPadrao = 'cartao_debito';
        else if (updated.cartaoCreditoHabilitado) updated.metodoPadrao = 'cartao_credito';
        else if (updated.tapOnPhoneHabilitado) updated.metodoPadrao = 'tap_on_phone';
        else if (updated.dinheiroHabilitado) updated.metodoPadrao = 'dinheiro';
      }
    }

    setConfig(updated);
    paymentMethodsRepository.saveConfig(updated);
    window.dispatchEvent(new Event('estilo_payment_methods_updated'));
    window.dispatchEvent(new Event('estilo_store_updated'));
    if (onUpdated) onUpdated();

    setToastMessage('Preferência de pagamento atualizada com sucesso!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleChangeDefault = (metodo: MetodoPagamento) => {
    const updated = { ...config, metodoPadrao: metodo };
    setConfig(updated);
    paymentMethodsRepository.saveConfig(updated);
    window.dispatchEvent(new Event('estilo_payment_methods_updated'));
    window.dispatchEvent(new Event('estilo_store_updated'));
    if (onUpdated) onUpdated();
    setToastMessage('Método padrão atualizado!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    const created = cardMachineRepository.addMachine({
      atelierId: atelier.id,
      nome: newNome.trim(),
      marca: newMarca,
      modelo: newModelo.trim() || 'Smart POS',
      tipoConexao: newConexao,
      conectada: true,
      padrao: machines.length === 0,
      taxaDebito: newTaxaDebito,
      taxaCreditoVista: newTaxaCredito,
      taxaCreditoParcelado: newTaxaCredito + 2.0,
    });

    const updatedList = cardMachineRepository.getMachines(atelier.id);
    setMachines(updatedList);
    setShowAddMachine(false);
    setNewNome('');
    setNewModelo('');
    window.dispatchEvent(new Event('estilo_card_machines_updated'));
    if (onUpdated) onUpdated();

    setToastMessage(`Maquininha "${created.nome}" cadastrada com sucesso!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteMachine = (id: string) => {
    cardMachineRepository.deleteMachine(id);
    const updatedList = cardMachineRepository.getMachines(atelier.id);
    setMachines(updatedList);
    window.dispatchEvent(new Event('estilo_card_machines_updated'));
    if (onUpdated) onUpdated();
    setToastMessage('Maquininha removida.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSetDefaultMachine = (id: string) => {
    cardMachineRepository.setDefaultMachine(id, atelier.id);
    const updatedList = cardMachineRepository.getMachines(atelier.id);
    setMachines(updatedList);
    window.dispatchEvent(new Event('estilo_card_machines_updated'));
    if (onUpdated) onUpdated();
    setToastMessage('Maquininha padrão definida!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto">
      <div className="min-h-screen max-w-2xl mx-auto p-4 sm:p-6 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
            </button>
            <div className="text-right">
              <span className="font-heading font-black text-[11px] uppercase tracking-widest text-[#F2CA50] flex items-center justify-end gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                CONFIGURAÇÕES DO ESTABELECIMENTO
              </span>
              <h1 className="font-heading text-xl sm:text-2xl font-black text-white mt-0.5">
                Formas de Pagamento & Maquininhas
              </h1>
            </div>
          </div>

          {/* Toast Message */}
          {toastMessage && (
            <div className="p-3.5 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('methods')}
              className={`py-2.5 px-4 rounded-xl text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'methods'
                  ? 'bg-[#F2CA50] text-black shadow-lg shadow-[#F2CA50]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Métodos Aceitos ({activeCount}/5)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('machines')}
              className={`py-2.5 px-4 rounded-xl text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'machines'
                  ? 'bg-[#F2CA50] text-black shadow-lg shadow-[#F2CA50]/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Maquininhas Vinculadas ({machines.length})</span>
            </button>
          </div>

          {/* TAB 1: MÉTODOS DE PAGAMENTO VISÍVEIS NO CAIXA */}
          {activeTab === 'methods' && (
            <div className="space-y-6">
              
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-black via-[#1C1C1B] to-black border border-white/10 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white text-sm">
                    Personalize o que Aparece no Caixa da Sua Barbearia
                  </h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Você pode desativar métodos que não utiliza (como dinheiro ou crédito parcelado). Apenas as opções marcadas como <strong>Ativas</strong> aparecerão para a sua equipe na tela de <em>Concluir e Receber</em>.
                  </p>
                </div>
              </div>

              {/* Switches List */}
              <div className="space-y-3">
                {/* 1. Pix */}
                <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Pix Instantâneo</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#25D366]/20 text-[#25D366]">
                          QR Code na Tela
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Geração automática de QR Code no atendimento, Pix Copia e Cola e cobrança WhatsApp.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('pixHabilitado')}
                    className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 relative ${
                      config.pixHabilitado ? 'bg-[#25D366]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      config.pixHabilitado ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 2. Cartão de Débito */}
                <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Cartão de Débito</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F2CA50]/20 text-[#F2CA50]">
                          Maquininha POS
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Permite selecionar a maquininha do balcão e enviar o valor direto para o terminal.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('cartaoDebitoHabilitado')}
                    className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 relative ${
                      config.cartaoDebitoHabilitado ? 'bg-[#F2CA50]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      config.cartaoDebitoHabilitado ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 3. Cartão de Crédito */}
                <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Cartão de Crédito (À vista & Parcelado)</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F2CA50]/20 text-[#F2CA50]">
                          Até 6x
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Permite ao cliente pagar no crédito com cálculo dinâmico de parcelas.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('cartaoCreditoHabilitado')}
                    className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 relative ${
                      config.cartaoCreditoHabilitado ? 'bg-[#F2CA50]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      config.cartaoCreditoHabilitado ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 4. Celular como Maquininha (Tap on Phone NFC) */}
                <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Celular como Maquininha (Tap on Phone)</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-400/20 text-cyan-300">
                          NFC Contactless
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Receba pagamentos por aproximação (cartão ou celular) direto na traseira do smartphone.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('tapOnPhoneHabilitado')}
                    className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 relative ${
                      config.tapOnPhoneHabilitado ? 'bg-cyan-400' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      config.tapOnPhoneHabilitado ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 5. Dinheiro em Espécie */}
                <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                        <span>Dinheiro em Espécie</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300">
                          Troco Automático
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Permite registrar pagamento em notas físicas com calculadora instantânea de troco.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('dinheiroHabilitado')}
                    className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 relative ${
                      config.dinheiroHabilitado ? 'bg-amber-400' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      config.dinheiroHabilitado ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Default Method Selector */}
              <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-white uppercase tracking-wider">
                      Método Pré-selecionado no Caixa
                    </label>
                    <span className="text-[11px] text-white/40">
                      Qual método deve vir selecionado por padrão ao abrir a tela de checkout?
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {config.pixHabilitado && (
                    <button
                      type="button"
                      onClick={() => handleChangeDefault('pix')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        config.metodoPadrao === 'pix'
                          ? 'bg-[#25D366]/20 border-[#25D366] text-[#25D366]'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Pix Instantâneo</span>
                      {config.metodoPadrao === 'pix' && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  )}

                  {config.cartaoDebitoHabilitado && (
                    <button
                      type="button"
                      onClick={() => handleChangeDefault('cartao_debito')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        config.metodoPadrao === 'cartao_debito'
                          ? 'bg-[#F2CA50]/20 border-[#F2CA50] text-[#F2CA50]'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Cartão Débito</span>
                      {config.metodoPadrao === 'cartao_debito' && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  )}

                  {config.cartaoCreditoHabilitado && (
                    <button
                      type="button"
                      onClick={() => handleChangeDefault('cartao_credito')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        config.metodoPadrao === 'cartao_credito'
                          ? 'bg-[#F2CA50]/20 border-[#F2CA50] text-[#F2CA50]'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Cartão Crédito</span>
                      {config.metodoPadrao === 'cartao_credito' && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  )}

                  {config.tapOnPhoneHabilitado && (
                    <button
                      type="button"
                      onClick={() => handleChangeDefault('tap_on_phone')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        config.metodoPadrao === 'tap_on_phone'
                          ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <Radio className="w-4 h-4" />
                      <span>Celular NFC</span>
                      {config.metodoPadrao === 'tap_on_phone' && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  )}

                  {config.dinheiroHabilitado && (
                    <button
                      type="button"
                      onClick={() => handleChangeDefault('dinheiro')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        config.metodoPadrao === 'dinheiro'
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Dinheiro</span>
                      {config.metodoPadrao === 'dinheiro' && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Prévia Dinâmica do Modal de Finalização de Atendimento */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-black/80 to-[#1C1C1B] border-2 border-dashed border-[#F2CA50]/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-heading font-black uppercase tracking-wider text-[#F2CA50]">
                      Prévia Dinâmica do Caixa (Como o Barbeiro Verá ao Finalizar Atendimento)
                    </span>
                  </div>
                  <span className="text-[10px] text-white/50 font-bold">
                    {activeCount} de 5 métodos ativos
                  </span>
                </div>

                <p className="text-xs text-white/60">
                  Ao ativar ou desativar os métodos acima, os botões abaixo são atualizados instantaneamente na tela de <strong>Concluir e Receber</strong>:
                </p>

                {/* Simulated Grid in Checkout Modal */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white/40 uppercase">
                    <span>SELETOR DE PAGAMENTO NO CHECKOUT</span>
                    <span className="text-[#F2CA50]">Padrão: {config.metodoPadrao.toUpperCase().replace('_', ' ')}</span>
                  </div>

                  <div className={`grid ${
                    activeCount === 1 ? 'grid-cols-1' :
                    activeCount === 2 ? 'grid-cols-2' :
                    activeCount === 3 ? 'grid-cols-3' :
                    activeCount === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-5'
                  } gap-2`}>
                    {config.pixHabilitado && (
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 ${
                        config.metodoPadrao === 'pix' ? 'bg-[#25D366]/20 border-[#25D366] text-white shadow-md' : 'bg-black/40 border-white/10 text-white/60'
                      }`}>
                        <QrCode className={`w-5 h-5 ${config.metodoPadrao === 'pix' ? 'text-[#25D366]' : 'text-white/40'}`} />
                        <span className="font-heading font-black text-xs">PIX</span>
                        <span className="text-[9px] text-[#25D366] font-bold">QR Code</span>
                      </div>
                    )}

                    {config.cartaoDebitoHabilitado && (
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 ${
                        config.metodoPadrao === 'cartao_debito' ? 'bg-[#F2CA50]/20 border-[#F2CA50] text-white shadow-md' : 'bg-black/40 border-white/10 text-white/60'
                      }`}>
                        <CreditCard className={`w-5 h-5 ${config.metodoPadrao === 'cartao_debito' ? 'text-[#F2CA50]' : 'text-white/40'}`} />
                        <span className="font-heading font-black text-xs">DÉBITO</span>
                        <span className="text-[9px] text-white/40 font-bold">Maquininha</span>
                      </div>
                    )}

                    {config.cartaoCreditoHabilitado && (
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 ${
                        config.metodoPadrao === 'cartao_credito' ? 'bg-[#F2CA50]/20 border-[#F2CA50] text-white shadow-md' : 'bg-black/40 border-white/10 text-white/60'
                      }`}>
                        <CreditCard className={`w-5 h-5 ${config.metodoPadrao === 'cartao_credito' ? 'text-[#F2CA50]' : 'text-white/40'}`} />
                        <span className="font-heading font-black text-xs">CRÉDITO</span>
                        <span className="text-[9px] text-white/40 font-bold">Parcelado</span>
                      </div>
                    )}

                    {config.tapOnPhoneHabilitado && (
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 ${
                        config.metodoPadrao === 'tap_on_phone' ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md' : 'bg-black/40 border-white/10 text-white/60'
                      }`}>
                        <Radio className={`w-5 h-5 ${config.metodoPadrao === 'tap_on_phone' ? 'text-cyan-400' : 'text-white/40'}`} />
                        <span className="font-heading font-black text-xs">CELULAR NFC</span>
                        <span className="text-[9px] text-cyan-300 font-bold">Tap to Pay</span>
                      </div>
                    )}

                    {config.dinheiroHabilitado && (
                      <div className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 ${
                        config.metodoPadrao === 'dinheiro' ? 'bg-amber-500/20 border-amber-400 text-white shadow-md' : 'bg-black/40 border-white/10 text-white/60'
                      }`}>
                        <Banknote className={`w-5 h-5 ${config.metodoPadrao === 'dinheiro' ? 'text-amber-400' : 'text-white/40'}`} />
                        <span className="font-heading font-black text-xs">DINHEIRO</span>
                        <span className="text-[9px] text-white/40 font-bold">Com Troco</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MAQUININHAS DE CARTÃO VINCULADAS */}
          {activeTab === 'machines' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="font-heading font-bold text-white text-base">
                    Terminais POS & Maquininhas
                  </h3>
                  <p className="text-xs text-white/50">
                    Cadastre as maquininhas de cartão físicas ou celulares vinculados à barbearia
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMachine(!showAddMachine)}
                  className="py-2 px-3.5 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-[#ebd05d] transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddMachine ? 'Fechar Formulário' : 'Nova Maquininha'}</span>
                </button>
              </div>

              {/* Add Machine Form */}
              {showAddMachine && (
                <form onSubmit={handleSaveMachine} className="p-5 rounded-2xl bg-[#1C1C1B] border-2 border-[#F2CA50]/40 space-y-4 animate-slideDown">
                  <span className="font-heading font-black text-xs uppercase tracking-wider text-[#F2CA50] block">
                    Cadastrar Nova Maquininha
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1">Nome / Apelido no Caixa</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Stone Balcão 1"
                        value={newNome}
                        onChange={(e) => setNewNome(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 mb-1">Operadora / Marca</label>
                      <select
                        value={newMarca}
                        onChange={(e) => setNewMarca(e.target.value as MaquininhaMarca)}
                        className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                      >
                        <option value="stone">Stone</option>
                        <option value="pagbank">PagBank (PagSeguro)</option>
                        <option value="cielo">Cielo</option>
                        <option value="rede">Rede</option>
                        <option value="mercadopago">Mercado Pago</option>
                        <option value="infinitepay">InfinitePay</option>
                        <option value="smart_pos">Smart POS Android</option>
                        <option value="outra">Outra</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 mb-1">Modelo do Terminal</label>
                      <input
                        type="text"
                        placeholder="Ex: Pax A910, Moderninha Pro 2..."
                        value={newModelo}
                        onChange={(e) => setNewModelo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 mb-1">Tipo de Conexão</label>
                      <select
                        value={newConexao}
                        onChange={(e) => setNewConexao(e.target.value as 'wifi' | 'bluetooth' | 'tap_on_phone' | 'standalone')}
                        className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                      >
                        <option value="wifi">Wi-Fi (Conexão Cloud)</option>
                        <option value="bluetooth">Bluetooth</option>
                        <option value="tap_on_phone">Tap on Phone (NFC Celular)</option>
                        <option value="standalone">Chip 4G / Standalone</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 mb-1">Taxa Débito Estimada (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTaxaDebito}
                        onChange={(e) => setNewTaxaDebito(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/50 mb-1">Taxa Crédito à Vista (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTaxaCredito}
                        onChange={(e) => setNewTaxaCredito(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMachine(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer"
                    >
                      Salvar Maquininha
                    </button>
                  </div>
                </form>
              )}

              {/* List of Machines */}
              <div className="space-y-3">
                {machines.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs rounded-2xl border border-dashed border-white/10">
                    Nenhuma maquininha cadastrada ainda.
                  </div>
                ) : (
                  machines.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80 shrink-0">
                          {m.tipoConexao === 'wifi' && <Wifi className="w-5 h-5 text-blue-400" />}
                          {m.tipoConexao === 'bluetooth' && <Bluetooth className="w-5 h-5 text-indigo-400" />}
                          {m.tipoConexao === 'tap_on_phone' && <Smartphone className="w-5 h-5 text-cyan-400" />}
                          {m.tipoConexao === 'standalone' && <CreditCard className="w-5 h-5 text-emerald-400" />}
                        </div>

                        <div>
                          <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                            <span>{m.nome}</span>
                            {m.padrao && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F2CA50]/20 text-[#F2CA50] border border-[#F2CA50]/30">
                                Padrão do Caixa
                              </span>
                            )}
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Ativa" />
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">
                            {m.marca.toUpperCase()} • Modelo: {m.modelo} • Débito: {m.taxaDebito || 1.39}% | Crédito: {m.taxaCreditoVista || 3.19}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {!m.padrao && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultMachine(m.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#F2CA50] hover:bg-[#F2CA50]/10 border border-[#F2CA50]/30 cursor-pointer"
                          >
                            Tornar Padrão
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMachine(m.id)}
                          className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/5 cursor-pointer"
                          title="Excluir Maquininha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/5 text-center text-white/30 text-xs">
          EstiloExatoZap • Configurações de Pagamento & POS
        </div>
      </div>
    </div>
  );
};
