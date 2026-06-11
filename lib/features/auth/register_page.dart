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
      // --- ADICIONADO: BOTÃO DE VOLTAR NO TOPO ---
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFFF2CA50), size: 20),
          onPressed: () => Navigator.pop(context), // Volta para a tela de Boas-vindas
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // SUA LOGO
              Center(
                child: Image.network(
                  'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
                  height: 80,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.cut, color: Color(0xFFF2CA50), size: 50),
                ),
              ),
              const SizedBox(height: 32),
              
              Text("Crie sua conta\ne ganhe 14 dias", 
                style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white, height: 1.1)),
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
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF2CA50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: _isLoading ? null : _register,
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.black)
                    : const Text("COMEÇAR TESTE GRÁTIS", 
                        style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, letterSpacing: 1)),
                ),
              ),
              const SizedBox(height: 20),
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
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 8),
        TextField(
          controller: controller, 
          obscureText: isPassword, 
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint, 
            hintStyle: const TextStyle(color: Colors.white10), 
            filled: true, 
            fillColor: const Color(0xFF1C1C1B), 
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)
          ),
        ),
      ],
    );
  }

  Future<void> _register() async {
    if(_businessController.text.isEmpty || _emailController.text.isEmpty || _passwordController.text.isEmpty) {
       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Preencha todos os campos")));
       return;
    }

    setState(() => _isLoading = true);
    try {
      await AuthRepository().registerAtelier(
        email: _emailController.text.trim(), 
        password: _passwordController.text.trim(), 
        businessName: _businessController.text.trim(),
      );
      // O AuthWrapper no main.dart detectará o login e mudará a tela sozinho
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erro: $e"), backgroundColor: Colors.redAccent));
    } finally {
      if(mounted) setState(() => _isLoading = false);
    }
  }
}