import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ClientLoginPage extends StatefulWidget {
  final String atelierId; // Precisamos saber de qual salão é este cliente

  const ClientLoginPage({super.key, required this.atelierId});

  @override
  State<ClientLoginPage> createState() => _ClientLoginPageState();
}

class _ClientLoginPageState extends State<ClientLoginPage> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Logo do Sistema
              Image.network(
                'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
                height: 60,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.star, color: Color(0xFFF2CA50), size: 40),
              ),
              const SizedBox(height: 40),
              
              Text(
                "Área do Cliente",
                style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                "Acesse para entrar na fila e ver seus pontos de fidelidade.",
                textAlign: TextAlign.center,
                style: GoogleFonts.workSans(color: Colors.white54, fontSize: 14),
              ),
              const SizedBox(height: 48),

              // Formulário de Login do Cliente
              _buildInput("CELULAR (COM DDD)", "Ex: 11999999999", _phoneController, Icons.phone_iphone, isPhone: true),
              const SizedBox(height: 20),
              _buildInput("SENHA", "••••••••", _passwordController, Icons.lock_outline, isPassword: true),
              
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    // Lógica de esqueci a senha
                  },
                  child: const Text("Esqueceu a senha?", style: TextStyle(color: Color(0xFFF2CA50), fontSize: 12)),
                ),
              ),
              
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF2CA50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 8,
                    shadowColor: const Color(0xFFF2CA50).withOpacity(0.3),
                  ),
                  onPressed: _isLoading ? null : () {
                    // Aqui faremos a lógica de login do cliente depois
                  },
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.black)
                    : Text("ENTRAR NO MEU PERFIL", style: GoogleFonts.manrope(color: Colors.black, fontWeight: FontWeight.w900, letterSpacing: 1)),
                ),
              ),

              const SizedBox(height: 24),
              
              // Botão para criar conta de cliente
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Ainda não é cliente?", style: TextStyle(color: Colors.white54, fontSize: 12)),
                  TextButton(
                    onPressed: () {
                      // Ir para tela de cadastro de cliente
                    },
                    child: const Text("Criar conta grátis", style: TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold)),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInput(String label, String hint, TextEditingController controller, IconData icon, {bool isPassword = false, bool isPhone = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword,
          keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: const Color(0xFFF2CA50), size: 18),
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white10),
            filled: true,
            fillColor: const Color(0xFF1C1C1B),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }
}