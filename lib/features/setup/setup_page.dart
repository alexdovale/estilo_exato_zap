import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SetupPage extends StatefulWidget {
  const SetupPage({super.key});

  @override
  State<SetupPage> createState() => _SetupPageState();
}

class _SetupPageState extends State<SetupPage> {
  String? selectedBranch;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("CONFIGURAÇÃO DO ATELIER", 
                style: GoogleFonts.workSans(color: const Color(0xFFF2CA50), letterSpacing: 2, fontSize: 10, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text("Qual o seu ramo?", 
                style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(height: 32),
              
              _branchTile('Barbearia'),
              _branchTile('Manicure / Unhas'),
              _branchTile('Cílios / Estética'),

              const Spacer(),
              if (selectedBranch != null)
                SizedBox(
                  width: double.infinity, height: 60,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
                    onPressed: () {
                      // Lógica de salvar vem depois
                    },
                    child: const Text("AVANÇAR", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                  ),
                )
            ],
          ),
        ),
      ),
    );
  }

  Widget _branchTile(String title) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1B), 
        borderRadius: BorderRadius.circular(12), 
        border: Border.all(color: selectedBranch == title ? const Color(0xFFF2CA50) : Colors.transparent)
      ),
      child: ListTile(
        title: Text(title, style: const TextStyle(color: Colors.white)),
        trailing: const Icon(Icons.arrow_forward_ios, color: Color(0xFFF2CA50), size: 14),
        onTap: () => setState(() => selectedBranch = title),
      ),
    );
  }
}