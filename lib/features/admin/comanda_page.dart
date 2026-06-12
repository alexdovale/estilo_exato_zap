import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/repositories/queue_repository.dart';

class ComandaPage extends StatefulWidget {
  final String clienteNome;
  final String ticketId;
  final String service;

  const ComandaPage({super.key, required this.clienteNome, required this.ticketId, required this.service});

  @override
  State<ComandaPage> createState() => _ComandaPageState();
}

class _ComandaPageState extends State<ComandaPage> {
  final QueueRepository _repository = QueueRepository();
  List<Map<String, dynamic>> itens = [];

  @override
  void initState() {
    super.initState();
    // Inicia com o serviço principal que o cliente escolheu
    itens.add({'nome': widget.service, 'preco': 50.0}); 
  }

  double get total => itens.fold(0, (sum, item) => sum + item['preco']);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        title: Text(widget.clienteNome.toUpperCase(), style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(24),
              itemCount: itens.length,
              itemBuilder: (context, i) => ListTile(
                title: Text(itens[i]['nome'], style: const TextStyle(color: Colors.white)),
                trailing: Text("R\$ ${itens[i]['preco'].toStringAsFixed(2)}", style: const TextStyle(color: Color(0xFFF2CA50))),
              ),
            ),
          ),
          _buildBottomAction(),
        ],
      ),
    );
  }

  Widget _buildBottomAction() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(color: Color(0xFF1C1C1B)),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("TOTAL", style: GoogleFonts.manrope(color: Colors.white38)),
              Text("R\$ ${total.toStringAsFixed(2)}", style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
            ],
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50), minimumSize: const Size(double.infinity, 60)),
            onPressed: () async {
              await _repository.finishAndRecordTransaction(
                ticketId: widget.ticketId,
                clientName: widget.clienteNome,
                serviceName: "Atendimento Geral",
                value: total,
              );
              if (mounted) Navigator.pop(context);
            },
            child: const Text("RECEBER PAGAMENTO", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }
}