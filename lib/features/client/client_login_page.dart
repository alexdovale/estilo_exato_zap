import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'client_register_page.dart'; // Certifique-se de que este arquivo existe

class ClientLoginPage extends StatefulWidget {
  final String atelierId; // ID da barbearia/estúdio vindo do link/URL

  const ClientLoginPage({super.key, required this.atelierId});

  @override
  State<ClientLoginPage> createState() => _ClientLoginPageState();
}

class _ClientLoginPageState extends State<ClientLoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  // --- LÓGICA DE LOGIN ---
  Future<void> _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showSnackBar("Preencha todos os campos para acessar.", Colors.orange);
      return;
    }

    setState(() => _isLoading = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
      // O AuthWrapper no main.dart detectará o login e levará para a ClientHomePage automaticamente
    } on FirebaseAuthException catch (e) {
      String message = "Erro ao entrar. Verifique seus dados.";
      if (e.code == 'user-not-found') message = "E-mail não cadastrado.";
      if (e.code == 'wrong-password') message = "Senha incorreta.";
      
      _showSnackBar(message, Colors.redAccent);
    } catch (e) {
      _showSnackBar("Erro técnico. Tente novamente.", Colors.redAccent);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // --- RECUPERAÇÃO DE SENHA ---
  Future<void> _recoverPassword() async {
    if (_emailController.text.isEmpty) {
      _showSnackBar("Digite seu e-mail para recuperar a senha.", Colors.blueAccent);
      return;
    }
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: _emailController.text.trim());
      _showSnackBar("Link de recuperação enviado para o e-mail!", Colors.green);
    } catch (e) {
      _showSnackBar("Erro ao enviar link. Verifique o e-mail.", Colors.redAccent);
    }
  }

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
              const SizedBox(height: 20),
              // LOGO DO SISTEMA
              Image.network(
                'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
                height: 80,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.star, color: Color(0xFFF2CA50), size: 40),
              ),
              const SizedBox(height: 40),
              
              Text(
                "Área do Cliente",
                style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                "Acesse para entrar na fila e acompanhar seus pontos de fidelidade.",
                textAlign: TextAlign.center,
                style: GoogleFonts.workSans(color: Colors.white54, fontSize: 14),
              ),
              const SizedBox(height: 48),

              // CAMPOS DE ENTRADA
              _buildInputField(
                label: "SEU E-MAIL", 
                hint: "voce@exemplo.com", 
                controller: _emailController, 
                icon: Icons.email_outlined
              ),
              const SizedBox(height: 20),
              _buildInputField(
                label: "SUA SENHA", 
                hint: "••••••••", 
                controller: _passwordController, 
                icon: Icons.lock_outline, 
                isPassword: true
              ),
              
              // ESQUECI A SENHA
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _recoverPassword,
                  child: const Text("Esqueceu a senha?", 
                    style: TextStyle(color: Color(0xFFF2CA50), fontSize: 12, decoration: TextDecoration.underline)),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // BOTÃO ENTRAR
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
                  onPressed: _isLoading ? null : _handleLogin,
                  child: _isLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : Text("ACESSAR PERFIL", 
                        style: GoogleFonts.manrope(color: Colors.black, fontWeight: FontWeight.w900, letterSpacing: 1)),
                ),
              ),

              const SizedBox(height: 32),
              
              // CRIAR CONTA
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Novo por aqui?", style: TextStyle(color: Colors.white54, fontSize: 13)),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context, 
                        MaterialPageRoute(builder: (_) => ClientRegisterPage(atelierId: widget.atelierId))
                      );
                    },
                    child: const Text("Criar conta grátis", 
                      style: TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 13)),
                  )
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required String label, 
    required String hint, 
    required TextEditingController controller, 
    required IconData icon, 
    bool isPassword = false
  }) {
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
            prefixIcon: Icon(icon, color: const Color(0xFFF2CA50), size: 18),
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white10),
            filled: true,
            fillColor: const Color(0xFF1C1C1B),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(vertical: 18),
          ),
        ),
      ],
    );
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: color, behavior: SnackBarBehavior.floating),
    );
  }
}