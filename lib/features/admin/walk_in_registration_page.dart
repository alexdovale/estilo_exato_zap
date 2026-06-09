import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class WalkInRegistrationPage extends StatefulWidget {
  const WalkInRegistrationPage({super.key});

  @override
  State<WalkInRegistrationPage> createState() => _WalkInRegistrationPageState();
}

class _WalkInRegistrationPageState extends State<WalkInRegistrationPage> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final String? uid = FirebaseAuth.instance.currentUser?.uid;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Color(0xFFF2CA50)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children:[
            Text("REGISTRO WALK-IN", 
              style: GoogleFonts.workSans(fontSize: 10, letterSpacing: 2, color: const Color(0xFFF2CA50), fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text("Adicionar à Fila", 
              style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 40),
            
            _buildInputField("NOME DO CLIENTE", "Ex: Arthur Shelby", _nameController, Icons.person_outline),
            const SizedBox(height: 20),
            _buildInputField("WHATSAPP / CELULAR", "(11) 99999-9999", _phoneController, Icons.phone_iphone, isPhone: true),
            
            const SizedBox(height: 40),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField(String label, String hint, TextEditingController controller, IconData icon, {bool isPhone = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children:[
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
          style: const TextStyle(color: Colors.white, fontSize: 16),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: const Color(0xFFF2CA50), size: 20),
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white10),
            filled: true,
            fillColor: const Color(0xFF1C1C1B),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
        onPressed: _isLoading ? null : () async {
          if (_nameController.text.isEmpty) return;
          setState(() => _isLoading = true);
          try {
            await FirebaseFirestore.instance.collection('fila_virtual').add({
              'atelierId': uid,
              'cliente_nome': _nameController.text,
              'cliente_zap': _phoneController.text,
              'servico': 'Presencial',
              'status': 'waiting',
              'ticket': 99, // Fictício
              'timestamp': FieldValue.serverTimestamp(),
            });
            if (mounted) Navigator.pop(context);
          } catch (e) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erro: $e")));
            setState(() => _isLoading = false);
          }
        },
        child: _isLoading 
          ? const CircularProgressIndicator(color: Colors.black)
          : const Text("CONFIRMAR NA FILA", style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, letterSpacing: 1)),
      ),
    );
  }
}