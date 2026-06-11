import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ClientHomePage extends StatelessWidget {
  final String atelierId;
  const ClientHomePage({super.key, required this.atelierId});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Image.network('https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png', height: 40),
        centerTitle: true,
        actions: [IconButton(onPressed: () => FirebaseAuth.instance.signOut(), icon: const Icon(Icons.logout))],
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('clientes').doc(user?.uid).snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          var clientData = snapshot.data!.data() as Map<String, dynamic>;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("OLÁ, ${clientData['nome'].toString().toUpperCase()}", 
                  style: GoogleFonts.workSans(color: const Color(0xFFF2CA50), fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 10)),
                Text("Bem-vindo ao Atelier", style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white)),
                
                const SizedBox(height: 32),
                
                // --- CARTÃO FIDELIDADE ---
                _buildLoyaltyCard(clientData['pontos'] ?? 0),
                
                const SizedBox(height: 40),
                
                // --- BOTÃO DE ENTRAR NA FILA ---
                SizedBox(
                  width: double.infinity,
                  height: 80,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                    onPressed: () => _joinQueue(context, clientData['nome']),
                    child: const Text("ENTRAR NA FILA AGORA", style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 16)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildLoyaltyCard(int points) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF1C1C1B), Color(0xFF000000)]),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF2CA50).withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("CARTÃO FIDELIDADE", style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
              Icon(Icons.star, color: const Color(0xFFF2CA50), size: 16),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(10, (index) => Icon(
              index < points ? Icons.check_circle : Icons.circle_outlined,
              color: index < points ? const Color(0xFFF2CA50) : Colors.white10,
              size: 24,
            )),
          ),
          const SizedBox(height: 20),
          Text("${10 - points} visitas para o próximo corte grátis!", style: const TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      ),
    );
  }

  void _joinQueue(BuildContext context, String name) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    await FirebaseFirestore.instance.collection('fila_virtual').add({
      'atelierId': atelierId,
      'cliente_nome': name,
      'cliente_uid': uid,
      'status': 'waiting',
      'timestamp': FieldValue.serverTimestamp(),
      'ticket': 99,
    });
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Você entrou na fila!")));
  }
}