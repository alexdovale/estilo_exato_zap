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

  // --- FUNÇÃO PARA RECUPERAR SENHA (FIREBASE) ---
  Future<void> _recoverPassword() async {
    final email = _emailController.text.trim();

    if (email.isEmpty) {
      _showSnackBar("Por favor, digite seu e-mail acima para recuperar a senha.", Colors.orange);
      return;
    }

    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
      _showSuccessDialog(
        "Link Enviado!",
        "Um link de recuperação foi enviado para $email. Verifique sua caixa de entrada ou spam."
      );
    } catch (e) {
      _showSnackBar("Erro: Verifique se o e-mail está correto.", Colors.redAccent);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent, 
        elevation: 0, 
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFFF2CA50), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Image.network(
                'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png', 
                height: 80,
                errorBuilder: (context, error, stackTrace) => const SizedBox(),
              ),
            ),
            const SizedBox(height: 40),
            
            Text("Acesso à Equipe", 
              style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
            const Text("Gerencie seu atelier no tempo exato.", 
              style: TextStyle(color: Colors.white54)),
            const SizedBox(height: 40),
            
            _buildInput("E-MAIL PROFISSIONAL", "voce@email.com", _emailController, Icons.email_outlined),
            const SizedBox(height: 20),
            _buildInput("SUA SENHA", "••••••••", _passwordController, Icons.lock_outline, isPassword: true),
            
            // --- BOTÃO ESQUECI MINHA SENHA ---
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _recoverPassword,
                child: Text(
                  "Esqueci minha senha", 
                  style: GoogleFonts.workSans(color: const Color(0xFFF2CA50), fontSize: 12, decoration: TextDecoration.underline),
                ),
              ),
            ),
            
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity, height: 60,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF2CA50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isLoading ? null : _login,
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.black)
                  : const Text("ACESSAR PAINEL", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, letterSpacing: 1)),
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
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)
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
      if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
    } catch (e) {
      _showSnackBar("E-mail ou senha incorretos.", Colors.redAccent);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: color),
    );
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1C1C1B),
        title: Text(title, style: const TextStyle(color: Colors.white)),
        content: Text(message, style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), 
            child: const Text("ENTENDI", style: TextStyle(color: Color(0xFFF2CA50))))
        ],
      ),
    );
  }
}