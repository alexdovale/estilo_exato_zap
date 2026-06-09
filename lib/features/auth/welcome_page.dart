import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'register_page.dart';
import 'login_page.dart'; // Esta tela servirá tanto para o Dono quanto para o Funcionário

class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      body: Stack(
        children: [
          // Efeito de luz dourada no fundo (Premium Glow)
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
                  
                  // SUA LOGO OFICIAL VIA NETWORK (Para evitar erro de asset)
                  Image.network(
                    'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
                    height: 90,
                    // Se a imagem falhar, mostra o ícone reserva
                    errorBuilder: (context, error, stackTrace) => const Icon(Icons.cut, color: Color(0xFFF2CA50), size: 60),
                  ),
                  
                  const SizedBox(height: 16),
                  Text(
                    "O seu negócio no tempo exato.",
                    style: GoogleFonts.workSans(color: Colors.white54, fontSize: 14, fontStyle: FontStyle.italic),
                  ),
                  
                  const Spacer(),
                  
                  // OPÇÃO 1: DONO DO NEGÓCIO (NOVO CADASTRO)
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
                  
                  // OPÇÃO 2: EQUIPE / FUNCIONÁRIOS (LOGIN)
                  _buildOptionCard(
                    context,
                    title: "SOU DA EQUIPE / LOGIN",
                    subtitle: "Acesse o painel do atelier com sua conta.",
                    icon: Icons.badge_outlined, // Ícone de crachá para funcionários
                    isPrimary: false,
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginPage()));
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
    required String title, 
    required String subtitle, 
    required IconData icon, 
    required bool isPrimary, 
    required VoidCallback onTap
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isPrimary ? const Color(0xFFF2CA50) : const Color(0xFF1C1C1B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isPrimary ? Colors.transparent : const Color(0xFFF2CA50).withOpacity(0.3)),
          boxShadow: isPrimary ? [BoxShadow(color: const Color(0xFFF2CA50).withOpacity(0.2), blurRadius: 20)] : [],
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
            Icon(Icons.chevron_right, color: isPrimary ? Colors.black54 : Colors.white24),
          ],
        ),
      ),
    );
  }
}