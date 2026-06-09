import 'features/client/client_login_page.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';
import 'features/admin/profile_page.dart';
import 'firebase_options.dart';
import 'core/theme/app_theme.dart';

// Importações das telas
import 'features/auth/welcome_page.dart'; // <-- TELA INICIAL
import 'features/auth/register_page.dart';
import 'features/admin/admin_dashboard_page.dart';
import 'features/setup/setup_page.dart';
import 'features/queue/public_queue_page.dart';

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
    // 1. OUVIR O ESTADO DE AUTENTICAÇÃO
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, authSnapshot) {
        final user = authSnapshot.data;

        // --- CASO: USUÁRIO NÃO LOGADO ---
        if (user == null) {
          // Agora ele manda para a Tela de Boas-Vindas (Dono ou Funcionário)
          return _buildMaterialApp(context, 'obsidian', const WelcomePage());
        }

        // 2. SE LOGADO: Ouve os dados do atelier no Firestore (Tema e Configuração)
        return StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance.collection('ateliers').doc(user.uid).snapshots(),
          builder: (context, dbSnapshot) {
            // Enquanto carrega os dados do banco
            if (dbSnapshot.connectionState == ConnectionState.waiting) {
              return _buildMaterialApp(context, 'obsidian', const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)))));
            }

            // Se o documento não existir no banco (erro de fluxo ou conta incompleta)
            if (!dbSnapshot.hasData || !dbSnapshot.data!.exists) {
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

            // --- LÓGICA DE NAVEGAÇÃO INTERNA ---
            Widget homeWidget;
            if (!isConfigured) {
              homeWidget = const SetupPage(); // Mandar para configurar ramo e serviços
            } else if (!temAcesso) {
              homeWidget = _buildExpiredPage(); // Bloquear por falta de pagamento
            } else {
              homeWidget = const AdminDashboardPage(); // Painel principal liberado
            }

            // 3. RETORNA O APP COM O TEMA QUE VEM DO BANCO DE DADOS
            return _buildMaterialApp(context, themeName, homeWidget);
          },
        );
      },
    );
  }

  // Função auxiliar para construir o MaterialApp com o tema dinâmico e Rotas
  Widget _buildMaterialApp(BuildContext context, String themeName, Widget home) {
    return MaterialApp(
      title: 'EstiloExatoZap',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getTheme(themeName), // DINÂMICO: Obsidian ou Aura
      home: home,
      onGenerateRoute: (settings) {
        // ROTA DO CLIENTE: Manda para a TELA DE LOGIN DO CLIENTE em vez do formulário anônimo
        if (settings.name != null && settings.name!.startsWith('/fila/')) {
          final id = settings.name!.replaceFirst('/fila/', '');
          return MaterialPageRoute(builder: (_) => ClientLoginPage(atelierId: id));
        }
        return null;
      },
    );
  }

  // Tela de bloqueio quando os 14 dias de Trial acabam
  Widget _buildExpiredPage() {
    return const Scaffold(
      backgroundColor: Color(0xFF131313),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.lock_clock_outlined, color: Colors.redAccent, size: 64),
              SizedBox(height: 24),
              Text(
                "Teste Grátis Encerrado",
                style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              Text(
                "Sua assinatura EstiloExatoZap expirou.\nEntre em contato com o suporte para renovar seu acesso.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white60, fontSize: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}