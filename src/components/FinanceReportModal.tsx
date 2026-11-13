import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  Zap, 
  Wallet, 
  TrendingUp, 
  Receipt, 
  DollarSign, 
  Users, 
  Calendar,
  Sparkles,
  BarChart3,
  FileDown,
  Loader2,
  CheckCircle2,
  Clock,
  Star,
  Gift,
  Flame,
  AlertCircle,
  MessageSquare,
  QrCode,
  Copy,
  Check,
  Send,
  Sliders,
  RefreshCw,
  CreditCard,
  Smartphone,
  Radio,
  Banknote,
  FileText,
  X
} from 'lucide-react';
import { Transaction, DailyTrendPoint, PixConfig, PaymentMethodsConfig, MetodoPagamento } from '../types';
import { financeRepository, atelierRepository, clientRepository, staffProductivityRepository, whatsappRepository, pixRepository, paymentMethodsRepository } from '../services/store';
import {
  generateConsolidatedFinancePDF,
  filterTransactionsByPeriod,
  getPeriodLabel,
  PdfReportPeriod,
} from '../services/pdfReportService';
import { AdminTrendsDashboard } from './AdminTrendsDashboard';

interface FinanceReportModalProps {
  atelierId: string;
  onClose: () => void;
}

export const FinanceReportModal: React.FC<FinanceReportModalProps> = ({
  atelierId,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trendsData, setTrendsData] = useState<DailyTrendPoint[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'graficos' | 'extrato' | 'inadimplencia' | 'pix' | 'config_pagamentos'>('geral');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfPeriod, setPdfPeriod] = useState<PdfReportPeriod>('mes_atual');
  const [pdfIncludeMonthlyRevenue, setPdfIncludeMonthlyRevenue] = useState(true);
  const [pdfIncludeTeamPerformance, setPdfIncludeTeamPerformance] = useState(true);
  const [pdfIncludeAttendanceHistory, setPdfIncludeAttendanceHistory] = useState(true);
  const [pdfIncludeLoyaltyAndPayments, setPdfIncludeLoyaltyAndPayments] = useState(true);
  const [inadimplenciaToast, setInadimplenciaToast] = useState<string | null>(null);
  const [pixSavedToast, setPixSavedToast] = useState<string | null>(null);
  const [methodsSavedToast, setMethodsSavedToast] = useState<string | null>(null);

  // Payment Methods Configuration State
  const [paymentMethodsConfig, setPaymentMethodsConfig] = useState<PaymentMethodsConfig>(() =>
    paymentMethodsRepository.getConfig(atelierId)
  );

  // Pix and Automatic Reminders state
  const [pixConfig, setPixConfig] = useState<PixConfig>(() => pixRepository.getConfig(atelierId));
  const [simulatorAmount, setSimulatorAmount] = useState<number>(65.00);
  const [copiedPixKey, setCopiedPixKey] = useState(false);
  const [copiedPixPayload, setCopiedPixPayload] = useState(false);
  const [isSendingPixTest, setIsSendingPixTest] = useState(false);

  // Monthly Goal State & Progress
  const [monthlyGoal, setMonthlyGoal] = useState<number>(() => financeRepository.getMonthlyGoal(atelierId));

  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(tx => {
        const d = new Date(tx.data);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, tx) => sum + tx.valor, 0);
  }, [transactions]);

  const monthlyGoalPercentage = Math.min(100, Math.round((currentMonthRevenue / (monthlyGoal || 1)) * 100));

  // Dynamic Pix per attendance modal state
  interface ActivePixModalClientState {
    id?: string;
    name: string;
    service?: string;
    amount: number;
    reason: string;
    phone?: string;
    daysPending?: number;
    chavePix: string;
    chaveTipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
    beneficiario: string;
    isCustomKey: boolean;
  }

  const [activePixModalClient, setActivePixModalClient] = useState<ActivePixModalClientState | null>(null);

  // Dynamic Pix generator per attendance within the 'pix' tab
  const [dynSelectedTxId, setDynSelectedTxId] = useState<string>('manual');
  const [dynAttendanceClient, setDynAttendanceClient] = useState<string>('André Ramos');
  const [dynAttendanceService, setDynAttendanceService] = useState<string>('Corte Degradê Fade + Pomada');
  const [dynAttendanceAmount, setDynAttendanceAmount] = useState<number>(90.00);
  const [dynAttendancePixKey, setDynAttendancePixKey] = useState<string>(() => pixConfig.chaveValor);
  const [dynAttendancePixType, setDynAttendancePixType] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>(() => pixConfig.chaveTipo);
  const [dynAttendanceBeneficiary, setDynAttendanceBeneficiary] = useState<string>(() => pixConfig.beneficiario);
  const [dynIsCustomKey, setDynIsCustomKey] = useState<boolean>(false);
  const [dynAttendancePhone, setDynAttendancePhone] = useState<string>('11999998888');
  const [dynCopiedPayload, setDynCopiedPayload] = useState(false);

  const [delinquentClients, setDelinquentClients] = useState([
    { id: 'del_1', name: 'Arthur Shelby', phone: '11999998888', amount: 120.00, daysPending: 4, reason: 'Serviço de Corte + Barba Pendente', absences: 2 },
    { id: 'del_2', name: 'Lucas Ferreira', phone: '11988887777', amount: 80.00, daysPending: 2, reason: 'Assinatura Mensal em Atraso', absences: 1 },
  ]);

  const reportRef = useRef<HTMLDivElement>(null);
  const atelier = useMemo(() => atelierRepository.getAtelier(atelierId), [atelierId]);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleSavePixConfig = (newConfig: PixConfig) => {
    setPixConfig(newConfig);
    pixRepository.saveConfig(newConfig);
    setPixSavedToast('Configurações de Pix e Lembretes Automáticos salvas com sucesso!');
    setTimeout(() => setPixSavedToast(null), 3000);
  };

  // Sync payment methods configuration with real-time app events
  useEffect(() => {
    const handleSync = () => {
      setPaymentMethodsConfig(paymentMethodsRepository.getConfig(atelierId));
    };
    window.addEventListener('estilo_payment_methods_updated', handleSync);
    return () => window.removeEventListener('estilo_payment_methods_updated', handleSync);
  }, [atelierId]);

  const handleTogglePaymentMethod = (key: keyof Omit<PaymentMethodsConfig, 'atelierId' | 'metodoPadrao'>) => {
    const activeCount = [
      paymentMethodsConfig.pixHabilitado,
      paymentMethodsConfig.cartaoDebitoHabilitado,
      paymentMethodsConfig.cartaoCreditoHabilitado,
      paymentMethodsConfig.tapOnPhoneHabilitado,
      paymentMethodsConfig.dinheiroHabilitado,
    ].filter(Boolean).length;

    // Safeguard: do not allow disabling all methods
    if (paymentMethodsConfig[key] && activeCount <= 1) {
      setMethodsSavedToast('Pelo menos 1 método de pagamento deve permanecer ativo no estabelecimento.');
      setTimeout(() => setMethodsSavedToast(null), 3500);
      return;
    }

    const updated: PaymentMethodsConfig = {
      ...paymentMethodsConfig,
      [key]: !paymentMethodsConfig[key],
    };

    // If disabled method was the default, automatically pick the first available
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

    setPaymentMethodsConfig(updated);
    paymentMethodsRepository.saveConfig(updated);
    window.dispatchEvent(new Event('estilo_payment_methods_updated'));
    window.dispatchEvent(new Event('estilo_store_updated'));
    setMethodsSavedToast('Métodos de pagamento atualizados! Refletindo em tempo real no checkout.');
    setTimeout(() => setMethodsSavedToast(null), 3000);
  };

  const handleSetDefaultMethod = (metodo: MetodoPagamento) => {
    const updated: PaymentMethodsConfig = {
      ...paymentMethodsConfig,
      metodoPadrao: metodo,
    };
    setPaymentMethodsConfig(updated);
    paymentMethodsRepository.saveConfig(updated);
    window.dispatchEvent(new Event('estilo_payment_methods_updated'));
    window.dispatchEvent(new Event('estilo_store_updated'));
    setMethodsSavedToast(`Método padrão alterado para ${metodo.toUpperCase().replace('_', ' ')}.`);
    setTimeout(() => setMethodsSavedToast(null), 3000);
  };

  const getFormattedReminderMessage = (
    clientName: string, 
    serviceName: string, 
    amount: number, 
    daysPending: number,
    customPixKey?: string,
    customPixType?: string,
    customBeneficiary?: string
  ) => {
    const template = pixConfig.templateLembrete || 'Olá {{nome}}! Lembramos que o pagamento de {{servico}} no valor de {{valor}} venceu há {{dias_atraso}} dia(s). Para regularizar sem encargos, utilize nossa chave Pix ({{chave_tipo}}): *{{chave_pix}}* - Titular: *{{beneficiario}}*. Se já efetuou o pagamento, favor desconsiderar. 💈✂️';
    const keyToUse = customPixKey || pixConfig.chaveValor;
    const typeToUse = (customPixType || pixConfig.chaveTipo).toUpperCase();
    const beneficiaryToUse = customBeneficiary || pixConfig.beneficiario;

    return template
      .replace(/{{nome}}/g, clientName)
      .replace(/{{servico}}/g, serviceName)
      .replace(/{{valor}}/g, formatCurrency(amount))
      .replace(/{{dias_atraso}}/g, String(daysPending))
      .replace(/{{chave_pix}}/g, keyToUse)
      .replace(/{{chave_tipo}}/g, typeToUse)
      .replace(/{{beneficiario}}/g, beneficiaryToUse)
      .replace(/{{cidade}}/g, pixConfig.cidade)
      .replace(/{{atelier}}/g, atelier?.nome_negocio || 'Barbearia');
  };

  const handleSendDelinquentWhatsApp = async (
    client: typeof delinquentClients[0],
    customKey?: string,
    customType?: string,
    customBeneficiary?: string
  ) => {
    try {
      const customMsg = getFormattedReminderMessage(
        client.name,
        client.reason,
        client.amount,
        client.daysPending,
        customKey,
        customType,
        customBeneficiary
      );
      await whatsappRepository.sendMessage({
        atelierId,
        recipientName: client.name,
        recipientPhone: client.phone,
        type: 'lembrete',
        serviceName: client.reason,
        customMessage: customMsg,
      });
      setInadimplenciaToast(`Lembrete com Pix enviado com sucesso para ${client.name} via WhatsApp!`);
      setTimeout(() => setInadimplenciaToast(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAllDelinquentReminders = async () => {
    try {
      for (const client of delinquentClients) {
        const customMsg = getFormattedReminderMessage(
          client.name,
          client.reason,
          client.amount,
          client.daysPending
        );
        await whatsappRepository.sendMessage({
          atelierId,
          recipientName: client.name,
          recipientPhone: client.phone,
          type: 'lembrete',
          serviceName: client.reason,
          customMessage: customMsg,
        });
      }
      setInadimplenciaToast(`Lembretes com chave Pix disparados para todos os ${delinquentClients.length} clientes inadimplentes!`);
      setTimeout(() => setInadimplenciaToast(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendPixTest = async () => {
    setIsSendingPixTest(true);
    try {
      const targetPhone = '11999998888';
      const testMsg = getFormattedReminderMessage(
        'Administrador (Você)',
        'Corte Fade + Barboterapia',
        simulatorAmount,
        pixConfig.diasAposVencimento
      );
      await whatsappRepository.sendMessage({
        atelierId,
        recipientName: 'Administrador (Você)',
        recipientPhone: targetPhone,
        type: 'lembrete',
        serviceName: 'Lembrete de Pagamento Pix',
        customMessage: testMsg,
      });
      setPixSavedToast(`Prévia de lembrete com chave Pix enviada para o WhatsApp ${targetPhone}!`);
      setTimeout(() => setPixSavedToast(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingPixTest(false);
    }
  };

  const loadData = () => {
    setTransactions(financeRepository.getTransactions(atelierId));
    setTrendsData(financeRepository.get30DaysTrends(atelierId));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('estilo_store_updated', handleUpdate);
    return () => window.removeEventListener('estilo_store_updated', handleUpdate);
  }, [atelierId]);

  const stats = financeRepository.calculateStats(transactions);

  // Summary for 30 days trends
  const trendsSummary = useMemo(() => {
    let totalReceita = 0;
    let totalVolume = 0;
    for (const d of trendsData) {
      totalReceita += d.receita;
      totalVolume += d.volume;
    }
    const ticketMedio = totalVolume > 0 ? totalReceita / totalVolume : 0;
    return { totalReceita, totalVolume, ticketMedio };
  }, [trendsData]);

  const loyaltySummary = useMemo(() => {
    return clientRepository.getLoyaltySummary(atelierId);
  }, [atelierId]);

  const staffStats = useMemo(() => {
    return staffProductivityRepository.getStats(atelierId);
  }, [atelierId]);



  const pdfPreviewTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, pdfPeriod),
    [transactions, pdfPeriod]
  );

  const pdfPreviewRevenue = useMemo(
    () => pdfPreviewTransactions.reduce((sum, tx) => sum + tx.valor, 0),
    [pdfPreviewTransactions]
  );

  // Export Consolidated PDF Handler
  const handleExportPDF = async () => {
    if (
      !pdfIncludeMonthlyRevenue &&
      !pdfIncludeTeamPerformance &&
      !pdfIncludeAttendanceHistory &&
      !pdfIncludeLoyaltyAndPayments
    ) {
      setExportErrorMessage('Selecione pelo menos uma seção para incluir no relatório PDF.');
      return;
    }

    setIsExporting(true);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 120));

      const fileName = generateConsolidatedFinancePDF({
        atelier: atelier || undefined,
        period: pdfPeriod,
        includeMonthlyRevenue: pdfIncludeMonthlyRevenue,
        includeTeamPerformance: pdfIncludeTeamPerformance,
        includeAttendanceHistory: pdfIncludeAttendanceHistory,
        includeLoyaltyAndPayments: pdfIncludeLoyaltyAndPayments,
        transactions,
        staffStats,
        monthlyGoal,
        todayRevenue: stats.today,
        currentMonthRevenue,
        trendsData,
        loyaltySummary,
      });

      setIsPdfModalOpen(false);
      setExportSuccessMessage(`Relatório PDF consolidado baixado: ${fileName}`);
      setTimeout(() => setExportSuccessMessage(null), 6000);
    } catch (err) {
      console.error('Falha ao exportar PDF financeiro:', err);
      setExportErrorMessage('Não foi possível gerar o arquivo PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 overflow-y-auto">
      <div className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
              </button>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <div>
                <span className="font-heading font-black text-[11px] uppercase tracking-widest text-[#F2CA50] flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  PAINEL FINANCEIRO & ESTATÍSTICAS
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-black text-white mt-0.5">
                  Faturamento & Tendências
                </h1>
              </div>
            </div>

            {/* Top Action Buttons (Export PDF & Navigation Tabs) */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Botão Exportar PDF Consolidado */}
              <button
                type="button"
                onClick={() => {
                  setExportErrorMessage(null);
                  setIsPdfModalOpen(true);
                }}
                disabled={isExporting}
                className="py-2.5 px-4 rounded-2xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#F2CA50]/15 transition-all cursor-pointer transform active:scale-95 disabled:opacity-50"
                title="Exportar Relatório Consolidado em PDF (Faturamento, Equipe e Atendimentos)"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>GERANDO PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 text-black" />
                    <span>EXPORTAR PDF</span>
                  </>
                )}
              </button>

              {/* Navigation Tabs within Finance Panel */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#1C1C1B] border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('geral')}
                  className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'geral'
                      ? 'bg-[#F2CA50] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Visão Geral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('graficos')}
                  className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'graficos'
                      ? 'bg-[#F2CA50] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Gráficos (30d)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('extrato')}
                  className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'extrato'
                      ? 'bg-[#F2CA50] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Extrato ({transactions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inadimplencia')}
                  className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'inadimplencia'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>Inadimplência ({delinquentClients.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pix')}
                  className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'pix'
                      ? 'bg-[#25D366] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Pix & Lembretes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('config_pagamentos')}
                  className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'config_pagamentos'
                      ? 'bg-[#F2CA50] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Métodos de Pagamento</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toast de Configuração dos Métodos de Pagamento */}
          {methodsSavedToast && (
            <div className="p-3.5 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center gap-3 text-xs text-[#F2CA50] font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#F2CA50]" />
              <div className="flex-1">
                <span>{methodsSavedToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setMethodsSavedToast(null)}
                className="text-[#F2CA50]/80 hover:text-[#F2CA50] text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Toast de Configuração do Pix & Lembretes */}
          {pixSavedToast && (
            <div className="p-3.5 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center gap-3 text-xs text-[#25D366] font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#25D366]" />
              <div className="flex-1">
                <span>{pixSavedToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setPixSavedToast(null)}
                className="text-[#25D366]/80 hover:text-[#25D366] text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Toast de Sucesso da Exportação de PDF */}
          {exportSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center gap-3 text-xs text-green-400 font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
              <div className="flex-1">
                <span>{exportSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setExportSuccessMessage(null)}
                className="text-green-400/80 hover:text-green-400 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Printable & Exportable Content Container */}
          <div ref={reportRef} id="relatorio-financeiro-pdf" className="space-y-6 bg-[#131313] p-1 rounded-3xl">
            {/* Header exclusivo para o PDF gerado */}
            <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-heading font-black text-white text-base">
                  {atelier?.nome_negocio || 'Barbearia'} • Relatório Oficial
                </div>
                <div className="text-white/40 text-[11px] mt-0.5">
                  Consolidado Financeiro e Tendências de Atendimentos dos Últimos 30 Dias
                </div>
              </div>
              <div className="text-white/50 text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#F2CA50]" />
                <span>Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Quick Stats Grid (Resumos Financeiros) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Faturamento Hoje */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F2CA50] text-black shadow-xl shadow-[#F2CA50]/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-black/70">
                  <span className="text-[10px] font-black uppercase tracking-wider">FATURAMENTO HOJE</span>
                  <Zap className="w-4 h-4 text-black" />
                </div>
                <div className="mt-2 font-heading text-2xl sm:text-3xl font-black">
                  {formatCurrency(stats.today)}
                </div>
                <span className="text-[11px] text-black/60 font-bold mt-1">
                  Atendimentos finalizados hoje
                </span>
              </div>

              {/* Card 2: Faturamento do Mês */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-white/40">
                  <span className="text-[10px] font-black uppercase tracking-wider">TOTAL DO MÊS</span>
                  <Wallet className="w-4 h-4 text-[#F2CA50]" />
                </div>
                <div className="mt-2 font-heading text-2xl sm:text-3xl font-black text-white">
                  {formatCurrency(stats.month)}
                </div>
                <span className="text-[11px] text-white/50 font-bold mt-1">
                  Mês corrente acumulado
                </span>
              </div>

              {/* Card 3: Faturamento 30 Dias */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-white/40">
                  <span className="text-[10px] font-black uppercase tracking-wider">FATURAMENTO 30D</span>
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <div className="mt-2 font-heading text-2xl sm:text-3xl font-black text-white">
                  {formatCurrency(trendsSummary.totalReceita)}
                </div>
                <span className="text-[11px] text-green-400 font-bold mt-1">
                  {trendsSummary.totalVolume} cortes no período
                </span>
              </div>

              {/* Card 4: Ticket Médio Geral */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-white/40">
                  <span className="text-[10px] font-black uppercase tracking-wider">TICKET MÉDIO</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 font-heading text-2xl sm:text-3xl font-black text-white">
                  {formatCurrency(trendsSummary.ticketMedio)}
                </div>
                <span className="text-[11px] text-white/50 font-bold mt-1">
                  Por cliente atendido
                </span>
              </div>
            </div>

            {/* Resumo de Fidelidade & Recompensas no Mês */}
            <div className="p-5 rounded-3xl bg-[#1C1C1B] border border-[#F2CA50]/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#F2CA50]" />
                  <h3 className="font-heading font-black text-white text-base">
                    Resumo de Fidelidade & Recompensas (Mês Atual)
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50]">
                  Clube de Vantagens
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                      CARTÕES COMPLETADOS
                    </span>
                    <div className="font-heading font-black text-2xl text-[#F2CA50] mt-1">
                      {loyaltySummary.cartoesCompletados} cartões
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Clientes que atingiram 10 selos de fidelidade
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F2CA50]/15 flex items-center justify-center text-[#F2CA50]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                      BRINDES RESGATADOS NO MÊS
                    </span>
                    <div className="font-heading font-black text-2xl text-green-400 mt-1">
                      {loyaltySummary.brindesResgatadosMes} resgates
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Cortes e brindes gratuitos entregues aos clientes fiéis
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-green-500/15 flex items-center justify-center text-green-400">
                    <Gift className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Comparativo de Produtividade por Funcionário */}
            <div className="p-5 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#F2CA50]" />
                  <h3 className="font-heading font-black text-white text-base">
                    Comparativo de Produtividade por Funcionário
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                  Eficiência da Equipe
                </span>
              </div>

              {staffStats.length === 0 ? (
                <div className="py-8 text-center text-white/40 text-xs">
                  Nenhum funcionário cadastrado no atelier.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {staffStats.map((st) => (
                    <div
                      key={st.staffId}
                      className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between space-y-3 hover:border-[#F2CA50]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-heading font-bold text-white text-sm">
                            {st.name}
                          </div>
                          <div className="text-xs text-[#F2CA50]">
                            {st.role}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                            FATURAMENTO
                          </span>
                          <span className="font-heading font-black text-sm text-[#F2CA50]">
                            {formatCurrency(st.faturamentoTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Taxa de Ocupação & Média de Tempo */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
                        <div>
                          <div className="flex items-center justify-between text-white/50 text-[11px] mb-1">
                            <span>Taxa Ocupação</span>
                            <strong className="text-white font-bold">{st.taxaOcupacao}%</strong>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                st.taxaOcupacao >= 85 ? 'bg-green-400' : 'bg-[#F2CA50]'
                              }`}
                              style={{ width: `${st.taxaOcupacao}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-white/50 text-[11px] mb-1">
                            <span>Tempo Médio</span>
                            <strong className="text-white font-bold">{st.mediaTempoMinutos} min</strong>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/70 text-[11px] mt-1">
                            <Clock className="w-3.5 h-3.5 text-[#F2CA50]" />
                            <span>{st.atendimentosCount} atendimentos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Análise de Horários de Pico e Dias de Movimento */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h3 className="font-heading font-black text-white text-base">
                    Horários de Pico & Dias de Maior Movimento
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400">
                  Otimização de Escala
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dias da Semana com Maior Demanda */}
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white/60">
                    Volume por Dia da Semana (Demanda Média)
                  </h4>
                  <div className="space-y-2">
                    {[
                      { dia: 'Sábado', volume: '95%', tag: 'Pico Máximo', color: 'bg-[#F2CA50]' },
                      { dia: 'Sexta-feira', volume: '85%', tag: 'Alto Movimento', color: 'bg-green-400' },
                      { dia: 'Quinta-feira', volume: '65%', tag: 'Moderado', color: 'bg-blue-400' },
                      { dia: 'Quarta-feira', volume: '60%', tag: 'Moderado', color: 'bg-blue-400' },
                      { dia: 'Terça-feira', volume: '55%', tag: 'Estável', color: 'bg-blue-400' },
                      { dia: 'Segunda-feira', volume: '45%', tag: 'Movimento Leve', color: 'bg-purple-400' },
                      { dia: 'Domingo', volume: '25%', tag: 'Fechado / Opcional', color: 'bg-white/20' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-heading font-bold text-white w-24">{item.dia}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/70">
                            {item.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 w-36">
                          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: item.volume }} />
                          </div>
                          <span className="font-bold text-white w-10 text-right">{item.volume}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faixas Horárias de Pico */}
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white/60">
                    Faixas Horárias de Maior Concentração de Fila
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      { horario: '17:00 às 20:00 (Fim de Tarde / Noite)', carga: 'Pico de Pós-Expediente', bar: '92%', cor: 'bg-red-400' },
                      { horario: '14:00 às 17:00 (Tarde)', carga: 'Movimento Alto', bar: '78%', cor: 'bg-[#F2CA50]' },
                      { horario: '10:00 às 13:00 (Manhã / Almoço)', carga: 'Movimento Constante', bar: '65%', cor: 'bg-green-400' },
                      { horario: '08:30 às 10:00 (Início da Manhã)', carga: 'Fluxo Moderado', bar: '40%', cor: 'bg-blue-400' },
                    ].map((slot, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-white">{slot.horario}</span>
                          <span className="text-[10px] font-bold text-[#F2CA50]">{slot.carga}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full ${slot.cor}`} style={{ width: slot.bar }} />
                        </div>
                      </div>
                    ))}

                    <div className="p-3.5 rounded-2xl bg-[#F2CA50]/10 border border-[#F2CA50]/30 text-[11px] text-[#F2CA50] space-y-1">
                      <div className="font-heading font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Recomendação de Escala Inteligente:</span>
                      </div>
                      <p className="text-white/80 leading-relaxed font-sans">
                        Recomenda-se manter todos os barbeiros ativos nas sextas e sábados das 14h às 20h para zerar o tempo de espera na fila virtual.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab 1: Visão Geral (Gráficos + Resumo do Extrato) */}
            {activeTab === 'geral' && (
              <div className="space-y-6">
                {/* O Gráfico de Tendências integrado com Recharts */}
                <AdminTrendsDashboard data={trendsData} />

                {/* Últimas Transações */}
                <div className="p-5 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#F2CA50]" />
                      <h3 className="font-heading font-black text-white text-base">
                        Últimos Atendimentos Registrados
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('extrato')}
                      className="text-xs text-[#F2CA50] hover:underline font-bold cursor-pointer"
                    >
                      Ver extrato completo ({transactions.length}) →
                    </button>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="py-8 text-center text-white/30 text-xs">
                      Nenhum atendimento registrado no histórico recente.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {transactions.slice(0, 6).map((tx) => {
                        const date = new Date(tx.data);
                        const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                        return (
                          <div
                            key={tx.id}
                            className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="font-heading font-bold text-white text-xs truncate">
                                {tx.cliente_nome}
                              </div>
                              <div className="text-[11px] text-white/40 truncate">
                                {tx.servico}
                              </div>
                              <div className="text-[10px] text-white/30 mt-0.5">
                                {formattedDate} às {formattedTime}
                              </div>
                            </div>

                            <div className="font-heading font-black text-[#F2CA50] text-sm shrink-0">
                              + {formatCurrency(tx.valor)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Gráficos de Tendência */}
            {activeTab === 'graficos' && (
              <div className="space-y-4">
                <AdminTrendsDashboard data={trendsData} />
              </div>
            )}

            {/* Tab 3: Extrato Completo */}
            {activeTab === 'extrato' && (
              <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div>
                    <h3 className="font-heading font-black text-white text-lg">
                      Histórico Completo de Transações
                    </h3>
                    <p className="text-xs text-white/40">
                      Registro de todos os pagamentos e atendimentos finalizados no atelier.
                    </p>
                  </div>
                  <div className="text-xs text-[#F2CA50] font-bold">
                    Total de {transactions.length} registros
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="py-16 text-center text-white/30 text-sm">
                    Nenhuma transação registrada ainda no sistema.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                    {transactions.map((tx) => {
                      const date = new Date(tx.data);
                      const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                      return (
                        <div
                          key={tx.id}
                          className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="font-heading font-bold text-white text-sm truncate">
                              {tx.cliente_nome}
                            </div>
                            <div className="text-xs text-white/50 truncate">
                              {tx.servico}
                            </div>
                            <div className="text-[11px] text-white/30 mt-1 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-white/30" />
                              <span>{formattedDate} às {formattedTime}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="font-heading font-black text-[#F2CA50] text-base">
                                + {formatCurrency(tx.valor)}
                              </div>
                              <div className="text-[10px] text-white/40 uppercase font-mono">
                                {tx.metodo_pagamento ? tx.metodo_pagamento.replace('_', ' ') : 'pix'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActivePixModalClient({
                                id: tx.id,
                                name: tx.cliente_nome,
                                service: tx.servico,
                                reason: tx.servico,
                                amount: tx.valor,
                                chavePix: pixConfig.chaveValor,
                                chaveTipo: pixConfig.chaveTipo,
                                beneficiario: pixConfig.beneficiario,
                                isCustomKey: false,
                              })}
                              className="px-3 py-2 rounded-xl bg-[#F2CA50]/10 hover:bg-[#F2CA50]/20 text-[#F2CA50] border border-[#F2CA50]/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                              title="Gerar QR Code Pix exclusivo para este atendimento"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Pix Exclusivo</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Inadimplência & Lembretes WhatsApp */}
            {activeTab === 'inadimplencia' && (
              <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div>
                    <h3 className="font-heading font-black text-white text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span>Gestão de Inadimplência & Faltas Recorrentes</span>
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Lista de clientes com pagamentos pendentes ou histórico de no-show para cobrança direta via WhatsApp com chave Pix.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-bold border border-red-500/30">
                    {delinquentClients.length} Clientes Pendentes
                  </span>
                </div>

                {/* Banner de Régua Automática com Pix */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#1C1C1B] to-black border border-[#25D366]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Régua de Lembretes Automáticos WhatsApp + Pix</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pixConfig.lembreteAutomaticoAtivo ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-white/10 text-white/50'}`}>
                          {pixConfig.lembreteAutomaticoAtivo ? 'Automação Ativa' : 'Pausado'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        Disparo configurado: <strong className="text-[#F2CA50]">{pixConfig.diasAposVencimento} dia(s)</strong> após vencimento • Chave Pix: <strong className="text-white font-mono">{pixConfig.chaveValor}</strong> ({pixConfig.chaveTipo.toUpperCase()})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pix')}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F2CA50] text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Configurar Pix & Prazos</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendAllDelinquentReminders}
                      className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Cobrar Todos ({delinquentClients.length})</span>
                    </button>
                  </div>
                </div>

                {inadimplenciaToast && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{inadimplenciaToast}</span>
                  </div>
                )}

                {delinquentClients.length === 0 ? (
                  <div className="py-16 text-center text-white/40 text-xs">
                    Nenhum cliente inadimplente ou com pendências registradas. Parabéns!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {delinquentClients.map((client) => (
                      <div
                        key={client.id}
                        className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all shadow-md"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-white text-sm">
                              {client.name}
                            </span>
                            <span className="font-mono text-xs text-white/40">
                              ({client.phone})
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                              Pendente: {formatCurrency(client.amount)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold">
                              {client.daysPending} dias de atraso
                            </span>
                          </div>
                          <div className="text-xs text-white/60">
                            Motivo: <strong>{client.reason}</strong> • Faltas recorrentes: {client.absences}x
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => setActivePixModalClient({
                              id: client.id,
                              name: client.name,
                              service: client.reason,
                              reason: client.reason,
                              amount: client.amount,
                              phone: client.phone,
                              daysPending: client.daysPending,
                              chavePix: pixConfig.chaveValor,
                              chaveTipo: pixConfig.chaveTipo,
                              beneficiario: pixConfig.beneficiario,
                              isCustomKey: false,
                            })}
                            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Visualizar QR Code Pix e Copia e Cola para este cliente"
                          >
                            <QrCode className="w-4 h-4 text-[#F2CA50]" />
                            <span>Ver QR Code Pix</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendDelinquentWhatsApp(client)}
                            className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Cobrar via WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Configuração Pix & Lembretes Automáticos WhatsApp */}
            {activeTab === 'pix' && (
              <div className="space-y-6">
                {/* Seção de Meta Mensal de Faturamento */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border-2 border-[#F2CA50]/40 shadow-xl space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2CA50]/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#F2CA50]/20 border border-[#F2CA50]/40 flex items-center justify-center text-[#F2CA50] shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-white text-lg">
                          Meta Mensal de Faturamento
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                          Defina o objetivo financeiro para o mês vigente e acompanhe o progresso em tempo real.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-black/60 px-3.5 py-2 rounded-xl border border-white/10">
                      <span className="text-xs text-white/50 font-bold">Meta R$:</span>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        value={monthlyGoal}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setMonthlyGoal(val);
                          financeRepository.setMonthlyGoal(atelierId, val);
                        }}
                        className="w-28 bg-transparent text-[#F2CA50] font-heading font-black text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Barra de Progresso Visual */}
                  <div className="space-y-3 pt-2 relative z-10">
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-white/70">
                        Faturado este mês: <strong className="text-white font-heading font-bold">{formatCurrency(currentMonthRevenue)}</strong>
                      </div>
                      <div className="font-heading font-black text-[#F2CA50]">
                        {monthlyGoalPercentage}% atingido (Meta: {formatCurrency(monthlyGoal)})
                      </div>
                    </div>

                    <div className="w-full h-4 bg-black/80 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 via-[#F2CA50] to-emerald-400 rounded-full transition-all duration-700 shadow-md relative"
                        style={{ width: `${monthlyGoalPercentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                      <span>Falta {formatCurrency(Math.max(0, monthlyGoal - currentMonthRevenue))} para bater a meta</span>
                      <span>Mês Atual: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Seção 1: Configuração da Chave Pix & Geração Automática de QR Code */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-white text-lg">
                          Configuração de Pagamento via Pix
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                          Cadastre a chave Pix da barbearia para geração automática de QR Codes nos atendimentos e faturas.
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-[#25D366]/15 text-[#25D366] text-xs font-bold border border-[#25D366]/30 self-start sm:self-auto">
                      Pix Instantâneo
                    </span>
                  </div>

                  {/* Formulário de Configuração do Pix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                        Tipo de Chave Pix
                      </label>
                      <select
                        value={pixConfig.chaveTipo}
                        onChange={(e) => handleSavePixConfig({ ...pixConfig, chaveTipo: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs font-medium focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                      >
                        <option value="cnpj">CNPJ</option>
                        <option value="cpf">CPF</option>
                        <option value="email">E-mail</option>
                        <option value="telefone">Celular (com DDD)</option>
                        <option value="aleatoria">Chave Aleatória (EVP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                        Chave Pix
                      </label>
                      <input
                        type="text"
                        value={pixConfig.chaveValor}
                        onChange={(e) => setPixConfig({ ...pixConfig, chaveValor: e.target.value })}
                        onBlur={() => handleSavePixConfig(pixConfig)}
                        placeholder="Ex: 45.123.789/0001-90 ou financeiro@estiloreal.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs font-mono focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                        Alias da Chave Pix (Apelido ou Identificador)
                      </label>
                      <input
                        type="text"
                        value={pixConfig.chaveAlias || ''}
                        onChange={(e) => setPixConfig({ ...pixConfig, chaveAlias: e.target.value })}
                        onBlur={() => handleSavePixConfig(pixConfig)}
                        placeholder="Ex: Barbeiro Principal ou Caixa 01"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                        Nome do Beneficiário / Titular da Conta
                      </label>
                      <input
                        type="text"
                        value={pixConfig.beneficiario}
                        onChange={(e) => setPixConfig({ ...pixConfig, beneficiario: e.target.value })}
                        onBlur={() => handleSavePixConfig(pixConfig)}
                        placeholder="Ex: Barbearia Estilo Real LTDA"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                        Cidade do Titular
                      </label>
                      <input
                        type="text"
                        value={pixConfig.cidade}
                        onChange={(e) => setPixConfig({ ...pixConfig, cidade: e.target.value })}
                        onBlur={() => handleSavePixConfig(pixConfig)}
                        placeholder="Ex: São Paulo"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Switch para Geração Automática de QR Code nos Atendimentos */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Geração Automática de QR Code Pix</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-bold">Faturamento Rápido</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Gera automaticamente o QR Code Pix e código Copia e Cola para cobrança imediata de serviços finalizados e faturas em aberto.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={pixConfig.autoGerarQrCode}
                        onChange={(e) => handleSavePixConfig({ ...pixConfig, autoGerarQrCode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                    </label>
                  </div>

                  {/* Visualizador & Simulador de QR Code Pix */}
                  <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div>
                        <h4 className="font-heading font-black text-white text-xs uppercase tracking-wider flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-[#F2CA50]" />
                          <span>Simulador do QR Code de Pagamento (Atendimentos & Faturas)</span>
                        </h4>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          Visualização do QR Code gerado automaticamente com os dados cadastrados.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">Valor Simulado:</span>
                        <div className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-xl border border-white/10 font-mono text-xs text-[#F2CA50]">
                          <span>R$</span>
                          <input
                            type="number"
                            min="1"
                            step="5"
                            value={simulatorAmount}
                            onChange={(e) => setSimulatorAmount(Number(e.target.value) || 0)}
                            className="w-16 bg-transparent text-[#F2CA50] font-black focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
                      {/* Box do QR Code */}
                      <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center shrink-0 border-2 border-[#F2CA50]">
                        <div className="w-36 h-36 bg-black flex flex-col justify-between p-2.5 rounded-xl relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <div className="w-9 h-9 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                              <div className="w-4 h-4 bg-white" />
                            </div>
                            <div className="text-[9px] font-bold text-white/60 tracking-wider">PIX</div>
                            <div className="w-9 h-9 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                              <div className="w-4 h-4 bg-white" />
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-1 my-auto opacity-90 px-1">
                            {Array.from({ length: 15 }).map((_, i) => (
                              <div key={i} className={`h-1.5 rounded-[1px] ${i % 2 === 0 ? 'bg-white' : 'bg-white/40'}`} />
                            ))}
                          </div>

                          <div className="flex justify-between items-end">
                            <div className="w-9 h-9 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                              <div className="w-4 h-4 bg-white" />
                            </div>
                            <div className="text-[8px] font-mono text-[#F2CA50] font-black">
                              {formatCurrency(simulatorAmount)}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-black uppercase tracking-wider mt-2">
                          Pague com Pix
                        </span>
                      </div>

                      {/* Dados da Chave e Copia e Cola */}
                      <div className="space-y-3 text-xs w-full max-w-sm">
                        <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                          <div className="text-[10px] text-white/40 uppercase font-bold">Chave Pix Cadastrada</div>
                          <div className="flex items-center justify-between text-white font-mono">
                            <span className="truncate">{pixConfig.chaveValor}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pixConfig.chaveValor);
                                setCopiedPixKey(true);
                                setTimeout(() => setCopiedPixKey(false), 2000);
                              }}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#F2CA50] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedPixKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedPixKey ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                          </div>
                          <div className="text-[11px] text-white/50">
                            Titular: {pixConfig.beneficiario} • {pixConfig.cidade}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                          <div className="text-[10px] text-white/40 uppercase font-bold">Código Pix Copia e Cola</div>
                          <div className="p-2 rounded bg-black/80 font-mono text-[10px] text-white/70 truncate border border-white/5">
                            {pixRepository.generatePixCopiaECola(pixConfig, simulatorAmount)}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const payload = pixRepository.generatePixCopiaECola(pixConfig, simulatorAmount);
                              navigator.clipboard.writeText(payload);
                              setCopiedPixPayload(true);
                              setTimeout(() => setCopiedPixPayload(false), 2000);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 mt-1"
                          >
                            {copiedPixPayload ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                            <span>{copiedPixPayload ? 'Código Copiado!' : 'Copiar Código Copia e Cola'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção 1.5: Geração Dinâmica de QR Code Pix por Atendimento Específico */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border-2 border-[#F2CA50]/30 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2CA50]/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#F2CA50]/20 border border-[#F2CA50]/40 flex items-center justify-center text-[#F2CA50] shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-black text-white text-lg">
                            Geração Dinâmica de Pix por Atendimento
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#F2CA50]/20 text-[#F2CA50] text-[10px] font-black uppercase tracking-wider border border-[#F2CA50]/40">
                            Exclusivo
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                          Informe a chave Pix de forma dinâmica por atendimento, gerando um QR Code e Copia e Cola exclusivos com o valor exato daquele serviço.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !dynIsCustomKey;
                          setDynIsCustomKey(nextVal);
                          if (!nextVal) {
                            setDynAttendancePixKey(pixConfig.chaveValor);
                            setDynAttendancePixType(pixConfig.chaveTipo);
                            setDynAttendanceBeneficiary(pixConfig.beneficiario);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          dynIsCustomKey
                            ? 'bg-[#F2CA50] text-black border-[#F2CA50]'
                            : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{dynIsCustomKey ? 'Usando Chave Dinâmica' : 'Usando Chave Padrão'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Seletor de Atendimento Recente ou Manual */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                        Origem do Atendimento
                      </label>
                      <select
                        value={dynSelectedTxId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDynSelectedTxId(val);
                          if (val !== 'manual') {
                            const found = transactions.find(t => t.id === val);
                            if (found) {
                              setDynAttendanceClient(found.cliente_nome);
                              setDynAttendanceService(found.servico);
                              setDynAttendanceAmount(found.valor);
                            }
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs font-medium focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                      >
                        <option value="manual">✍️ Atendimento Avulso / Manual</option>
                        {transactions.slice(0, 10).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.cliente_nome} — {t.servico} ({formatCurrency(t.valor)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                        Nome do Cliente
                      </label>
                      <input
                        type="text"
                        value={dynAttendanceClient}
                        onChange={(e) => setDynAttendanceClient(e.target.value)}
                        placeholder="Ex: Carlos Eduardo"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                        Descrição do Serviço Realizado
                      </label>
                      <input
                        type="text"
                        value={dynAttendanceService}
                        onChange={(e) => setDynAttendanceService(e.target.value)}
                        placeholder="Ex: Corte Degradê + Barboterapia"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-white/10 text-xs focus:border-[#F2CA50] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Campos de Chave Pix Dinâmica deste Atendimento */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-[#F2CA50]/20 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                      <div className="text-xs font-bold text-[#F2CA50] flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        <span>Chave Pix Deste Atendimento Específico</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-white/40">Modo da Chave:</span>
                        <div className="inline-flex rounded-lg bg-black/60 p-0.5 border border-white/10">
                          <button
                            type="button"
                            onClick={() => {
                              setDynIsCustomKey(false);
                              setDynAttendancePixKey(pixConfig.chaveValor);
                              setDynAttendancePixType(pixConfig.chaveTipo);
                              setDynAttendanceBeneficiary(pixConfig.beneficiario);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              !dynIsCustomKey
                                ? 'bg-white/20 text-white shadow'
                                : 'text-white/50 hover:text-white'
                            }`}
                          >
                            Padrão da Barbearia
                          </button>
                          <button
                            type="button"
                            onClick={() => setDynIsCustomKey(true)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              dynIsCustomKey
                                ? 'bg-[#F2CA50] text-black shadow'
                                : 'text-white/50 hover:text-white'
                            }`}
                          >
                            Dinâmica / Personalizada
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                          Tipo de Chave Pix
                        </label>
                        <select
                          disabled={!dynIsCustomKey}
                          value={dynAttendancePixType}
                          onChange={(e) => setDynAttendancePixType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-black/70 text-white border border-white/10 text-xs font-medium focus:border-[#F2CA50] focus:outline-none disabled:opacity-60 cursor-pointer"
                        >
                          <option value="cnpj">CNPJ</option>
                          <option value="cpf">CPF</option>
                          <option value="email">E-mail</option>
                          <option value="telefone">Celular (com DDD)</option>
                          <option value="aleatoria">Chave Aleatória (EVP)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                          Chave Pix do Atendimento
                        </label>
                        <input
                          type="text"
                          disabled={!dynIsCustomKey}
                          value={dynAttendancePixKey}
                          onChange={(e) => setDynAttendancePixKey(e.target.value)}
                          placeholder="Informe a chave específica..."
                          className="w-full px-3 py-2 rounded-xl bg-black/70 text-white border border-white/10 text-xs font-mono focus:border-[#F2CA50] focus:outline-none disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                          Nome do Titular / Recebedor
                        </label>
                        <input
                          type="text"
                          disabled={!dynIsCustomKey}
                          value={dynAttendanceBeneficiary}
                          onChange={(e) => setDynAttendanceBeneficiary(e.target.value)}
                          placeholder="Ex: Barbearia ou Profissional"
                          className="w-full px-3 py-2 rounded-xl bg-black/70 text-white border border-white/10 text-xs focus:border-[#F2CA50] focus:outline-none disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                          Valor Exato do Serviço (R$)
                        </label>
                        <div className="flex items-center gap-1 bg-black/70 px-3 py-2 rounded-xl border border-[#F2CA50]/30 font-mono text-xs text-[#F2CA50]">
                          <span className="font-bold">R$</span>
                          <input
                            type="number"
                            min="1"
                            step="0.50"
                            value={dynAttendanceAmount}
                            onChange={(e) => setDynAttendanceAmount(Number(e.target.value) || 0)}
                            className="w-full bg-transparent text-[#F2CA50] font-black focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visualização do QR Code Exclusivo Gerado em Tempo Real */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="p-3 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center shrink-0 border-2 border-[#F2CA50]">
                      <div className="w-32 h-32 bg-black flex flex-col justify-between p-2 rounded-xl relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div className="w-7 h-7 border-[3px] border-white bg-black p-0.5 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white" />
                          </div>
                          <div className="text-[8px] font-bold text-white/60 tracking-wider">PIX</div>
                          <div className="w-7 h-7 border-[3px] border-white bg-black p-0.5 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white" />
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-1 my-auto opacity-90 px-0.5">
                          {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-[1px] ${i % 2 === 0 ? 'bg-white' : 'bg-white/40'}`} />
                          ))}
                        </div>

                        <div className="flex justify-between items-end">
                          <div className="w-7 h-7 border-[3px] border-white bg-black p-0.5 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white" />
                          </div>
                          <div className="text-[8px] font-mono text-[#F2CA50] font-black">
                            {formatCurrency(dynAttendanceAmount)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-black uppercase tracking-wider mt-1.5">
                        QR Code Exclusivo
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white truncate">
                          {dynAttendanceClient || 'Cliente'} • {dynAttendanceService || 'Serviço'}
                        </div>
                        <div className="text-sm font-black text-[#F2CA50] font-mono shrink-0">
                          {formatCurrency(dynAttendanceAmount)}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/80 border border-white/5 space-y-1">
                        <div className="text-[10px] text-white/40 uppercase font-bold flex items-center justify-between">
                          <span>Código Pix Copia e Cola Exclusivo</span>
                          <span className="text-[#F2CA50] font-mono">{dynAttendancePixType.toUpperCase()}: {dynAttendancePixKey}</span>
                        </div>
                        <div className="font-mono text-[10px] text-white/70 truncate">
                          {pixRepository.generatePixCopiaECola({
                            ...pixConfig,
                            chaveValor: dynAttendancePixKey,
                            chaveTipo: dynAttendancePixType,
                            beneficiario: dynAttendanceBeneficiary,
                          }, dynAttendanceAmount, dynAttendanceService)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const payload = pixRepository.generatePixCopiaECola({
                              ...pixConfig,
                              chaveValor: dynAttendancePixKey,
                              chaveTipo: dynAttendancePixType,
                              beneficiario: dynAttendanceBeneficiary,
                            }, dynAttendanceAmount, dynAttendanceService);
                            navigator.clipboard.writeText(payload);
                            setDynCopiedPayload(true);
                            setTimeout(() => setDynCopiedPayload(false), 2000);
                          }}
                          className="py-2 px-3.5 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                        >
                          {dynCopiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{dynCopiedPayload ? 'Código Copiado!' : 'Copiar Copia e Cola'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActivePixModalClient({
                              name: dynAttendanceClient,
                              service: dynAttendanceService,
                              reason: dynAttendanceService,
                              amount: dynAttendanceAmount,
                              phone: dynAttendancePhone,
                              chavePix: dynAttendancePixKey,
                              chaveTipo: dynAttendancePixType,
                              beneficiario: dynAttendanceBeneficiary,
                              isCustomKey: dynIsCustomKey,
                            });
                          }}
                          className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#F2CA50]" />
                          <span>Expandir Modal de Cobrança</span>
                        </button>

                        {dynIsCustomKey && (
                          <button
                            type="button"
                            onClick={() => {
                              handleSavePixConfig({
                                ...pixConfig,
                                chaveValor: dynAttendancePixKey,
                                chaveTipo: dynAttendancePixType,
                                beneficiario: dynAttendanceBeneficiary,
                              });
                              setPixSavedToast('Chave salva como novo padrão da barbearia!');
                              setTimeout(() => setPixSavedToast(null), 3000);
                            }}
                            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Tornar esta chave o padrão da barbearia"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tornar Padrão Geral</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Régua de Lembretes Automáticos via WhatsApp Pós-Vencimento */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-white text-lg">
                          Lembretes Automáticos via WhatsApp pós-Vencimento
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                          Defina o prazo de carência após o vencimento da fatura e envie lembretes amigáveis com a chave Pix cadastrada.
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-[#25D366]/15 text-[#25D366] text-xs font-bold border border-[#25D366]/30 self-start sm:self-auto">
                      Automação Ativa
                    </span>
                  </div>

                  {/* Configuração de Prazos e Gatilho */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Disparo Automático de Lembretes</span>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={pixConfig.lembreteAutomaticoAtivo}
                            onChange={(e) => handleSavePixConfig({ ...pixConfig, lembreteAutomaticoAtivo: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                        </label>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Quando ativado, o sistema envia automaticamente a mensagem no WhatsApp do cliente assim que o prazo estipulado após o vencimento for atingido.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                      <label className="block text-xs font-bold text-white">
                        Prazo após o Vencimento da Fatura
                      </label>
                      <p className="text-xs text-white/50">
                        Selecione quantos dias após o vencimento o lembrete deve ser enviado:
                      </p>
                      <select
                        value={pixConfig.diasAposVencimento}
                        onChange={(e) => handleSavePixConfig({ ...pixConfig, diasAposVencimento: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-white border border-[#25D366]/30 text-xs font-bold focus:border-[#25D366] focus:outline-none cursor-pointer"
                      >
                        <option value={1}>1 dia após o vencimento</option>
                        <option value={2}>2 dias após o vencimento (Recomendado)</option>
                        <option value={3}>3 dias após o vencimento</option>
                        <option value={5}>5 dias após o vencimento</option>
                        <option value={7}>7 dias após o vencimento (1 semana)</option>
                        <option value={15}>15 dias após o vencimento</option>
                      </select>
                    </div>
                  </div>

                  {/* Editor do Modelo de Mensagem com Tags */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-white uppercase tracking-wider">
                        Modelo de Mensagem do Lembrete de Cobrança com Pix
                      </label>
                      <span className="text-[10px] text-white/40">WhatsApp Oficial</span>
                    </div>

                    {/* Chips de Inserção Rápida */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-white/40 mr-1">Inserir:</span>
                      {[
                        { label: 'Nome ({{nome}})', tag: ' {{nome}}' },
                        { label: 'Valor ({{valor}})', tag: ' {{valor}}' },
                        { label: 'Dias Atraso ({{dias_atraso}})', tag: ' {{dias_atraso}}' },
                        { label: 'Chave Pix ({{chave_pix}})', tag: ' {{chave_pix}}' },
                        { label: 'Tipo Chave ({{chave_tipo}})', tag: ' {{chave_tipo}}' },
                        { label: 'Titular ({{beneficiario}})', tag: ' {{beneficiario}}' },
                        { label: 'Serviço ({{servico}})', tag: ' {{servico}}' },
                        { label: 'Atelier ({{atelier}})', tag: ' {{atelier}}' },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const updated = (pixConfig.templateLembrete || '') + chip.tag;
                            handleSavePixConfig({ ...pixConfig, templateLembrete: updated });
                          }}
                          className="px-2 py-1 rounded-md bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold border border-[#25D366]/20 cursor-pointer transition-colors"
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={4}
                      value={pixConfig.templateLembrete}
                      onChange={(e) => setPixConfig({ ...pixConfig, templateLembrete: e.target.value })}
                      onBlur={() => handleSavePixConfig(pixConfig)}
                      placeholder="Ex: Olá {{nome}}! Lembramos que o pagamento de {{servico}} no valor de {{valor}} venceu..."
                      className="w-full p-3.5 rounded-xl bg-black/60 text-white text-xs border border-white/10 focus:border-[#25D366] focus:outline-none resize-none leading-relaxed font-sans"
                    />

                    {/* Prévia ao Vivo Estilo Balão do WhatsApp */}
                    <div className="p-4 rounded-xl bg-[#25D366]/5 border border-[#25D366]/20 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#25D366] font-bold">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pré-visualização do Lembrete no WhatsApp do Cliente:</span>
                        </div>
                        <span className="text-[10px] text-white/40">Prazo: +{pixConfig.diasAposVencimento} dias</span>
                      </div>

                      <div className="max-w-md bg-[#005c4b]/80 text-white text-xs p-3.5 rounded-2xl rounded-tr-none shadow-md space-y-2 ml-auto leading-relaxed border border-[#25D366]/30">
                        <p className="whitespace-pre-line font-sans">
                          {getFormattedReminderMessage('Arthur Shelby', 'Corte Degradê Fade + Barba', simulatorAmount, pixConfig.diasAposVencimento)}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-white/60">
                          <span>11:45</span>
                          <span className="text-cyan-300">✓✓</span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleSendPixTest}
                        disabled={isSendingPixTest}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>{isSendingPixTest ? 'Enviando Teste...' : 'Enviar Teste com Pix para Meu WhatsApp'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSavePixConfig(pixConfig)}
                        className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-transform active:scale-95"
                      >
                        Salvar Todas as Configurações
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CONFIGURAÇÕES DE MÉTODOS DE PAGAMENTO */}
            {activeTab === 'config_pagamentos' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Header informativo */}
                <div className="p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-white text-base tracking-wide flex items-center gap-2">
                        <span>Métodos de Pagamento Aceitos</span>
                        <span className="text-[10px] py-0.5 px-2 rounded-full bg-[#F2CA50]/20 text-[#F2CA50] font-bold border border-[#F2CA50]/30">
                          Sincronização em Tempo Real
                        </span>
                      </h3>
                      <p className="text-xs text-white/60 mt-1 max-w-xl leading-relaxed">
                        Ative ou desative individualmente as formas de pagamento disponíveis. Os métodos desativados aqui ficam ocultos de forma imediata na tela de <strong>Finalizar Atendimento (Checkout)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-white/70 bg-black/40 px-3.5 py-2 rounded-xl border border-white/5 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#F2CA50]" />
                    <span>
                      {[
                        paymentMethodsConfig.pixHabilitado,
                        paymentMethodsConfig.cartaoDebitoHabilitado,
                        paymentMethodsConfig.cartaoCreditoHabilitado,
                        paymentMethodsConfig.tapOnPhoneHabilitado,
                        paymentMethodsConfig.dinheiroHabilitado,
                      ].filter(Boolean).length} de 5 métodos ativos
                    </span>
                  </div>
                </div>

                {/* Lista de Toggles Individuais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. PIX INSTANTÂNEO */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    paymentMethodsConfig.pixHabilitado 
                      ? 'bg-[#1C1C1B] border-[#25D366]/40 shadow-lg shadow-[#25D366]/5' 
                      : 'bg-[#1C1C1B]/50 border-white/5 opacity-60'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          paymentMethodsConfig.pixHabilitado ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-white/5 text-white/40'
                        }`}>
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-white">Pix Instantâneo</span>
                            {paymentMethodsConfig.metodoPadrao === 'pix' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#25D366] text-black">PADRÃO</span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#25D366] font-semibold">QR Code Dinâmico + Copia e Cola</span>
                        </div>
                      </div>

                      {/* Switch */}
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentMethod('pixHabilitado')}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          paymentMethodsConfig.pixHabilitado ? 'bg-[#25D366]' : 'bg-white/20'
                        }`}
                        title={paymentMethodsConfig.pixHabilitado ? 'Desativar Pix' : 'Ativar Pix'}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-black transform transition-transform ${
                          paymentMethodsConfig.pixHabilitado ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <p className="text-xs text-white/50 mt-3 leading-relaxed">
                      Exibe o QR Code dinâmico na tela do barbeiro e o código Copia e Cola com chave cadastrada para pagamento imediato sem taxas bancárias abusivas.
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Status no Checkout:</span>
                      <span className={`font-bold ${paymentMethodsConfig.pixHabilitado ? 'text-[#25D366]' : 'text-red-400'}`}>
                        {paymentMethodsConfig.pixHabilitado ? '● Visível para a equipe' : '○ Oculto no caixa'}
                      </span>
                    </div>
                  </div>

                  {/* 2. CARTÃO DE DÉBITO */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    paymentMethodsConfig.cartaoDebitoHabilitado 
                      ? 'bg-[#1C1C1B] border-[#F2CA50]/40 shadow-lg shadow-[#F2CA50]/5' 
                      : 'bg-[#1C1C1B]/50 border-white/5 opacity-60'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          paymentMethodsConfig.cartaoDebitoHabilitado ? 'bg-[#F2CA50]/20 text-[#F2CA50]' : 'bg-white/5 text-white/40'
                        }`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-white">Cartão de Débito</span>
                            {paymentMethodsConfig.metodoPadrao === 'cartao_debito' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F2CA50] text-black">PADRÃO</span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#F2CA50] font-semibold">Maquininha de Cartão Física</span>
                        </div>
                      </div>

                      {/* Switch */}
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentMethod('cartaoDebitoHabilitado')}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          paymentMethodsConfig.cartaoDebitoHabilitado ? 'bg-[#F2CA50]' : 'bg-white/20'
                        }`}
                        title={paymentMethodsConfig.cartaoDebitoHabilitado ? 'Desativar Cartão Débito' : 'Ativar Cartão Débito'}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-black transform transition-transform ${
                          paymentMethodsConfig.cartaoDebitoHabilitado ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <p className="text-xs text-white/50 mt-3 leading-relaxed">
                      Vincula maquininhas POS (Stone, PagBank, Cielo, Rede, Mercado Pago) com registro de NSU de autorização e liquidação automática em D+1.
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Status no Checkout:</span>
                      <span className={`font-bold ${paymentMethodsConfig.cartaoDebitoHabilitado ? 'text-[#F2CA50]' : 'text-red-400'}`}>
                        {paymentMethodsConfig.cartaoDebitoHabilitado ? '● Visível para a equipe' : '○ Oculto no caixa'}
                      </span>
                    </div>
                  </div>

                  {/* 3. CARTÃO DE CRÉDITO */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    paymentMethodsConfig.cartaoCreditoHabilitado 
                      ? 'bg-[#1C1C1B] border-amber-400/40 shadow-lg shadow-amber-400/5' 
                      : 'bg-[#1C1C1B]/50 border-white/5 opacity-60'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          paymentMethodsConfig.cartaoCreditoHabilitado ? 'bg-amber-400/20 text-amber-400' : 'bg-white/5 text-white/40'
                        }`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-white">Cartão de Crédito</span>
                            {paymentMethodsConfig.metodoPadrao === 'cartao_credito' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-black">PADRÃO</span>
                            )}
                          </div>
                          <span className="text-[11px] text-amber-400 font-semibold">À Vista & Parcelado em até 12x</span>
                        </div>
                      </div>

                      {/* Switch */}
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentMethod('cartaoCreditoHabilitado')}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          paymentMethodsConfig.cartaoCreditoHabilitado ? 'bg-amber-400' : 'bg-white/20'
                        }`}
                        title={paymentMethodsConfig.cartaoCreditoHabilitado ? 'Desativar Cartão Crédito' : 'Ativar Cartão Crédito'}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-black transform transition-transform ${
                          paymentMethodsConfig.cartaoCreditoHabilitado ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <p className="text-xs text-white/50 mt-3 leading-relaxed">
                      Permite recebimento de pacotes, assinaturas e combos na maquininha, com opção de parcelamento direto no checkout.
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Status no Checkout:</span>
                      <span className={`font-bold ${paymentMethodsConfig.cartaoCreditoHabilitado ? 'text-amber-400' : 'text-red-400'}`}>
                        {paymentMethodsConfig.cartaoCreditoHabilitado ? '● Visível para a equipe' : '○ Oculto no caixa'}
                      </span>
                    </div>
                  </div>

                  {/* 4. CELULAR NFC / TAP ON PHONE */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    paymentMethodsConfig.tapOnPhoneHabilitado 
                      ? 'bg-[#1C1C1B] border-blue-400/40 shadow-lg shadow-blue-400/5' 
                      : 'bg-[#1C1C1B]/50 border-white/5 opacity-60'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          paymentMethodsConfig.tapOnPhoneHabilitado ? 'bg-blue-400/20 text-blue-400' : 'bg-white/5 text-white/40'
                        }`}>
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-white">Celular NFC (Tap on Phone)</span>
                            {paymentMethodsConfig.metodoPadrao === 'tap_on_phone' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-400 text-black">PADRÃO</span>
                            )}
                          </div>
                          <span className="text-[11px] text-blue-400 font-semibold">Aproximação sem Maquininha</span>
                        </div>
                      </div>

                      {/* Switch */}
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentMethod('tapOnPhoneHabilitado')}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          paymentMethodsConfig.tapOnPhoneHabilitado ? 'bg-blue-400' : 'bg-white/20'
                        }`}
                        title={paymentMethodsConfig.tapOnPhoneHabilitado ? 'Desativar Tap on Phone' : 'Ativar Tap on Phone'}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-black transform transition-transform ${
                          paymentMethodsConfig.tapOnPhoneHabilitado ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <p className="text-xs text-white/50 mt-3 leading-relaxed">
                      Transforma o smartphone da barbearia em maquininha via antena NFC para aproximar cartões, relógios Apple Watch e carteiras Google Pay.
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Status no Checkout:</span>
                      <span className={`font-bold ${paymentMethodsConfig.tapOnPhoneHabilitado ? 'text-blue-400' : 'text-red-400'}`}>
                        {paymentMethodsConfig.tapOnPhoneHabilitado ? '● Visível para a equipe' : '○ Oculto no caixa'}
                      </span>
                    </div>
                  </div>

                  {/* 5. DINHEIRO EM ESPÉCIE */}
                  <div className={`p-5 rounded-2xl border transition-all md:col-span-2 ${
                    paymentMethodsConfig.dinheiroHabilitado 
                      ? 'bg-[#1C1C1B] border-emerald-400/40 shadow-lg shadow-emerald-400/5' 
                      : 'bg-[#1C1C1B]/50 border-white/5 opacity-60'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          paymentMethodsConfig.dinheiroHabilitado ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-white/40'
                        }`}>
                          <Banknote className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-white">Dinheiro em Espécie</span>
                            {paymentMethodsConfig.metodoPadrao === 'dinheiro' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-400 text-black">PADRÃO</span>
                            )}
                          </div>
                          <span className="text-[11px] text-emerald-400 font-semibold">Cédulas Físicas & Calculadora de Troco</span>
                        </div>
                      </div>

                      {/* Switch */}
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentMethod('dinheiroHabilitado')}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          paymentMethodsConfig.dinheiroHabilitado ? 'bg-emerald-400' : 'bg-white/20'
                        }`}
                        title={paymentMethodsConfig.dinheiroHabilitado ? 'Desativar Dinheiro' : 'Ativar Dinheiro'}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-black transform transition-transform ${
                          paymentMethodsConfig.dinheiroHabilitado ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <p className="text-xs text-white/50 mt-3 leading-relaxed">
                      Ativa a opção de recebimento em espécie no caixa com inserção de valor entregue e cálculo instantâneo do troco para evitar erros operacionais.
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Status no Checkout:</span>
                      <span className={`font-bold ${paymentMethodsConfig.dinheiroHabilitado ? 'text-emerald-400' : 'text-red-400'}`}>
                        {paymentMethodsConfig.dinheiroHabilitado ? '● Visível para a equipe' : '○ Oculto no caixa'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seleção do Método Padrão de Abertura */}
                <div className="p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 space-y-4">
                  <div>
                    <h4 className="font-heading font-black text-white text-sm">
                      Método Padrão ao Abrir o Caixa / Finalizar Atendimento
                    </h4>
                    <p className="text-xs text-white/50 mt-1">
                      Escolha qual aba deve vir pré-selecionada quando o atendente clicar em Concluir & Receber. Apenas métodos atualmente ativados podem ser definidos como padrão.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {paymentMethodsConfig.pixHabilitado && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultMethod('pix')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethodsConfig.metodoPadrao === 'pix'
                            ? 'bg-[#25D366]/20 border-[#25D366] text-[#25D366] font-bold shadow-md'
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="text-[11px]">Pix</span>
                      </button>
                    )}

                    {paymentMethodsConfig.cartaoDebitoHabilitado && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultMethod('cartao_debito')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethodsConfig.metodoPadrao === 'cartao_debito'
                            ? 'bg-[#F2CA50]/20 border-[#F2CA50] text-[#F2CA50] font-bold shadow-md'
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-[11px]">Débito</span>
                      </button>
                    )}

                    {paymentMethodsConfig.cartaoCreditoHabilitado && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultMethod('cartao_credito')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethodsConfig.metodoPadrao === 'cartao_credito'
                            ? 'bg-amber-400/20 border-amber-400 text-amber-400 font-bold shadow-md'
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-[11px]">Crédito</span>
                      </button>
                    )}

                    {paymentMethodsConfig.tapOnPhoneHabilitado && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultMethod('tap_on_phone')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethodsConfig.metodoPadrao === 'tap_on_phone'
                            ? 'bg-blue-400/20 border-blue-400 text-blue-400 font-bold shadow-md'
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <Radio className="w-4 h-4" />
                        <span className="text-[11px]">Celular NFC</span>
                      </button>
                    )}

                    {paymentMethodsConfig.dinheiroHabilitado && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultMethod('dinheiro')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethodsConfig.metodoPadrao === 'dinheiro'
                            ? 'bg-emerald-400/20 border-emerald-400 text-emerald-400 font-bold shadow-md'
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span className="text-[11px]">Dinheiro</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Prévia Dinâmica do Modal de Finalização de Atendimento */}
                <div className="p-6 rounded-3xl bg-black/60 border-2 border-[#F2CA50]/30 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F2CA50]" />
                      <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        Prévia em Tempo Real no Caixa (Checkout)
                      </span>
                    </div>
                    <span className="text-[10px] text-[#25D366] font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                      Reflete imediatamente no atendimento
                    </span>
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed">
                    Abaixo está a representação visual exata dos botões que serão exibidos para o barbeiro ao clicar em <strong>"Concluir & Receber"</strong>:
                  </p>

                  <div className="p-4 rounded-2xl bg-[#1C1C1B] border border-white/10">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                      FORMA DE PAGAMENTO SELECIONADA PELO BARBEIRO:
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {paymentMethodsConfig.pixHabilitado && (
                        <div className={`p-3 rounded-xl border text-center transition-all ${
                          paymentMethodsConfig.metodoPadrao === 'pix'
                            ? 'bg-[#25D366]/20 border-[#25D366] text-white shadow-md'
                            : 'bg-black/40 border-white/10 text-white/70'
                        }`}>
                          <QrCode className="w-5 h-5 mx-auto mb-1 text-[#25D366]" />
                          <div className="font-heading font-black text-[11px]">PIX</div>
                          <div className="text-[9px] text-white/40">QR Code</div>
                        </div>
                      )}

                      {paymentMethodsConfig.cartaoDebitoHabilitado && (
                        <div className={`p-3 rounded-xl border text-center transition-all ${
                          paymentMethodsConfig.metodoPadrao === 'cartao_debito'
                            ? 'bg-[#F2CA50]/20 border-[#F2CA50] text-white shadow-md'
                            : 'bg-black/40 border-white/10 text-white/70'
                        }`}>
                          <CreditCard className="w-5 h-5 mx-auto mb-1 text-[#F2CA50]" />
                          <div className="font-heading font-black text-[11px]">DÉBITO</div>
                          <div className="text-[9px] text-white/40">Maquininha</div>
                        </div>
                      )}

                      {paymentMethodsConfig.cartaoCreditoHabilitado && (
                        <div className={`p-3 rounded-xl border text-center transition-all ${
                          paymentMethodsConfig.metodoPadrao === 'cartao_credito'
                            ? 'bg-amber-400/20 border-amber-400 text-white shadow-md'
                            : 'bg-black/40 border-white/10 text-white/70'
                        }`}>
                          <CreditCard className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                          <div className="font-heading font-black text-[11px]">CRÉDITO</div>
                          <div className="text-[9px] text-white/40">Parcelado</div>
                        </div>
                      )}

                      {paymentMethodsConfig.tapOnPhoneHabilitado && (
                        <div className={`p-3 rounded-xl border text-center transition-all ${
                          paymentMethodsConfig.metodoPadrao === 'tap_on_phone'
                            ? 'bg-blue-400/20 border-blue-400 text-white shadow-md'
                            : 'bg-black/40 border-white/10 text-white/70'
                        }`}>
                          <Radio className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                          <div className="font-heading font-black text-[11px]">CELULAR</div>
                          <div className="text-[9px] text-white/40">NFC / Tap</div>
                        </div>
                      )}

                      {paymentMethodsConfig.dinheiroHabilitado && (
                        <div className={`p-3 rounded-xl border text-center transition-all ${
                          paymentMethodsConfig.metodoPadrao === 'dinheiro'
                            ? 'bg-emerald-400/20 border-emerald-400 text-white shadow-md'
                            : 'bg-black/40 border-white/10 text-white/70'
                        }`}>
                          <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                          <div className="font-heading font-black text-[11px]">DINHEIRO</div>
                          <div className="text-[9px] text-white/40">Troco</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                      <span>Total de botões ativos no checkout:</span>
                      <span className="font-bold text-white">
                        {[
                          paymentMethodsConfig.pixHabilitado,
                          paymentMethodsConfig.cartaoDebitoHabilitado,
                          paymentMethodsConfig.cartaoCreditoHabilitado,
                          paymentMethodsConfig.tapOnPhoneHabilitado,
                          paymentMethodsConfig.dinheiroHabilitado,
                        ].filter(Boolean).length} opções
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-8 text-center text-white/20 text-xs">
            EstiloExatoZap • Painel Financeiro, Gráficos & Exportação em PDF
          </div>
        </div>

        {/* Modal / Dialog de QR Code Pix Dinâmico para Atendimento Específico */}
        {activePixModalClient && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-lg bg-[#1C1C1B] border-2 border-[#F2CA50] rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl animate-scaleUp max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 border border-[#F2CA50]/40 flex items-center justify-center text-[#F2CA50] shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-white text-base">
                      QR Code Pix Exclusivo do Atendimento
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Chave dinâmica e valor exato calculados em tempo real
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePixModalClient(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Informações do Atendimento & Valor Exato */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                      Cliente
                    </label>
                    <input
                      type="text"
                      value={activePixModalClient.name}
                      onChange={(e) => setActivePixModalClient({ ...activePixModalClient, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/70 text-white border border-white/10 text-xs font-bold focus:border-[#F2CA50] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                      Serviço / Descrição
                    </label>
                    <input
                      type="text"
                      value={activePixModalClient.reason || activePixModalClient.service || 'Serviço'}
                      onChange={(e) => setActivePixModalClient({ ...activePixModalClient, reason: e.target.value, service: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/70 text-white border border-white/10 text-xs focus:border-[#F2CA50] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-[#F2CA50] uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Valor Exato do Atendimento (R$)</span>
                      <span className="text-[9px] text-white/40 lowercase">editável</span>
                    </label>
                    <div className="flex items-center gap-1.5 bg-black/80 px-3 py-2 rounded-xl border-2 border-[#F2CA50]/40 font-mono text-sm text-[#F2CA50]">
                      <span className="font-bold">R$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.50"
                        value={activePixModalClient.amount}
                        onChange={(e) => setActivePixModalClient({ ...activePixModalClient, amount: Number(e.target.value) || 0 })}
                        className="w-full bg-transparent text-[#F2CA50] font-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                      WhatsApp do Cliente
                    </label>
                    <input
                      type="text"
                      value={activePixModalClient.phone || ''}
                      onChange={(e) => setActivePixModalClient({ ...activePixModalClient, phone: e.target.value })}
                      placeholder="Ex: 11999998888"
                      className="w-full px-3 py-2 rounded-xl bg-black/70 text-white border border-white/10 text-xs font-mono focus:border-[#F2CA50] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção de Chave Pix Dinâmica Deste Atendimento */}
              <div className="p-4 rounded-2xl bg-black/50 border border-[#F2CA50]/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <div className="text-xs font-bold text-[#F2CA50] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Chave Pix Deste Atendimento</span>
                  </div>

                  <div className="inline-flex rounded-lg bg-black/70 p-0.5 border border-white/10 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePixModalClient({
                          ...activePixModalClient,
                          isCustomKey: false,
                          chavePix: pixConfig.chaveValor,
                          chaveTipo: pixConfig.chaveTipo,
                          beneficiario: pixConfig.beneficiario,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        !activePixModalClient.isCustomKey
                          ? 'bg-white/20 text-white shadow'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      Chave Padrão
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePixModalClient({
                          ...activePixModalClient,
                          isCustomKey: true,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        activePixModalClient.isCustomKey
                          ? 'bg-[#F2CA50] text-black shadow'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      Chave Dinâmica
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                      Tipo de Chave
                    </label>
                    <select
                      value={activePixModalClient.chaveTipo}
                      onChange={(e) => setActivePixModalClient({ ...activePixModalClient, chaveTipo: e.target.value as any, isCustomKey: true })}
                      className="w-full px-2.5 py-2 rounded-xl bg-black/80 text-white border border-white/10 text-xs font-medium focus:border-[#F2CA50] focus:outline-none cursor-pointer"
                    >
                      <option value="cnpj">CNPJ</option>
                      <option value="cpf">CPF</option>
                      <option value="email">E-mail</option>
                      <option value="telefone">Celular</option>
                      <option value="aleatoria">Aleatória</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                      Chave Pix
                    </label>
                    <input
                      type="text"
                      value={activePixModalClient.chavePix}
                      onChange={(e) => setActivePixModalClient({ ...activePixModalClient, chavePix: e.target.value, isCustomKey: true })}
                      placeholder="Digite a chave Pix deste atendimento..."
                      className="w-full px-3 py-2 rounded-xl bg-black/80 text-white border border-white/10 text-xs font-mono focus:border-[#F2CA50] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                    Titular / Beneficiário da Chave
                  </label>
                  <input
                    type="text"
                    value={activePixModalClient.beneficiario}
                    onChange={(e) => setActivePixModalClient({ ...activePixModalClient, beneficiario: e.target.value, isCustomKey: true })}
                    placeholder="Nome do titular ou da barbearia..."
                    className="w-full px-3 py-2 rounded-xl bg-black/80 text-white border border-white/10 text-xs focus:border-[#F2CA50] focus:outline-none"
                  />
                </div>
              </div>

              {/* QR Code Container Dinâmico */}
              {(() => {
                const dynamicConfig: PixConfig = {
                  ...pixConfig,
                  chaveValor: activePixModalClient.chavePix,
                  chaveTipo: activePixModalClient.chaveTipo,
                  beneficiario: activePixModalClient.beneficiario,
                };
                const payload = pixRepository.generatePixCopiaECola(
                  dynamicConfig,
                  activePixModalClient.amount,
                  activePixModalClient.reason || activePixModalClient.service || 'Atendimento'
                );

                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-2xl mx-auto w-48 flex flex-col items-center justify-center border-2 border-[#F2CA50] shadow-md">
                      <div className="w-40 h-40 bg-black flex flex-col justify-between p-2.5 rounded-xl relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div className="w-8 h-8 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 bg-white" />
                          </div>
                          <div className="text-[9px] font-bold text-white/60">PIX</div>
                          <div className="w-8 h-8 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 bg-white" />
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-1 my-auto opacity-90 px-1">
                          {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-[1px] ${i % 2 === 0 ? 'bg-white' : 'bg-white/40'}`} />
                          ))}
                        </div>

                        <div className="flex justify-between items-end">
                          <div className="w-8 h-8 border-4 border-white bg-black p-0.5 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 bg-white" />
                          </div>
                          <div className="text-[8px] font-mono text-[#F2CA50] font-black">
                            {formatCurrency(activePixModalClient.amount)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-black uppercase tracking-wider mt-2">
                        Escanear com Banco
                      </span>
                    </div>

                    {/* Copia e Cola Payload Box */}
                    <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                      <div className="text-[10px] text-white/40 uppercase font-bold flex items-center justify-between">
                        <span>Código Pix Copia e Cola Exclusivo</span>
                        <span className="text-[#F2CA50] text-[9px] font-mono">
                          {activePixModalClient.chaveTipo.toUpperCase()} • {formatCurrency(activePixModalClient.amount)}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-black/80 font-mono text-[10px] text-white/70 truncate border border-white/5 select-all">
                        {payload}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(payload);
                          setPixSavedToast('Código Pix Copia e Cola copiado com sucesso!');
                          setTimeout(() => setPixSavedToast(null), 3000);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar Código Pix Copia e Cola</span>
                      </button>

                      {activePixModalClient.phone && (
                        <button
                          type="button"
                          onClick={async () => {
                            await handleSendDelinquentWhatsApp(
                              {
                                id: activePixModalClient.id || 'modal_client',
                                name: activePixModalClient.name,
                                phone: activePixModalClient.phone || '',
                                amount: activePixModalClient.amount,
                                daysPending: activePixModalClient.daysPending || 1,
                                reason: activePixModalClient.reason || activePixModalClient.service || 'Atendimento',
                                absences: 1,
                              },
                              activePixModalClient.chavePix,
                              activePixModalClient.chaveTipo,
                              activePixModalClient.beneficiario
                            );
                            setActivePixModalClient(null);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Enviar Cobrança no WhatsApp do Cliente</span>
                        </button>
                      )}

                      {activePixModalClient.isCustomKey && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSavePixConfig({
                              ...pixConfig,
                              chaveValor: activePixModalClient.chavePix,
                              chaveTipo: activePixModalClient.chaveTipo,
                              beneficiario: activePixModalClient.beneficiario,
                            });
                            setPixSavedToast('Chave Pix salva como novo padrão da barbearia!');
                            setTimeout(() => setPixSavedToast(null), 3000);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Definir Esta Chave como Padrão da Barbearia</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {/* Modal de Configuração e Exportação Consolidada em PDF */}
        {isPdfModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl bg-[#1C1C1B] border border-[#F2CA50]/40 p-6 space-y-5 shadow-2xl my-auto">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-white text-base uppercase tracking-wider">
                      Exportar Relatório em PDF
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Consolide faturamento mensal, histórico de atendimentos e desempenho da equipe.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Seleção de Período */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-white/50">
                  Período do Relatório
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mes_atual' as PdfReportPeriod, label: 'Mês Vigente' },
                    { id: '30_dias' as PdfReportPeriod, label: 'Últimos 30 Dias' },
                    { id: 'completo' as PdfReportPeriod, label: 'Tudo' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPdfPeriod(opt.id)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        pdfPeriod === opt.id
                          ? 'bg-[#F2CA50] text-black border-[#F2CA50] shadow-md font-black'
                          : 'bg-black/40 text-white/70 border-white/10 hover:border-white/25'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seções Consolidadas */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-white/50">
                  Blocos Incluídos no PDF
                </label>
                <div className="space-y-2">
                  {[
                    {
                      checked: pdfIncludeMonthlyRevenue,
                      onChange: setPdfIncludeMonthlyRevenue,
                      title: 'Faturamento Mensal & Meta do Mês',
                      desc: 'KPIs de receita, ticket médio e progresso visual da meta mensal.',
                    },
                    {
                      checked: pdfIncludeTeamPerformance,
                      onChange: setPdfIncludeTeamPerformance,
                      title: 'Desempenho da Equipe',
                      desc: 'Atendimentos, faturamento, taxa de ocupação e tempo médio por profissional.',
                    },
                    {
                      checked: pdfIncludeAttendanceHistory,
                      onChange: setPdfIncludeAttendanceHistory,
                      title: 'Histórico de Atendimentos',
                      desc: 'Tabela completa com data, cliente, serviço realizado, pagamento e valor.',
                    },
                    {
                      checked: pdfIncludeLoyaltyAndPayments,
                      onChange: setPdfIncludeLoyaltyAndPayments,
                      title: 'Métodos de Pagamento & Fidelidade',
                      desc: 'Distribuição por Pix/Cartão/Dinheiro e resgates do clube de vantagens.',
                    },
                  ].map((sec, idx) => (
                    <label
                      key={idx}
                      className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        sec.checked
                          ? 'bg-[#F2CA50]/10 border-[#F2CA50]/40'
                          : 'bg-black/40 border-white/10 opacity-65'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sec.checked}
                        onChange={(e) => sec.onChange(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-[#F2CA50] bg-black border-white/20 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{sec.title}</div>
                        <div className="text-[11px] text-white/50">{sec.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prévia Consolidada */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] flex items-center justify-between">
                  <span>Prévia dos Dados Consolidados</span>
                  <span className="text-white/50 font-normal normal-case">{getPeriodLabel(pdfPeriod)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <div className="text-[10px] text-white/40 uppercase">Faturamento</div>
                    <div className="font-heading font-black text-xs sm:text-sm text-[#F2CA50] mt-0.5">
                      {formatCurrency(pdfPreviewRevenue)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <div className="text-[10px] text-white/40 uppercase">Atendimentos</div>
                    <div className="font-heading font-black text-xs sm:text-sm text-white mt-0.5">
                      {pdfPreviewTransactions.length}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <div className="text-[10px] text-white/40 uppercase">Equipe</div>
                    <div className="font-heading font-black text-xs sm:text-sm text-[#25D366] mt-0.5">
                      {staffStats.length} prof.
                    </div>
                  </div>
                </div>
              </div>

              {exportErrorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-bold">
                  {exportErrorMessage}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F2CA50]/15 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Baixar Relatório PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
