import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';

import 'firebase_options.dart';
import 'core/theme/app_theme.dart';
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
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, authSnapshot) {
        final user = authSnapshot.data;

        // 1. SE NÃO LOGADO: Vai para Registro com Tema Obsidian
        if (user == null) {
          return _buildMaterialApp(context, 'obsidian', const RegisterPage());
        }

        // 2. SE LOGADO: Ouve o banco de dados para saber o Tema e o Status da Assinatura
        return StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance.collection('ateliers').doc(user.uid).snapshots(),
          builder: (context, dbSnapshot) {
            if (dbSnapshot.connectionState == ConnectionState.waiting) {
              return _buildMaterialApp(context, 'obsidian', const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)))));
            }

            if (!dbSnapshot.hasData || !dbSnapshot.data!.exists) {
              return _buildMaterialApp(context, 'obsidian', const RegisterPage());
            }

            final data = dbSnapshot.data!.data() as Map<String, dynamic>;
            
            // Variáveis do SaaS
            final String themeName = data['tema'] ?? 'obsidian';
            final bool isConfigured = data['configurado'] ?? false;
            final String status = data['status_assinatura'] ?? 'trial';
            final Timestamp? expiryTimestamp = data['data_expiracao'];
            
            DateTime dataExpiracao = expiryTimestamp != null 
                ? expiryTimestamp.toDate() 
                : DateTime.now().add(const Duration(days: 7)); 
            
            DateTime hoje = DateTime.now();
            bool temAcesso = status == 'ativo' || hoje.isBefore(dataExpiracao);

            // Redirecionamento de Telas
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

  // Construtor do App com Rota Dinâmica para a Fila do Cliente
  Widget _buildMaterialApp(BuildContext context, String themeName, Widget home) {
    return MaterialApp(
      title: 'EstiloExatoZap',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getTheme(themeName), 
      home: home,
      onGenerateRoute: (settings) {
        if (settings.name!.startsWith('/fila/')) {
          final id = settings.name!.replaceFirst('/fila/', '');
          return MaterialPageRoute(builder: (_) => PublicQueuePage(atelierId: id));
        }
        return null;
      },
    );
  }

  Widget _buildExpiredPage() {
    return const Scaffold(
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.lock_clock_outlined, color: Colors.red, size: 64),
              SizedBox(height: 24),
              Text(
                "Teste Grátis Encerrado",
                style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              Text(
                "Sua assinatura EstiloExatoZap expirou.\nRealize o pagamento para continuar.",
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