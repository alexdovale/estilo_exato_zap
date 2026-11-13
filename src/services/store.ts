import { 
  QueueItem, 
  ServiceItem, 
  StaffMember, 
  PlanModel, 
  Transaction, 
  ClientProfile, 
  AtelierProfile,
  WhatsAppConfig,
  WhatsAppLog,
  DailyTrendPoint,
  DiaFuncionamento,
  ConfiguracaoExpediente,
  ClientNotificationPreferences,
  Appointment,
  AuditLogItem,
  PixConfig,
  MaquininhaCartao,
  MetodoPagamento,
  PaymentMethodsConfig,
  DigitalReceiptConfig,
  WhatsAppChatThread,
  WhatsAppChatMessage,
  SmartReplyAnalysis,
  InventoryProduct,
  InventoryMovement,
  ServiceProductUsage,
  ServiceFeedback,
  RealtimeWaitEstimate,
  LoyaltyConfig,
  LoyaltyHistoryItem,
  ClientLoyaltyPlan,
  ScheduleTimeSlot,
  DayAvailabilitySummary
} from '../types';
import { broadcastRealtimeEvent } from './notificationService';

const STORAGE_KEYS = {
  CURRENT_USER: 'estilo_current_user',
  ATELIERS: 'estilo_ateliers',
  QUEUE: 'estilo_queue',
  SERVICES: 'estilo_services',
  STAFF: 'estilo_staff',
  PLANS: 'estilo_plans',
  TRANSACTIONS: 'estilo_transactions',
  CLIENTS: 'estilo_clients',
  WHATSAPP_CONFIG: 'estilo_whatsapp_config',
  WHATSAPP_LOGS: 'estilo_whatsapp_logs',
  WHATSAPP_CHATS: 'estilo_whatsapp_chats',
  APPOINTMENTS: 'estilo_appointments',
  AUDIT_LOGS: 'estilo_audit_logs',
  PIX_CONFIG: 'estilo_pix_config',
  CARD_MACHINES: 'estilo_card_machines',
  PAYMENT_METHODS_CONFIG: 'estilo_payment_methods_config',
  DIGITAL_RECEIPT_CONFIG: 'estilo_digital_receipt_config',
  INVENTORY_PRODUCTS: 'estilo_inventory_products',
  INVENTORY_MOVEMENTS: 'estilo_inventory_movements',
  SERVICE_FEEDBACKS: 'estilo_service_feedbacks',
  LOYALTY_CONFIG: 'estilo_loyalty_config',
  LOYALTY_HISTORY: 'estilo_loyalty_history',
  CLIENT_LOYALTY_PLANS: 'estilo_client_loyalty_plans',
};

// Initial default seed atelier
const DEFAULT_ATELIER_ID = 'demo-atelier-1';
const DEFAULT_CLIENT_ID = 'demo-client-1';

export const DEFAULT_EXPEDIENTE: ConfiguracaoExpediente = {
  vagasPorDia: 25,
  limiteFilaSimultanea: 12,
  duracaoEstimadaMinutos: 35,
  permitirFilaForaHorario: false,
  dias: [
    { diaSemana: 'seg', nome: 'Segunda-feira', aberto: true, inicio: '09:00', fim: '19:00', intervalo: { habilitado: true, inicio: '12:00', fim: '13:00' } },
    { diaSemana: 'ter', nome: 'Terça-feira', aberto: true, inicio: '09:00', fim: '19:00', intervalo: { habilitado: true, inicio: '12:00', fim: '13:00' } },
    { diaSemana: 'qua', nome: 'Quarta-feira', aberto: true, inicio: '09:00', fim: '19:00', intervalo: { habilitado: true, inicio: '12:00', fim: '13:00' } },
    { diaSemana: 'qui', nome: 'Quinta-feira', aberto: true, inicio: '09:00', fim: '19:00', intervalo: { habilitado: true, inicio: '12:00', fim: '13:00' } },
    { diaSemana: 'sex', nome: 'Sexta-feira', aberto: true, inicio: '08:30', fim: '20:00', intervalo: { habilitado: false, inicio: '12:00', fim: '13:00' } },
    { diaSemana: 'sab', nome: 'Sábado', aberto: true, inicio: '08:30', fim: '18:30', intervalo: { habilitado: false, inicio: '12:00', fim: '13:00' } },
    { diaSemana: 'dom', nome: 'Domingo', aberto: false, inicio: '09:00', fim: '14:00', intervalo: { habilitado: false, inicio: '12:00', fim: '13:00' } },
  ],
  recorrencia: {
    habilitado: true,
    frequenciaPadrao: 'semanal',
    permitirClienteSelecionar: true,
    descontoRecorrenciaPercentual: 10,
  },
  pausaGeral: {
    habilitado: true,
    inicio: '12:00',
    fim: '13:00',
    descricao: 'Almoço Simultâneo da Equipe',
  },
  diasExcecaoFechados: ['2026-12-25', '2027-01-01'],
};

const INITIAL_ATELIER: AtelierProfile = {
  id: DEFAULT_ATELIER_ID,
  atelierId: DEFAULT_ATELIER_ID,
  nome_negocio: 'Barbearia Estilo Real',
  email: 'dono@estiloreal.com',
  status_assinatura: 'trial',
  data_expiracao: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days from now
  configurado: true,
  tipo_servico: 'Barbearia',
  tema: 'obsidian',
  criado_em: Date.now() - 2 * 24 * 60 * 60 * 1000,
  endereco: {
    pais: 'Brasil',
    cep: '01310-100',
    cidade: 'São Paulo',
    endereco: 'Av. Paulista, 1000 - Bela Vista',
  },
  segmentacao: {
    ramo: 'Barbearia',
    valor_base: '50.00',
    equipe_size: '3',
  },
  expediente: DEFAULT_EXPEDIENTE,
};

const INITIAL_SERVICES: ServiceItem[] = [
  { id: 's1', atelierId: DEFAULT_ATELIER_ID, nome: 'Corte Degradê Fade', preco: 55.0, duracao: 35 },
  { id: 's2', atelierId: DEFAULT_ATELIER_ID, nome: 'Barba Terapia com Toalha Quente', preco: 45.0, duracao: 30 },
  { id: 's3', atelierId: DEFAULT_ATELIER_ID, nome: 'Combo Completo (Cabelo + Barba)', preco: 90.0, duracao: 60 },
  { id: 's4', atelierId: DEFAULT_ATELIER_ID, nome: 'Acabamento / Pezinho + Sobrancelha', preco: 25.0, duracao: 20 },
];

const INITIAL_STAFF: StaffMember[] = [
  { id: 'st1', atelierId: DEFAULT_ATELIER_ID, nome: 'Rodrigo "Navalha"', email: 'rodrigo@estilo.com', celular: '11988887777', cargo: 'Barbeiro Chefe', ativo: true },
  { id: 'st2', atelierId: DEFAULT_ATELIER_ID, nome: 'Marcos Silva', email: 'marcos@estilo.com', celular: '11977776666', cargo: 'Barbeiro', ativo: true },
  { id: 'st3', atelierId: DEFAULT_ATELIER_ID, nome: 'Beatriz Lima', email: 'beatriz@estilo.com', celular: '11966665555', cargo: 'Recepcionista', ativo: true },
];

const INITIAL_PLANS: PlanModel[] = [
  { 
    id: 'p_bronze', 
    atelierId: DEFAULT_ATELIER_ID, 
    name: 'PLANO BRONZE', 
    description: 'Essencial para barbearias iniciantes. Fila básica e agendamentos.', 
    price: 49.9,
    ativo: true,
    limiteUsuarios: 2,
    recursoWhatsApp: false,
    recursoRelatoriosAvancados: false,
    recursoFilaVirtual: true,
    subscribersCount: 8,
  },
  { 
    id: 'p_prata', 
    atelierId: DEFAULT_ATELIER_ID, 
    name: 'PLANO PRATA', 
    description: 'Para barbearias em crescimento. WhatsApp automatizado e até 5 funcionários.', 
    price: 99.9,
    ativo: true,
    limiteUsuarios: 5,
    recursoWhatsApp: true,
    recursoRelatoriosAvancados: true,
    recursoFilaVirtual: true,
    subscribersCount: 15,
  },
  { 
    id: 'p_ouro', 
    atelierId: DEFAULT_ATELIER_ID, 
    name: 'PLANO OURO VIP', 
    description: 'Solução completa sem limites. Equipe ilimitada, WhatsApp Pro e relatórios avançados.', 
    price: 149.9,
    ativo: true,
    limiteUsuarios: 20,
    recursoWhatsApp: true,
    recursoRelatoriosAvancados: true,
    recursoFilaVirtual: true,
    subscribersCount: 24,
  },
];

const INITIAL_CLIENT_LOYALTY_PLANS: ClientLoyaltyPlan[] = [
  {
    id: 'clp_essencial',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Clube Corte Essencial',
    descricao: '2 cortes por mês + pontuação acelerada no Cartão Fidelidade Digital.',
    precoMensal: 79.9,
    cortesInclusosMes: 2,
    multiplicadorPontos: 1,
    descontoExtrasPercentual: 10,
    prioridadeFila: false,
    ativo: true,
    criadoEm: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'clp_vip',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Clube Barba & Corte VIP',
    descricao: '4 atendimentos no mês, pontos em dobro (2x) na fidelidade e prioridade na fila.',
    precoMensal: 139.9,
    cortesInclusosMes: 4,
    multiplicadorPontos: 2,
    descontoExtrasPercentual: 15,
    prioridadeFila: true,
    ativo: true,
    criadoEm: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'clp_black',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Fidelidade Black Ilimitado',
    descricao: 'Cortes e barbas ilimitados no mês, 3x pontos fidelidade e 20% OFF em produtos.',
    precoMensal: 189.9,
    cortesInclusosMes: 0,
    multiplicadorPontos: 3,
    descontoExtrasPercentual: 20,
    prioridadeFila: true,
    ativo: true,
    criadoEm: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
];

const INITIAL_QUEUE: QueueItem[] = [
  {
    id: 'q1',
    atelierId: DEFAULT_ATELIER_ID,
    clientName: 'Carlos Eduardo',
    phone: '5511987654321',
    service: 'Corte Degradê Fade',
    status: 'in_service',
    ticketNumber: 1,
    origin: 'loja',
    timestamp: Date.now() - 15 * 60 * 1000,
  },
  {
    id: 'q2',
    atelierId: DEFAULT_ATELIER_ID,
    clientName: 'Lucas Ferreira',
    phone: '5511991234567',
    service: 'Combo Completo (Cabelo + Barba)',
    status: 'waiting',
    ticketNumber: 2,
    origin: 'app',
    timestamp: Date.now() - 8 * 60 * 1000,
  },
  {
    id: 'q3',
    atelierId: DEFAULT_ATELIER_ID,
    clientName: 'Gabriel Souza',
    phone: '5511978901234',
    service: 'Corte Degradê Fade',
    status: 'waiting',
    ticketNumber: 3,
    origin: 'loja',
    timestamp: Date.now() - 3 * 60 * 1000,
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'André Ramos',
    servico: 'Corte Degradê Fade + Pomada',
    valor: 90.0,
    data: Date.now() - 35 * 60 * 1000,
    metodo_pagamento: 'pix',
  },
  {
    id: 't2',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Thiago Oliveira',
    servico: 'Barba Terapia com Toalha Quente',
    valor: 45.0,
    data: Date.now() - 95 * 60 * 1000,
    metodo_pagamento: 'cartao_debito',
    maquininha_nome: 'Stone Smart POS Pro',
    nsu_autorizacao: 'STN-893421',
  },
  {
    id: 't3',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Marcelo Vieira',
    servico: 'Combo Completo (Cabelo + Barba)',
    valor: 90.0,
    data: Date.now() - 170 * 60 * 1000,
    metodo_pagamento: 'cartao_credito',
    maquininha_nome: 'Stone Smart POS Pro',
    nsu_autorizacao: 'STN-893422',
    parcelas: 2,
  },
  {
    id: 't4',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Lucas Ferreira',
    servico: 'Corte Navalhado',
    valor: 60.0,
    data: Date.now() - 260 * 60 * 1000,
    metodo_pagamento: 'tap_on_phone',
  },
  {
    id: 't5',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Rodrigo Santoro',
    servico: 'Cabelo + Sobrancelha',
    valor: 75.0,
    data: Date.now() - 340 * 60 * 1000,
    metodo_pagamento: 'dinheiro',
  },
  {
    id: 't6',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Felipe Alencar',
    servico: 'Corte Tradicional',
    valor: 50.0,
    data: Date.now() - 1 * 24 * 60 * 60 * 1000 - 120 * 60 * 1000,
    metodo_pagamento: 'pix',
  },
  {
    id: 't7',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Gabriel Pires',
    servico: 'Barba Alinhada',
    valor: 40.0,
    data: Date.now() - 1 * 24 * 60 * 60 * 1000 - 180 * 60 * 1000,
    metodo_pagamento: 'cartao_debito',
    maquininha_nome: 'Stone Smart POS Pro',
  },
  {
    id: 't8',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Bruno Carvalho',
    servico: 'Combo VIP Completo',
    valor: 110.0,
    data: Date.now() - 1 * 24 * 60 * 60 * 1000 - 240 * 60 * 1000,
    metodo_pagamento: 'cartao_credito',
    parcelas: 3,
  },
  {
    id: 't9',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Diego Rocha',
    servico: 'Corte Degradê Fade',
    valor: 55.0,
    data: Date.now() - 2 * 24 * 60 * 60 * 1000 - 100 * 60 * 1000,
    metodo_pagamento: 'pix',
  },
  {
    id: 't10',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Eduardo Martins',
    servico: 'Barboterapia & Hidratação',
    valor: 65.0,
    data: Date.now() - 2 * 24 * 60 * 60 * 1000 - 210 * 60 * 1000,
    metodo_pagamento: 'tap_on_phone',
  },
  {
    id: 't11',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Henrique Guimarães',
    servico: 'Corte + Barba',
    valor: 85.0,
    data: Date.now() - 2 * 24 * 60 * 60 * 1000 - 320 * 60 * 1000,
    metodo_pagamento: 'dinheiro',
  },
  {
    id: 't12',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Matheus Prado',
    servico: 'Corte Degradê Fade',
    valor: 55.0,
    data: Date.now() - 3 * 24 * 60 * 60 * 1000 - 140 * 60 * 1000,
    metodo_pagamento: 'pix',
  },
  {
    id: 't13',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Rafael Nogueira',
    servico: 'Combo Completo',
    valor: 95.0,
    data: Date.now() - 3 * 24 * 60 * 60 * 1000 - 230 * 60 * 1000,
    metodo_pagamento: 'cartao_debito',
  },
  {
    id: 't14',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Leonardo Moura',
    servico: 'Corte Masculino',
    valor: 50.0,
    data: Date.now() - 4 * 24 * 60 * 60 * 1000 - 180 * 60 * 1000,
    metodo_pagamento: 'pix',
  },
  {
    id: 't15',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Vinícius Silva',
    servico: 'Barba Terapia',
    valor: 45.0,
    data: Date.now() - 4 * 24 * 60 * 60 * 1000 - 300 * 60 * 1000,
    metodo_pagamento: 'cartao_credito',
  },
  {
    id: 't16',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Guilherme Castro',
    servico: 'Corte Degradê + Barba',
    valor: 90.0,
    data: Date.now() - 5 * 24 * 60 * 60 * 1000 - 150 * 60 * 1000,
    metodo_pagamento: 'pix',
  },
  {
    id: 't17',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Renato Farias',
    servico: 'Corte Simples',
    valor: 50.0,
    data: Date.now() - 5 * 24 * 60 * 60 * 1000 - 270 * 60 * 1000,
    metodo_pagamento: 'dinheiro',
  },
  {
    id: 't18',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Danilo Azevedo',
    servico: 'Combo Cabelo e Barba',
    valor: 90.0,
    data: Date.now() - 6 * 24 * 60 * 60 * 1000 - 200 * 60 * 1000,
    metodo_pagamento: 'cartao_debito',
  },
  {
    id: 't19',
    atelierId: DEFAULT_ATELIER_ID,
    cliente_nome: 'Murilo Campos',
    servico: 'Corte Degradê',
    valor: 55.0,
    data: Date.now() - 6 * 24 * 60 * 60 * 1000 - 310 * 60 * 1000,
    metodo_pagamento: 'tap_on_phone',
  },
];

const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: DEFAULT_CLIENT_ID,
    nome: 'Arthur Shelby da Silva',
    email: 'arthur.shelby@exemplo.com',
    pontos: 6,
    atelier_origem: DEFAULT_ATELIER_ID,
    telefone: '11988889999',
    notificacoes: {
      permitirAvisoProximo: true,
      permitirAvisoVagaAberta: true,
      pushHabilitado: true,
    },
  },
  {
    id: 'cli_carlos',
    nome: 'Carlos Eduardo',
    email: 'carlos.edu@exemplo.com',
    pontos: 3,
    atelier_origem: DEFAULT_ATELIER_ID,
    telefone: '11987654321',
    notificacoes: {
      permitirAvisoProximo: true,
      permitirAvisoVagaAberta: true,
      pushHabilitado: true,
    },
  },
  {
    id: 'cli_lucas',
    nome: 'Lucas Ferreira',
    email: 'lucas.f@exemplo.com',
    pontos: 8,
    atelier_origem: DEFAULT_ATELIER_ID,
    telefone: '11991234567',
    notificacoes: {
      permitirAvisoProximo: true,
      permitirAvisoVagaAberta: false, // exemplo de cliente que desabilitou vaga aberta
      pushHabilitado: true,
    },
  },
  {
    id: 'cli_gabriel',
    nome: 'Gabriel Souza',
    email: 'gabriel.s@exemplo.com',
    pontos: 2,
    atelier_origem: DEFAULT_ATELIER_ID,
    telefone: '11978901234',
    notificacoes: {
      permitirAvisoProximo: false, // exemplo de cliente que desabilitou aviso de próximo
      permitirAvisoVagaAberta: true,
      pushHabilitado: false,
    },
  },
  {
    id: 'cli_marcos',
    nome: 'Marcos Vinicius',
    email: 'marcos.v@exemplo.com',
    pontos: 5,
    atelier_origem: DEFAULT_ATELIER_ID,
    telefone: '11988887777',
    notificacoes: {
      permitirAvisoProximo: true,
      permitirAvisoVagaAberta: true,
      pushHabilitado: true,
    },
  },
  {
    id: 'cli_diego',
    nome: 'Diego Santana',
    email: 'diego.santana@exemplo.com',
    pontos: 1,
    atelier_origem: DEFAULT_ATELIER_ID,
    telefone: '11977778888',
    notificacoes: {
      permitirAvisoProximo: true,
      permitirAvisoVagaAberta: true,
      pushHabilitado: true,
    },
  },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_demo_1',
    atelierId: DEFAULT_ATELIER_ID,
    clientId: DEFAULT_CLIENT_ID,
    clientName: 'Arthur Shelby da Silva',
    clientPhone: '11988889999',
    serviceId: 's1',
    serviceName: 'Corte Degradê Fade',
    servicePrice: 55.0,
    serviceDuration: 35,
    staffId: 'st1',
    staffName: 'Rodrigo "Navalha"',
    data: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    horario: '15:30',
    status: 'confirmado',
    criadoEm: Date.now() - 2 * 60 * 60 * 1000,
  },
];

// Helper to get / set typed localStorage
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('estilo_store_updated', { detail: { key } }));
  } catch (e) {
    console.error('Error setting localStorage', e);
  }
}

// Initialize seed data once
export function initializeStore(): void {
  if (!localStorage.getItem(STORAGE_KEYS.ATELIERS)) {
    setItem(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
  } else {
    // Garantir que ateliês existentes tenham a configuração de expediente
    const currentAteliers = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    let hasChanges = false;
    const patched = currentAteliers.map(a => {
      if (!a.expediente) {
        hasChanges = true;
        return { ...a, expediente: DEFAULT_EXPEDIENTE };
      }
      return a;
    });
    if (hasChanges) {
      setItem(STORAGE_KEYS.ATELIERS, patched);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    setItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
    setItem(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    setItem(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLIENT_LOYALTY_PLANS)) {
    setItem(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, INITIAL_CLIENT_LOYALTY_PLANS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUEUE)) {
    setItem(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    setItem(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    setItem(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  } else {
    // Garantir que clientes já salvos tenham estrutura de notificações
    const currentClients = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    let clientsModified = false;
    const patchedClients = currentClients.map(c => {
      if (!c.notificacoes) {
        clientsModified = true;
        return {
          ...c,
          notificacoes: {
            permitirAvisoProximo: true,
            permitirAvisoVagaAberta: true,
            pushHabilitado: true,
          },
        };
      }
      return c;
    });
    if (clientsModified) {
      setItem(STORAGE_KEYS.CLIENTS, patchedClients);
    }
  }
}

// --- AUTH REPOSITORY ---
export const authRepository = {
  getCurrentUser() {
    return getItem<{ uid: string; email: string; role: 'owner' | 'staff' | 'client'; atelierId?: string } | null>(
      STORAGE_KEYS.CURRENT_USER,
      null
    );
  },

  setCurrentUser(user: { uid: string; email: string; role: 'owner' | 'staff' | 'client'; atelierId?: string } | null) {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  async registerAtelier(email: string, password: string, businessName: string): Promise<AtelierProfile> {
    const ateliers = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const newId = 'atelier_' + Date.now();
    const trialExpiry = Date.now() + 14 * 24 * 60 * 60 * 1000;

    const newAtelier: AtelierProfile = {
      id: newId,
      atelierId: newId,
      nome_negocio: businessName,
      email: email,
      status_assinatura: 'trial',
      data_expiracao: trialExpiry,
      configurado: false, // forces to go to setup page
      tipo_servico: 'Barbearia',
      tema: 'obsidian',
      criado_em: Date.now(),
    };

    ateliers.push(newAtelier);
    setItem(STORAGE_KEYS.ATELIERS, ateliers);

    // Set current user
    this.setCurrentUser({
      uid: newId,
      email,
      role: 'owner',
      atelierId: newId,
    });

    return newAtelier;
  },

  async login(email: string, password: string): Promise<{ uid: string; email: string; role: 'owner' | 'staff'; atelierId: string }> {
    const ateliers = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const staffList = getItem<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);

    // Check if owner
    const matchedAtelier = ateliers.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (matchedAtelier) {
      const user = { uid: matchedAtelier.id, email: matchedAtelier.email, role: 'owner' as const, atelierId: matchedAtelier.id };
      this.setCurrentUser(user);
      return user;
    }

    // Check if staff
    const matchedStaff = staffList.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
    if (matchedStaff) {
      const user = { uid: matchedStaff.id, email: matchedStaff.email || email, role: 'staff' as const, atelierId: matchedStaff.atelierId };
      this.setCurrentUser(user);
      return user;
    }

    // Demo fallback for any login during testing: default to demo atelier
    const defaultAtelier = ateliers[0] || INITIAL_ATELIER;
    const fallbackUser = { uid: defaultAtelier.id, email, role: 'owner' as const, atelierId: defaultAtelier.id };
    this.setCurrentUser(fallbackUser);
    return fallbackUser;
  },

  async logout(): Promise<void> {
    this.setCurrentUser(null);
  },

  async sendPasswordResetEmail(email: string): Promise<boolean> {
    console.log(`Password reset email sent to ${email}`);
    return true;
  },
};

// --- QUEUE REPOSITORY ---
export const queueRepository = {
  getQueue(atelierId: string): QueueItem[] {
    const all = getItem<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
    return all.filter(item => item.atelierId === atelierId && item.status !== 'finished');
  },

  syncRemoteQueueItem(remoteItem: QueueItem): void {
    if (!remoteItem || !remoteItem.id) return;
    const all = getItem<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
    const exists = all.some(item => item.id === remoteItem.id);
    if (!exists) {
      all.push(remoteItem);
      setItem(STORAGE_KEYS.QUEUE, all);
    }
  },

  async addWalkInClient(atelierId: string, clientName: string, phone: string, service: string): Promise<QueueItem> {
    const all = getItem<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
    const newItem: QueueItem = {
      id: 'q_' + Date.now(),
      atelierId,
      clientName,
      phone,
      service: service || 'Presencial',
      status: 'waiting',
      ticketNumber: (all.length % 99) + 1,
      origin: 'loja',
      timestamp: Date.now(),
    };
    all.push(newItem);
    setItem(STORAGE_KEYS.QUEUE, all);

    void broadcastRealtimeEvent({
      atelierId,
      type: 'new_client_joined',
      targetClientName: clientName,
      targetClientPhone: phone,
      title: '🔔 Novo Cliente na Fila!',
      message: `${clientName} entrou na fila presencial (#${newItem.ticketNumber}) • ${newItem.service}.`,
      data: { queueItem: newItem },
    });

    return newItem;
  },

  async callNext(itemId: string): Promise<void> {
    const all = getItem<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
    const updated = all.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'in_service' as const, startedAt: Date.now() };
      }
      return item;
    });
    setItem(STORAGE_KEYS.QUEUE, updated);
  },

  async finishAndRecordTransaction(
    ticketId: string, 
    atelierId: string, 
    clientName: string, 
    serviceName: string, 
    value: number,
    paymentDetails?: {
      metodo_pagamento?: MetodoPagamento;
      maquininha_id?: string;
      maquininha_nome?: string;
      nsu_autorizacao?: string;
      parcelas?: number;
    }
  ): Promise<Transaction> {
    // 1. Update queue item to finished
    const allQueue = getItem<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
    const updatedQueue = allQueue.map(item => {
      if (item.id === ticketId) {
        return { ...item, status: 'finished' as const };
      }
      return item;
    });
    setItem(STORAGE_KEYS.QUEUE, updatedQueue);

    // 2. Record transaction
    const allTransactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      atelierId,
      cliente_nome: clientName,
      servico: serviceName,
      valor: value,
      data: Date.now(),
      metodo_pagamento: paymentDetails?.metodo_pagamento || 'dinheiro',
      maquininha_id: paymentDetails?.maquininha_id,
      maquininha_nome: paymentDetails?.maquininha_nome,
      nsu_autorizacao: paymentDetails?.nsu_autorizacao,
      parcelas: paymentDetails?.parcelas,
    };
    allTransactions.unshift(newTx);
    setItem(STORAGE_KEYS.TRANSACTIONS, allTransactions);

    // 3. Increment loyalty points according to configurable loyalty program & client subscription multiplier
    const loyaltyCfg = clientRepository.getLoyaltyConfig(atelierId);
    if (loyaltyCfg.ativo) {
      const basePoints = Math.max(1, loyaltyCfg.pontosPorAtendimento || 1);
      const allClients = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
      let matchedClient: ClientProfile | undefined;
      let earnedPoints = basePoints;
      const updatedClients = allClients.map(c => {
        if (c.nome.toLowerCase() === clientName.toLowerCase()) {
          const multiplier =
            c.planoAssinaturaStatus === 'ativo' ? Math.max(1, c.planoMultiplicadorPontos || 1) : 1;
          earnedPoints = basePoints * multiplier;
          matchedClient = { ...c, pontos: c.pontos + earnedPoints };
          return matchedClient;
        }
        return c;
      });
      setItem(STORAGE_KEYS.CLIENTS, updatedClients);

      if (matchedClient) {
        const history = getItem<LoyaltyHistoryItem[]>(STORAGE_KEYS.LOYALTY_HISTORY, []);
        const planTag =
          matchedClient.planoAssinaturaStatus === 'ativo' && (matchedClient.planoMultiplicadorPontos || 1) > 1
            ? ` (${matchedClient.planoAssinaturaNome || 'Assinante'} ${matchedClient.planoMultiplicadorPontos}x)`
            : '';
        history.unshift({
          id: 'loy_' + Date.now(),
          atelierId,
          clientId: matchedClient.id,
          clientName: matchedClient.nome,
          tipo: 'ganho',
          pontos: earnedPoints,
          descricao: `Atendimento concluído${planTag}: ${serviceName}`,
          timestamp: Date.now(),
        });
        setItem(STORAGE_KEYS.LOYALTY_HISTORY, history);
      }
    }

    // 4. Baixa automática de estoque dos produtos associados ao serviço finalizado
    inventoryRepository.deductStockForService(atelierId, serviceName, clientName);

    return newTx;
  },

  async notifyClient(phone: string, clientName: string, businessName: string): Promise<string> {
    const atelierId = authRepository.getCurrentUser()?.atelierId || DEFAULT_ATELIER_ID;
    const result = await whatsappRepository.sendMessage({
      atelierId,
      recipientName: clientName,
      recipientPhone: phone,
      type: 'chamada',
    });
    return result.message;
  },

  async notifyYouAreNext(phone: string, clientName: string, businessName: string): Promise<string> {
    const atelierId = authRepository.getCurrentUser()?.atelierId || DEFAULT_ATELIER_ID;

    // Verificar permissão individual do cliente
    if (!clientRepository.canClientReceive(phone || clientName, 'proximo')) {
      console.log(`[Push/WhatsApp Ignorado] Cliente ${clientName} (${phone}) desativou avisos de 'próximo da fila'.`);
      return `[Aviso não enviado: Cliente ${clientName} optou por não receber avisos de próximo da fila nas preferências individuais]`;
    }

    const result = await whatsappRepository.sendMessage({
      atelierId,
      recipientName: clientName,
      recipientPhone: phone,
      type: 'voce_e_o_proximo',
    });
    return result.message;
  },

  async notifySlotOpened(targetClients: QueueItem[], businessName: string): Promise<{ count: number; message: string }> {
    const atelierId = authRepository.getCurrentUser()?.atelierId || DEFAULT_ATELIER_ID;
    let lastMessage = '';
    let count = 0;

    for (const item of targetClients) {
      if (item.phone) {
        // Verificar permissão individual de vaga aberta do cliente
        const allowed = clientRepository.canClientReceive(item.phone || item.clientName, 'vaga_aberta');
        if (!allowed) {
          console.log(`[Push/WhatsApp Ignorado] Cliente ${item.clientName} desativou avisos de 'vaga aberta'.`);
          continue;
        }

        const result = await whatsappRepository.sendMessage({
          atelierId,
          recipientName: item.clientName,
          recipientPhone: item.phone,
          type: 'vaga_aberta',
        });
        lastMessage = result.message;
        count++;
      }
    }
    return { count, message: lastMessage };
  },

  async removeFromQueue(id: string): Promise<void> {
    const all = getItem<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
    setItem(STORAGE_KEYS.QUEUE, all.filter(q => q.id !== id));
  },

  getRealtimeWaitEstimate(
    atelierId: string,
    clientName?: string,
    clientUid?: string
  ): RealtimeWaitEstimate {
    const now = Date.now();
    const today = new Date(now);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const services = serviceRepository.getServices(atelierId);
    const team = teamRepository.getTeam(atelierId);
    const atelier = atelierRepository.getAtelier(atelierId);
    const activeBarbersCount = Math.max(1, team.length);

    const catalogDefaultAvg =
      services.length > 0
        ? Math.round(services.reduce((sum, s) => sum + (s.duracao || 25), 0) / services.length)
        : 25;
    const configuredDefault = atelier?.expediente?.duracaoEstimadaMinutos || catalogDefaultAvg || 25;

    const resolveServiceDuration = (serviceLabel: string, fallbackMin: number): number => {
      const normalized = (serviceLabel || '').trim().toLowerCase();
      if (!normalized) return fallbackMin;

      const exact = services.find(s => s.nome.trim().toLowerCase() === normalized);
      if (exact && exact.duracao > 0) return exact.duracao;

      // Support combined services e.g. "Corte + Barba"
      const parts = normalized.split(/[+,&/]/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        let summed = 0;
        let matchedCount = 0;
        for (const part of parts) {
          const match = services.find(
            s => s.nome.toLowerCase() === part || s.nome.toLowerCase().includes(part) || part.includes(s.nome.toLowerCase())
          );
          if (match && match.duracao > 0) {
            summed += match.duracao;
            matchedCount++;
          }
        }
        if (matchedCount > 0) return Math.min(120, summed);
      }

      const partial = services.find(
        s => normalized.includes(s.nome.toLowerCase()) || s.nome.toLowerCase().includes(normalized)
      );
      if (partial && partial.duracao > 0) return partial.duracao;

      return fallbackMin;
    };

    // 1. Average duration based on today's completed attendances (transactions + concluded appointments)
    const transactionsToday = financeRepository
      .getTransactions(atelierId)
      .filter(tx => tx.data >= startOfToday && tx.data <= now);

    const concludedAppointmentsToday = appointmentRepository
      .getAppointments(atelierId)
      .filter(apt => apt.data === todayIso && apt.status === 'concluido');

    const durationsToday: number[] = transactionsToday.map(tx =>
      resolveServiceDuration(tx.servico, configuredDefault)
    );

    if (durationsToday.length === 0 && concludedAppointmentsToday.length > 0) {
      for (const apt of concludedAppointmentsToday) {
        durationsToday.push(apt.serviceDuration || resolveServiceDuration(apt.serviceName, configuredDefault));
      }
    }

    const todayCompletedCount = durationsToday.length;
    const avgServiceMinutesToday =
      todayCompletedCount > 0
        ? Math.max(10, Math.min(120, Math.round(durationsToday.reduce((sum, d) => sum + d, 0) / todayCompletedCount)))
        : configuredDefault;

    // 2. Analyze current queue state and simulate chair turnover
    const activeQueue = this.getQueue(atelierId);
    const waitingQueue = activeQueue.filter(q => q.status === 'waiting');
    const inServiceQueue = activeQueue.filter(q => q.status === 'in_service');

    const normalizedClient = (clientName || '').trim().toLowerCase();
    const myEntry = activeQueue.find(
      q =>
        (clientUid && q.clientUid === clientUid) ||
        (normalizedClient && q.clientName.trim().toLowerCase() === normalizedClient)
    );

    const myStatus: RealtimeWaitEstimate['myStatus'] = myEntry
      ? myEntry.status === 'in_service'
        ? 'in_service'
        : 'waiting'
      : 'none';

    const myWaitingIdx =
      myStatus === 'waiting' && myEntry ? waitingQueue.findIndex(q => q.id === myEntry.id) : -1;
    const myPosition = myWaitingIdx >= 0 ? myWaitingIdx + 1 : 0;
    const peopleAhead = myWaitingIdx >= 0 ? myWaitingIdx : waitingQueue.length;

    let estimatedMinutes = 0;

    if (myStatus !== 'in_service') {
      // Simulate parallel chairs across active professionals
      const chairFinishTimes: number[] = Array.from({ length: activeBarbersCount }, (_, idx) => {
        const activeClient = inServiceQueue[idx];
        if (!activeClient) return 0; // free chair right now
        const expectedDur = resolveServiceDuration(activeClient.service, avgServiceMinutesToday);
        const startTime = activeClient.startedAt || activeClient.timestamp;
        const elapsedMin = Math.max(0, (now - startTime) / 60000);
        return Math.max(4, Math.round(expectedDur - elapsedMin));
      });

      const clientsToSimulate = waitingQueue.slice(0, peopleAhead);
      for (const queuedClient of clientsToSimulate) {
        chairFinishTimes.sort((a, b) => a - b);
        const clientDur = resolveServiceDuration(queuedClient.service, avgServiceMinutesToday);
        chairFinishTimes[0] += clientDur;
      }

      chairFinishTimes.sort((a, b) => a - b);
      estimatedMinutes = Math.max(0, Math.round(chairFinishTimes[0] ?? 0));
    }

    const paceStatus: RealtimeWaitEstimate['paceStatus'] =
      estimatedMinutes <= 15 ? 'livre' : estimatedMinutes <= 40 ? 'moderado' : 'intenso';

    return {
      estimatedMinutes,
      avgServiceMinutesToday,
      todayCompletedCount,
      waitingCount: waitingQueue.length,
      inServiceCount: inServiceQueue.length,
      activeBarbersCount,
      peopleAhead,
      myPosition,
      myStatus,
      paceStatus,
      calculatedAt: now,
    };
  },
};

// --- SETUP REPOSITORY ---
export const setupRepository = {
  async completeFullSetup(
    atelierId: string,
    location: { pais: string; cep: string; cidade: string; endereco: string },
    segmentation: { ramo: string; valor_base: string; equipe_size: string },
    services: Array<{ nome: string; preco: number; duracao: number }>,
    staff: Array<{ nome: string; celular: string; cargo: string }>
  ): Promise<void> {
    // 1. Update Atelier
    const ateliers = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const updatedAteliers = ateliers.map(a => {
      if (a.id === atelierId) {
        return {
          ...a,
          configurado: true,
          endereco: location,
          segmentacao: segmentation,
          tipo_servico: segmentation.ramo,
          tema: segmentation.ramo === 'Barbearia' ? ('obsidian' as const) : ('aura' as const),
        };
      }
      return a;
    });
    setItem(STORAGE_KEYS.ATELIERS, updatedAteliers);

    // 2. Add services
    if (services.length > 0) {
      const existingServices = getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      const newItems: ServiceItem[] = services.map((s, idx) => ({
        id: `s_custom_${Date.now()}_${idx}`,
        atelierId,
        nome: s.nome,
        preco: s.preco,
        duracao: s.duracao,
      }));
      setItem(STORAGE_KEYS.SERVICES, [...existingServices, ...newItems]);
    }

    // 3. Add staff
    if (staff.length > 0) {
      const existingStaff = getItem<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const newStaff: StaffMember[] = staff.map((st, idx) => ({
        id: `st_custom_${Date.now()}_${idx}`,
        atelierId,
        nome: st.nome,
        celular: st.celular,
        cargo: st.cargo,
        ativo: true,
      }));
      setItem(STORAGE_KEYS.STAFF, [...existingStaff, ...newStaff]);
    }
  },
};

// --- SERVICE REPOSITORY ---
export const serviceRepository = {
  getServices(atelierId: string): ServiceItem[] {
    const all = getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    return all.filter(s => s.atelierId === atelierId);
  },

  async addService(atelierId: string, nome: string, preco: number, duracao: number): Promise<ServiceItem> {
    const all = getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const newService: ServiceItem = {
      id: 'srv_' + Date.now(),
      atelierId,
      nome,
      preco,
      duracao,
    };
    all.push(newService);
    setItem(STORAGE_KEYS.SERVICES, all);
    return newService;
  },

  async deleteService(id: string): Promise<void> {
    const all = getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    setItem(STORAGE_KEYS.SERVICES, all.filter(s => s.id !== id));
  },
};

// --- TEAM REPOSITORY ---
export const teamRepository = {
  getTeam(atelierId: string): StaffMember[] {
    const all = getItem<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    return all.filter(s => s.atelierId === atelierId && s.ativo);
  },

  async addStaffMember(atelierId: string, nome: string, email: string, role: string, celular?: string): Promise<StaffMember> {
    const all = getItem<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    const newMember: StaffMember = {
      id: 'stf_' + Date.now(),
      atelierId,
      nome,
      email,
      celular,
      cargo: role,
      ativo: true,
    };
    all.push(newMember);
    setItem(STORAGE_KEYS.STAFF, all);
    return newMember;
  },

  async removeStaff(id: string): Promise<void> {
    const all = getItem<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    setItem(STORAGE_KEYS.STAFF, all.filter(s => s.id !== id));
  },
};

// --- PLAN REPOSITORY ---
export const planRepository = {
  getPlans(atelierId: string): PlanModel[] {
    const all = getItem<PlanModel[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    return all.filter(p => p.atelierId === atelierId);
  },

  async addPlan(
    atelierId: string, 
    name: string, 
    description: string, 
    price: number,
    limiteUsuarios: number = 5,
    recursoWhatsApp: boolean = true,
    recursoRelatoriosAvancados: boolean = true,
    recursoFilaVirtual: boolean = true
  ): Promise<PlanModel> {
    const all = getItem<PlanModel[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    const newPlan: PlanModel = {
      id: 'plan_' + Date.now(),
      atelierId,
      name,
      description,
      price,
      ativo: true,
      limiteUsuarios,
      recursoWhatsApp,
      recursoRelatoriosAvancados,
      recursoFilaVirtual,
      subscribersCount: 1,
    };
    all.push(newPlan);
    setItem(STORAGE_KEYS.PLANS, all);
    return newPlan;
  },

  async deletePlan(id: string): Promise<void> {
    const all = getItem<PlanModel[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    setItem(STORAGE_KEYS.PLANS, all.filter(p => p.id !== id));
  },

  async togglePlanStatus(id: string): Promise<void> {
    const all = getItem<PlanModel[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    const updated = all.map(p => {
      if (p.id === id) {
        const currentAtivo = p.ativo !== false;
        return { ...p, ativo: !currentAtivo };
      }
      return p;
    });
    setItem(STORAGE_KEYS.PLANS, updated);
  },

  getClientLoyaltyPlans(atelierId: string): ClientLoyaltyPlan[] {
    const all = getItem<ClientLoyaltyPlan[]>(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, INITIAL_CLIENT_LOYALTY_PLANS);
    const filtered = all.filter(p => p.atelierId === atelierId);
    if (filtered.length > 0) return filtered;
    // Clone defaults cleanly for a newly created atelier if none exist yet
    return INITIAL_CLIENT_LOYALTY_PLANS.map(p => ({ ...p, id: `${p.id}_${atelierId}`, atelierId }));
  },

  saveClientLoyaltyPlan(
    planData: Omit<ClientLoyaltyPlan, 'id' | 'criadoEm'> & { id?: string }
  ): ClientLoyaltyPlan {
    const all = getItem<ClientLoyaltyPlan[]>(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, INITIAL_CLIENT_LOYALTY_PLANS);
    if (planData.id) {
      let updatedPlan: ClientLoyaltyPlan | null = null;
      const updated = all.map(p => {
        if (p.id === planData.id) {
          updatedPlan = { ...p, ...planData };
          return updatedPlan;
        }
        return p;
      });
      if (updatedPlan) {
        setItem(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, updated);
        return updatedPlan;
      }
    }

    const newPlan: ClientLoyaltyPlan = {
      ...planData,
      id: 'clp_' + Date.now(),
      criadoEm: Date.now(),
    };
    const next = [...all.filter(p => p.atelierId !== planData.atelierId || p.id !== newPlan.id), newPlan];
    setItem(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, next);
    return newPlan;
  },

  toggleClientLoyaltyPlan(planId: string, atelierId: string): void {
    const currentList = this.getClientLoyaltyPlans(atelierId);
    const all = getItem<ClientLoyaltyPlan[]>(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, INITIAL_CLIENT_LOYALTY_PLANS);
    const existsInStorage = all.some(p => p.id === planId);
    const source = existsInStorage ? all : [...all, ...currentList];
    const updated = source.map(p => (p.id === planId ? { ...p, ativo: !p.ativo } : p));
    setItem(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, updated);
  },

  deleteClientLoyaltyPlan(planId: string): void {
    const all = getItem<ClientLoyaltyPlan[]>(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, INITIAL_CLIENT_LOYALTY_PLANS);
    setItem(STORAGE_KEYS.CLIENT_LOYALTY_PLANS, all.filter(p => p.id !== planId));
  },
};

// --- FINANCE REPOSITORY ---
export const financeRepository = {
  getTransactions(atelierId: string): Transaction[] {
    const all = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    return all.filter(t => t.atelierId === atelierId);
  },

  calculateStats(transactions: Transaction[]): { today: number; month: number } {
    let today = 0;
    let month = 0;
    const now = new Date();

    for (const tx of transactions) {
      const txDate = new Date(tx.data);
      if (
        txDate.getDate() === now.getDate() &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      ) {
        today += tx.valor;
      }
      if (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      ) {
        month += tx.valor;
      }
    }

    return { today, month };
  },

  getDailyGoal(atelierId: string): number {
    const atelier = atelierRepository.getAtelier(atelierId);
    if (atelier?.metaDiariaFaturamento && atelier.metaDiariaFaturamento > 0) {
      return atelier.metaDiariaFaturamento;
    }
    const stored = getItem<number>(`estilo_meta_diaria_${atelierId}`, 600.0);
    return stored || 600.0;
  },

  setDailyGoal(atelierId: string, goal: number): void {
    setItem(`estilo_meta_diaria_${atelierId}`, goal);
    const ateliers = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const updated = ateliers.map(a => a.id === atelierId ? { ...a, metaDiariaFaturamento: goal } : a);
    setItem(STORAGE_KEYS.ATELIERS, updated);
    window.dispatchEvent(new Event('estilo_meta_updated'));
    window.dispatchEvent(new Event('estilo_store_updated'));
  },

  getMonthlyGoal(atelierId: string): number {
    const atelier = atelierRepository.getAtelier(atelierId);
    if (atelier?.metaMensalFaturamento && atelier.metaMensalFaturamento > 0) {
      return atelier.metaMensalFaturamento;
    }
    const stored = getItem<number>(`estilo_meta_mensal_${atelierId}`, 15000.0);
    return stored || 15000.0;
  },

  setMonthlyGoal(atelierId: string, goal: number): void {
    setItem(`estilo_meta_mensal_${atelierId}`, goal);
    const ateliers = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const updated = ateliers.map(a => a.id === atelierId ? { ...a, metaMensalFaturamento: goal } : a);
    setItem(STORAGE_KEYS.ATELIERS, updated);
    window.dispatchEvent(new Event('estilo_meta_updated'));
    window.dispatchEvent(new Event('estilo_store_updated'));
  },

  get30DaysTrends(atelierId: string): DailyTrendPoint[] {
    const transactions = this.getTransactions(atelierId);
    const now = new Date();
    const days: DailyTrendPoint[] = [];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Group actual transactions by date key 'YYYY-MM-DD'
    const actualByDay: Record<string, { count: number; total: number }> = {};
    for (const tx of transactions) {
      const d = new Date(tx.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!actualByDay[key]) {
        actualByDay[key] = { count: 0, total: 0 };
      }
      actualByDay[key].count += 1;
      actualByDay[key].total += tx.valor;
    }

    // Build last 30 days chronologically from 29 days ago up to today
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayOfWeekNum = d.getDay();
      const diaSemana = diasSemana[dayOfWeekNum];
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      let volume = actualByDay[key]?.count || 0;
      let receita = actualByDay[key]?.total || 0;

      // For past days (i > 0) without recorded mock transactions, provide realistic deterministic barbershop baseline
      if (volume === 0 && i > 0) {
        const baseVolume = dayOfWeekNum === 6 ? 14 : dayOfWeekNum === 5 ? 11 : dayOfWeekNum === 0 ? 3 : (5 + (i % 5));
        const avgTicket = 65 + ((i * 7) % 25);
        volume = baseVolume;
        receita = baseVolume * avgTicket;
      }

      const ticketMedio = volume > 0 ? Math.round((receita / volume) * 100) / 100 : 0;

      days.push({
        dateKey: key,
        label,
        diaSemana,
        volume,
        receita: Math.round(receita * 100) / 100,
        ticketMedio,
      });
    }

    return days;
  },
};

// --- CLIENT REPOSITORY ---
export const clientRepository = {
  getClient(id: string): ClientProfile | null {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    return all.find(c => c.id === id) || null;
  },

  getAllClients(atelierId?: string): ClientProfile[] {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    if (!atelierId) return all;
    return all.filter(c => !c.atelier_origem || c.atelier_origem === atelierId);
  },

  async updateClientNotificationPreferences(
    clientId: string, 
    preferences: Partial<ClientNotificationPreferences>
  ): Promise<ClientProfile | null> {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    let updatedTarget: ClientProfile | null = null;
    const updated = all.map(c => {
      if (c.id === clientId) {
        const currentNotif: ClientNotificationPreferences = c.notificacoes || {
          permitirAvisoProximo: true,
          permitirAvisoVagaAberta: true,
          pushHabilitado: true,
        };
        const newNotif: ClientNotificationPreferences = {
          ...currentNotif,
          ...preferences,
        };
        updatedTarget = { ...c, notificacoes: newNotif };
        return updatedTarget;
      }
      return c;
    });
    setItem(STORAGE_KEYS.CLIENTS, updated);
    return updatedTarget;
  },

  async bulkUpdateNotifications(
    changes: Partial<ClientNotificationPreferences>,
    atelierId?: string
  ): Promise<void> {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const updated = all.map(c => {
      if (!atelierId || !c.atelier_origem || c.atelier_origem === atelierId) {
        const currentNotif: ClientNotificationPreferences = c.notificacoes || {
          permitirAvisoProximo: true,
          permitirAvisoVagaAberta: true,
          pushHabilitado: true,
        };
        return {
          ...c,
          notificacoes: {
            ...currentNotif,
            ...changes,
          },
        };
      }
      return c;
    });
    setItem(STORAGE_KEYS.CLIENTS, updated);
  },

  canClientReceive(phoneOrName: string, type: 'proximo' | 'vaga_aberta'): boolean {
    if (!phoneOrName) return true;
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const cleanInput = phoneOrName.replace(/\D/g, '');

    const matched = all.find(c => {
      if (c.id === phoneOrName) return true;
      if (c.nome.toLowerCase() === phoneOrName.toLowerCase()) return true;
      if (cleanInput && c.telefone) {
        const cleanClientPhone = c.telefone.replace(/\D/g, '');
        if (cleanClientPhone && (cleanClientPhone.endsWith(cleanInput.slice(-8)) || cleanInput.endsWith(cleanClientPhone.slice(-8)))) {
          return true;
        }
      }
      return false;
    });

    if (!matched || !matched.notificacoes) return true;

    if (type === 'proximo') {
      return matched.notificacoes.permitirAvisoProximo !== false;
    }
    if (type === 'vaga_aberta') {
      return matched.notificacoes.permitirAvisoVagaAberta !== false;
    }
    return true;
  },

  async registerClient(nome: string, email: string, atelierId: string, telefone?: string): Promise<ClientProfile> {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const newClient: ClientProfile = {
      id: 'cli_' + Date.now(),
      nome,
      email,
      pontos: 0,
      atelier_origem: atelierId,
      telefone,
      notificacoes: {
        permitirAvisoProximo: true,
        permitirAvisoVagaAberta: true,
        pushHabilitado: true,
      },
    };
    all.push(newClient);
    setItem(STORAGE_KEYS.CLIENTS, all);
    return newClient;
  },

  async clientLogin(email: string): Promise<ClientProfile> {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const existing = all.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    // Create a new client profile if not existing
    const newClient: ClientProfile = {
      id: 'cli_' + Date.now(),
      nome: email.split('@')[0],
      email,
      pontos: 1,
      atelier_origem: DEFAULT_ATELIER_ID,
      notificacoes: {
        permitirAvisoProximo: true,
        permitirAvisoVagaAberta: true,
        pushHabilitado: true,
      },
    };
    all.push(newClient);
    setItem(STORAGE_KEYS.CLIENTS, all);
    return newClient;
  },

  async joinQueue(atelierId: string, name: string, phone: string, clientUid?: string): Promise<QueueItem> {
    const all = getItem<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
    const newItem: QueueItem = {
      id: 'q_' + Date.now(),
      atelierId,
      clientName: name,
      phone,
      service: 'Solicitado via App',
      status: 'waiting',
      ticketNumber: (all.length % 99) + 1,
      origin: 'app',
      timestamp: Date.now(),
      clientUid,
    };
    all.push(newItem);
    setItem(STORAGE_KEYS.QUEUE, all);

    void broadcastRealtimeEvent({
      atelierId,
      type: 'new_client_joined',
      targetClientName: name,
      targetClientPhone: phone,
      title: '🔔 Novo Cliente na Fila!',
      message: `${name} acabou de entrar na fila online (Senha #${newItem.ticketNumber}).`,
      data: { queueItem: newItem },
    });

    return newItem;
  },

  getCurrentServing(atelierId: string): QueueItem | null {
    const all = getItem<QueueItem[]>(STORAGE_KEYS.QUEUE, INITIAL_QUEUE);
    return all.find(item => item.atelierId === atelierId && item.status === 'in_service') || null;
  },

  getLoyaltyConfig(atelierId: string): LoyaltyConfig {
    const all = getItem<Record<string, LoyaltyConfig>>(STORAGE_KEYS.LOYALTY_CONFIG, {});
    if (all[atelierId]) {
      return all[atelierId];
    }
    return {
      atelierId,
      ativo: true,
      pontosNecessarios: 10,
      pontosPorAtendimento: 1,
      servicoRecompensa: 'Corte ou Serviço Padrão Grátis',
      regrasDescricao: 'Acumule selos a cada atendimento finalizado e troque por um serviço gratuito.',
      atualizadoEm: Date.now(),
    };
  },

  saveLoyaltyConfig(config: LoyaltyConfig): void {
    const all = getItem<Record<string, LoyaltyConfig>>(STORAGE_KEYS.LOYALTY_CONFIG, {});
    all[config.atelierId] = {
      ...config,
      pontosNecessarios: Math.max(2, Math.min(30, config.pontosNecessarios || 10)),
      pontosPorAtendimento: Math.max(1, Math.min(5, config.pontosPorAtendimento || 1)),
      atualizadoEm: Date.now(),
    };
    setItem(STORAGE_KEYS.LOYALTY_CONFIG, all);
  },

  assignLoyaltyPlan(
    clientId: string,
    planId: string | null,
    atelierId?: string
  ): ClientProfile | null {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const client = all.find(c => c.id === clientId);
    if (!client) return null;

    const targetAtelierId = atelierId || client.atelier_origem || DEFAULT_ATELIER_ID;
    const plans = planRepository.getClientLoyaltyPlans(targetAtelierId);
    const selectedPlan = planId ? plans.find(p => p.id === planId) : undefined;

    let updatedClient: ClientProfile = client;
    const updatedList = all.map(c => {
      if (c.id !== clientId) return c;
      if (!selectedPlan) {
        updatedClient = {
          ...c,
          planoAssinaturaId: undefined,
          planoAssinaturaNome: undefined,
          planoAssinaturaStatus: 'cancelado',
          planoMultiplicadorPontos: 1,
        };
      } else {
        updatedClient = {
          ...c,
          planoAssinaturaId: selectedPlan.id,
          planoAssinaturaNome: selectedPlan.nome,
          planoAssinaturaStatus: 'ativo',
          planoAssinaturaInicio: Date.now(),
          planoMultiplicadorPontos: Math.max(1, selectedPlan.multiplicadorPontos || 1),
        };
      }
      return updatedClient;
    });

    setItem(STORAGE_KEYS.CLIENTS, updatedList);
    return updatedClient;
  },

  getLoyaltyHistory(clientId: string, atelierId?: string): LoyaltyHistoryItem[] {
    const all = getItem<LoyaltyHistoryItem[]>(STORAGE_KEYS.LOYALTY_HISTORY, []);
    return all
      .filter(item => item.clientId === clientId && (!atelierId || item.atelierId === atelierId))
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  async addPoints(clientId: string, amount: number = 1, description?: string): Promise<void> {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    let targetClient: ClientProfile | undefined;
    const updated = all.map(c => {
      if (c.id === clientId) {
        targetClient = { ...c, pontos: c.pontos + amount };
        return targetClient;
      }
      return c;
    });
    setItem(STORAGE_KEYS.CLIENTS, updated);

    if (targetClient) {
      const history = getItem<LoyaltyHistoryItem[]>(STORAGE_KEYS.LOYALTY_HISTORY, []);
      history.unshift({
        id: 'loy_' + Date.now(),
        atelierId: targetClient.atelier_origem || DEFAULT_ATELIER_ID,
        clientId: targetClient.id,
        clientName: targetClient.nome,
        tipo: 'ganho',
        pontos: amount,
        descricao: description || 'Atendimento realizado no atelier',
        timestamp: Date.now(),
      });
      setItem(STORAGE_KEYS.LOYALTY_HISTORY, history);
    }
  },

  async redeemReward(
    clientId: string,
    atelierId?: string
  ): Promise<{ voucherCode: string; rewardName: string; pontosUsados: number }> {
    const all = getItem<ClientProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const client = all.find(c => c.id === clientId);
    const targetAtelierId = atelierId || client?.atelier_origem || DEFAULT_ATELIER_ID;
    const config = this.getLoyaltyConfig(targetAtelierId);
    const requiredPoints = Math.max(2, config.pontosNecessarios || 10);

    const updated = all.map(c =>
      c.id === clientId ? { ...c, pontos: Math.max(0, c.pontos - requiredPoints) } : c
    );
    setItem(STORAGE_KEYS.CLIENTS, updated);

    const voucherCode = `FID-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const rewardName = config.servicoRecompensa || 'Serviço Gratuito';

    // Record loyalty redemption for monthly finance summary
    const redemptions = getItem<Array<{ clientId: string; timestamp: number; atelierId: string; voucherCode?: string; rewardName?: string }>>('estilo_loyalty_redemptions', []);
    redemptions.push({
      clientId,
      atelierId: targetAtelierId,
      timestamp: Date.now(),
      voucherCode,
      rewardName,
    });
    setItem('estilo_loyalty_redemptions', redemptions);

    if (client) {
      const history = getItem<LoyaltyHistoryItem[]>(STORAGE_KEYS.LOYALTY_HISTORY, []);
      history.unshift({
        id: 'loy_' + Date.now(),
        atelierId: targetAtelierId,
        clientId: client.id,
        clientName: client.nome,
        tipo: 'resgate',
        pontos: -requiredPoints,
        descricao: `Resgate: ${rewardName}`,
        voucherCodigo: voucherCode,
        timestamp: Date.now(),
      });
      setItem(STORAGE_KEYS.LOYALTY_HISTORY, history);
    }

    return { voucherCode, rewardName, pontosUsados: requiredPoints };
  },

  getLoyaltySummary(atelierId: string): { cartoesCompletados: number; brindesResgatadosMes: number } {
    const allClients = this.getAllClients(atelierId);
    const config = this.getLoyaltyConfig(atelierId);
    const targetPoints = Math.max(2, config.pontosNecessarios || 10);

    let cartoesCompletados = 0;
    for (const c of allClients) {
      if (c.pontos >= targetPoints) {
        cartoesCompletados += Math.floor(c.pontos / targetPoints);
      }
    }

    const redemptions = getItem<Array<{ clientId: string; timestamp: number; atelierId: string }>>('estilo_loyalty_redemptions', []);
    const now = new Date();
    let brindesResgatadosMes = redemptions.filter(r => {
      if (r.atelierId && r.atelierId !== atelierId) return false;
      const d = new Date(r.timestamp);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    if (brindesResgatadosMes === 0 && allClients.length > 0) {
      brindesResgatadosMes = Math.floor(allClients.length / 3) + 1;
    }
    if (cartoesCompletados === 0 && allClients.length > 0) {
      cartoesCompletados = allClients.filter(c => c.pontos >= Math.ceil(targetPoints / 2)).length;
    }

    return { cartoesCompletados, brindesResgatadosMes };
  }
};

// --- ATELIER REPOSITORY ---
export const atelierRepository = {
  getAtelier(id: string): AtelierProfile | null {
    const all = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const found = all.find(a => a.id === id) || all[0] || null;
    if (found && !found.expediente) {
      found.expediente = DEFAULT_EXPEDIENTE;
    }
    return found;
  },

  getAllAteliers(): AtelierProfile[] {
    const all = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    return all.map(a => (!a.expediente ? { ...a, expediente: DEFAULT_EXPEDIENTE } : a));
  },

  getExpediente(atelierId: string): ConfiguracaoExpediente {
    const atelier = this.getAtelier(atelierId);
    return atelier?.expediente || DEFAULT_EXPEDIENTE;
  },

  async updateExpediente(atelierId: string, expediente: ConfiguracaoExpediente): Promise<void> {
    const all = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const updated = all.map(a => {
      if (a.id === atelierId) {
        return {
          ...a,
          expediente,
        };
      }
      return a;
    });
    setItem(STORAGE_KEYS.ATELIERS, updated);

    if (expediente.configuracaoLembretes) {
      const currentWa = whatsappRepository.getConfig(atelierId);
      const minutos = Math.max(5, expediente.configuracaoLembretes.minutosAntes || 60);
      whatsappRepository.saveConfig({
        ...currentWa,
        autoSendReminder: expediente.configuracaoLembretes.habilitado,
        reminderHoursBefore: Math.max(0.25, Number((minutos / 60).toFixed(2))),
        templateReminder: expediente.configuracaoLembretes.templatePersonalizado?.trim()
          ? expediente.configuracaoLembretes.templatePersonalizado
          : currentWa.templateReminder,
      });
    }
  },

  getExpedienteStatus(atelierId: string): { 
    isOpen: boolean; 
    currentDayName: string; 
    horarioHoje: string; 
    vagasRestantes: number; 
    vagasOcupadasHoje: number; 
    totalVagas: number;
    message: string;
  } {
    const expediente = this.getExpediente(atelierId);
    const now = new Date();
    const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday ...
    const diasKeys: Array<DiaFuncionamento['diaSemana']> = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const currentKey = diasKeys[dayIndex];
    const dayConfig = expediente.dias.find(d => d.diaSemana === currentKey) || expediente.dias[0];

    // Transactions today
    const transactions = financeRepository.getTransactions(atelierId);
    const queue = queueRepository.getQueue(atelierId);
    let vagasOcupadasHoje = 0;

    for (const tx of transactions) {
      const d = new Date(tx.data);
      if (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        vagasOcupadasHoje++;
      }
    }
    // Adiciona os clientes que já estão na fila hoje
    vagasOcupadasHoje += queue.length;

    const totalVagas = expediente.vagasPorDia || 25;
    const vagasRestantes = Math.max(0, totalVagas - vagasOcupadasHoje);

    if (!dayConfig.aberto) {
      return {
        isOpen: false,
        currentDayName: dayConfig.nome,
        horarioHoje: 'Fechado hoje',
        vagasRestantes,
        vagasOcupadasHoje,
        totalVagas,
        message: 'O atelier está fechado hoje.',
      };
    }

    // Check hours
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [hInicio, mInicio] = dayConfig.inicio.split(':').map(Number);
    const [hFim, mFim] = dayConfig.fim.split(':').map(Number);
    const startMinutes = hInicio * 60 + (mInicio || 0);
    const endMinutes = hFim * 60 + (mFim || 0);

    let isOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    let message = isOpen 
      ? `Aberto hoje das ${dayConfig.inicio} às ${dayConfig.fim}` 
      : (currentMinutes < startMinutes 
          ? `Abre hoje às ${dayConfig.inicio}` 
          : `Fechou às ${dayConfig.fim}`);

    // Check lunch interval if enabled
    if (isOpen && dayConfig.intervalo && dayConfig.intervalo.habilitado) {
      const [hIntIni, mIntIni] = dayConfig.intervalo.inicio.split(':').map(Number);
      const [hIntFim, mIntFim] = dayConfig.intervalo.fim.split(':').map(Number);
      const intervalStart = hIntIni * 60 + (mIntIni || 0);
      const intervalEnd = hIntFim * 60 + (mIntFim || 0);

      if (currentMinutes >= intervalStart && currentMinutes < intervalEnd) {
        isOpen = false;
        message = `Intervalo de almoço (${dayConfig.intervalo.inicio} às ${dayConfig.intervalo.fim}). Retorna às ${dayConfig.intervalo.fim}.`;
      }
    }

    return {
      isOpen,
      currentDayName: dayConfig.nome,
      horarioHoje: `${dayConfig.inicio} - ${dayConfig.fim}`,
      vagasRestantes,
      vagasOcupadasHoje,
      totalVagas,
      message,
    };
  },

  async updateSubscription(atelierId: string, status: 'trial' | 'ativo' | 'suspenso', daysToAdd: number = 30): Promise<void> {
    const all = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const updated = all.map(a => {
      if (a.id === atelierId) {
        return {
          ...a,
          status_assinatura: status,
          data_expiracao: Date.now() + daysToAdd * 24 * 60 * 60 * 1000,
        };
      }
      return a;
    });
    setItem(STORAGE_KEYS.ATELIERS, updated);
  },

  updateAtelier(id: string, updates: Partial<AtelierProfile>): void {
    const all = getItem<AtelierProfile[]>(STORAGE_KEYS.ATELIERS, [INITIAL_ATELIER]);
    const updated = all.map(a => {
      if (a.id === id) {
        return {
          ...a,
          ...updates,
        };
      }
      return a;
    });
    setItem(STORAGE_KEYS.ATELIERS, updated);
  }
};

// --- WHATSAPP BUSINESS REPOSITORY ---
const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  atelierId: DEFAULT_ATELIER_ID,
  provider: 'meta_cloud',
  connected: true,
  phoneNumberId: '109283746592019',
  wabaId: '987654321012345',
  accessToken: 'EAAG...wh_token_valid',
  instanceId: 'instancia_estilo_zap_01',
  instanceToken: 'tok_live_982348a1b',
  autoSendConfirmation: true,
  autoSendReminder: true,
  reminderHoursBefore: 2,
  autoSendQueueCall: true,
  autoSendYouAreNext: true,
  autoSendSlotOpened: true,
  templateConfirmation: 'Olá {{nome}}! Seu agendamento para {{servico}} no *{{atelier}}* foi confirmado com sucesso. Estamos te aguardando!',
  templateReminder: 'Olá {{nome}}! Lembramos do seu horário no *{{atelier}}* para {{servico}} hoje. Caso precise reagendar, nos avise por aqui!',
  templateQueueCall: 'Olá {{nome}}! O seu barbeiro no *{{atelier}}* está pronto. Pode se dirigir à cadeira agora! ✂️',
  templateYouAreNext: 'Olá {{nome}}! Você é o *PRÓXIMO* da fila no *{{atelier}}* (Posição #1). Fique por perto, seu atendimento começará em instantes! ✂️⚡',
  templateSlotOpened: 'Olá {{nome}}! 💈 Boas notícias do *{{atelier}}*: acabou de *ABRIR UMA VAGA* na cadeira! Venha agora para ser atendido sem espera! 🚪✂️',
  adminTestPhone: '11999998888',
  autoActivationEnabled: true,
  autoActivationApiKey: 'WAPP-API-KEY-ESTILO-2026',
  smartReplyEnabled: true,
  smartReplyTone: 'cordial',
  smartReplyAutoSuggest: true,
  smartReplyCustomInstructions: 'Tolerância de 10 minutos para atrasos; aceitamos Pix e cartões sem acréscimo.',
  autoReplyAbsenceEnabled: true,
  autoReplyAbsenceMode: 'ambos',
  templateAbsenceReply: 'Olá {{nome}}! No momento o *{{atelier}}* está fora do horário de funcionamento ({{horario_funcionamento}}) ou com a equipe em atendimento. Recebemos sua mensagem e responderemos assim que possível! 💈⏰',
};

const INITIAL_WHATSAPP_CHATS: WhatsAppChatThread[] = [
  {
    id: 'chat_arthur',
    atelierId: DEFAULT_ATELIER_ID,
    clientName: 'Arthur Shelby',
    clientPhone: '5511999998888',
    serviceName: 'Corte Degradê Fade + Barba',
    unread: true,
    lastUpdated: Date.now() - 4 * 60 * 1000,
    messages: [
      {
        id: 'm1',
        direction: 'outbound',
        text: 'Olá Arthur Shelby! Lembramos do seu horário no *Barbearia Estilo Real* para Corte Degradê Fade + Barba hoje às 16:00. Estamos te aguardando!',
        timestamp: Date.now() - 55 * 60 * 1000,
      },
      {
        id: 'm2',
        direction: 'inbound',
        text: 'Boa tarde! Peguei um trânsito pesado na avenida, acho que chego uns 12 minutos atrasado. Ainda consigo ser atendido ou prefere me encaixar depois?',
        timestamp: Date.now() - 4 * 60 * 1000,
      },
    ],
  },
  {
    id: 'chat_lucas',
    atelierId: DEFAULT_ATELIER_ID,
    clientName: 'Lucas Ferreira',
    clientPhone: '5511991234567',
    serviceName: 'Combo Completo (Cabelo + Barba)',
    unread: true,
    lastUpdated: Date.now() - 18 * 60 * 1000,
    messages: [
      {
        id: 'm3',
        direction: 'outbound',
        text: 'Olá Lucas Ferreira! Seu agendamento para Combo Completo (Cabelo + Barba) no *Barbearia Estilo Real* foi confirmado com sucesso.',
        timestamp: Date.now() - 45 * 60 * 1000,
      },
      {
        id: 'm4',
        direction: 'inbound',
        text: 'Show! Posso adicionar sobrancelha na hora e pagar tudo no Pix quando finalizar?',
        timestamp: Date.now() - 18 * 60 * 1000,
      },
    ],
  },
  {
    id: 'chat_gabriel',
    atelierId: DEFAULT_ATELIER_ID,
    clientName: 'Gabriel Souza',
    clientPhone: '5511978901234',
    serviceName: 'Corte Navalhado',
    unread: true,
    lastUpdated: Date.now() - 32 * 60 * 1000,
    messages: [
      {
        id: 'm5',
        direction: 'inbound',
        text: 'Opa! Surgiu uma reunião de última hora aqui no trabalho e não vou conseguir ir hoje às 15h. Tem horário amanhã no fim da tarde?',
        timestamp: Date.now() - 32 * 60 * 1000,
      },
    ],
  },
  {
    id: 'chat_carlos',
    atelierId: DEFAULT_ATELIER_ID,
    clientName: 'Carlos Eduardo',
    clientPhone: '5511987654321',
    serviceName: 'Corte Degradê Fade',
    unread: false,
    lastUpdated: Date.now() - 15 * 60 * 1000,
    messages: [
      {
        id: 'm6',
        direction: 'outbound',
        text: 'Olá Carlos Eduardo! O seu barbeiro no *Barbearia Estilo Real* está pronto. Pode se dirigir à cadeira agora! ✂️',
        timestamp: Date.now() - 15 * 60 * 1000,
      },
      {
        id: 'm7',
        direction: 'inbound',
        text: 'Beleza, já estou subindo as escadas!',
        timestamp: Date.now() - 12 * 60 * 1000,
      },
    ],
  },
];

const INITIAL_WHATSAPP_LOGS: WhatsAppLog[] = [
  {
    id: 'log_1',
    atelierId: DEFAULT_ATELIER_ID,
    recipientName: 'Carlos Eduardo',
    recipientPhone: '5511987654321',
    type: 'chamada',
    message: 'Olá Carlos Eduardo! O seu barbeiro no *Barbearia Estilo Real* está pronto. Pode se dirigir à cadeira agora! ✂️',
    status: 'enviado',
    timestamp: Date.now() - 15 * 60 * 1000,
  },
  {
    id: 'log_2',
    atelierId: DEFAULT_ATELIER_ID,
    recipientName: 'Lucas Ferreira',
    recipientPhone: '5511991234567',
    type: 'confirmacao',
    message: 'Olá Lucas Ferreira! Seu agendamento para Combo Completo (Cabelo + Barba) no *Barbearia Estilo Real* foi confirmado com sucesso. Estamos te aguardando!',
    status: 'enviado',
    timestamp: Date.now() - 45 * 60 * 1000,
  },
  {
    id: 'log_3',
    atelierId: DEFAULT_ATELIER_ID,
    recipientName: 'Gabriel Souza',
    recipientPhone: '5511978901234',
    type: 'lembrete',
    message: 'Olá Gabriel Souza! Lembramos do seu horário no *Barbearia Estilo Real* para Corte Degradê Fade hoje. Caso precise reagendar, nos avise por aqui!',
    status: 'enviado',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'log_4',
    atelierId: DEFAULT_ATELIER_ID,
    recipientName: 'Marcos Vinicius',
    recipientPhone: '5511988887777',
    type: 'voce_e_o_proximo',
    message: 'Olá Marcos Vinicius! Você é o *PRÓXIMO* da fila no *Barbearia Estilo Real* (Posição #1). Fique por perto, seu atendimento começará em instantes! ✂️⚡',
    status: 'enviado',
    timestamp: Date.now() - 30 * 60 * 1000,
  },
];

export const whatsappRepository = {
  getConfig(atelierId: string): WhatsAppConfig {
    const allConfigs = getItem<Record<string, WhatsAppConfig>>(STORAGE_KEYS.WHATSAPP_CONFIG, {
      [DEFAULT_ATELIER_ID]: DEFAULT_WHATSAPP_CONFIG,
    });
    if (allConfigs[atelierId]) {
      return allConfigs[atelierId];
    }
    const newConfig: WhatsAppConfig = {
      ...DEFAULT_WHATSAPP_CONFIG,
      atelierId,
      connected: false,
    };
    return newConfig;
  },

  saveConfig(config: WhatsAppConfig): void {
    const allConfigs = getItem<Record<string, WhatsAppConfig>>(STORAGE_KEYS.WHATSAPP_CONFIG, {
      [DEFAULT_ATELIER_ID]: DEFAULT_WHATSAPP_CONFIG,
    });
    allConfigs[config.atelierId] = config;
    setItem(STORAGE_KEYS.WHATSAPP_CONFIG, allConfigs);
  },

  getLogs(atelierId: string): WhatsAppLog[] {
    const allLogs = getItem<WhatsAppLog[]>(STORAGE_KEYS.WHATSAPP_LOGS, INITIAL_WHATSAPP_LOGS);
    return allLogs.filter(l => l.atelierId === atelierId);
  },

  async sendMessage(params: {
    atelierId: string;
    recipientName: string;
    recipientPhone: string;
    type: 'confirmacao' | 'lembrete' | 'chamada' | 'teste' | 'voce_e_o_proximo' | 'vaga_aberta' | 'ausencia';
    customMessage?: string;
    serviceName?: string;
  }): Promise<{ success: boolean; message: string; log: WhatsAppLog }> {
    const config = this.getConfig(params.atelierId);
    const atelier = atelierRepository.getAtelier(params.atelierId);
    const atelierName = atelier ? atelier.nome_negocio : 'Estilo Exato';
    const expedienteStatus = atelierRepository.getExpedienteStatus(params.atelierId);

    let content = params.customMessage || '';

    if (!content) {
      if (params.type === 'confirmacao') {
        content = config.templateConfirmation
          .replace(/{{nome}}/g, params.recipientName)
          .replace(/{{atelier}}/g, atelierName)
          .replace(/{{servico}}/g, params.serviceName || 'Atendimento');
      } else if (params.type === 'lembrete') {
        content = config.templateReminder
          .replace(/{{nome}}/g, params.recipientName)
          .replace(/{{atelier}}/g, atelierName)
          .replace(/{{servico}}/g, params.serviceName || 'Atendimento');
      } else if (params.type === 'chamada') {
        content = config.templateQueueCall
          .replace(/{{nome}}/g, params.recipientName)
          .replace(/{{atelier}}/g, atelierName);
      } else if (params.type === 'voce_e_o_proximo') {
        const tpl = config.templateYouAreNext || 'Olá {{nome}}! Você é o *PRÓXIMO* da fila no *{{atelier}}* (Posição #1). Fique por perto, seu atendimento começará em instantes! ✂️⚡';
        content = tpl
          .replace(/{{nome}}/g, params.recipientName)
          .replace(/{{atelier}}/g, atelierName)
          .replace(/{{posicao}}/g, '1');
      } else if (params.type === 'vaga_aberta') {
        const tpl = config.templateSlotOpened || 'Olá {{nome}}! 💈 Boas notícias do *{{atelier}}*: acabou de *ABRIR UMA VAGA* na cadeira! Venha agora para ser atendido sem espera! 🚪✂️';
        content = tpl
          .replace(/{{nome}}/g, params.recipientName)
          .replace(/{{atelier}}/g, atelierName);
      } else if (params.type === 'ausencia') {
        const tpl = config.templateAbsenceReply || DEFAULT_WHATSAPP_CONFIG.templateAbsenceReply!;
        content = tpl
          .replace(/{{nome}}/g, params.recipientName)
          .replace(/{{atelier}}/g, atelierName)
          .replace(/{{horario_funcionamento}}/g, expedienteStatus.horarioHoje || '09:00 - 19:00');
      } else {
        content = `Olá ${params.recipientName}! Esta é uma mensagem de teste do WhatsApp Business da ${atelierName}. Seu canal oficial está conectado e ativo! 🚀`;
      }
    }

    const log: WhatsAppLog = {
      id: 'log_' + Date.now(),
      atelierId: params.atelierId,
      recipientName: params.recipientName,
      recipientPhone: params.recipientPhone,
      type: params.type,
      message: content,
      status: 'enviado',
      timestamp: Date.now(),
    };

    const allLogs = getItem<WhatsAppLog[]>(STORAGE_KEYS.WHATSAPP_LOGS, INITIAL_WHATSAPP_LOGS);
    allLogs.unshift(log);
    setItem(STORAGE_KEYS.WHATSAPP_LOGS, allLogs);

    // Também registra no console com o formato de API Oficial do WhatsApp Business / Meta Cloud API
    console.log(`[WhatsApp Business API] Sent to ${params.recipientPhone} (${params.recipientName}): "${content}"`);

    return {
      success: true,
      message: content,
      log,
    };
  },

  async clearLogs(atelierId: string): Promise<void> {
    const allLogs = getItem<WhatsAppLog[]>(STORAGE_KEYS.WHATSAPP_LOGS, INITIAL_WHATSAPP_LOGS);
    const filtered = allLogs.filter(l => l.atelierId !== atelierId);
    setItem(STORAGE_KEYS.WHATSAPP_LOGS, filtered);
  },

  getChatThreads(atelierId: string): WhatsAppChatThread[] {
    const all = getItem<WhatsAppChatThread[]>(STORAGE_KEYS.WHATSAPP_CHATS, INITIAL_WHATSAPP_CHATS);
    const matched = all.filter(c => c.atelierId === atelierId);
    if (matched.length === 0 && atelierId !== DEFAULT_ATELIER_ID) {
      const seeded = INITIAL_WHATSAPP_CHATS.map(c => ({
        ...c,
        id: `${c.id}_${atelierId}`,
        atelierId,
      }));
      setItem(STORAGE_KEYS.WHATSAPP_CHATS, [...all, ...seeded]);
      return seeded.sort((a, b) => b.lastUpdated - a.lastUpdated);
    }
    return matched.sort((a, b) => b.lastUpdated - a.lastUpdated);
  },

  addChatMessage(
    atelierId: string,
    params: {
      clientName: string;
      clientPhone: string;
      serviceName?: string;
      direction: 'inbound' | 'outbound';
      text: string;
      aiSuggested?: boolean;
    }
  ): WhatsAppChatThread[] {
    const all = getItem<WhatsAppChatThread[]>(STORAGE_KEYS.WHATSAPP_CHATS, INITIAL_WHATSAPP_CHATS);
    const cleanPhone = params.clientPhone.replace(/\D/g, '');
    const idx = all.findIndex(
      t =>
        t.atelierId === atelierId &&
        (t.clientPhone.replace(/\D/g, '') === cleanPhone || t.clientName.toLowerCase() === params.clientName.toLowerCase())
    );

    const newMessage: WhatsAppChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      direction: params.direction,
      text: params.text,
      timestamp: Date.now(),
      aiSuggested: params.aiSuggested,
    };

    if (idx >= 0) {
      const existing = all[idx];
      all[idx] = {
        ...existing,
        serviceName: params.serviceName || existing.serviceName,
        unread: params.direction === 'inbound',
        lastUpdated: newMessage.timestamp,
        messages: [...existing.messages, newMessage],
      };
    } else {
      all.unshift({
        id: 'chat_' + Date.now(),
        atelierId,
        clientName: params.clientName,
        clientPhone: params.clientPhone,
        serviceName: params.serviceName || 'Atendimento',
        unread: params.direction === 'inbound',
        lastUpdated: newMessage.timestamp,
        messages: [newMessage],
      });
    }

    setItem(STORAGE_KEYS.WHATSAPP_CHATS, all);

    // Also register outbound messages in WhatsAppLog so logs stay synchronized
    if (params.direction === 'outbound') {
      const allLogs = getItem<WhatsAppLog[]>(STORAGE_KEYS.WHATSAPP_LOGS, INITIAL_WHATSAPP_LOGS);
      allLogs.unshift({
        id: 'log_' + Date.now(),
        atelierId,
        recipientName: params.clientName,
        recipientPhone: params.clientPhone,
        type: 'confirmacao',
        message: params.text,
        status: 'enviado',
        timestamp: newMessage.timestamp,
      });
      setItem(STORAGE_KEYS.WHATSAPP_LOGS, allLogs);
    }

    return this.getChatThreads(atelierId);
  },

  markThreadRead(atelierId: string, threadId: string): WhatsAppChatThread[] {
    const all = getItem<WhatsAppChatThread[]>(STORAGE_KEYS.WHATSAPP_CHATS, INITIAL_WHATSAPP_CHATS);
    const updated = all.map(t => (t.atelierId === atelierId && t.id === threadId ? { ...t, unread: false } : t));
    setItem(STORAGE_KEYS.WHATSAPP_CHATS, updated);
    return this.getChatThreads(atelierId);
  },

  async generateSmartReplies(params: {
    atelierId: string;
    clientName: string;
    serviceName?: string;
    chatHistory: WhatsAppChatMessage[];
    extraGoal?: string;
  }): Promise<SmartReplyAnalysis> {
    const config = this.getConfig(params.atelierId);
    const atelier = atelierRepository.getAtelier(params.atelierId);

    const response = await fetch('/api/whatsapp/smart-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        atelierName: atelier?.nome_negocio || 'Barbearia Estilo Real',
        clientName: params.clientName,
        serviceName: params.serviceName,
        tone: config.smartReplyTone || 'cordial',
        customInstructions: config.smartReplyCustomInstructions || '',
        chatHistory: params.chatHistory,
        extraGoal: params.extraGoal,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Falha ao consultar a IA para sugestão de respostas.');
    }

    return data.analysis as SmartReplyAnalysis;
  },
};

// --- APPOINTMENT REPOSITORY ---
export const appointmentRepository = {
  getAppointments(atelierId: string): Appointment[] {
    const all = getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    return all.filter(a => a.atelierId === atelierId);
  },

  getClientAppointments(clientId: string, atelierId?: string): Appointment[] {
    const all = getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    return all.filter(a => {
      if (a.clientId !== clientId) return false;
      if (atelierId && a.atelierId !== atelierId) return false;
      return true;
    }).sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
  },

  async createAppointment(data: Omit<Appointment, 'id' | 'status' | 'criadoEm'>): Promise<Appointment> {
    const all = getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const newAppointment: Appointment = {
      ...data,
      id: 'apt_' + Date.now(),
      status: 'confirmado',
      criadoEm: Date.now(),
    };
    all.unshift(newAppointment);
    setItem(STORAGE_KEYS.APPOINTMENTS, all);

    // Enviar confirmação via WhatsApp se configurado
    try {
      await whatsappRepository.sendMessage({
        atelierId: data.atelierId,
        recipientName: data.clientName,
        recipientPhone: data.clientPhone,
        type: 'confirmacao',
        serviceName: `${data.serviceName} (${data.data.split('-').reverse().join('/')} às ${data.horario}${data.staffName ? ' com ' + data.staffName : ''})`,
      });
    } catch (e) {
      console.warn('Falha ao enviar confirmação WhatsApp de agendamento', e);
    }

    return newAppointment;
  },

  async cancelAppointment(appointmentId: string): Promise<void> {
    const all = getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const updated = all.map(a => a.id === appointmentId ? { ...a, status: 'cancelado' as const } : a);
    setItem(STORAGE_KEYS.APPOINTMENTS, updated);
  },

  getDayAvailability(atelierId: string, dateStr: string, staffId?: string): DayAvailabilitySummary {
    const expediente = atelierRepository.getExpediente(atelierId) || DEFAULT_EXPEDIENTE;
    const recorrenciaCfg = expediente.recorrencia || {
      habilitado: true,
      frequenciaPadrao: 'semanal' as const,
      permitirClienteSelecionar: true,
      descontoRecorrenciaPercentual: 10,
    };
    const vagasTotaisDia = Math.max(1, expediente.vagasPorDia || 25);
    const slotDurationMinutes = Math.max(10, expediente.duracaoEstimadaMinutos || 35);

    const allAppointments = this.getAppointments(atelierId);
    const activeDayBookings = allAppointments.filter(
      (a) => a.data === dateStr && a.status !== 'cancelado'
    );
    const vagasOcupadasDia = activeDayBookings.length;
    const vagasRestantesDia = Math.max(0, vagasTotaisDia - vagasOcupadasDia);

    // 1. Verificar se o dia é feriado ou exceção fechada
    if (expediente.diasExcecaoFechados && expediente.diasExcecaoFechados.includes(dateStr)) {
      return {
        dateStr,
        isOpen: false,
        reasonClosed: 'Feriado ou data bloqueada na agenda do atelier',
        horarioDia: 'Fechado',
        slotDurationMinutes,
        vagasTotaisDia,
        vagasOcupadasDia,
        vagasRestantesDia: 0,
        slots: [],
        availableSlots: [],
        recorrenciaHabilitada: recorrenciaCfg.habilitado,
        descontoRecorrenciaPercentual: recorrenciaCfg.descontoRecorrenciaPercentual,
        permitirClienteRecorrencia: recorrenciaCfg.permitirClienteSelecionar,
        frequenciaPadraoRecorrencia: recorrenciaCfg.frequenciaPadrao,
      };
    }

    const targetDate = new Date(dateStr + 'T12:00:00');
    const dayIndex = targetDate.getDay();
    const diasKeys: Array<DiaFuncionamento['diaSemana']> = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const currentKey = diasKeys[dayIndex];
    const dayConfig = expediente.dias.find((d) => d.diaSemana === currentKey);

    if (!dayConfig || !dayConfig.aberto) {
      return {
        dateStr,
        isOpen: false,
        reasonClosed: `Atelier fechado (${dayConfig?.nome || 'dia sem expediente'})`,
        horarioDia: 'Fechado',
        slotDurationMinutes,
        vagasTotaisDia,
        vagasOcupadasDia,
        vagasRestantesDia: 0,
        slots: [],
        availableSlots: [],
        recorrenciaHabilitada: recorrenciaCfg.habilitado,
        descontoRecorrenciaPercentual: recorrenciaCfg.descontoRecorrenciaPercentual,
        permitirClienteRecorrencia: recorrenciaCfg.permitirClienteSelecionar,
        frequenciaPadraoRecorrencia: recorrenciaCfg.frequenciaPadrao,
      };
    }

    const [hInicio, mInicio] = dayConfig.inicio.split(':').map(Number);
    const [hFim, mFim] = dayConfig.fim.split(':').map(Number);
    const startMinutes = (hInicio || 9) * 60 + (mInicio || 0);
    const endMinutes = (hFim || 19) * 60 + (mFim || 0);

    // Intervalo de almoço por dia
    let intStart = -1;
    let intEnd = -1;
    if (dayConfig.intervalo && dayConfig.intervalo.habilitado) {
      const [hI, mI] = dayConfig.intervalo.inicio.split(':').map(Number);
      const [hF, mF] = dayConfig.intervalo.fim.split(':').map(Number);
      intStart = (hI || 12) * 60 + (mI || 0);
      intEnd = (hF || 13) * 60 + (mF || 0);
    }

    // Pausa geral / almoço simultâneo da equipe
    let pausaStart = -1;
    let pausaEnd = -1;
    if (expediente.pausaGeral && expediente.pausaGeral.habilitado) {
      const [hP, mP] = expediente.pausaGeral.inicio.split(':').map(Number);
      const [hPE, mPE] = expediente.pausaGeral.fim.split(':').map(Number);
      pausaStart = (hP || 12) * 60 + (mP || 0);
      pausaEnd = (hPE || 13) * 60 + (mPE || 0);
    }

    const pauseDescriptions: string[] = [];
    if (intStart !== -1 && intEnd !== -1 && dayConfig.intervalo) {
      pauseDescriptions.push(`${dayConfig.intervalo.inicio} - ${dayConfig.intervalo.fim}`);
    }
    if (pausaStart !== -1 && pausaEnd !== -1 && expediente.pausaGeral) {
      const label = `${expediente.pausaGeral.inicio} - ${expediente.pausaGeral.fim}`;
      if (!pauseDescriptions.includes(label)) {
        pauseDescriptions.push(label);
      }
    }

    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentLocalMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = dateStr === todayLocalStr;

    const team = teamRepository.getTeam(atelierId);
    const activeTeamCapacity = Math.max(1, team.filter((m) => m.cargo !== 'Recepção').length || team.length || 1);

    const slots: ScheduleTimeSlot[] = [];
    const availableSlots: string[] = [];

    for (let m = startMinutes; m + slotDurationMinutes <= endMinutes; m += slotDurationMinutes) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const inDayBreak =
        intStart !== -1 && intEnd !== -1 && m < intEnd && m + slotDurationMinutes > intStart;
      const inGlobalBreak =
        pausaStart !== -1 && pausaEnd !== -1 && m < pausaEnd && m + slotDurationMinutes > pausaStart;

      if (inDayBreak || inGlobalBreak) {
        slots.push({ time: timeStr, available: false, reason: 'pausa' });
        continue;
      }

      if (isToday && m <= currentLocalMinutes + 10) {
        // Horário já passou ou está em cima da hora
        continue;
      }

      const bookingsAtSlot = activeDayBookings.filter((a) => a.horario === timeStr);
      const isOccupied = staffId
        ? bookingsAtSlot.some((a) => a.staffId === staffId) || bookingsAtSlot.length >= activeTeamCapacity
        : bookingsAtSlot.length >= activeTeamCapacity;

      if (isOccupied) {
        slots.push({ time: timeStr, available: false, reason: 'ocupado' });
        continue;
      }

      if (vagasRestantesDia <= 0) {
        slots.push({ time: timeStr, available: false, reason: 'lotado' });
        continue;
      }

      slots.push({ time: timeStr, available: true });
      availableSlots.push(timeStr);
    }

    return {
      dateStr,
      isOpen: true,
      reasonClosed:
        vagasRestantesDia <= 0
          ? `Limite máximo de ${vagasTotaisDia} vagas para este dia foi atingido`
          : undefined,
      horarioDia: `${dayConfig.inicio} às ${dayConfig.fim}`,
      pausaLabel: pauseDescriptions.length > 0 ? pauseDescriptions.join(' / ') : undefined,
      slotDurationMinutes,
      vagasTotaisDia,
      vagasOcupadasDia,
      vagasRestantesDia,
      slots,
      availableSlots,
      recorrenciaHabilitada: recorrenciaCfg.habilitado,
      descontoRecorrenciaPercentual: recorrenciaCfg.descontoRecorrenciaPercentual,
      permitirClienteRecorrencia: recorrenciaCfg.permitirClienteSelecionar,
      frequenciaPadraoRecorrencia: recorrenciaCfg.frequenciaPadrao,
    };
  },

  getAvailableTimeSlots(atelierId: string, dateStr: string, staffId?: string): string[] {
    return this.getDayAvailability(atelierId, dateStr, staffId).availableSlots;
  },

  getUpcomingReminderSchedule(
    atelierId: string,
    minutosAntesOverride?: number
  ): Array<{
    appointment: Appointment;
    appointmentAt: number;
    dispatchAt: number;
    status: 'enviado' | 'pronto' | 'agendado';
  }> {
    const now = Date.now();
    const expediente = atelierRepository.getExpediente(atelierId);
    const waConfig = whatsappRepository.getConfig(atelierId);
    const minutosAntes =
      minutosAntesOverride ??
      expediente.configuracaoLembretes?.minutosAntes ??
      Math.round((waConfig.reminderHoursBefore || 2) * 60);

    const activeAppointments = this.getAppointments(atelierId).filter(
      a => a.status === 'agendado' || a.status === 'confirmado'
    );

    const rows = activeAppointments
      .map(appointment => {
        const appointmentAt = new Date(`${appointment.data}T${appointment.horario}:00`).getTime();
        if (Number.isNaN(appointmentAt)) return null;
        const dispatchAt = appointmentAt - minutosAntes * 60_000;
        const status: 'enviado' | 'pronto' | 'agendado' = appointment.lembreteEnviadoEm
          ? 'enviado'
          : now >= dispatchAt && appointmentAt >= now - 30 * 60_000
          ? 'pronto'
          : 'agendado';

        return {
          appointment,
          appointmentAt,
          dispatchAt,
          status,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row) && row!.appointmentAt >= now - 2 * 60 * 60_000)
      .sort((a, b) => a.appointmentAt - b.appointmentAt);

    return rows;
  },

  async processPendingWhatsAppReminders(
    atelierId: string,
    overrideConfig?: {
      minutosAntes?: number;
      templatePersonalizado?: string;
      incluirInstrucaoConfirmacao?: boolean;
      respeitarHorarioComercial?: boolean;
    }
  ): Promise<{ sentCount: number; logs: WhatsAppLog[] }> {
    const expediente = atelierRepository.getExpediente(atelierId);
    const waConfig = whatsappRepository.getConfig(atelierId);
    const atelier = atelierRepository.getAtelier(atelierId);
    const lembreteCfg = expediente.configuracaoLembretes;

    const minutosAntes =
      overrideConfig?.minutosAntes ??
      lembreteCfg?.minutosAntes ??
      Math.round((waConfig.reminderHoursBefore || 2) * 60);

    const templateBase =
      overrideConfig?.templatePersonalizado ||
      lembreteCfg?.templatePersonalizado ||
      waConfig.templateReminder;

    const incluirConfirmacao =
      overrideConfig?.incluirInstrucaoConfirmacao ?? lembreteCfg?.incluirInstrucaoConfirmacao ?? false;

    const respeitarComercial =
      overrideConfig?.respeitarHorarioComercial ?? lembreteCfg?.respeitarHorarioComercial ?? false;

    if (respeitarComercial) {
      const hour = new Date().getHours();
      if (hour < 8 || hour >= 21) {
        return { sentCount: 0, logs: [] };
      }
    }

    const schedule = this.getUpcomingReminderSchedule(atelierId, minutosAntes);
    const readyItems = schedule.filter(item => item.status === 'pronto');

    const secondEnabled = lembreteCfg?.segundoLembreteHabilitado ?? false;
    const secondMinutes = lembreteCfg?.segundoLembreteMinutosAntes ?? 30;
    const now = Date.now();
    const readySecondItems = secondEnabled
      ? schedule.filter(item => {
          if (item.appointment.lembreteSegundoEnviadoEm) return false;
          const secondDispatchAt = item.appointmentAt - secondMinutes * 60_000;
          return now >= secondDispatchAt && item.appointmentAt >= now - 15 * 60_000 && !readyItems.some(r => r.appointment.id === item.appointment.id);
        })
      : [];

    if (readyItems.length === 0 && readySecondItems.length === 0) {
      return { sentCount: 0, logs: [] };
    }

    const atelierName = atelier?.nome_negocio || 'Estilo Exato';
    const sentLogs: WhatsAppLog[] = [];
    const sentIds = new Set<string>();
    const sentSecondIds = new Set<string>();

    const buildReminderText = (appointment: Appointment, isSecond: boolean): string => {
      let msg = templateBase
        .replace(/{{nome}}/g, appointment.clientName)
        .replace(/{{servico}}/g, appointment.serviceName)
        .replace(/{{horario}}/g, `${appointment.data.split('-').reverse().join('/')} às ${appointment.horario}`)
        .replace(/{{profissional}}/g, appointment.staffName || 'equipe do atelier')
        .replace(/{{atelier}}/g, atelierName);

      if (isSecond) {
        msg = `⏰ Lembrete de reforço: ${msg}`;
      }

      if (incluirConfirmacao && !msg.toLowerCase().includes('confirm')) {
        msg += '\n\nResponda *1* para confirmar presença ou *2* se precisar reagendar.';
      }
      return msg;
    };

    for (const item of readyItems) {
      const { appointment } = item;
      if (!appointment.clientPhone) continue;

      const res = await whatsappRepository.sendMessage({
        atelierId,
        recipientName: appointment.clientName,
        recipientPhone: appointment.clientPhone,
        type: 'lembrete',
        serviceName: appointment.serviceName,
        customMessage: buildReminderText(appointment, false),
      });

      if (res.success) {
        sentLogs.push(res.log);
        sentIds.add(appointment.id);
      }
    }

    for (const item of readySecondItems) {
      const { appointment } = item;
      if (!appointment.clientPhone) continue;

      const res = await whatsappRepository.sendMessage({
        atelierId,
        recipientName: appointment.clientName,
        recipientPhone: appointment.clientPhone,
        type: 'lembrete',
        serviceName: appointment.serviceName,
        customMessage: buildReminderText(appointment, true),
      });

      if (res.success) {
        sentLogs.push(res.log);
        sentSecondIds.add(appointment.id);
      }
    }

    if (sentIds.size > 0 || sentSecondIds.size > 0) {
      const all = getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
      const updated = all.map(a => ({
        ...a,
        ...(sentIds.has(a.id) ? { lembreteEnviadoEm: now } : {}),
        ...(sentSecondIds.has(a.id) ? { lembreteSegundoEnviadoEm: now } : {}),
      }));
      setItem(STORAGE_KEYS.APPOINTMENTS, updated);
    }

    return { sentCount: sentLogs.length, logs: sentLogs };
  },
};

export const staffProductivityRepository = {
  getStats(atelierId: string): Array<{
    staffId: string;
    name: string;
    role: string;
    atendimentosCount: number;
    faturamentoTotal: number;
    taxaOcupacao: number;
    mediaTempoMinutos: number;
  }> {
    const team = teamRepository.getTeam(atelierId);
    const transactions = financeRepository.getTransactions(atelierId);

    return team.map((member, index) => {
      const atendimentosCount = 8 + (index * 5) % 15;
      const faturamentoTotal = atendimentosCount * (55 + index * 8);
      const taxaOcupacao = 75 + ((index * 7 + 10) % 20); // e.g. 75% - 95%
      const mediaTempoMinutos = 30 + ((index * 4) % 12); // e.g. 30 - 42 min

      return {
        staffId: member.id,
        name: member.nome,
        role: member.cargo || 'Barbeiro',
        atendimentosCount,
        faturamentoTotal: Math.round(faturamentoTotal * 100) / 100,
        taxaOcupacao,
        mediaTempoMinutos,
      };
    });
  }
};

export const auditRepository = {
  getLogs(atelierId: string): AuditLogItem[] {
    const all = getItem<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'aud_1',
        atelierId,
        usuario: 'dono@estiloreal.com (Proprietário)',
        acao: 'Atualização de Horários de Expediente',
        categoria: 'configuracao',
        detalhes: 'Configuração de dias de funcionamento, pausa geral e limite de vagas diárias atualizada.',
        timestamp: Date.now() - 30 * 60 * 1000,
      },
      {
        id: 'aud_2',
        atelierId,
        usuario: 'dono@estiloreal.com (Proprietário)',
        acao: 'Conexão Stripe Connect',
        categoria: 'financeiro',
        detalhes: 'Chaves de API do Stripe ativadas para cobranças automáticas de assinaturas.',
        timestamp: Date.now() - 120 * 60 * 1000,
      },
      {
        id: 'aud_3',
        atelierId,
        usuario: 'dono@estiloreal.com (Proprietário)',
        acao: 'Alteração em Permissões de Push',
        categoria: 'whatsapp',
        detalhes: 'Ajuste nas preferências individuais de notificações de próximo da fila para clientes.',
        timestamp: Date.now() - 240 * 60 * 1000,
      },
      {
        id: 'aud_4',
        atelierId,
        usuario: 'rodrigo@estilo.com (Barbeiro Chefe)',
        acao: 'Adição de Novo Funcionário na Equipe',
        categoria: 'equipe',
        detalhes: 'Membro da equipe cadastrado no sistema.',
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
      },
    ]);
    return all.filter(item => item.atelierId === atelierId);
  },

  async logAction(atelierId: string, usuario: string, acao: string, categoria: AuditLogItem['categoria'], detalhes: string): Promise<AuditLogItem> {
    const all = getItem<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newItem: AuditLogItem = {
      id: 'aud_' + Date.now(),
      atelierId,
      usuario,
      acao,
      categoria,
      detalhes,
      timestamp: Date.now(),
    };
    all.unshift(newItem);
    setItem(STORAGE_KEYS.AUDIT_LOGS, all);
    return newItem;
  }
};

// --- PIX & AUTOMATIC REMINDERS REPOSITORY ---
const DEFAULT_PIX_CONFIG: PixConfig = {
  atelierId: DEFAULT_ATELIER_ID,
  chaveTipo: 'cnpj',
  chaveValor: '45.123.789/0001-90',
  beneficiario: 'Barbearia Estilo Real LTDA',
  cidade: 'São Paulo',
  autoGerarQrCode: true,
  lembreteAutomaticoAtivo: true,
  diasAposVencimento: 2,
  templateLembrete: 'Olá {{nome}}! Lembramos que o pagamento de {{servico}} no valor de {{valor}} venceu há {{dias_atraso}} dia(s). Para regularizar sem taxas adicionais, utilize nossa chave Pix ({{chave_tipo}}): *{{chave_pix}}* - Titular: *{{beneficiario}}*. Se já efetuou o pagamento, favor desconsiderar. 💈✂️',
};

export const pixRepository = {
  getConfig(atelierId: string): PixConfig {
    const all = getItem<Record<string, PixConfig>>(STORAGE_KEYS.PIX_CONFIG, {});
    if (all[atelierId]) {
      return { ...DEFAULT_PIX_CONFIG, ...all[atelierId], atelierId };
    }
    return { ...DEFAULT_PIX_CONFIG, atelierId };
  },

  saveConfig(config: PixConfig): void {
    const all = getItem<Record<string, PixConfig>>(STORAGE_KEYS.PIX_CONFIG, {});
    all[config.atelierId] = config;
    setItem(STORAGE_KEYS.PIX_CONFIG, all);
  },

  generatePixCopiaECola(config: PixConfig, valor: number, descricao: string = 'Atendimento'): string {
    const sanitizedKey = config.chaveValor.replace(/[^a-zA-Z0-9@.+_-]/g, '');
    const formattedValor = valor.toFixed(2);
    return `00020126580014br.gov.bcb.pix01${sanitizedKey.length.toString().padStart(2, '0')}${sanitizedKey}52040000530398654${formattedValor.length.toString().padStart(2, '0')}${formattedValor}5802BR59${(config.beneficiario || 'ESTILO').substring(0, 25).length.toString().padStart(2, '0')}${(config.beneficiario || 'ESTILO').substring(0, 25)}60${(config.cidade || 'SAO PAULO').substring(0, 15).length.toString().padStart(2, '0')}${(config.cidade || 'SAO PAULO').substring(0, 15)}62070503***6304`;
  }
};

// --- CARD MACHINES (MAQUININHAS DE CARTÃO) REPOSITORY ---
const INITIAL_CARD_MACHINES: MaquininhaCartao[] = [
  {
    id: 'pos_1',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Stone Smart POS (Balcão)',
    marca: 'stone',
    modelo: 'Pax A910 Android',
    tipoConexao: 'wifi',
    numeroSerie: 'ST-9482-A910',
    conectada: true,
    padrao: true,
    taxaDebito: 1.25,
    taxaCreditoVista: 2.99,
    taxaCreditoParcelado: 4.89,
  },
  {
    id: 'pos_2',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'PagBank Moderninha Smart (Cadeira 1)',
    marca: 'pagbank',
    modelo: 'Moderninha Pro 2',
    tipoConexao: 'bluetooth',
    numeroSerie: 'PAG-4819-MOD',
    conectada: true,
    padrao: false,
    taxaDebito: 1.39,
    taxaCreditoVista: 3.19,
    taxaCreditoParcelado: 5.49,
  },
  {
    id: 'pos_3',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Tap to Pay no Celular (NFC Aproximação)',
    marca: 'infinitepay',
    modelo: 'Celular como Maquininha NFC',
    tipoConexao: 'tap_on_phone',
    conectada: true,
    padrao: false,
    taxaDebito: 0.99,
    taxaCreditoVista: 2.75,
    taxaCreditoParcelado: 4.20,
  }
];

export const cardMachineRepository = {
  getMachines(atelierId: string): MaquininhaCartao[] {
    const all = getItem<MaquininhaCartao[]>(STORAGE_KEYS.CARD_MACHINES, INITIAL_CARD_MACHINES);
    const filtered = all.filter(m => m.atelierId === atelierId);
    if (filtered.length === 0) {
      // Seed for this atelier if empty
      const seeded = INITIAL_CARD_MACHINES.map(m => ({ ...m, atelierId }));
      this.saveMachines(atelierId, seeded);
      return seeded;
    }
    return filtered;
  },

  saveMachines(atelierId: string, machines: MaquininhaCartao[]): void {
    const all = getItem<MaquininhaCartao[]>(STORAGE_KEYS.CARD_MACHINES, INITIAL_CARD_MACHINES);
    const others = all.filter(m => m.atelierId !== atelierId);
    setItem(STORAGE_KEYS.CARD_MACHINES, [...others, ...machines]);
  },

  addMachine(machine: Omit<MaquininhaCartao, 'id'>): MaquininhaCartao {
    const all = getItem<MaquininhaCartao[]>(STORAGE_KEYS.CARD_MACHINES, INITIAL_CARD_MACHINES);
    const newMachine: MaquininhaCartao = {
      ...machine,
      id: 'pos_' + Date.now(),
    };
    if (newMachine.padrao) {
      all.forEach(m => {
        if (m.atelierId === newMachine.atelierId) m.padrao = false;
      });
    }
    all.push(newMachine);
    setItem(STORAGE_KEYS.CARD_MACHINES, all);
    return newMachine;
  },

  updateMachine(id: string, updates: Partial<MaquininhaCartao>): void {
    const all = getItem<MaquininhaCartao[]>(STORAGE_KEYS.CARD_MACHINES, INITIAL_CARD_MACHINES);
    const target = all.find(m => m.id === id);
    const updated = all.map(m => {
      if (m.id === id) {
        return { ...m, ...updates };
      }
      if (updates.padrao && target && m.atelierId === target.atelierId) {
        return { ...m, padrao: false };
      }
      return m;
    });
    setItem(STORAGE_KEYS.CARD_MACHINES, updated);
  },

  deleteMachine(id: string): void {
    const all = getItem<MaquininhaCartao[]>(STORAGE_KEYS.CARD_MACHINES, INITIAL_CARD_MACHINES);
    setItem(STORAGE_KEYS.CARD_MACHINES, all.filter(m => m.id !== id));
  },

  setDefaultMachine(id: string, atelierId: string): void {
    const all = getItem<MaquininhaCartao[]>(STORAGE_KEYS.CARD_MACHINES, INITIAL_CARD_MACHINES);
    const updated = all.map(m => {
      if (m.atelierId === atelierId) {
        return { ...m, padrao: m.id === id };
      }
      return m;
    });
    setItem(STORAGE_KEYS.CARD_MACHINES, updated);
  }
};

// --- PAYMENT METHODS VISIBILITY & CONFIGURATION REPOSITORY ---
const DEFAULT_PAYMENT_METHODS_CONFIG: PaymentMethodsConfig = {
  atelierId: DEFAULT_ATELIER_ID,
  pixHabilitado: true,
  cartaoDebitoHabilitado: true,
  cartaoCreditoHabilitado: true,
  tapOnPhoneHabilitado: true,
  dinheiroHabilitado: true,
  metodoPadrao: 'pix',
};

export const paymentMethodsRepository = {
  getConfig(atelierId: string): PaymentMethodsConfig {
    const all = getItem<Record<string, PaymentMethodsConfig>>(STORAGE_KEYS.PAYMENT_METHODS_CONFIG, {});
    if (all[atelierId]) {
      return { ...DEFAULT_PAYMENT_METHODS_CONFIG, ...all[atelierId], atelierId };
    }
    return { ...DEFAULT_PAYMENT_METHODS_CONFIG, atelierId };
  },

  saveConfig(config: PaymentMethodsConfig): void {
    const all = getItem<Record<string, PaymentMethodsConfig>>(STORAGE_KEYS.PAYMENT_METHODS_CONFIG, {});
    all[config.atelierId] = config;
    setItem(STORAGE_KEYS.PAYMENT_METHODS_CONFIG, all);
  }
};

// --- DIGITAL RECEIPT TEMPLATE (RECIBO DIGITAL PDF) REPOSITORY ---
export const DEFAULT_DIGITAL_RECEIPT_CONFIG: DigitalReceiptConfig = {
  atelierId: DEFAULT_ATELIER_ID,
  ativo: true,
  enviarWhatsAppAutomatico: true,
  permitirDownloadPdf: true,
  mostrarLogo: true,
  logoUrl: '',
  tituloRecibo: 'COMPROVANTE DE ATENDIMENTO & PAGAMENTO',
  subtitulo: 'Atelier de Estilo Masculino • Corte & Barba Premium',
  corDestaque: '#F2CA50',
  mostrarCnpj: true,
  cnpj: '45.123.789/0001-90',
  mostrarEndereco: true,
  enderecoCompleto: 'Rua Augusta, 1492 - Jardins, São Paulo - SP',
  mostrarTelefone: true,
  telefoneContato: '(11) 98765-4321',
  mostrarInstagram: true,
  instagramHandle: '@estiloexato.barber',
  mostrarDetalhesServico: true,
  mostrarProfissional: true,
  mostrarFormaPagamento: true,
  mostrarDadosMaquininha: true,
  mostrarDataHora: true,
  mostrarCodigoAutenticidade: true,
  mensagemAgradecimento: 'Obrigado pela preferência e confiança! Seu visual impecável é a nossa missão.',
  termosGarantia: 'Garantia de 3 dias para ajustes finos de contorno e acabamento. Não substitui documento fiscal.',
  incluirChavePixGorjeta: false,
};

export const digitalReceiptRepository = {
  getConfig(atelierId: string): DigitalReceiptConfig {
    const all = getItem<Record<string, DigitalReceiptConfig>>(STORAGE_KEYS.DIGITAL_RECEIPT_CONFIG, {});
    if (all[atelierId]) {
      return { ...DEFAULT_DIGITAL_RECEIPT_CONFIG, ...all[atelierId], atelierId };
    }
    return { ...DEFAULT_DIGITAL_RECEIPT_CONFIG, atelierId };
  },

  saveConfig(config: DigitalReceiptConfig): void {
    const all = getItem<Record<string, DigitalReceiptConfig>>(STORAGE_KEYS.DIGITAL_RECEIPT_CONFIG, {});
    all[config.atelierId] = config;
    setItem(STORAGE_KEYS.DIGITAL_RECEIPT_CONFIG, all);
  }
};

// --- INVENTORY / STOCK MANAGEMENT REPOSITORY ---
const INITIAL_INVENTORY_PRODUCTS: InventoryProduct[] = [
  {
    id: 'inv_1',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Lâmina Descartável Platinum',
    categoria: 'higiene_descartaveis',
    unidade: 'un',
    quantidadeAtual: 16,
    estoqueMinimo: 20,
    custoUnitario: 0.9,
    servicosAssociados: [
      { serviceId: 's1', serviceName: 'Corte Degradê Fade', consumoPorAtendimento: 1 },
      { serviceId: 's2', serviceName: 'Barba Terapia com Toalha Quente', consumoPorAtendimento: 1 },
      { serviceId: 's3', serviceName: 'Combo Completo (Cabelo + Barba)', consumoPorAtendimento: 2 },
    ],
    atualizadoEm: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'inv_2',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Creme de Barbear Premium (Dose)',
    categoria: 'consumo_interno',
    unidade: 'doses',
    quantidadeAtual: 24,
    estoqueMinimo: 8,
    custoUnitario: 2.5,
    servicosAssociados: [
      { serviceId: 's2', serviceName: 'Barba Terapia com Toalha Quente', consumoPorAtendimento: 1 },
      { serviceId: 's3', serviceName: 'Combo Completo (Cabelo + Barba)', consumoPorAtendimento: 1 },
    ],
    atualizadoEm: Date.now() - 5 * 60 * 60 * 1000,
  },
  {
    id: 'inv_3',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Pomada Modeladora Matte (Bancada)',
    categoria: 'consumo_interno',
    unidade: 'doses',
    quantidadeAtual: 4,
    estoqueMinimo: 6,
    custoUnitario: 3.2,
    servicosAssociados: [
      { serviceId: 's1', serviceName: 'Corte Degradê Fade', consumoPorAtendimento: 1 },
      { serviceId: 's3', serviceName: 'Combo Completo (Cabelo + Barba)', consumoPorAtendimento: 1 },
    ],
    atualizadoEm: Date.now() - 1 * 60 * 60 * 1000,
  },
  {
    id: 'inv_4',
    atelierId: DEFAULT_ATELIER_ID,
    nome: 'Gola Higiênica Descartável',
    categoria: 'higiene_descartaveis',
    unidade: 'un',
    quantidadeAtual: 82,
    estoqueMinimo: 30,
    custoUnitario: 0.25,
    servicosAssociados: [
      { serviceId: 's1', serviceName: 'Corte Degradê Fade', consumoPorAtendimento: 1 },
      { serviceId: 's3', serviceName: 'Combo Completo (Cabelo + Barba)', consumoPorAtendimento: 1 },
      { serviceId: 's4', serviceName: 'Acabamento / Pezinho + Sobrancelha', consumoPorAtendimento: 1 },
    ],
    atualizadoEm: Date.now() - 24 * 60 * 60 * 1000,
  },
];

const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov_1',
    atelierId: DEFAULT_ATELIER_ID,
    productId: 'inv_1',
    productName: 'Lâmina Descartável Platinum',
    tipo: 'baixa_automatica',
    quantidade: -1,
    motivo: 'Serviço finalizado: Corte Degradê Fade (André Ramos)',
    timestamp: Date.now() - 35 * 60 * 1000,
  },
  {
    id: 'mov_2',
    atelierId: DEFAULT_ATELIER_ID,
    productId: 'inv_3',
    productName: 'Pomada Modeladora Matte (Bancada)',
    tipo: 'baixa_automatica',
    quantidade: -1,
    motivo: 'Serviço finalizado: Combo Completo (Cabelo + Barba)',
    timestamp: Date.now() - 170 * 60 * 1000,
  },
  {
    id: 'mov_3',
    atelierId: DEFAULT_ATELIER_ID,
    productId: 'inv_4',
    productName: 'Gola Higiênica Descartável',
    tipo: 'entrada',
    quantidade: 100,
    motivo: 'Reposição de estoque (Rolo c/ 100)',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
  },
];

export const inventoryRepository = {
  getProducts(atelierId: string): InventoryProduct[] {
    const all = getItem<InventoryProduct[]>(STORAGE_KEYS.INVENTORY_PRODUCTS, INITIAL_INVENTORY_PRODUCTS);
    return all.filter(p => p.atelierId === atelierId);
  },

  getLowStockProducts(atelierId: string): InventoryProduct[] {
    return this.getProducts(atelierId).filter(p => p.quantidadeAtual <= p.estoqueMinimo);
  },

  getMovements(atelierId: string): InventoryMovement[] {
    const all = getItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, INITIAL_INVENTORY_MOVEMENTS);
    return all.filter(m => m.atelierId === atelierId).sort((a, b) => b.timestamp - a.timestamp);
  },

  addProduct(
    atelierId: string,
    data: Omit<InventoryProduct, 'id' | 'atelierId' | 'atualizadoEm'>
  ): InventoryProduct {
    const all = getItem<InventoryProduct[]>(STORAGE_KEYS.INVENTORY_PRODUCTS, INITIAL_INVENTORY_PRODUCTS);
    const newProduct: InventoryProduct = {
      ...data,
      id: 'inv_' + Date.now(),
      atelierId,
      atualizadoEm: Date.now(),
    };
    all.unshift(newProduct);
    setItem(STORAGE_KEYS.INVENTORY_PRODUCTS, all);

    if (newProduct.quantidadeAtual > 0) {
      const movements = getItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, INITIAL_INVENTORY_MOVEMENTS);
      movements.unshift({
        id: 'mov_' + Date.now(),
        atelierId,
        productId: newProduct.id,
        productName: newProduct.nome,
        tipo: 'entrada',
        quantidade: newProduct.quantidadeAtual,
        motivo: 'Cadastro inicial no estoque',
        timestamp: Date.now(),
      });
      setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements);
    }

    return newProduct;
  },

  updateProduct(productId: string, updates: Partial<InventoryProduct>): void {
    const all = getItem<InventoryProduct[]>(STORAGE_KEYS.INVENTORY_PRODUCTS, INITIAL_INVENTORY_PRODUCTS);
    const updated = all.map(p =>
      p.id === productId ? { ...p, ...updates, atualizadoEm: Date.now() } : p
    );
    setItem(STORAGE_KEYS.INVENTORY_PRODUCTS, updated);
  },

  setProductServiceAssociations(productId: string, associations: ServiceProductUsage[]): void {
    this.updateProduct(productId, { servicosAssociados: associations });
  },

  adjustStock(
    productId: string,
    delta: number,
    tipo: InventoryMovement['tipo'] = delta >= 0 ? 'entrada' : 'ajuste_manual',
    motivo?: string
  ): void {
    const all = getItem<InventoryProduct[]>(STORAGE_KEYS.INVENTORY_PRODUCTS, INITIAL_INVENTORY_PRODUCTS);
    let targetProduct: InventoryProduct | null = null;
    const updated = all.map(p => {
      if (p.id === productId) {
        const nextQty = Math.max(0, p.quantidadeAtual + delta);
        targetProduct = { ...p, quantidadeAtual: nextQty, atualizadoEm: Date.now() };
        return targetProduct;
      }
      return p;
    });
    setItem(STORAGE_KEYS.INVENTORY_PRODUCTS, updated);

    if (targetProduct && delta !== 0) {
      const movements = getItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, INITIAL_INVENTORY_MOVEMENTS);
      movements.unshift({
        id: 'mov_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        atelierId: (targetProduct as InventoryProduct).atelierId,
        productId,
        productName: (targetProduct as InventoryProduct).nome,
        tipo,
        quantidade: delta,
        motivo: motivo || (delta > 0 ? 'Reposição de estoque' : 'Ajuste manual de saída'),
        timestamp: Date.now(),
      });
      setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements.slice(0, 100));
    }
  },

  deleteProduct(productId: string): void {
    const all = getItem<InventoryProduct[]>(STORAGE_KEYS.INVENTORY_PRODUCTS, INITIAL_INVENTORY_PRODUCTS);
    setItem(STORAGE_KEYS.INVENTORY_PRODUCTS, all.filter(p => p.id !== productId));
  },

  deductStockForService(atelierId: string, serviceText: string, clientName?: string): InventoryProduct[] {
    if (!serviceText) return [];
    const normalizedText = serviceText.toLowerCase();
    const all = getItem<InventoryProduct[]>(STORAGE_KEYS.INVENTORY_PRODUCTS, INITIAL_INVENTORY_PRODUCTS);
    const movements = getItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, INITIAL_INVENTORY_MOVEMENTS);
    const deductedProducts: InventoryProduct[] = [];

    const updated = all.map(product => {
      if (product.atelierId !== atelierId || !product.servicosAssociados?.length) {
        return product;
      }

      const matchedUsage = product.servicosAssociados.find(
        assoc =>
          normalizedText === assoc.serviceName.toLowerCase() ||
          normalizedText.includes(assoc.serviceName.toLowerCase()) ||
          assoc.serviceId.toLowerCase() === normalizedText
      );

      if (!matchedUsage || matchedUsage.consumoPorAtendimento <= 0) {
        return product;
      }

      const qtyToDeduct = matchedUsage.consumoPorAtendimento;
      const nextQty = Math.max(0, product.quantidadeAtual - qtyToDeduct);
      const updatedProduct: InventoryProduct = {
        ...product,
        quantidadeAtual: nextQty,
        atualizadoEm: Date.now(),
      };
      deductedProducts.push(updatedProduct);

      movements.unshift({
        id: 'mov_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        atelierId,
        productId: product.id,
        productName: product.nome,
        tipo: 'baixa_automatica',
        quantidade: -qtyToDeduct,
        motivo: `Baixa automática: ${matchedUsage.serviceName}${clientName ? ` (${clientName})` : ''}`,
        timestamp: Date.now(),
      });

      return updatedProduct;
    });

    if (deductedProducts.length > 0) {
      setItem(STORAGE_KEYS.INVENTORY_PRODUCTS, updated);
      setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements.slice(0, 100));
    }

    return deductedProducts;
  },
};

// --- SERVICE FEEDBACK REPOSITORY ---
const INITIAL_FEEDBACKS: ServiceFeedback[] = [
  {
    id: 'fb_1',
    atelierId: DEFAULT_ATELIER_ID,
    clientId: DEFAULT_CLIENT_ID,
    clientName: 'Marcos Oliveira',
    serviceName: 'Corte Degradê Fade',
    staffName: 'Rodrigo Silva',
    nota: 5,
    comentario: 'Atendimento impecável, degradê bem alinhado e pontualidade nota 10!',
    tags: ['Corte Impecável', 'Pontualidade'],
    criadoEm: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'fb_2',
    atelierId: DEFAULT_ATELIER_ID,
    clientId: 'cli_2',
    clientName: 'Lucas Ferreira',
    serviceName: 'Barba Terapia com Toalha Quente',
    staffName: 'Carlos Mendes',
    nota: 5,
    comentario: 'Toalha quente relaxante demais, ambiente muito limpo.',
    tags: ['Atendimento Top', 'Ambiente Limpo'],
    criadoEm: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
];

export const feedbackRepository = {
  getAtelierFeedbacks(atelierId: string): ServiceFeedback[] {
    const all = getItem<ServiceFeedback[]>(STORAGE_KEYS.SERVICE_FEEDBACKS, INITIAL_FEEDBACKS);
    return all
      .filter((f) => f.atelierId === atelierId)
      .sort((a, b) => b.criadoEm - a.criadoEm);
  },

  getClientFeedbacks(clientId: string, atelierId: string): ServiceFeedback[] {
    return this.getAtelierFeedbacks(atelierId).filter((f) => f.clientId === clientId);
  },

  addFeedback(data: Omit<ServiceFeedback, 'id' | 'criadoEm'>): ServiceFeedback {
    const all = getItem<ServiceFeedback[]>(STORAGE_KEYS.SERVICE_FEEDBACKS, INITIAL_FEEDBACKS);
    const created: ServiceFeedback = {
      ...data,
      id: 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      criadoEm: Date.now(),
    };
    all.unshift(created);
    setItem(STORAGE_KEYS.SERVICE_FEEDBACKS, all);
    return created;
  },

  getAverageRating(atelierId: string): { average: number; total: number } {
    const list = this.getAtelierFeedbacks(atelierId);
    if (list.length === 0) return { average: 5, total: 0 };
    const sum = list.reduce((acc, f) => acc + f.nota, 0);
    return {
      average: Math.round((sum / list.length) * 10) / 10,
      total: list.length,
    };
  },
};
