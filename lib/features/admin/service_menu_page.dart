import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../data/repositories/service_repository.dart';

class ServiceMenuPage extends StatefulWidget {
  const ServiceMenuPage({super.key});

  @override
  State<ServiceMenuPage> createState() => _ServiceMenuPageState();
}

class _ServiceMenuPageState extends State<ServiceMenuPage> {
  final ServiceRepository _repository = ServiceRepository();
  final _nameController = TextEditingController();
  final _priceController = TextEditingController();
  final _timeController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        title: Text("MENU DE SERVIÇOS", style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2)),
        backgroundColor: Colors.transparent,
        leading: const BackButton(color: Color(0xFFF2CA50)),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _repository.getServicesStream(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

          final docs = snapshot.data!.docs;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text("Seu Catálogo", style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(height: 32),
              ...docs.map((doc) => _buildServiceTile(doc)).toList(),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF2CA50),
        onPressed: () => _showAddServiceModal(),
        icon: const Icon(Icons.add, color: Colors.black),
        label: const Text("NOVO SERVIÇO", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildServiceTile(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(data['nome'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              Text("${data['duracao']} min", style: const TextStyle(color: Colors.white38, fontSize: 12)),
            ],
          ),
          Row(
            children: [
              Text("R\$ ${data['preco'].toStringAsFixed(2)}", style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                onPressed: () => _repository.deleteService(doc.id),
              )
            ],
          )
        ],
      ),
    );
  }

  void _showAddServiceModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1C1C1B),
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("ADICIONAR SERVIÇO", style: GoogleFonts.manrope(fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: "Nome do Serviço")),
            TextField(controller: _priceController, decoration: const InputDecoration(labelText: "Preço (R\$)"), keyboardType: TextInputType.number),
            TextField(controller: _timeController, decoration: const InputDecoration(labelText: "Duração (min)"), keyboardType: TextInputType.number),
            const SizedBox(height: 32),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50), minimumSize: const Size(double.infinity, 55)),
              onPressed: () async {
                await _repository.addService(_nameController.text, double.parse(_priceController.text), int.parse(_timeController.text));
                Navigator.pop(context);
                _nameController.clear(); _priceController.clear(); _timeController.clear();
              },
              child: const Text("SALVAR", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}