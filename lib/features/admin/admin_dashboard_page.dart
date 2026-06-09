import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:share_plus/share_plus.dart';
import '../../data/repositories/queue_repository.dart';

class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  final QueueRepository _repository = QueueRepository();
  String businessName = "Carregando...";
  String profession = "Profissional";
  final String uid = FirebaseAuth.instance.currentUser!.uid;

  @override
  void initState() {
    super.initState();
    _loadBusinessInfo();
  }

  _loadBusinessInfo() async {
    var doc = await FirebaseFirestore.instance.collection('ateliers').doc(uid).get();
    if (doc.exists && mounted) {
      setState(() {
        businessName = doc.data()?['nome_negocio'] ?? "Meu Negócio";
        profession = doc.data()?['tipo_servico'] ?? "Profissional";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(businessName.toUpperCase(), style: GoogleFonts.manrope(color: const Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 2)),
        actions: [
          IconButton(icon: const Icon(Icons.logout, color: Colors.white24, size: 20), onPressed: () => FirebaseAuth.instance.signOut()),
        ],
      ),
      body: StreamBuilder<List<QueueItem>>(
        stream: _repository.getQueueStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)));
          
          final queue = snapshot.data ?? [];
          final inService = queue.where((item) => item.status == 'in_service').toList();
          final waiting = queue.where((item) => item.status == 'waiting').toList();

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Text("PAINEL DA ${profession.toUpperCase()}", style: GoogleFonts.workSans(color: const Color(0xFFF2CA50), fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)),
                Text("${waiting.length} clientes na fila", style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white, height: 1.1)),
                const SizedBox(height: 32),
                
                const Text("ATENDIMENTO ATUAL", style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                const SizedBox(height: 12),
                inService.isNotEmpty ? _buildCurrentClientCard(inService.first) : _buildEmptyChairCard(),
                const SizedBox(height: 32),
                
                const Text("FILA DE ESPERA", style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                const SizedBox(height: 12),
                Expanded(
                  child: waiting.isEmpty ? const Center(child: Text("Fila vazia", style: TextStyle(color: Colors.white10))) : ListView.builder(
                    itemCount: waiting.length,
                    itemBuilder: (context, index) => _buildWaitingItem(waiting[index], index + 1),
                  ),
                ),

                if (waiting.isNotEmpty && inService.isEmpty)
                  SizedBox(
                    width: double.infinity, height: 60,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
                      onPressed: () => _repository.callNext(waiting.first.id),
                      child: Text("CHAMAR ${waiting.first.clientName.toUpperCase()}", style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900)),
                    ),
                  ),
                const SizedBox(height: 12),
                TextButton.icon(
                  onPressed: () => Share.share("Olá! Entre na minha fila virtual do EstiloExatoZap aqui: https://estiloexatozap.web.app/#/fila/$uid"),
                  icon: const Icon(Icons.share, color: Color(0xFFF2CA50)),
                  label: const Text("COMPARTILHAR LINK DA FILA", style: TextStyle(color: Colors.white70)),
                ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCurrentClientCard(QueueItem item) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFF2CA50).withOpacity(0.3))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item.clientName, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            Text(item.service, style: const TextStyle(color: Color(0xFFF2CA50), fontSize: 11, fontWeight: FontWeight.bold)),
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
      decoration: BoxDecoration(border: Border.all(color: Colors.white10), borderRadius: BorderRadius.circular(12)),
      child: const Center(child: Text("CADEIRA DISPONÍVEL", style: TextStyle(color: Colors.white10, fontWeight: FontWeight.bold, fontSize: 12))),
    );
  }

  Widget _buildWaitingItem(QueueItem item, int pos) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Text("#$pos", style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(width: 16),
          Expanded(child: Text(item.clientName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600))),
        ],
      ),
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