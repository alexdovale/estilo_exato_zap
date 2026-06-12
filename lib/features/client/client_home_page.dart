import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ClientHomePage extends StatelessWidget {
  final String atelierId;
  const ClientHomePage({super.key, required this.atelierId});

  @override
  Widget build(BuildContext context) {
    // Pega o usuário logado para buscar os pontos e o nome
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        // Logo oficial carregada da rede
        title: Image.network(
          'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
          height: 40,
          errorBuilder: (context, error, stackTrace) => const Text("ESTILO EXATO"),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white24, size: 20),
            onPressed: () => FirebaseAuth.instance.signOut(),
          )
        ],
      ),
      body: StreamBuilder<DocumentSnapshot>(
        // Ouve em tempo real os dados do cliente (pontos, nome, etc)
        stream: FirebaseFirestore.instance.collection('clientes').doc(user?.uid).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)));
          }

          if (!snapshot.hasData || !snapshot.data!.exists) {
            return const Center(
              child: Text("Erro ao carregar seu perfil. Tente logar novamente.", 
                style: TextStyle(color: Colors.white54))
            );
          }

          var clientData = snapshot.data!.data() as Map<String, dynamic>;
          String nome = clientData['nome'] ?? 'Cliente';
          int pontos = clientData['pontos'] ?? 0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // SAUDAÇÃO
                Text("BEM-VINDO,", 
                  style: GoogleFonts.workSans(
                    color: const Color(0xFFF2CA50), 
                    fontWeight: FontWeight.bold, 
                    letterSpacing: 2, 
                    fontSize: 10
                  ),
                ),
                Text(nome.split(' ')[0].toUpperCase(), 
                  style: GoogleFonts.manrope(
                    fontSize: 32, 
                    fontWeight: FontWeight.w900, 
                    color: Colors.white,
                    height: 1.1
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // --- SEÇÃO: CARTÃO FIDELIDADE ---
                _buildLoyaltyCard(pontos),
                
                const SizedBox(height: 48),
                
                // --- SEÇÃO: AÇÃO DE ATENDIMENTO ---
                Text("ATENDIMENTO DISPONÍVEL", 
                  style: GoogleFonts.workSans(
                    color: Colors.white38, 
                    fontSize: 10, 
                    fontWeight: FontWeight.bold, 
                    letterSpacing: 1.5
                  ),
                ),
                const SizedBox(height: 16),
                _buildJoinQueueButton(context, nome, user?.uid),
                
                const SizedBox(height: 60),
                const Center(
                  child: Opacity(
                    opacity: 0.2,
                    child: Text("EstiloExatoZap v1.0", style: TextStyle(color: Colors.white, fontSize: 10)),
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }

  // Widget do Cartão de Selos (Loyalty)
  Widget _buildLoyaltyCard(int points) {
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
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("MEUS PONTOS ACUMULADOS", 
                style: TextStyle(color: Color(0xFFF2CA50), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const Icon(Icons.stars_rounded, color: Color(0xFFF2CA50), size: 18),
            ],
          ),
          const SizedBox(height: 24),
          // GRID DE 10 ÍCONES (2 linhas de 5)
          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: List.generate(10, (index) {
              bool isEarned = index < points;
              return Container(
                width: 45,
                height: 45,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isEarned ? const Color(0xFFF2CA50) : Colors.white.withOpacity(0.03),
                ),
                child: Icon(
                  isEarned ? Icons.check_rounded : Icons.circle_outlined,
                  color: isEarned ? Colors.black : Colors.white10,
                  size: 20,
                ),
              );
            }),
          ),
          const SizedBox(height: 24),
          Text(
            points >= 10 
              ? "PARABÉNS! VOCÊ GANHOU UM CORTE GRÁTIS!" 
              : "Faltam ${10 - points} visitas para sua recompensa.",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: points >= 10 ? const Color(0xFFF2CA50) : Colors.white60, 
              fontSize: 13, 
              fontWeight: FontWeight.bold
            ),
          ),
        ],
      ),
    );
  }

  // Botão Estilizado para entrar na fila
  Widget _buildJoinQueueButton(BuildContext context, String nome, String? uid) {
    return GestureDetector(
      onTap: () async {
        // Lógica para registrar o cliente na fila virtual do Atelier
        await FirebaseFirestore.instance.collection('fila_virtual').add({
          'atelierId': atelierId,
          'cliente_nome': nome,
          'cliente_uid': uid,
          'status': 'waiting',
          'timestamp': FieldValue.serverTimestamp(),
          'ticket': 0, // O Admin atribui o número na chamada
          'servico': 'Agendado pelo App',
          'origem': 'app',
        });
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Você entrou na fila! Fique de olho no WhatsApp."),
              backgroundColor: Colors.green,
            ),
          );
        }
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFF2CA50), Color(0xFFD4AF37)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFF2CA50).withOpacity(0.2),
              blurRadius: 15,
              offset: const Offset(0, 8)
            )
          ],
        ),
        child: Column(
          children: [
            const Icon(Icons.bolt_rounded, color: Colors.black, size: 32),
            const SizedBox(height: 8),
            Text("ENTRAR NA FILA AGORA", 
              style: GoogleFonts.manrope(
                fontWeight: FontWeight.w900, 
                color: Colors.black, 
                fontSize: 18,
                letterSpacing: 1
              ),
            ),
            const Text("Toque para confirmar sua presença no local", 
              style: TextStyle(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}