import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';

class StaffLoginPage extends StatefulWidget {
  const StaffLoginPage({super.key});

  @override
  State<StaffLoginPage> createState() => _StaffLoginPageState();
}

class _StaffLoginPageState extends State<StaffLoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent, 
        elevation: 0, 
        leading: const BackButton(color: Color(0xFFF2CA50)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Image.network(
                'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png', 
                height: 60,
                errorBuilder: (context, error, stackTrace) => const SizedBox(),
              ),
            ),
            const SizedBox(height: 40),
            
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(color: const Color(0xFFF2CA50).withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
              child: const Text("ACESSO DA EQUIPE", style: TextStyle(color: Color(0xFFF2CA50), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2)),
            ),
            const SizedBox(height: 16),
            
            Text("Bem-vindo de volta", style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 8),
            Text("Acesse seu painel para gerenciar a fila e seus atendimentos de hoje.", style: GoogleFonts.workSans(color: Colors.white54)),
            const SizedBox(height: 40),
            
            _buildInput("E-MAIL PROFISSIONAL", "barbeiro@atelier.com", _emailController, Icons.email_outlined),
            const SizedBox(height: 20),
            _buildInput("SENHA", "••••••••", _passwordController, Icons.lock_outline, isPassword: true),
            
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity, height: 60,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF2CA50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: _isLoading ? null : _login,
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.black)
                  : const Text("ACESSAR SISTEMA", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, letterSpacing: 1)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInput(String label, String hint, TextEditingController controller, IconData icon, {bool isPassword = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 8),
        TextField(
          controller: controller, obscureText: isPassword, style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: const Color(0xFFF2CA50), size: 18),
            hintText: hint, hintStyle: const TextStyle(color: Colors.white10), 
            filled: true, fillColor: const Color(0xFF1C1C1B), 
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)
          ),
        ),
      ],
    );
  }

  Future<void> _login() async {
    setState(() => _isLoading = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
      if (mounted) {
        // Volta para o main.dart, onde o SubscriptionGuard enviará o funcionário pro Dashboard
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Erro: Email ou senha incorretos.", style: TextStyle(color: Colors.white)), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}