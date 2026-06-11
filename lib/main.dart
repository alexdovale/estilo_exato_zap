import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';

import 'firebase_options.dart';
import 'core/theme/app_theme.dart';

// Importações das telas
import 'features/auth/welcome_page.dart';
import 'features/auth/register_page.dart';
import 'features/auth/login_page.dart';
import 'features/admin/admin_dashboard_page.dart';
import 'features/admin/profile_page.dart';
import 'features/setup/setup_page.dart';
import 'features/queue/public_queue_page.dart';
import 'features/client/client_login_page.dart'; // <-- IMPORTADA

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const EstiloExatoZapApp());
}

class EstiloExatoZapApp extends StatelessWidget {
  const EstiloExatoZapApp({super.key});

  @override
  Widget build(BuildContext context) {
    // 1. OUVIR O ESTADO DE AUTENTICAÇÃO (DONO OU FUNCIONÁRIO)
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, authSnapshot) {
        final user = authSnapshot.data;

        // --- CASO: USUÁRIO NÃO LOGADO NO SISTEMA ---
        if (user == null) {
          return _buildMaterialApp(context, 'obsidian', const WelcomePage());
        }

        // 2. SE LOGADO: Ouve os dados do atelier no Firestore (Tema e Configuração)
        return StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance.collection('ateliers').doc(user.uid).snapshots(),
          builder: (context, dbSnapshot) {
            
            if (dbSnapshot.connectionState == ConnectionState.waiting) {
              return _buildMaterialApp(context, 'obsidian', const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)))));
            }

            // Se o usuário logado NÃO for um dono de atelier (pode ser um cliente logado ou erro)
            if (!dbSnapshot.hasData || !dbSnapshot.data!.exists) {
              // Aqui, se o documento não existe em 'ateliers', verificamos se é um cliente ou voltamos para Welcome
              return _buildMaterialApp(context, 'obsidian', const WelcomePage());
            }

            final data = dbSnapshot.data!.data() as Map<String, dynamic>;
            
            // --- EXTRAÇÃO DE VARIÁVEIS DO SAAS ---
            final String themeName = data['tema'] ?? 'obsidian';
            final bool isConfigured = data['configurado'] ?? false;
            final String status = data['status_assinatura'] ?? 'trial';
            final Timestamp? expiryTimestamp = data['data_expiracao'];
            
            DateTime dataExpiracao = expiryTimestamp != null 
                ? expiryTimestamp.toDate() 
                : DateTime.now().add(const Duration(days: 7)); 
            
            DateTime hoje = DateTime.now();
            bool temAcesso = status == 'ativo' || hoje.isBefore(dataExpiracao);

            // --- LÓGICA DE NAVEGAÇÃO INTERNA DO ADMIN ---
            Widget homeWidget;
            if (!isConfigured) {
              homeWidget = const SetupPage(); 
            } else if (!temAcesso) {
              homeWidget = _buildExpiredPage(); 
            } else {
              homeWidget = const AdminDashboardPage(); 
            }

            return _buildMaterialApp(context, themeName, homeWidget);
          },
        );
      },
    );
  }

  // --- FUNÇÃO QUE CONSTRÓI O APP E GERENCIA AS ROTAS PÚBLICAS ---
  Widget _buildMaterialApp(BuildContext context, String themeName, Widget home) {
    return MaterialApp(
      title: 'EstiloExatoZap',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getTheme(themeName), 
      home: home,
      onGenerateRoute: (settings) {
        // ROTA DO CLIENTE: Se o link for /fila/ID_DO_SALAO
        if (settings.name != null && settings.name!.startsWith('/fila/')) {
          final id = settings.name!.replaceFirst('/fila/', '');
          
          // O cliente cai na tela de LOGIN dele para esse salão específico
          return MaterialPageRoute(
            builder: (_) => ClientLoginPage(atelierId: id),
          );
        }
        return null;
      },
    );
  }

  // Tela de bloqueio quando os 14 dias de Trial acabam
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
              Text(
                "Teste Grátis Encerrado",
                style: GoogleFonts.manrope(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              const Text(
                "Sua assinatura EstiloExatoZap expirou.\nEntre em contato com o suporte ou realize o pagamento para continuar.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white60, fontSize: 16),
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
                onPressed: () {
                  // Aqui abriria o link do Mercado Pago
                },
                child: const Text("RENOVAR ASSINATURA", style: TextStyle(color: Colors.black)),
              )
            ],
          ),
        ),
      ),
    );
  }
}