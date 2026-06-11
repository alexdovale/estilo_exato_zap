import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ClientRegisterPage extends StatefulWidget {
  final String atelierId;
  const ClientRegisterPage({super.key, required this.atelierId});

  @override
  State<ClientRegisterPage> createState() => _ClientRegisterPageState();
}

class _ClientRegisterPageState extends State<ClientRegisterPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(backgroundColor: Colors.transparent, leading: const BackButton(color: Color(0xFFF2CA50))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("NOVO POR AQUI?", style: GoogleFonts.manrope(color: const Color(0xFFF2CA50), fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 12)),
            const SizedBox(height: 8),
            Text("Crie sua conta\nde cliente", style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white, height: 1.1)),
            const SizedBox(height: 40),
            
            _buildInput("SEU NOME COMPLETO", "Ex: Arthur Shelby", _nameController),
            const SizedBox(height: 20),
            _buildInput("E-MAIL", "voce@email.com", _emailController),
            const SizedBox(height: 20),
            _buildInput("CRIE UMA SENHA", "••••••••", _passwordController, isPassword: true),
            
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity, height: 60,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
                onPressed: _isLoading ? null : _registerClient,
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.black)
                  : const Text("CRIAR MINHA CONTA", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
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
          decoration: InputDecoration(hintText: hint, hintStyle: const TextStyle(color: Colors.white10), filled: true, fillColor: const Color(0xFF1C1C1B), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
        ),
      ],
    );
  }

  Future<void> _registerClient() async {
    setState(() => _isLoading = true);
    try {
      UserCredential user = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      // Salva o perfil do cliente no banco
      await FirebaseFirestore.instance.collection('clientes').doc(user.user!.uid).set({
        'nome': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'pontos_fidelidade': 0,
        'ultimo_atelier_visitado': widget.atelierId,
        'tipo': 'cliente',
      });

      Navigator.pop(context); // Volta para o login
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erro ao cadastrar: $e")));
    } finally {
      setState(() => _isLoading = false);
    }
  }
}