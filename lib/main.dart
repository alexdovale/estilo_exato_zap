import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';

import 'firebase_options.dart';
import 'core/theme/app_theme.dart';

// --- IMPORTAÇÕES DE TELAS (ADMIN & STAFF) ---
import 'features/auth/welcome_page.dart';
import 'features/auth/register_page.dart';
import 'features/auth/staff_login_page.dart';
//import 'features/auth/login_page.dart';
import 'features/admin/admin_dashboard_page.dart';
import 'features/admin/profile_page.dart';
import 'features/setup/setup_page.dart';

// --- IMPORTAÇÕES DE TELAS (CLIENTE) ---
import 'features/client/client_login_page.dart';
import 'features/client/client_register_page.dart';
import 'features/client/client_home_page.dart';
import 'features/queue/public_queue_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicialização oficial do Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const EstiloExatoZapApp());
}

class EstiloExatoZapApp extends StatelessWidget {
  const EstiloExatoZapApp({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, authSnapshot) {
        final user = authSnapshot.data;

        // --- 1. SE DESLOGADO: Mostra a Welcome Page oficial ---
        if (user == null) {
          return _buildMaterialApp(context, 'obsidian', const WelcomePage());
        }

        // --- 2. SE LOGADO: Verifica se é um ATELIER (Dono/Equipe) ---
        return StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance.collection('ateliers').doc(user.uid).snapshots(),
          builder: (context, dbSnapshot) {
            if (dbSnapshot.connectionState == ConnectionState.waiting) {
              return _buildMaterialApp(context, 'obsidian', const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)))));
            }

            // --- FLUXO DO ADMINISTRADOR / EQUIPE ---
            if (dbSnapshot.hasData && dbSnapshot.data!.exists) {
              final data = dbSnapshot.data!.data() as Map<String, dynamic>;
              
              final String themeName = data['tema'] ?? 'obsidian';
              final bool isConfigured = data['configurado'] ?? false;
              final String status = data['status_assinatura'] ?? 'trial';
              final Timestamp? expiryTimestamp = data['data_expiracao'];
              
              DateTime dataExpiracao = expiryTimestamp != null 
                  ? expiryTimestamp.toDate() 
                  : DateTime.now().add(const Duration(days: 7)); 
              
              DateTime hoje = DateTime.now();
              bool temAcesso = status == 'ativo' || hoje.isBefore(dataExpiracao);

              if (!isConfigured) {
                return _buildMaterialApp(context, themeName, const SetupPage());
              } else if (!temAcesso) {
                return _buildMaterialApp(context, themeName, _buildExpiredPage());
              } else {
                return _buildMaterialApp(context, themeName, const AdminDashboardPage());
              }
            }

            // --- 3. SE NÃO É ATELIER, VERIFICA SE É UM CLIENTE LOGADO ---
            return StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance.collection('clientes').doc(user.uid).snapshots(),
              builder: (context, clientSnapshot) {
                if (clientSnapshot.connectionState == ConnectionState.waiting) {
                  return _buildMaterialApp(context, 'aura', const Scaffold(body: Center(child: CircularProgressIndicator())));
                }

                if (clientSnapshot.hasData && clientSnapshot.data!.exists) {
                  final clientData = clientSnapshot.data!.data() as Map<String, dynamic>;
                  return _buildMaterialApp(
                    context, 
                    'aura', 
                    ClientHomePage(atelierId: clientData['atelier_origem'] ?? '')
                  );
                }

                // Fallback: Se logou mas não tem registro em nenhuma coleção, desloga por segurança.
                return _buildMaterialApp(context, 'obsidian', const WelcomePage());
              },
            );
          },
        );
      },
    );
  }

  // --- O MAESTRO DAS ROTAS E TEMAS ---
  Widget _buildMaterialApp(BuildContext context, String themeName, Widget home) {
    return MaterialApp(
      title: 'EstiloExatoZap',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getTheme(themeName), 
      home: home,
      onGenerateRoute: (settings) {
        // ROTA DINÂMICA PWA: estilozap.com/#/fila/ID_DO_ATELIER
        if (settings.name != null && settings.name!.startsWith('/fila/')) {
          final id = settings.name!.replaceFirst('/fila/', '');
          return MaterialPageRoute(
            builder: (_) => ClientLoginPage(atelierId: id),
          );
        }
        return null;
      },
    );
  }

  // TELA DE ASSINATURA EXPIRADA (PARA O DONO)
  Widget _buildExpiredPage() {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_clock_outlined, color: Colors.redAccent, size: 64),
              const SizedBox(height: 24),
              Text("Acesso Suspenso", style: GoogleFonts.manrope(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              const Text(
                "Seu período de teste EstiloExatoZap terminou.\nRealize o pagamento para liberar seu painel e continuar atendendo.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white60, fontSize: 16),
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF2CA50), 
                  minimumSize: const Size(double.infinity, 60),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                ),
                onPressed: () {
                  // Aqui redirecionará para o link de checkout do Mercado Pago
                },
                child: const Text("PAGAR ASSINATURA (R\$ 89,90)", 
                  style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, letterSpacing: 1)),
              )
            ],
          ),
        ),
      ),
    );
  }
}