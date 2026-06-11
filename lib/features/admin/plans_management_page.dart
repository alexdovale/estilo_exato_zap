import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../data/repositories/plan_repository.dart';

class PlansManagementPage extends StatefulWidget {
  const PlansManagementPage({super.key});

  @override
  State<PlansManagementPage> createState() => _PlansManagementPageState();
}

class _PlansManagementPageState extends State<PlansManagementPage> {
  final PlanRepository _repository = PlanRepository();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        title: Text("CLUBES DE ASSINATURA", style: GoogleFonts.manrope(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFF2CA50), letterSpacing: 2)),
        backgroundColor: Colors.transparent,
        leading: const BackButton(color: Color(0xFFF2CA50)),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _repository.getPlansStream(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final docs = snapshot.data!.docs;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text("Planos Ativos", style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
              const SizedBox(height: 32),
              ...docs.map((doc) => _buildPlanCard(doc)).toList(),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF2CA50),
        onPressed: () => _showAddPlanModal(),
        icon: const Icon(Icons.add, color: Colors.black),
        label: const Text("CRIAR NOVO PLANO", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildPlanCard(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blueAccent.withOpacity(0.4), width: 1),
        boxShadow: [BoxShadow(color: Colors.blueAccent.withOpacity(0.1), blurRadius: 15)],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data['nome'].toUpperCase(), style: GoogleFonts.manrope(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 18, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(data['descricao'], style: const TextStyle(color: Colors.blueAccent, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text("R\$ ${data['preco']}", style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
              const Text("/MÊS", style: TextStyle(color: Colors.white38, fontSize: 10)),
            ],
          ),
          const SizedBox(width: 10),
          IconButton(icon: const Icon(Icons.delete_outline, color: Colors.white24), onPressed: () => _repository.deletePlan(doc.id)),
        ],
      ),
    );
  }

  void _showAddPlanModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1C1C1B),
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("NOVO PLANO DE ASSINATURA", style: GoogleFonts.manrope(fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: "Nome (Ex: VIP GOLD)")),
            TextField(controller: _descController, decoration: const InputDecoration(labelText: "Regras (Ex: Corte ilimitado)")),
            TextField(controller: _priceController, decoration: const InputDecoration(labelText: "Preço Mensal"), keyboardType: TextInputType.number),
            const SizedBox(height: 32),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50), minimumSize: const Size(double.infinity, 55)),
              onPressed: () async {
                await _repository.addPlan(_nameController.text, _descController.text, double.parse(_priceController.text));
                Navigator.pop(context);
                _nameController.clear(); _descController.clear(); _priceController.clear();
              },
              child: const Text("ATIVAR PLANO NO ATELIER", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}