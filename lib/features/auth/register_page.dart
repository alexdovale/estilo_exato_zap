import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/repositories/auth_repository.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _businessController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("ESTILO EXATO ZAP", style: GoogleFonts.manrope(color: const Color(0xFFF2CA50), fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 12)),
              const SizedBox(height: 8),
              Text("Crie sua conta\ne ganhe 14 dias", style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white, height: 1.1)),
              const SizedBox(height: 40),
              
              _buildInput("NOME DO NEGÓCIO", "Ex: Barbearia do João", _businessController),
              const SizedBox(height: 20),
              _buildInput("E-MAIL", "voce@email.com", _emailController),
              const SizedBox(height: 20),
              _buildInput("SENHA", "••••••••", _passwordController, isPassword: true),
              
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity, height: 60,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
                  onPressed: _isLoading ? null : _register,
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.black)
                    : const Text("COMEÇAR TESTE GRÁTIS", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInput(String label, String hint, TextEditingController controller, {bool isPassword = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextField(
          controller: controller, obscureText: isPassword, style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: Colors.white10), filled: true, fillColor: const Color(0xFF1C1C1B), border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)),
        ),
      ],
    );
  }

  Future<void> _register() async {
    setState(() => _isLoading = true);
    try {
      await AuthRepository().registerAtelier(
        email: _emailController.text, password: _passwordController.text, businessName: _businessController.text,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erro: $e")));
    } finally {
      if(mounted) setState(() => _isLoading = false);
    }
  }
}