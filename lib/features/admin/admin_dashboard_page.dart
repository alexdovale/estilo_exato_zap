import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:share_plus/share_plus.dart';

import '../../data/repositories/queue_repository.dart';
import '../../data/models/queue_item.dart';

// Importações das telas que o Painel vai abrir
import 'walk_in_registration_page.dart';
import 'profile_page.dart';
import '../reports/finance_report_page.dart';

class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  final QueueRepository _repository = QueueRepository();
  String businessName = "Carregando...";
  String profession = "Profissional";
  bool isAdmin = false; // Controle de acesso (Dono vs Funcionário)
  final String uid = FirebaseAuth.instance.currentUser!.uid;

  @override
  void initState() {
    super.initState();
    _loadBusinessInfo();
  }

  // Verifica se o usuário logado é o DONO do atelier
  _loadBusinessInfo() async {
    var doc = await FirebaseFirestore.instance.collection('ateliers').doc(uid).get();
    
    if (doc.exists) {
      // Se o documento existe na coleção 'ateliers', ele é o PROPRIETÁRIO
      if (mounted) {
        setState(() {
          businessName = doc.data()?['nome_negocio'] ?? "Meu Negócio";
          profession = doc.data()?['tipo_servico'] ?? "Profissional";
          isAdmin = true; 
        });
      }
    } else {
      // Se não existe, ele é um FUNCIONÁRIO logado
      if (mounted) {
        setState(() {
          businessName = "Painel de Atendimento";
          profession = "Colaborador";
          isAdmin = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: _buildAppBar(),
      
      // BOTÃO FLUTUANTE: Disponível para Admin e Staff
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF2CA50),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const WalkInRegistrationPage()),
          );
        },
        icon: const Icon(Icons.person_add, color: Colors.black),
        label: const Text("NOVO CLIENTE", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),

      body: StreamBuilder<List<QueueItem>>(
        stream: _repository.getQueueStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)));
          }
          
          final queue = snapshot.data ?? [];
          final inService = queue.where((item) => item.status == 'in_service').toList();
          final waiting = queue.where((item) => item.status == 'waiting').toList();

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                _buildHeader(waiting.length),
                const SizedBox(height: 32),
                
                _buildSectionTitle("ATENDIMENTO ATUAL"),
                inService.isNotEmpty 
                  ? _buildCurrentClientCard(inService.first) 
                  : _buildEmptyChairCard(),

                const SizedBox(height: 32),
                
                _buildSectionTitle("FILA DE ESPERA"),
                Expanded(
                  child: waiting.isEmpty 
                    ? const Center(child: Text("Fila vazia", style: TextStyle(color: Colors.white10))) 
                    : ListView.builder(
                        itemCount: waiting.length,
                        itemBuilder: (context, index) => _buildWaitingItem(waiting[index], index + 1),
                      ),
                ),

                // BOTÃO DE CHAMADA: Só aparece se a cadeira estiver vazia
                if (waiting.isNotEmpty && inService.isEmpty)
                  _buildCallNextButton(waiting.first),
                
                const SizedBox(height: 12),
                
                _buildShareLinkButton(),
                
                const SizedBox(height: 80),
              ],
            ),
          );
        },
      ),
    );
  }

  // --- CABEÇALHO COM TRAVA DE SEGURANÇA ---
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      automaticallyImplyLeading: false, 
      
      title: Image.network(
        'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
        height: 45,
        errorBuilder: (context, error, stackTrace) => Text(businessName.toUpperCase(), 
          style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 12)),
      ),
      
      actions: [
        // 📊 BOTÃO DE ESTATÍSTICAS: Só aparece para o DONO (isAdmin)
        if (isAdmin)
          IconButton(
            icon: const Icon(Icons.bar_chart_rounded, color: Color(0xFFF2CA50)),
            tooltip: 'Faturamento',
            onPressed: () {
               Navigator.push(context, MaterialPageRoute(builder: (_) => FinanceReportPage()));
            },
          ),
        
        // ⚙️ BOTÃO DE CONFIGURAÇÕES: Só aparece para o DONO (isAdmin)
        if (isAdmin)
          IconButton(
            icon: const Icon(Icons.settings, color: Color(0xFFF2CA50)),
            tooltip: 'Gerenciar Atelier',
            onPressed: () {
               Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfilePage()));
            },
          ),

        // 🚪 SAIR DA CONTA: Para todos
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.redAccent, size: 22),
          onPressed: () async {
            await FirebaseAuth.instance.signOut();
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildHeader(int count) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(isAdmin ? "PAINEL ADMINISTRATIVO" : "PAINEL DE ATENDIMENTO", 
          style: GoogleFonts.workSans(color: const Color(0xFFF2CA50), fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)),
        Text("$count na espera", 
          style: GoogleFonts.manrope(fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white)),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: GoogleFonts.workSans(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
    );
  }

  Widget _buildCurrentClientCard(QueueItem item) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF2CA50).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item.clientName, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            Text(item.service.toUpperCase(), style: const TextStyle(color: Color(0xFFF2CA50), fontSize: 11, fontWeight: FontWeight.bold)),
          ]),
          ElevatedButton(
            onPressed: () => _showFinishDialog(item),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text("FINALIZAR", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          )
        ],
      ),
    );
  }

  Widget _buildEmptyChairCard() {
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(border: Border.all(color: Colors.white10), borderRadius: BorderRadius.circular(16)),
      child: const Center(child: Text("CADEIRA DISPONÍVEL", style: TextStyle(color: Colors.white10, fontWeight: FontWeight.bold, fontSize: 12))),
    );
  }

  Widget _buildWaitingItem(QueueItem item, int pos) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Text("#$pos", style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(width: 16),
          Expanded(child: Text(item.clientName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600))),
          const Icon(Icons.chat_bubble_outline, color: Color(0xFFF2CA50), size: 16),
        ],
      ),
    );
  }

  Widget _buildCallNextButton(QueueItem item) {
    return SizedBox(
      width: double.infinity, height: 60,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
        onPressed: () => _repository.callNext(item.id),
        child: Text("CHAMAR ${item.clientName.toUpperCase()}", style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildShareLinkButton() {
    return TextButton.icon(
      onPressed: () => Share.share("Olá! Entre na minha fila virtual do EstiloExatoZap aqui: https://estiloexatozap.web.app/#/fila/$uid"),
      icon: const Icon(Icons.share, color: Color(0xFFF2CA50), size: 18),
      label: const Text("COMPARTILHAR LINK DA FILA", style: TextStyle(color: Colors.white70, fontSize: 12)),
    );
  }

  void _showFinishDialog(QueueItem item) {
    double valorFinal = 50.0;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1C1C1B),
        title: Text("Finalizar Atendimento", style: GoogleFonts.manrope(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(prefixText: "R\$ "),
              onChanged: (v) => valorFinal = double.tryParse(v) ?? 0.0,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("CANCELAR", style: TextStyle(color: Colors.white24))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
            onPressed: () async {
              await _repository.finishAndRecordTransaction(ticketId: item.id, clientName: item.clientName, serviceName: item.service, value: valorFinal);
              if (mounted) Navigator.pop(context);
            },
            child: const Text("RECEBER", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}