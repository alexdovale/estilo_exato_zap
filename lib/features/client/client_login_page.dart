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
        elevation: 0,
        title: Image.network(
          'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
          height: 40,
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white24),
            onPressed: () => FirebaseAuth.instance.signOut(),
          )
        ],
      ),
      body: StreamBuilder<DocumentSnapshot>(
        // Ouve os pontos do cliente em tempo real
        stream: FirebaseFirestore.instance.collection('clientes').doc(user?.uid).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)));
          }

          if (!snapshot.hasData || !snapshot.data!.exists) {
            return const Center(child: Text("Erro ao carregar perfil", style: TextStyle(color: Colors.white)));
          }

          var clientData = snapshot.data!.data() as Map<String, dynamic>;
          int pontos = clientData['pontos'] ?? 0;
          String nome = clientData['nome'] ?? 'Cliente';

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("BEM-VINDO,", style: GoogleFonts.workSans(color: const Color(0xFFF2CA50), fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 10)),
                Text(nome.split(' ')[0].toUpperCase(), style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
                
                const SizedBox(height: 32),
                
                // --- CARD DE FIDELIDADE (Estilo Cartão Black) ---
                _buildFidelityCard(pontos),
                
                const SizedBox(height: 40),
                
                // --- BOTÃO PRINCIPAL: ENTRAR NA FILA ---
                Text("ATENDIMENTO", style: GoogleFonts.workSans(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                const SizedBox(height: 16),
                _buildJoinQueueButton(context, nome, user?.uid),
                
                const SizedBox(height: 40),
                const Center(
                  child: Text("Dúvidas? Chame no WhatsApp da unidade.", 
                    style: TextStyle(color: Colors.white10, fontSize: 11)),
                )
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildFidelityCard(int points) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF2CA50).withOpacity(0.1)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 20)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("MEUS PONTOS", style: GoogleFonts.workSans(color: const Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 10)),
              const Icon(Icons.qr_code, color: Colors.white10, size: 20),
            ],
          ),
          const SizedBox(height: 20),
          // LINHA DE SELOS (10 selos)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(10, (index) {
              bool isEarned = index < points;
              return Icon(
                isEarned ? Icons.check_circle : Icons.circle_outlined,
                color: isEarned ? const Color(0xFFF2CA50) : Colors.white10,
                size: 28,
              );
            }),
          ),
          const SizedBox(height: 24),
          Text(
            points >= 10 ? "VOCÊ GANHOU UM CORTE GRÁTIS!" : "Faltam ${10 - points} visitas para o prêmio.",
            style: TextStyle(color: points >= 10 ? const Color(0xFFF2CA50) : Colors.white60, fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinQueueButton(BuildContext context, String nome, String? uid) {
    return InkWell(
      onTap: () async {
        // Lógica para entrar na fila
        await FirebaseFirestore.instance.collection('fila_virtual').add({
          'atelierId': atelierId,
          'cliente_nome': nome,
          'cliente_uid': uid,
          'status': 'waiting',
          'timestamp': FieldValue.serverTimestamp(),
          'ticket': 0, // O sistema do barbeiro pode preencher o número real
          'servico': 'Agendado pelo App',
          'origem': 'app',
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Você entrou na fila com sucesso!"), backgroundColor: Colors.green),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFFF2CA50), Color(0xFFD4AF37)]),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            const Icon(Icons.bolt, color: Colors.black, size: 32),
            const SizedBox(height: 8),
            Text("ENTRAR NA FILA AGORA", 
              style: GoogleFonts.manrope(fontWeight: FontWeight.w900, color: Colors.black, fontSize: 16)),
            const Text("Clique para avisar que você chegou", 
              style: TextStyle(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}