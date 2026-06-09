import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../data/repositories/finance_repository.dart';

class FinanceReportPage extends StatelessWidget {
  final FinanceRepository _repository = FinanceRepository();

  FinanceReportPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: Text("ESTATÍSTICAS DO ATELIER", 
          style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFFF2CA50), letterSpacing: 2)),
        centerTitle: true,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _repository.getTransactionsStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)));
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) return const Center(child: Text("Nenhuma transação encontrada.", style: TextStyle(color: Colors.white24)));

          final docs = snapshot.data!.docs;
          final stats = _repository.calculateStats(docs);

          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Visão Geral do Lucro", style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white)),
                const SizedBox(height: 32),
                _buildRevenueCard("FATURAMENTO HOJE", stats['today']!, Icons.bolt, true),
                const SizedBox(height: 16),
                _buildRevenueCard("TOTAL DO MÊS", stats['month']!, Icons.account_balance_wallet, false),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildRevenueCard(String title, double value, IconData icon, bool isHighlight) {
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: isHighlight ? const Color(0xFFF2CA50) : const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(color: isHighlight ? Colors.black54 : Colors.white38, fontSize: 9, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text("R\$ ${value.toStringAsFixed(2)}", style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w900, color: isHighlight ? Colors.black : Colors.white)),
            ],
          ),
          Icon(icon, color: isHighlight ? Colors.black26 : const Color(0xFFF2CA50), size: 32),
        ],
      ),
    );
  }
}