import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  Copy, 
  QrCode, 
  Smartphone, 
  CreditCard, 
  Banknote, 
  Wifi, 
  Bluetooth, 
  Radio, 
  Plus, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Sliders, 
  RotateCw,
  Zap,
  Settings2
} from 'lucide-react';
import { QueueItem, AtelierProfile, MetodoPagamento, MaquininhaCartao, Transaction, PaymentMethodsConfig } from '../types';
import { cardMachineRepository, pixRepository, queueRepository, whatsappRepository, paymentMethodsRepository } from '../services/store';
import { broadcastRealtimeEvent } from '../services/notificationService';
import { PaymentSettingsModal } from './PaymentSettingsModal';

interface CheckoutPaymentModalProps {
  item: QueueItem;
  atelier: AtelierProfile;
  initialServiceValue?: number;
  onClose: () => void;
  onSuccess: (tx: Transaction, receiptMessage?: string) => void;
}

export const CheckoutPaymentModal: React.FC<CheckoutPaymentModalProps> = ({
  item,
  atelier,
  initialServiceValue = 50.0,
  onClose,
  onSuccess,
}) => {
  // Service and upsell products
  const [valorServico, setValorServico] = useState<number>(initialServiceValue);
  const [addedProducts, setAddedProducts] = useState<Array<{ name: string; price: number }>>([]);
  const [customProductName, setCustomProductName] = useState('');
  const [customProductPrice, setCustomProductPrice] = useState<number>(0);
  const [showCustomProductInput, setShowCustomProductInput] = useState(false);

  // Establishment Payment Methods Visibility & Configuration
  const [methodsConfig, setMethodsConfig] = useState<PaymentMethodsConfig>(() => 
    paymentMethodsRepository.getConfig(atelier.id)
  );

  // Payment Method active
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>(() => methodsConfig.metodoPadrao || 'pix');

  // Cash method state
  const [valorRecebido, setValorRecebido] = useState<number>(0);

  // Card Machine state
  const [machines, setMachines] = useState<MaquininhaCartao[]>(() => cardMachineRepository.getMachines(atelier.id));
  const defaultMachine = useMemo(() => {
    return machines.find(m => m.padrao) || machines[0] || null;
  }, [machines]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => defaultMachine?.id || '');
  const [parcelas, setParcelas] = useState<number>(1);
  const [isSendingToPos, setIsSendingToPos] = useState(false);
  const [posStatus, setPosStatus] = useState<'idle' | 'enviando' | 'aguardando_cartao' | 'aprovado' | 'erro'>('idle');
  const [nsuAutorizacao, setNsuAutorizacao] = useState<string>('');

  // Tap on Phone (NFC Celular) state
  const [tapStatus, setTapStatus] = useState<'idle' | 'aguardando_aproximacao' | 'lendo_chip' | 'aprovado'>('idle');

  // Pix state
  const pixConfig = useMemo(() => pixRepository.getConfig(atelier.id), [atelier.id]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [pixStatus, setPixStatus] = useState<'aguardando' | 'confirmado'>('aguardando');
  const [isSendingPixWhatsApp, setIsSendingPixWhatsApp] = useState(false);

  // Modal de Configurações de Métodos & Maquininhas
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);

  // Toast / feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Listen to configuration updates from anywhere in the app
  useEffect(() => {
    const handleUpdate = () => {
      const updatedConfig = paymentMethodsRepository.getConfig(atelier.id);
      setMethodsConfig(updatedConfig);
      setMachines(cardMachineRepository.getMachines(atelier.id));
    };

    window.addEventListener('estilo_payment_methods_updated', handleUpdate);
    window.addEventListener('estilo_card_machines_updated', handleUpdate);
    return () => {
      window.removeEventListener('estilo_payment_methods_updated', handleUpdate);
      window.removeEventListener('estilo_card_machines_updated', handleUpdate);
    };
  }, [atelier.id]);

  // Filter available payment methods based on owner configuration
  const availableMethods = useMemo(() => {
    const list: Array<{ 
      id: MetodoPagamento; 
      label: string; 
      sub: string; 
      icon: React.ComponentType<{ className?: string }>; 
      activeClasses: string; 
      iconColor: string 
    }> = [];

    if (methodsConfig.pixHabilitado) {
      list.push({
        id: 'pix',
        label: 'PIX',
        sub: 'QR Code',
        icon: QrCode,
        activeClasses: 'bg-[#25D366]/20 border-[#25D366] text-white shadow-lg shadow-[#25D366]/20',
        iconColor: 'text-[#25D366]',
      });
    }

    if (methodsConfig.cartaoDebitoHabilitado) {
      list.push({
        id: 'cartao_debito',
        label: 'DÉBITO',
        sub: 'Maquininha',
        icon: CreditCard,
        activeClasses: 'bg-[#F2CA50]/20 border-[#F2CA50] text-white shadow-lg shadow-[#F2CA50]/20',
        iconColor: 'text-[#F2CA50]',
      });
    }

    if (methodsConfig.cartaoCreditoHabilitado) {
      list.push({
        id: 'cartao_credito',
        label: 'CRÉDITO',
        sub: 'Parcelado',
        icon: CreditCard,
        activeClasses: 'bg-[#F2CA50]/20 border-[#F2CA50] text-white shadow-lg shadow-[#F2CA50]/20',
        iconColor: 'text-[#F2CA50]',
      });
    }

    if (methodsConfig.tapOnPhoneHabilitado) {
      list.push({
        id: 'tap_on_phone',
        label: 'CELULAR NFC',
        sub: 'Tap to Pay',
        icon: Radio,
        activeClasses: 'bg-gradient-to-b from-cyan-950/60 to-black border-cyan-400 text-white shadow-lg shadow-cyan-500/20',
        iconColor: 'text-cyan-400 animate-pulse',
      });
    }

    if (methodsConfig.dinheiroHabilitado) {
      list.push({
        id: 'dinheiro',
        label: 'DINHEIRO',
        sub: 'Com Troco',
        icon: Banknote,
        activeClasses: 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/20',
        iconColor: 'text-amber-400',
      });
    }

    return list;
  }, [methodsConfig]);

  // Ensure selected method is one of the available methods
  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.some(m => m.id === metodoPagamento)) {
      const preferred = availableMethods.find(m => m.id === methodsConfig.metodoPadrao);
      setMetodoPagamento(preferred ? preferred.id : availableMethods[0].id);
    }
  }, [availableMethods, metodoPagamento, methodsConfig.metodoPadrao]);

  // Dynamic Grid classes according to count of enabled methods
  const gridLayoutClass = useMemo(() => {
    const count = availableMethods.length;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
    return 'grid-cols-2 sm:grid-cols-5';
  }, [availableMethods.length]);

  // Calculations
  const valorProdutos = useMemo(() => {
    return addedProducts.reduce((sum, p) => sum + p.price, 0);
  }, [addedProducts]);

  const totalGeral = useMemo(() => {
    return valorServico + valorProdutos;
  }, [valorServico, valorProdutos]);

  const troco = useMemo(() => {
    return valorRecebido > totalGeral ? valorRecebido - totalGeral : 0;
  }, [valorRecebido, totalGeral]);

  const selectedMachine = useMemo(() => {
    return machines.find(m => m.id === selectedMachineId) || defaultMachine;
  }, [machines, selectedMachineId, defaultMachine]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Web Audio feedback for Tap to Pay / NFC
  const playBeep = (freq: number = 1000, duration: number = 0.12) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  // Add Product Chips
  const handleAddQuickProduct = (name: string, price: number) => {
    setAddedProducts(prev => [...prev, { name, price }]);
  };

  const handleRemoveProduct = (index: number) => {
    setAddedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomProduct = () => {
    if (!customProductName.trim() || customProductPrice <= 0) return;
    setAddedProducts(prev => [...prev, { name: customProductName.trim(), price: customProductPrice }]);
    setCustomProductName('');
    setCustomProductPrice(0);
    setShowCustomProductInput(false);
  };

  // Copy Pix Key
  const handleCopyPixKey = () => {
    if (!pixConfig.chaveValor) return;
    navigator.clipboard.writeText(pixConfig.chaveValor);
    setCopiedKey(true);
    setToastMessage('Chave Pix copiada com sucesso!');
    setTimeout(() => {
      setCopiedKey(false);
      setToastMessage(null);
    }, 2500);
  };

  // Copy Copia e Cola EMV
  const handleCopyPixPayload = () => {
    const payload = pixRepository.generatePixCopiaECola(pixConfig, totalGeral, item.service);
    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    setToastMessage('Código Pix Copia e Cola copiado!');
    setTimeout(() => {
      setCopiedPayload(false);
      setToastMessage(null);
    }, 2500);
  };

  // Send Pix via WhatsApp to client
  const handleSendPixWhatsApp = async () => {
    if (!item.phone) {
      setToastMessage('Cliente não possui telefone WhatsApp cadastrado.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsSendingPixWhatsApp(true);
    try {
      const payload = pixRepository.generatePixCopiaECola(pixConfig, totalGeral, item.service);
      const msg = `Olá *${item.clientName}*! Seguem os dados para pagamento do seu atendimento no *${atelier.nome_negocio}*:\n\n` +
        `✂️ *Serviço:* ${item.service}\n` +
        `💰 *Valor Total:* ${formatCurrency(totalGeral)}\n` +
        `🔑 *Chave Pix (${pixConfig.chaveTipo.toUpperCase()}):* ${pixConfig.chaveValor}\n` +
        `👤 *Titular:* ${pixConfig.beneficiario}\n\n` +
        `*Código Copia e Cola Pix:*\n${payload}\n\n` +
        `Assim que efetuar o pagamento nos avise. Obrigado pela preferência! 💈⚡`;

      await whatsappRepository.sendMessage({
        atelierId: atelier.id,
        recipientName: item.clientName,
        recipientPhone: item.phone,
        type: 'confirmacao',
        serviceName: item.service,
        customMessage: msg,
      });

      setToastMessage(`Cobrança Pix enviada com sucesso para ${item.clientName} via WhatsApp!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setToastMessage('Falha ao enviar cobrança via WhatsApp.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSendingPixWhatsApp(false);
    }
  };

  // POS Machine Sync Simulation
  const handleSendToPos = () => {
    if (!selectedMachine) return;
    setIsSendingToPos(true);
    setPosStatus('enviando');

    setTimeout(() => {
      setPosStatus('aguardando_cartao');
      setIsSendingToPos(false);
    }, 1200);
  };

  const handleSimulatePosApproval = () => {
    setPosStatus('aprovado');
    const autoNsu = 'POS' + Math.floor(100000 + Math.random() * 900000);
    setNsuAutorizacao(autoNsu);
    playBeep(950, 0.1);
    setTimeout(() => playBeep(1400, 0.18), 120);
    if ('vibrate' in navigator) {
      navigator.vibrate?.([60, 40, 80]);
    }
  };

  // Tap on Phone (NFC Celular) Simulation
  const handleStartTapOnPhone = () => {
    setTapStatus('aguardando_aproximacao');

    setTimeout(() => {
      setTapStatus('lendo_chip');
      playBeep(880, 0.08);

      setTimeout(() => {
        setTapStatus('aprovado');
        const autoNsu = 'NFC' + Math.floor(100000 + Math.random() * 900000);
        setNsuAutorizacao(autoNsu);
        playBeep(1200, 0.1);
        setTimeout(() => playBeep(1600, 0.2), 120);
        if ('vibrate' in navigator) {
          navigator.vibrate?.([100, 50, 150]);
        }
      }, 1000);
    }, 1400);
  };

  // Complete and Receive
  const handleCompleteAndReceive = async () => {
    const serviceDescription = addedProducts.length > 0 
      ? `${item.service} + ${addedProducts.map(p => p.name).join(', ')}`
      : item.service;

    const tx = await queueRepository.finishAndRecordTransaction(
      item.id,
      atelier.id,
      item.clientName,
      serviceDescription,
      totalGeral,
      {
        metodo_pagamento: metodoPagamento,
        maquininha_id: (metodoPagamento === 'cartao_credito' || metodoPagamento === 'cartao_debito') ? selectedMachine?.id : undefined,
        maquininha_nome: (metodoPagamento === 'cartao_credito' || metodoPagamento === 'cartao_debito') ? selectedMachine?.nome : (metodoPagamento === 'tap_on_phone' ? 'Celular NFC Tap on Phone' : undefined),
        nsu_autorizacao: nsuAutorizacao || undefined,
        parcelas: metodoPagamento === 'cartao_credito' ? parcelas : 1,
      }
    );

    // Broadcast push
    broadcastRealtimeEvent({
      atelierId: atelier.id,
      type: 'slot_opened',
      title: '🚪 Vaga Aberta na Cadeira!',
      message: `Uma vaga acabou de abrir na cadeira do ${atelier.nome_negocio}!`,
    });

    // Send receipt via WhatsApp if phone exists
    let receiptMessage = '';
    if (item.phone) {
      const formaFormatada = metodoPagamento === 'pix' ? 'Pix Instantâneo' :
        metodoPagamento === 'cartao_credito' ? `Cartão de Crédito (${parcelas}x)` :
        metodoPagamento === 'cartao_debito' ? 'Cartão de Débito' :
        metodoPagamento === 'tap_on_phone' ? 'Aproximação NFC no Celular' : 'Dinheiro em Espécie';

      receiptMessage = `🧾 *COMPROVANTE DE PAGAMENTO*\n` +
        `💈 *${atelier.nome_negocio}*\n` +
        `✂️ *Cliente:* ${item.clientName}\n` +
        `🏷️ *Serviço:* ${serviceDescription}\n` +
        `💳 *Forma de Pagamento:* ${formaFormatada}\n` +
        (selectedMachine && (metodoPagamento === 'cartao_credito' || metodoPagamento === 'cartao_debito') ? `📟 *Maquininha:* ${selectedMachine.nome}\n` : '') +
        (nsuAutorizacao ? `🔢 *NSU / Aut.:* ${nsuAutorizacao}\n` : '') +
        `💰 *Valor Pago:* ${formatCurrency(totalGeral)}\n` +
        `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
        `Obrigado pela preferência e volte sempre! ✂️⚡`;

      try {
        await whatsappRepository.sendMessage({
          atelierId: atelier.id,
          recipientName: item.clientName,
          recipientPhone: item.phone,
          type: 'confirmacao',
          serviceName: item.service,
          customMessage: receiptMessage,
        });
      } catch {
        // Non-fatal
      }
    }

    onSuccess(tx, receiptMessage);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#1C1C1B] border-2 border-[#F2CA50]/40 rounded-3xl shadow-2xl overflow-hidden my-auto animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-black via-[#1C1C1B] to-black border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/40 flex items-center justify-center text-[#F2CA50] shrink-0 font-heading font-black text-lg shadow-inner">
              {item.clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-black uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30">
                  FINALIZAR ATENDIMENTO
                </span>
                {item.phone && (
                  <span className="text-[11px] text-white/50 font-mono">
                    {item.phone}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                {item.clientName}
              </h2>
              <p className="text-xs text-[#F2CA50] font-bold">
                {item.service}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          
          {/* Toast Alert */}
          {toastMessage && (
            <div className="p-3.5 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Section 1: Valor do Serviço & Produtos Adicionais (Upsell) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#F2CA50]">
                  VALOR DO SERVIÇO
                </label>
                <span className="text-xs text-white/50">Corte, barba ou pacote contratado</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 px-3.5 py-2 rounded-xl border border-white/10 w-fit">
                <span className="text-base font-black text-[#F2CA50]">R$</span>
                <input
                  type="number"
                  step="0.50"
                  value={valorServico}
                  onChange={(e) => setValorServico(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 text-right bg-transparent text-white font-heading font-black text-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Upsell Products */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
                  ADICIONAR PRODUTOS (VENDA ADICIONAL)
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomProductInput(!showCustomProductInput)}
                  className="text-[11px] text-[#F2CA50] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Outro Produto</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQuickProduct('Pomada Modeladora', 35.0)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#F2CA50]/15 hover:border-[#F2CA50]/40 hover:text-[#F2CA50] text-xs font-bold text-white/80 border border-white/5 transition-all cursor-pointer active:scale-95"
                >
                  + Pomada (R$ 35,00)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickProduct('Óleo para Barba', 25.0)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#F2CA50]/15 hover:border-[#F2CA50]/40 hover:text-[#F2CA50] text-xs font-bold text-white/80 border border-white/5 transition-all cursor-pointer active:scale-95"
                >
                  + Óleo (R$ 25,00)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickProduct('Shampoo Especial', 40.0)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#F2CA50]/15 hover:border-[#F2CA50]/40 hover:text-[#F2CA50] text-xs font-bold text-white/80 border border-white/5 transition-all cursor-pointer active:scale-95"
                >
                  + Shampoo (R$ 40,00)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickProduct('Loção Pós-Barba', 30.0)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#F2CA50]/15 hover:border-[#F2CA50]/40 hover:text-[#F2CA50] text-xs font-bold text-white/80 border border-white/5 transition-all cursor-pointer active:scale-95"
                >
                  + Loção (R$ 30,00)
                </button>
              </div>

              {/* Custom Product Inputs */}
              {showCustomProductInput && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row gap-2 items-center animate-slideDown">
                  <input
                    type="text"
                    placeholder="Nome do produto (ex: Cerveja Artesanal)"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black text-white text-xs border border-white/10 focus:border-[#F2CA50] focus:outline-none"
                  />
                  <div className="flex items-center gap-1 w-full sm:w-32 bg-black px-2 py-1.5 rounded-lg border border-white/10">
                    <span className="text-xs text-[#F2CA50] font-bold">R$</span>
                    <input
                      type="number"
                      step="1.00"
                      placeholder="0,00"
                      value={customProductPrice || ''}
                      onChange={(e) => setCustomProductPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-white text-xs text-right focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomProduct}
                    className="px-3 py-1.5 rounded-lg bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              )}

              {/* Added products chip list */}
              {addedProducts.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider block">Produtos incluídos:</span>
                  <div className="flex flex-wrap gap-2">
                    {addedProducts.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>{p.name} (+{formatCurrency(p.price)})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="hover:text-red-400 cursor-pointer font-black ml-0.5"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total Highlight Bar */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-black via-[#1C1C1B] to-black border-2 border-[#F2CA50] flex items-center justify-between shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                  TOTAL A RECEBER:
                </span>
                <span className="text-[11px] text-white/40">
                  {addedProducts.length > 0 ? `Serviço (${formatCurrency(valorServico)}) + Produtos (${formatCurrency(valorProdutos)})` : 'Serviço avulso'}
                </span>
              </div>
              <div className="font-heading text-3xl font-black text-[#F2CA50] drop-shadow-md">
                {formatCurrency(totalGeral)}
              </div>
            </div>
          </div>

          {/* Section 2: Modos de Pagamento Habilitados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="block text-[11px] font-black uppercase tracking-widest text-white/60">
                  ESCOLHA O MODO DE PAGAMENTO
                </label>
                <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  {availableMethods.length} habilitado(s)
                </span>
              </div>

              {/* Botão para o dono configurar o que aparece */}
              <button
                type="button"
                onClick={() => setShowPaymentSettings(true)}
                className="text-xs text-[#F2CA50] hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Habilitar ou desabilitar métodos de pagamento visíveis e gerenciar maquininhas"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Configurar Métodos & Maquininhas</span>
              </button>
            </div>

            {/* Se o dono desabilitou todos */}
            {availableMethods.length === 0 ? (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-2">
                <p className="text-xs text-red-300 font-bold">
                  Nenhum método de pagamento está habilitado pelo proprietário.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPaymentSettings(true)}
                  className="px-4 py-2 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer"
                >
                  Habilitar Métodos de Pagamento
                </button>
              </div>
            ) : (
              /* Payment Method Selector Grid - Only Enabled Methods Appear */
              <div className={`grid ${gridLayoutClass} gap-2`}>
                {availableMethods.map((method) => {
                  const isSelected = metodoPagamento === method.id;
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setMetodoPagamento(method.id)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? `${method.activeClasses} scale-[1.02]`
                          : 'bg-black/40 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? method.iconColor : 'text-white/40'}`} />
                      <span className="font-heading font-black text-xs uppercase tracking-wider">{method.label}</span>
                      <span className="text-[9px] font-bold opacity-75">{method.sub}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Painel Específico do Modo Selecionado */}

          {/* PAINEL 1: PIX COM QR CODE AO VIVO */}
          {metodoPagamento === 'pix' && methodsConfig.pixHabilitado && (
            <div className="p-5 rounded-2xl bg-[#1C1C1B] border-2 border-[#25D366]/40 space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-white text-base">
                      QR Code Pix do Atendimento
                    </h4>
                    <p className="text-[11px] text-white/50">
                      Chave {pixConfig.chaveTipo.toUpperCase()}: <span className="text-white font-mono font-bold">{pixConfig.chaveValor}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    pixStatus === 'confirmado'
                      ? 'bg-green-500/20 text-green-400 border-green-500/40'
                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse'
                  }`}>
                    {pixStatus === 'confirmado' ? '✓ Pix Confirmado' : 'Aguardando Pagamento'}
                  </span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                <div className="p-4 bg-white rounded-2xl border-4 border-[#25D366] shadow-xl flex flex-col items-center shrink-0">
                  <div className="w-40 h-40 bg-black flex flex-col justify-between p-2.5 rounded-xl relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white" />
                      </div>
                      <div className="text-[10px] font-bold text-white/70">PIX</div>
                      <div className="w-10 h-10 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-1 my-auto opacity-90 px-1">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-[1px] ${i % 2 === 0 ? 'bg-white' : 'bg-white/40'}`} />
                      ))}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="w-10 h-10 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white" />
                      </div>
                      <div className="text-[9px] font-mono text-[#F2CA50] font-black">
                        {formatCurrency(totalGeral)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-black uppercase tracking-wider mt-2.5">
                    ESCANEAR COM BANCO
                  </span>
                </div>

                {/* Pix Action Buttons */}
                <div className="space-y-3 w-full max-w-sm">
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1">
                    <div className="text-[11px] text-white/50">Beneficiário Cadastrado:</div>
                    <div className="text-xs font-bold text-white">{pixConfig.beneficiario}</div>
                    <div className="text-[10px] text-white/40">{pixConfig.cidade} • Banco Central do Brasil</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPixKey}
                      className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#F2CA50]" />
                      <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPixPayload}
                      className="py-2.5 px-3 rounded-xl bg-[#F2CA50]/15 hover:bg-[#F2CA50]/25 text-[#F2CA50] text-xs font-bold border border-[#F2CA50]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{copiedPayload ? 'Código Copiado!' : 'Copia e Cola'}</span>
                    </button>
                  </div>

                  {item.phone && (
                    <button
                      type="button"
                      onClick={handleSendPixWhatsApp}
                      disabled={isSendingPixWhatsApp}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingPixWhatsApp ? 'Enviando...' : 'Cobrar no WhatsApp do Cliente'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setPixStatus('confirmado');
                      playBeep(1200, 0.15);
                      setToastMessage('Pix identificado com sucesso pelo webhook!');
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simular Notificação de Pix Pago</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAINEL 2: CARTÃO CRÉDITO OU DÉBITO (MAQUININHA VINCULADA) */}
          {((metodoPagamento === 'cartao_credito' && methodsConfig.cartaoCreditoHabilitado) ||
            (metodoPagamento === 'cartao_debito' && methodsConfig.cartaoDebitoHabilitado)) && (
            <div className="p-5 rounded-2xl bg-[#1C1C1B] border-2 border-[#F2CA50]/40 space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50]">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-white text-base">
                      {metodoPagamento === 'cartao_credito' ? 'Pagamento em Cartão de Crédito' : 'Pagamento em Cartão de Débito'}
                    </h4>
                    <p className="text-[11px] text-white/50">
                      Selecione a maquininha do balcão para processar o valor
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPaymentSettings(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#F2CA50] border border-white/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gerenciar Maquininhas</span>
                </button>
              </div>

              {/* Selector de Maquininha */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/50">
                  MAQUININHA DE CARTÃO VINCULADA
                </label>
                
                {machines.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-dashed border-white/20 text-center space-y-2">
                    <p className="text-xs text-white/60">Nenhuma maquininha de cartão cadastrada.</p>
                    <button
                      type="button"
                      onClick={() => setShowPaymentSettings(true)}
                      className="px-4 py-2 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer"
                    >
                      Cadastrar Primeira Maquininha
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {machines.map((m) => {
                      const isSelected = (selectedMachine?.id === m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMachineId(m.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#F2CA50]/15 border-[#F2CA50] text-white shadow-md'
                              : 'bg-black/50 border-white/5 text-white/60 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#F2CA50] text-black font-black' : 'bg-white/10 text-white/60'
                            }`}>
                              {m.tipoConexao === 'wifi' ? <Wifi className="w-4 h-4" /> : <Bluetooth className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-heading font-bold text-xs truncate text-white">
                                {m.nome}
                              </div>
                              <div className="text-[10px] text-white/40 truncate flex items-center gap-1 mt-0.5">
                                <span className="uppercase font-semibold">{m.marca}</span>
                                <span>•</span>
                                <span>{m.modelo}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {m.conectada ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Conectada" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-red-400" title="Desconectada" />
                            )}
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#F2CA50]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Parcelamento para Crédito */}
              {metodoPagamento === 'cartao_credito' && (
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">Opções de Parcelamento:</span>
                    <span className="text-[10px] text-white/40">Selecione em quantas vezes o cliente deseja passar o cartão</span>
                  </div>
                  <select
                    value={parcelas}
                    onChange={(e) => setParcelas(parseInt(e.target.value) || 1)}
                    className="px-3 py-2 rounded-xl bg-black text-[#F2CA50] text-xs font-bold border border-white/20 focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1x de {formatCurrency(totalGeral)} (À vista)</option>
                    <option value={2}>2x de {formatCurrency(totalGeral / 2)}</option>
                    <option value={3}>3x de {formatCurrency(totalGeral / 3)}</option>
                    <option value={4}>4x de {formatCurrency(totalGeral / 4)}</option>
                    <option value={5}>5x de {formatCurrency(totalGeral / 5)}</option>
                    <option value={6}>6x de {formatCurrency(totalGeral / 6)}</option>
                  </select>
                </div>
              )}

              {/* Status e Envio de Comando para a Maquininha */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#F2CA50]" />
                    <span className="text-xs font-bold text-white">Comunicação Direta com o Terminal POS:</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    posStatus === 'aprovado' ? 'bg-emerald-500/20 text-emerald-400' :
                    posStatus === 'aguardando_cartao' ? 'bg-amber-500/20 text-amber-300 animate-pulse' :
                    posStatus === 'enviando' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/40'
                  }`}>
                    {posStatus === 'aprovado' ? '✓ Transação Aprovada' :
                     posStatus === 'aguardando_cartao' ? 'Aguardando Cartão...' :
                     posStatus === 'enviando' ? 'Enviando...' : 'Pronta'}
                  </span>
                </div>

                {posStatus === 'idle' && (
                  <button
                    type="button"
                    onClick={handleSendToPos}
                    disabled={isSendingToPos || !selectedMachine}
                    className="w-full py-3 px-4 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Wifi className="w-4 h-4" />
                    <span>Enviar {formatCurrency(totalGeral)} para o Visor da Maquininha</span>
                  </button>
                )}

                {posStatus === 'enviando' && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center gap-2 text-xs text-blue-300 font-bold">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Conectando à {selectedMachine?.nome} via {selectedMachine?.tipoConexao.toUpperCase()}...</span>
                  </div>
                )}

                {posStatus === 'aguardando_cartao' && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 animate-ping" />
                        <span>Terminal pronto: Peça para o cliente inserir ou aproximar o cartão.</span>
                      </div>
                      <span className="font-mono">{formatCurrency(totalGeral)}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSimulatePosApproval}
                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-heading font-black uppercase cursor-pointer"
                      >
                        ✓ Simular Aprovação no Terminal
                      </button>
                      <button
                        type="button"
                        onClick={() => setPosStatus('idle')}
                        className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {posStatus === 'aprovado' && (
                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-emerald-400">Transação Autorizada com Sucesso!</div>
                        <div className="text-[10px] text-white/50 font-mono">NSU Autorização: {nsuAutorizacao}</div>
                      </div>
                    </div>
                    <span className="text-xs font-heading font-black text-emerald-400">{formatCurrency(totalGeral)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAINEL 3: CELULAR COMO MAQUININHA (TAP ON PHONE / NFC) */}
          {metodoPagamento === 'tap_on_phone' && methodsConfig.tapOnPhoneHabilitado && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/40 via-[#1C1C1B] to-black border-2 border-cyan-400/50 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-400/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-white text-base">
                      Celular como Maquininha (Tap on Phone)
                    </h4>
                    <p className="text-[11px] text-cyan-200/70">
                      Receba pagamentos por aproximação NFC direto no seu celular
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-heading font-black uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                  NFC Contactless
                </span>
              </div>

              {/* Graphic Simulator of NFC Phone */}
              <div className="py-6 px-4 rounded-2xl bg-black/60 border border-cyan-400/20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className={`w-28 h-28 rounded-full border-2 border-cyan-400/20 absolute ${tapStatus === 'aguardando_aproximacao' ? 'animate-ping' : ''}`} />
                  <div className="w-20 h-20 rounded-full bg-cyan-500/10 border-2 border-cyan-400/40 flex items-center justify-center">
                    <Smartphone className="w-9 h-9 text-cyan-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-heading font-black text-lg text-white">
                    {tapStatus === 'idle' && 'Pronto para Leitura por Aproximação'}
                    {tapStatus === 'aguardando_aproximacao' && 'Aproxime o cartão na traseira do celular...'}
                    {tapStatus === 'lendo_chip' && 'Lendo dados do chip NFC...'}
                    {tapStatus === 'aprovado' && '✓ Pagamento NFC Aprovado!'}
                  </div>
                  <p className="text-xs text-white/50 max-w-xs">
                    Aceita cartões físicos Visa, Mastercard, Elo e carteiras digitais (Apple Pay, Google Pay e Samsung Pay).
                  </p>
                </div>

                {tapStatus === 'idle' && (
                  <button
                    type="button"
                    onClick={handleStartTapOnPhone}
                    className="py-3 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/20 transition-transform active:scale-95"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Iniciar Leitura por Aproximação ({formatCurrency(totalGeral)})</span>
                  </button>
                )}

                {tapStatus === 'aguardando_aproximacao' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 animate-pulse">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Aguardando cliente aproximar cartão ou smartwatch...</span>
                  </div>
                )}

                {tapStatus === 'lendo_chip' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-yellow-300">
                    <Sparkles className="w-4 h-4 animate-bounce" />
                    <span>Processando criptografia do chip EMV Contactless...</span>
                  </div>
                )}

                {tapStatus === 'aprovado' && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-emerald-400">Aprovado via Tap on Phone!</div>
                      <div className="text-[10px] text-white/60 font-mono">NSU NFC: {nsuAutorizacao}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAINEL 4: DINHEIRO EM ESPÉCIE */}
          {metodoPagamento === 'dinheiro' && methodsConfig.dinheiroHabilitado && (
            <div className="p-5 rounded-2xl bg-[#1C1C1B] border-2 border-amber-400/40 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-white text-base">
                    Pagamento em Dinheiro (Cálculo de Troco)
                  </h4>
                  <p className="text-[11px] text-white/50">
                    Digite a quantia entregue pelo cliente para calcular o troco exato
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                  VALOR RECEBIDO DO CLIENTE
                </label>
                <div className="flex items-center gap-2 bg-black/60 px-4 py-3 rounded-xl border border-white/10 focus-within:border-amber-400">
                  <span className="text-xl font-black text-amber-400">R$</span>
                  <input
                    type="number"
                    step="1.00"
                    placeholder="0,00"
                    value={valorRecebido || ''}
                    onChange={(e) => setValorRecebido(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-heading font-black text-2xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Botões Rápidos de Dinheiro */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setValorRecebido(totalGeral)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 cursor-pointer"
                >
                  Valor Exato ({formatCurrency(totalGeral)})
                </button>
                <button
                  type="button"
                  onClick={() => setValorRecebido(50)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 cursor-pointer"
                >
                  R$ 50,00
                </button>
                <button
                  type="button"
                  onClick={() => setValorRecebido(100)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 cursor-pointer"
                >
                  R$ 100,00
                </button>
                <button
                  type="button"
                  onClick={() => setValorRecebido(200)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 cursor-pointer"
                >
                  R$ 200,00
                </button>
              </div>

              {/* Troco Result */}
              {troco > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    TROCO A DEVOLVER:
                  </span>
                  <span className="font-heading text-2xl font-black text-emerald-300">
                    {formatCurrency(troco)}
                  </span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 bg-black/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold uppercase cursor-pointer transition-colors"
          >
            CANCELAR
          </button>

          <button
            type="button"
            onClick={handleCompleteAndReceive}
            disabled={availableMethods.length === 0}
            className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-[#F2CA50]/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>CONCLUIR E RECEBER ({formatCurrency(totalGeral)})</span>
          </button>
        </div>

      </div>

      {/* MODAL DE GERENCIAMENTO DE MÉTODOS & MAQUININHAS */}
      {showPaymentSettings && (
        <PaymentSettingsModal
          atelier={atelier}
          onClose={() => {
            setShowPaymentSettings(false);
            setMethodsConfig(paymentMethodsRepository.getConfig(atelier.id));
            setMachines(cardMachineRepository.getMachines(atelier.id));
          }}
          onUpdated={() => {
            setMethodsConfig(paymentMethodsRepository.getConfig(atelier.id));
            setMachines(cardMachineRepository.getMachines(atelier.id));
          }}
        />
      )}

    </div>
  );
};
