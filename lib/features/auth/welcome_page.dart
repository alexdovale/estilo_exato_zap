import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'register_page.dart';
import 'staff_login_page.dart'; // Importação corrigida aqui

class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      body: Stack(
        children: [
          Positioned(
            top: -150, right: -100,
            child: Container(
              width: 400, height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFF2CA50).withOpacity(0.05),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 60),
                  Image.network(
                    'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
                    height: 90,
                    errorBuilder: (context, error, stackTrace) => const Icon(Icons.cut, color: Color(0xFFF2CA50), size: 60),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    "O seu negócio no tempo exato.",
                    style: GoogleFonts.workSans(color: Colors.white54, fontSize: 14, fontStyle: FontStyle.italic),
                  ),
                  const Spacer(),
                  _buildOptionCard(
                    context,
                    title: "SOU PROPRIETÁRIO",
                    subtitle: "Quero cadastrar meu negócio e testar 14 dias grátis.",
                    icon: Icons.storefront,
                    isPrimary: true,
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterPage()));
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildOptionCard(
                    context,
                    title: "JÁ TENHO CONTA",
                    subtitle: "Sou funcionário ou já cadastrei meu atelier.",
                    icon: Icons.badge_outlined,
                    isPrimary: false,
                    onTap: () {
                      // MUDANÇA AQUI: Agora abre a StaffLoginPage
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const StaffLoginPage()));
                    },
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionCard(BuildContext context, {
    required String title, required String subtitle, required IconData icon, required bool isPrimary, required VoidCallback onTap
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isPrimary ? const Color(0xFFF2CA50) : const Color(0xFF1C1C1B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFF2CA50).withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: isPrimary ? Colors.black : const Color(0xFFF2CA50), size: 32),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.manrope(
                    fontWeight: FontWeight.w900, fontSize: 16, color: isPrimary ? Colors.black : Colors.white)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: GoogleFonts.workSans(
                    fontSize: 12, color: isPrimary ? Colors.black87 : Colors.white54)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}