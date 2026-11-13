import React, { useState, useEffect } from 'react';
import { 
  authRepository, 
  atelierRepository, 
  clientRepository, 
  queueRepository,
  appointmentRepository,
  initializeStore 
} from './services/store';
import { pushNotificationService, QueueRealtimeMonitor } from './services/notificationService';
import { AtelierProfile, ClientProfile } from './types';
import { WelcomePage } from './components/WelcomePage';
import { RegisterPage } from './components/RegisterPage';
import { StaffLoginPage } from './components/StaffLoginPage';
import { SetupPage } from './components/SetupPage';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { WalkInRegistrationModal } from './components/WalkInRegistrationModal';
import { ProfileModal } from './components/ProfileModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { FinanceReportModal } from './components/FinanceReportModal';
import { ServiceMenuModal } from './components/ServiceMenuModal';
import { PlansManagementModal } from './components/PlansManagementModal';
import { WhatsAppIntegrationModal } from './components/WhatsAppIntegrationModal';
import { AtelierLocationModal } from './components/AtelierLocationModal';
import { ClientNotificationPermissionsModal } from './components/ClientNotificationPermissionsModal';
import { ScheduleSettingsModal } from './components/ScheduleSettingsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { CustomDomainModal } from './components/CustomDomainModal';
import { PaymentSettingsModal } from './components/PaymentSettingsModal';
import { LoyaltySettingsModal } from './components/LoyaltySettingsModal';
import { ExpiredModal } from './components/ExpiredModal';
import { PublicQueuePage } from './components/PublicQueuePage';
import { ClientLoginPage } from './components/ClientLoginPage';
import { ClientRegisterPage } from './components/ClientRegisterPage';
import { ClientHomePage } from './components/ClientHomePage';
import { Bell } from 'lucide-react';

export const App: React.FC = () => {
  // Initialize store seed once
  useEffect(() => {
    initializeStore();
  }, []);

  // Screen router state
  const [currentScreen, setCurrentScreen] = useState<string>('welcome');
  const [activeAtelierId, setActiveAtelierId] = useState<string>('demo-atelier-1');
  const [currentClient, setCurrentClient] = useState<ClientProfile | null>(null);

  // Active sub-modals for admin
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [serviceModalInitialTab, setServiceModalInitialTab] = useState<'servicos' | 'estoque'>('servicos');
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isNotificationPermissionsOpen, setIsNotificationPermissionsOpen] = useState(false);
  const [isScheduleSettingsOpen, setIsScheduleSettingsOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isCustomDomainOpen, setIsCustomDomainOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [isLoyaltySettingsOpen, setIsLoyaltySettingsOpen] = useState(false);

  // Google Maps Demo Key Quota Defense Listener (Tier 2)
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Browser Push Notification state for owner alerts
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() =>
    pushNotificationService.getPermission()
  );
  const [ownerPushEnabled, setOwnerPushEnabled] = useState<boolean>(() =>
    pushNotificationService.isOwnerAlertsEnabled()
  );

  // Global Real-Time Push Notification Floating Toast
  const [activePushToast, setActivePushToast] = useState<{
    title: string;
    body: string;
    type?: string;
  } | null>(null);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    const handlePushEvent = (e: any) => {
      const detail = e.detail;
      if (detail && detail.title) {
        setActivePushToast({
          title: detail.title,
          body: detail.body || '',
          type: detail.type,
        });
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          setActivePushToast(null);
        }, 7000);
      }
    };

    const handleStorageSync = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('estilo_')) {
        window.dispatchEvent(new CustomEvent('estilo_store_updated'));
      }
    };

    window.addEventListener('estilo_push_notification', handlePushEvent);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      window.removeEventListener('estilo_push_notification', handlePushEvent);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Read URL Hash for dynamic route matching Flutter: estilozap.com/#/fila/ID_DO_ATELIER
  useEffect(() => {
    const checkHashRoute = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/fila/')) {
        const id = hash.replace('#/fila/', '').trim();
        if (id) {
          setActiveAtelierId(id);
          setCurrentScreen('public_queue');
        }
      }
    };

    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);
    return () => window.removeEventListener('hashchange', checkHashRoute);
  }, []);

  // Sync auth state
  const [session, setSession] = useState(authRepository.getCurrentUser());

  useEffect(() => {
    const handleUpdate = () => {
      setSession(authRepository.getCurrentUser());
    };
    window.addEventListener('estilo_store_updated', handleUpdate);
    return () => window.removeEventListener('estilo_store_updated', handleUpdate);
  }, []);

  // Load active atelier data
  const atelier = atelierRepository.getAtelier(
    session?.atelierId || activeAtelierId
  ) || atelierRepository.getAllAteliers()[0];

  // Check subscription and configuration
  const isConfigured = atelier ? atelier.configurado : false;
  const isSubscriptionValid = atelier
    ? atelier.status_assinatura === 'ativo' || Date.now() < atelier.data_expiracao
    : true;

  // Owner real-time queue monitor for browser push alerts when new clients join
  useEffect(() => {
    if (!session || session.role !== 'owner' || !atelier?.id || !isConfigured || !isSubscriptionValid) {
      return;
    }

    const monitor = new QueueRealtimeMonitor({
      atelierId: atelier.id,
      isOwner: true,
      onEvent: (event) => {
        if (event.type === 'new_client_joined' && event.data?.queueItem) {
          queueRepository.syncRemoteQueueItem(event.data.queueItem);
        }
      },
    });

    return () => monitor.destroy();
  }, [session?.email, session?.role, atelier?.id, isConfigured, isSubscriptionValid]);

  // Periodic automatic WhatsApp reminder check based on ScheduleSettingsModal configuration
  useEffect(() => {
    if (!session || session.role !== 'owner' || !atelier?.id || !isConfigured || !isSubscriptionValid) {
      return;
    }

    const runReminderCheck = () => {
      const expediente = atelierRepository.getExpediente(atelier.id);
      if (expediente.configuracaoLembretes?.habilitado ?? true) {
        void appointmentRepository.processPendingWhatsAppReminders(atelier.id);
      }
    };

    runReminderCheck();
    const timer = window.setInterval(runReminderCheck, 60_000);
    return () => window.clearInterval(timer);
  }, [session?.email, session?.role, atelier?.id, isConfigured, isSubscriptionValid]);

  const handleRequestOwnerPush = async () => {
    const perm = await pushNotificationService.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      pushNotificationService.setOwnerAlertsEnabled(true);
      setOwnerPushEnabled(true);
      pushNotificationService.send({
        title: '🔔 Notificações Push Ativadas!',
        body: 'Você receberá alertas em tempo real no navegador sempre que um novo cliente entrar na fila.',
        type: 'new_client_joined',
        timestamp: Date.now(),
      });
    }
  };

  const handleToggleOwnerPush = () => {
    const next = !ownerPushEnabled;
    pushNotificationService.setOwnerAlertsEnabled(next);
    setOwnerPushEnabled(next);
  };

  const handleTestOwnerPush = () => {
    pushNotificationService.send({
      title: '🔔 Novo Cliente na Fila! (Teste)',
      body: 'Exemplo em tempo real: Cliente entrou na fila online via QR Code (#14).',
      type: 'new_client_joined',
      timestamp: Date.now(),
    });
  };

  // Handlers
  const handleLogout = async () => {
    await authRepository.logout();
    setCurrentClient(null);
    setCurrentScreen('welcome');
    setIsWalkInOpen(false);
    setIsProfileOpen(false);
    setIsTeamOpen(false);
    setIsFinanceOpen(false);
    setIsServicesOpen(false);
    setIsPlansOpen(false);
    setIsWhatsAppOpen(false);
    setIsNotificationPermissionsOpen(false);
    setIsScheduleSettingsOpen(false);
    window.location.hash = '';
  };

  // --- ROUTING RENDERER ---
  const renderScreen = () => {
    // 1. Direct Public Queue Screen via Hash or Navigation
    if (currentScreen === 'public_queue') {
      return (
        <PublicQueuePage
          atelierId={activeAtelierId}
          onBack={() => {
            window.location.hash = '';
            setCurrentScreen('welcome');
          }}
          onGoToClientLogin={() => setCurrentScreen('client_login')}
          onGoToStaffLogin={() => setCurrentScreen('staff_login')}
          onOpenLocation={() => setIsLocationOpen(true)}
        />
      );
    }

    // 2. Client Flow (Login, Register, Home)
    if (currentScreen === 'client_login') {
      return (
        <ClientLoginPage
          atelierId={activeAtelierId}
          onBack={() => setCurrentScreen('welcome')}
          onSuccess={(clientProfile) => {
            setCurrentClient(clientProfile);
            setCurrentScreen('client_home');
          }}
          onGoToRegister={() => setCurrentScreen('client_register')}
        />
      );
    }

    if (currentScreen === 'client_register') {
      return (
        <ClientRegisterPage
          atelierId={activeAtelierId}
          onBack={() => setCurrentScreen('client_login')}
          onSuccess={(clientProfile) => {
            setCurrentClient(clientProfile);
            setCurrentScreen('client_home');
          }}
        />
      );
    }

    if (currentScreen === 'client_home' && currentClient) {
      return (
        <ClientHomePage
          client={currentClient}
          atelierId={currentClient.atelier_origem || activeAtelierId}
          onLogout={handleLogout}
          onGoToPublicQueue={() => setCurrentScreen('public_queue')}
          onOpenLocation={() => setIsLocationOpen(true)}
        />
      );
    }

    // 3. Unauthenticated Staff Flow
    if (!session) {
      if (currentScreen === 'register_owner') {
        return (
          <RegisterPage
            onBack={() => setCurrentScreen('welcome')}
            onSuccess={(newAtelierId) => {
              setActiveAtelierId(newAtelierId);
            }}
          />
        );
      }

      if (currentScreen === 'staff_login') {
        return (
          <StaffLoginPage
            onBack={() => setCurrentScreen('welcome')}
            onSuccess={() => {}}
          />
        );
      }

      return (
        <WelcomePage
          onSelectProprietario={() => setCurrentScreen('register_owner')}
          onSelectJaTenhoConta={() => setCurrentScreen('staff_login')}
          onOpenPublicQueue={() => {
            window.location.hash = `#/fila/${activeAtelierId}`;
            setCurrentScreen('public_queue');
          }}
          onOpenClientPortal={() => setCurrentScreen('client_login')}
        />
      );
    }

    // 4. Authenticated Staff / Owner Flow
    if (!isConfigured) {
      return (
        <SetupPage
          atelierId={atelier.id}
          onCompleted={() => {
            setSession({ ...session });
          }}
          onLogout={handleLogout}
        />
      );
    }

    if (!isSubscriptionValid) {
      return (
        <ExpiredModal
          atelierId={atelier.id}
          onPaymentSuccess={() => {
            setSession({ ...session });
          }}
          onLogout={handleLogout}
        />
      );
    }

    // Main Admin Dashboard
    return (
      <AdminDashboardPage
        atelier={atelier}
        isAdmin={session.role === 'owner'}
        onOpenFinanceReport={() => setIsFinanceOpen(true)}
        onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
        onOpenInventory={() => {
          setServiceModalInitialTab('estoque');
          setIsServicesOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        onOpenLocation={() => setIsLocationOpen(true)}
        onLogout={handleLogout}
        onOpenWalkIn={() => setIsWalkInOpen(true)}
        onViewPublicQueue={() => {
          window.location.hash = `#/fila/${atelier.id}`;
          setCurrentScreen('public_queue');
        }}
        onOpenClientPortal={() => {
          if (!currentClient) {
            const defaultCli = clientRepository.getAllClients()[0];
            setCurrentClient(defaultCli);
          }
          setCurrentScreen('client_home');
        }}
        pushPermission={pushPermission}
        ownerPushEnabled={ownerPushEnabled}
        onRequestPushPermission={handleRequestOwnerPush}
        onToggleOwnerPush={handleToggleOwnerPush}
        onTestOwnerPush={handleTestOwnerPush}
      />
    );
  };

  return (
    <>
      {/* Tier 2 Quota Defense Notice for Demo Key */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {renderScreen()}

      {/* Sub Modals */}
      {isWalkInOpen && (
        <WalkInRegistrationModal
          atelierId={atelier.id}
          onClose={() => setIsWalkInOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          atelier={atelier}
          onClose={() => setIsProfileOpen(false)}
          onOpenTeam={() => {
            setIsProfileOpen(false);
            setIsTeamOpen(true);
          }}
          onOpenFinance={() => {
            setIsProfileOpen(false);
            setIsFinanceOpen(true);
          }}
          onOpenServices={() => {
            setIsProfileOpen(false);
            setServiceModalInitialTab('servicos');
            setIsServicesOpen(true);
          }}
          onOpenPlans={() => {
            setIsProfileOpen(false);
            setIsPlansOpen(true);
          }}
          onOpenWhatsApp={() => {
            setIsProfileOpen(false);
            setIsWhatsAppOpen(true);
          }}
          onOpenNotificationPermissions={() => {
            setIsProfileOpen(false);
            setIsNotificationPermissionsOpen(true);
          }}
          onOpenScheduleSettings={() => {
            setIsProfileOpen(false);
            setIsScheduleSettingsOpen(true);
          }}
          onOpenAuditLog={() => {
            setIsProfileOpen(false);
            setIsAuditLogOpen(true);
          }}
          onOpenCustomDomain={() => {
            setIsProfileOpen(false);
            setIsCustomDomainOpen(true);
          }}
          onOpenPaymentSettings={() => {
            setIsProfileOpen(false);
            setIsPaymentSettingsOpen(true);
          }}
          onOpenLoyaltySettings={() => {
            setIsProfileOpen(false);
            setIsLoyaltySettingsOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {isTeamOpen && (
        <TeamManagementModal
          atelierId={atelier.id}
          onClose={() => setIsTeamOpen(false)}
        />
      )}

      {isFinanceOpen && (
        <FinanceReportModal
          atelierId={atelier.id}
          onClose={() => setIsFinanceOpen(false)}
        />
      )}

      {isServicesOpen && (
        <ServiceMenuModal
          atelierId={atelier.id}
          initialTab={serviceModalInitialTab}
          onClose={() => setIsServicesOpen(false)}
        />
      )}

      {isPlansOpen && (
        <PlansManagementModal
          atelierId={atelier.id}
          onClose={() => setIsPlansOpen(false)}
        />
      )}

      {isWhatsAppOpen && (
        <WhatsAppIntegrationModal
          atelier={atelier}
          onClose={() => setIsWhatsAppOpen(false)}
        />
      )}

      {isLocationOpen && (
        <AtelierLocationModal
          atelier={atelier}
          onClose={() => setIsLocationOpen(false)}
        />
      )}

      {isNotificationPermissionsOpen && (
        <ClientNotificationPermissionsModal
          atelierId={atelier.id}
          onClose={() => setIsNotificationPermissionsOpen(false)}
        />
      )}

      {isScheduleSettingsOpen && (
        <ScheduleSettingsModal
          atelier={atelier}
          onClose={() => setIsScheduleSettingsOpen(false)}
        />
      )}

      {isAuditLogOpen && (
        <AuditLogModal
          atelierId={atelier.id}
          onClose={() => setIsAuditLogOpen(false)}
        />
      )}

      {isPaymentSettingsOpen && (
        <PaymentSettingsModal
          atelier={atelier}
          onClose={() => setIsPaymentSettingsOpen(false)}
        />
      )}

      {isLoyaltySettingsOpen && (
        <LoyaltySettingsModal
          atelier={atelier}
          onClose={() => setIsLoyaltySettingsOpen(false)}
        />
      )}

      {/* Floating Push Notification Toast */}
      {activePushToast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-11/12 animate-slideDown pointer-events-auto">
          <div
            className={`p-4 rounded-2xl bg-[#1C1C1B] border-2 shadow-2xl shadow-black/80 flex items-start gap-3 ${
              activePushToast.type === 'new_client_joined' ? 'border-[#25D366]' : 'border-[#F2CA50]'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl text-black flex items-center justify-center shrink-0 ${
                activePushToast.type === 'new_client_joined' ? 'bg-[#25D366]' : 'bg-[#F2CA50]'
              }`}
            >
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading font-black text-xs text-white uppercase tracking-wider truncate">
                  {activePushToast.title}
                </span>
                <span
                  className={`text-[10px] font-bold shrink-0 ${
                    activePushToast.type === 'new_client_joined' ? 'text-[#25D366]' : 'text-[#F2CA50]'
                  }`}
                >
                  Agora
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                {activePushToast.body}
              </p>
            </div>
            <button
              onClick={() => setActivePushToast(null)}
              className="text-white/40 hover:text-white text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};
