import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:url_launcher/url_launcher.dart';

// Importações das telas de gestão
import 'team_management_page.dart';
import 'service_menu_page.dart'; // <-- AGORA IMPORTADO
import '../reports/finance_report_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final String uid = FirebaseAuth.instance.currentUser!.uid;

    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text("CONFIGURAÇÕES", 
          style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2, color: const Color(0xFFF2CA50))),
        leading: const BackButton(color: Color(0xFFF2CA50)),
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('ateliers').doc(uid).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)));
          }

          if (!snapshot.hasData || !snapshot.data!.exists) {
            return const Center(child: Text("Erro ao carregar perfil", style: TextStyle(color: Colors.white)));
          }

          var data = snapshot.data!.data() as Map<String, dynamic>;
          String name = data['nome_negocio'] ?? 'Meu Atelier';
          String email = data['email'] ?? '';
          String status = data['status_assinatura'] ?? 'trial';
          
          // Lógica de cálculo de dias restantes
          Timestamp expiryTimestamp = data['data_expiracao'];
          DateTime expiryDate = expiryTimestamp.toDate();
          int daysLeft = expiryDate.difference(DateTime.now()).inDays;
          if (daysLeft < 0) daysLeft = 0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildUserHeader(name, email),
                const SizedBox(height: 32),
                
                // CARD DE ASSINATURA (Black Card Style)
                _buildSubscriptionCard(status, daysLeft),
                
                const SizedBox(height: 40),
                _buildSectionTitle("GESTÃO DO ATELIER"),
                
                // 1. GERENCIAR EQUIPE
                _buildMenuOption(Icons.people_outline, "Gerenciar Equipe", () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const TeamManagementPage()));
                }),
                
                // 2. RELATÓRIOS FINANCEIROS
                _buildMenuOption(Icons.bar_chart_outlined, "Relatórios Financeiros", () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => FinanceReportPage()));
                }),

                // 3. EDITAR MENU DE SERVIÇOS
                _buildMenuOption(Icons.restaurant_menu_outlined, "Editar Menu de Serviços", () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const ServiceMenuPage()));
                }),

                const SizedBox(height: 40),
                _buildSectionTitle("SUPORTE E AJUDA"),
                _buildMenuOption(Icons.help_outline, "Falar com suporte no Zap", () => _contactSupport()),
                
                const SizedBox(height: 60),
                _buildLogoutButton(context),
                const SizedBox(height: 20),
                Center(
                  child: Text("Versão 1.0.0 • EstiloExatoZap", 
                    style: TextStyle(color: Colors.white.withOpacity(0.1), fontSize: 10)),
                )
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildUserHeader(String name, String email) {
    return Row(
      children: [
        CircleAvatar(
          radius: 30,
          backgroundColor: const Color(0xFFF2CA50).withOpacity(0.1),
          child: Text(name.isNotEmpty ? name[0].toUpperCase() : "A", 
            style: const TextStyle(color: Color(0xFFF2CA50), fontSize: 24, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            Text(email, style: const TextStyle(color: Colors.white38, fontSize: 13)),
          ],
        )
      ],
    );
  }

  Widget _buildSubscriptionCard(String status, int daysLeft) {
    bool isTrial = status == 'trial';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isTrial ? [Colors.blueGrey.shade900, Colors.black] : [const Color(0xFFF2CA50), const Color(0xFFD4AF37)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(isTrial ? "PLANO TESTE" : "ASSINATURA ATIVA", 
                style: TextStyle(color: isTrial ? Colors.white54 : Colors.black54, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1)),
              Icon(Icons.verified, color: isTrial ? Colors.white24 : Colors.black54, size: 20),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            isTrial ? "$daysLeft Dias Restantes" : "Plano Pro",
            style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w900, color: isTrial ? Colors.white : Colors.black),
          ),
          const SizedBox(height: 8),
          Text(
            isTrial ? "Seu acesso gratuito expira em breve." : "Sua renovação automática está ligada.",
            style: TextStyle(color: isTrial ? Colors.white38 : Colors.black38, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuOption(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: const Color(0xFFF2CA50), size: 20),
      ),
      title: Text(title, style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right, color: Colors.white10, size: 18),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(title, style: const TextStyle(color: Color(0xFFF2CA50), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2)),
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return Center(
      child: TextButton.icon(
        onPressed: () async {
          await FirebaseAuth.instance.signOut();
          if (context.mounted) {
            Navigator.of(context).popUntil((route) => route.isFirst);
          }
        },
        icon: const Icon(Icons.logout, color: Colors.redAccent, size: 18),
        label: const Text("SAIR DA CONTA", style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12)),
      ),
    );
  }

  void _contactSupport() async {
    const phone = "5511999999999"; // Coloque seu número oficial aqui
    final url = Uri.parse("https://wa.me/$phone?text=Olá, preciso de ajuda com o sistema EstiloExatoZap.");
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }
}