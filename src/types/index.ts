export type QueueStatus = 'waiting' | 'in_service' | 'finished';

export interface QueueItem {
  id: string;
  atelierId: string;
  clientName: string;
  phone?: string;
  service: string;
  status: QueueStatus;
  ticketNumber: number;
  origin: 'loja' | 'app';
  timestamp: number;
  startedAt?: number;
  clientUid?: string;
}

export interface RealtimeWaitEstimate {
  estimatedMinutes: number;
  avgServiceMinutesToday: number;
  todayCompletedCount: number;
  waitingCount: number;
  inServiceCount: number;
  activeBarbersCount: number;
  peopleAhead: number;
  myPosition: number;
  myStatus: 'waiting' | 'in_service' | 'none';
  paceStatus: 'livre' | 'moderado' | 'intenso';
  calculatedAt: number;
}

export interface ServiceItem {
  id: string;
  atelierId: string;
  nome: string;
  preco: number;
  duracao: number; // minutes
}

export interface StaffMember {
  id: string;
  atelierId: string;
  nome: string;
  email?: string;
  celular?: string;
  cargo: string;
  ativo: boolean;
}

export interface PlanModel {
  id: string;
  atelierId: string;
  name: string;
  description: string;
  price: number;
  ativo?: boolean;
  subscribersCount?: number;
  limiteUsuarios: number;
  recursoWhatsApp: boolean;
  recursoRelatoriosAvancados: boolean;
  recursoFilaVirtual: boolean;
}

export type MetodoPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'tap_on_phone';

export interface Transaction {
  id: string;
  atelierId: string;
  cliente_nome: string;
  servico: string;
  valor: number;
  data: number; // timestamp ms
  metodo_pagamento?: MetodoPagamento;
  maquininha_id?: string;
  maquininha_nome?: string;
  nsu_autorizacao?: string;
  parcelas?: number;
}

export interface DailyTrendPoint {
  dateKey: string;
  label: string;
  diaSemana: string;
  volume: number;
  receita: number;
  ticketMedio: number;
}

export interface Appointment {
  id: string;
  atelierId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffId?: string;
  staffName?: string;
  data: string; // "YYYY-MM-DD"
  horario: string; // "14:30"
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido';
  observacoes?: string;
  recorrencia?: 'unico' | 'semanal' | 'quinzenal' | 'mensal';
  criadoEm: number;
  lembreteEnviadoEm?: number;
  lembreteSegundoEnviadoEm?: number;
}

export interface ScheduleTimeSlot {
  time: string;
  available: boolean;
  reason?: 'ocupado' | 'pausa' | 'passado' | 'lotado';
}

export interface DayAvailabilitySummary {
  dateStr: string;
  isOpen: boolean;
  reasonClosed?: string;
  horarioDia: string;
  pausaLabel?: string;
  slotDurationMinutes: number;
  vagasTotaisDia: number;
  vagasOcupadasDia: number;
  vagasRestantesDia: number;
  slots: ScheduleTimeSlot[];
  availableSlots: string[];
  recorrenciaHabilitada: boolean;
  descontoRecorrenciaPercentual: number;
  permitirClienteRecorrencia: boolean;
  frequenciaPadraoRecorrencia: 'semanal' | 'quinzenal' | 'mensal';
}

export interface ClientNotificationPreferences {
  permitirAvisoProximo: boolean;
  permitirAvisoVagaAberta: boolean;
  pushHabilitado?: boolean;
}

export interface ClientProfile {
  id: string;
  nome: string;
  email: string;
  pontos: number;
  atelier_origem: string;
  telefone?: string;
  notificacoes?: ClientNotificationPreferences;
  planoAssinaturaId?: string;
  planoAssinaturaNome?: string;
  planoAssinaturaStatus?: 'ativo' | 'pausado' | 'cancelado';
  planoAssinaturaInicio?: number;
  planoMultiplicadorPontos?: number;
}

export interface ClientLoyaltyPlan {
  id: string;
  atelierId: string;
  nome: string;
  descricao: string;
  precoMensal: number;
  cortesInclusosMes: number; // 0 = ilimitado
  multiplicadorPontos: number; // 1, 2, 3x pontos fidelidade
  descontoExtrasPercentual: number;
  prioridadeFila: boolean;
  ativo: boolean;
  criadoEm: number;
}

export interface LoyaltyConfig {
  atelierId: string;
  ativo: boolean;
  pontosNecessarios: number;
  pontosPorAtendimento: number;
  servicoRecompensa: string;
  regrasDescricao?: string;
  atualizadoEm: number;
}

export interface LoyaltyHistoryItem {
  id: string;
  atelierId: string;
  clientId: string;
  clientName: string;
  tipo: 'ganho' | 'resgate';
  pontos: number;
  descricao: string;
  voucherCodigo?: string;
  timestamp: number;
}

export interface DiaFuncionamento {
  diaSemana: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  nome: string;
  aberto: boolean;
  inicio: string; // "09:00"
  fim: string;    // "19:00"
  intervalo?: {
    habilitado: boolean;
    inicio: string; // "12:00"
    fim: string;    // "13:00"
  };
}

export interface ConfiguracaoRecorrencia {
  habilitado: boolean;
  frequenciaPadrao: 'semanal' | 'quinzenal' | 'mensal';
  permitirClienteSelecionar: boolean;
  descontoRecorrenciaPercentual: number; // ex: 10% de desconto para clientes recorrentes
}

export interface ConfiguracaoLembretesWhatsApp {
  habilitado: boolean;
  minutosAntes: number; // ex: 15, 30, 60, 120, 240, 1440 ou personalizado
  segundoLembreteHabilitado?: boolean;
  segundoLembreteMinutosAntes?: number;
  incluirInstrucaoConfirmacao?: boolean;
  respeitarHorarioComercial?: boolean;
  templatePersonalizado?: string;
}

export interface ConfiguracaoExpediente {
  vagasPorDia: number;
  limiteFilaSimultanea: number;
  duracaoEstimadaMinutos: number;
  permitirFilaForaHorario: boolean;
  dias: DiaFuncionamento[];
  recorrencia?: ConfiguracaoRecorrencia;
  pausaGeral?: {
    habilitado: boolean;
    inicio: string; // "12:00"
    fim: string;    // "13:00"
    descricao?: string;
  };
  diasExcecaoFechados?: string[]; // ["2026-12-25", "2027-01-01"]
  configuracaoLembretes?: ConfiguracaoLembretesWhatsApp;
  metasProdutividadeDiaria?: Record<string, number>; // staffId -> atendimentos/dia
}

export interface AtelierProfile {
  id: string;
  atelierId: string;
  nome_negocio: string;
  email: string;
  status_assinatura: 'trial' | 'ativo' | 'suspenso';
  data_expiracao: number; // timestamp ms
  configurado: boolean;
  tipo_servico: string;
  tema: 'obsidian' | 'aura';
  criado_em: number;
  endereco?: {
    pais: string;
    cep: string;
    cidade: string;
    endereco: string;
  };
  segmentacao?: {
    ramo: string;
    valor_base: string;
    equipe_size: string;
  };
  expediente?: ConfiguracaoExpediente;
  customDomain?: string;
  domainVerified?: boolean;
  metaDiariaFaturamento?: number;
  metaMensalFaturamento?: number;
}

export interface WhatsAppConfig {
  atelierId: string;
  provider: 'meta_cloud' | 'zapi';
  connected: boolean;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  instanceId?: string;
  instanceToken?: string;
  // Automações
  autoSendConfirmation: boolean;
  autoSendReminder: boolean;
  reminderHoursBefore: number;
  autoSendQueueCall: boolean;
  autoSendYouAreNext?: boolean;
  autoSendSlotOpened?: boolean;
  // Modelos de mensagens personalizados
  templateConfirmation: string;
  templateReminder: string;
  templateQueueCall: string;
  templateYouAreNext?: string;
  templateSlotOpened?: string;
  // Telefone do Administrador para testes
  adminTestPhone?: string;
  // Auto-Ativação e Chave de API de Validação
  autoActivationEnabled?: boolean;
  autoActivationApiKey?: string;
  // Automação de Respostas Inteligentes (IA)
  smartReplyEnabled?: boolean;
  smartReplyTone?: 'cordial' | 'profissional' | 'descontraido' | 'direto';
  smartReplyAutoSuggest?: boolean;
  smartReplyCustomInstructions?: string;
  // Auto-resposta de Ausência (fora do horário ou ocupado)
  autoReplyAbsenceEnabled?: boolean;
  autoReplyAbsenceMode?: 'fora_horario' | 'ocupado' | 'ambos';
  templateAbsenceReply?: string;
}

export interface WhatsAppChatMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: number;
  aiSuggested?: boolean;
}

export interface WhatsAppChatThread {
  id: string;
  atelierId: string;
  clientName: string;
  clientPhone: string;
  serviceName?: string;
  unread: boolean;
  lastUpdated: number;
  messages: WhatsAppChatMessage[];
}

export interface SmartReplySuggestion {
  id: string;
  label: string;
  tone: string;
  text: string;
}

export interface SmartReplyAnalysis {
  detectedIntent: string;
  urgency: 'baixa' | 'media' | 'alta';
  summary: string;
  suggestions: SmartReplySuggestion[];
}

export interface WhatsAppLog {
  id: string;
  atelierId: string;
  recipientPhone: string;
  recipientName: string;
  type: 'confirmacao' | 'lembrete' | 'chamada' | 'teste' | 'voce_e_o_proximo' | 'vaga_aberta' | 'ausencia';
  message: string;
  status: 'enviado' | 'falha' | 'pendente';
  timestamp: number;
}

export interface PixConfig {
  atelierId: string;
  chaveTipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  chaveValor: string;
  chaveAlias?: string;
  beneficiario: string;
  cidade: string;
  autoGerarQrCode: boolean;
  lembreteAutomaticoAtivo: boolean;
  diasAposVencimento: number;
  templateLembrete: string;
}

export interface AuthSession {
  user: {
    uid: string;
    email: string;
    role: 'owner' | 'staff' | 'client';
  } | null;
}

export interface AuditLogItem {
  id: string;
  atelierId: string;
  usuario: string;
  acao: string;
  categoria: 'configuracao' | 'financeiro' | 'whatsapp' | 'equipe' | 'seguranca';
  detalhes: string;
  timestamp: number;
}

export type MaquininhaMarca = 'stone' | 'pagbank' | 'cielo' | 'rede' | 'mercadopago' | 'infinitepay' | 'smart_pos' | 'outra';

export type MaquininhaConexao = 'bluetooth' | 'wifi' | 'tap_on_phone' | 'standalone';

export interface MaquininhaCartao {
  id: string;
  atelierId: string;
  nome: string;
  marca: MaquininhaMarca;
  modelo: string;
  tipoConexao: MaquininhaConexao;
  numeroSerie?: string;
  conectada: boolean;
  padrao: boolean;
  taxaDebito?: number;
  taxaCreditoVista?: number;
  taxaCreditoParcelado?: number;
}

export interface PaymentMethodsConfig {
  atelierId: string;
  pixHabilitado: boolean;
  cartaoDebitoHabilitado: boolean;
  cartaoCreditoHabilitado: boolean;
  tapOnPhoneHabilitado: boolean;
  dinheiroHabilitado: boolean;
  metodoPadrao: MetodoPagamento;
}

export interface DigitalReceiptConfig {
  atelierId: string;
  ativo: boolean; // Envio automático ativo após conclusão
  enviarWhatsAppAutomatico: boolean; // Disparo automático do recibo via WhatsApp
  permitirDownloadPdf: boolean; // Permitir download do arquivo PDF
  
  // Identidade Visual
  mostrarLogo: boolean;
  logoUrl?: string;
  tituloRecibo: string; // ex: "COMPROVANTE DE PAGAMENTO & ATENDIMENTO"
  subtitulo: string; // ex: "Atelier de Estilo Masculino • Excelência em Corte & Barba"
  corDestaque: string; // ex: "#F2CA50" ou "#25D366" ou "#3B82F6"
  
  // Informações do Estabelecimento
  mostrarCnpj: boolean;
  cnpj: string;
  mostrarEndereco: boolean;
  enderecoCompleto: string;
  mostrarTelefone: boolean;
  telefoneContato: string;
  mostrarInstagram: boolean;
  instagramHandle: string;
  
  // Detalhes do Serviço & Atendimento
  mostrarDetalhesServico: boolean;
  mostrarProfissional: boolean;
  mostrarFormaPagamento: boolean;
  mostrarDadosMaquininha: boolean; // NSU, Maquininha POS, bandeira
  mostrarDataHora: boolean;
  mostrarCodigoAutenticidade: boolean; // ex: "AUT-9482-BR"
  
  // Mensagem e Rodapé
  mensagemAgradecimento: string;
  termosGarantia: string;
  incluirChavePixGorjeta: boolean;
}

export interface ServiceProductUsage {
  serviceId: string;
  serviceName: string;
  consumoPorAtendimento: number;
}

export interface InventoryProduct {
  id: string;
  atelierId: string;
  nome: string;
  fotoUrl?: string;
  categoria: 'consumo_interno' | 'higiene_descartaveis' | 'revenda';
  unidade: string;
  quantidadeAtual: number;
  estoqueMinimo: number;
  custoUnitario?: number;
  servicosAssociados: ServiceProductUsage[];
  atualizadoEm: number;
}

export interface InventoryMovement {
  id: string;
  atelierId: string;
  productId: string;
  productName: string;
  tipo: 'entrada' | 'baixa_automatica' | 'ajuste_manual';
  quantidade: number;
  motivo: string;
  timestamp: number;
}

export interface ServiceFeedback {
  id: string;
  atelierId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  nota: 1 | 2 | 3 | 4 | 5;
  comentario: string;
  tags?: string[];
  criadoEm: number;
}
