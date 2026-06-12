import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../data/repositories/team_repository.dart';

class TeamManagementPage extends StatefulWidget {
  const TeamManagementPage({super.key});

  @override
  State<TeamManagementPage> createState() => _TeamManagementPageState();
}

class _TeamManagementPageState extends State<TeamManagementPage> {
  final TeamRepository _repository = TeamRepository();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  String _selectedRole = 'Barbeiro';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        title: Text("MINHA EQUIPE", style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2, color: const Color(0xFFF2CA50))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(color: Color(0xFFF2CA50)),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _repository.getTeamStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)));
          }

          final docs = snapshot.data!.docs;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text("Colaboradores Ativos", 
                style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(height: 8),
              const Text("Gerencie quem tem acesso ao painel de atendimento.", style: TextStyle(color: Colors.white38)),
              const SizedBox(height: 32),
              
              if (docs.isEmpty) 
                _buildEmptyState()
              else
                ...docs.map((doc) => _buildStaffCard(doc)).toList(),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF2CA50),
        onPressed: () => _showAddStaffModal(),
        icon: const Icon(Icons.add, color: Colors.black),
        label: const Text("NOVO MEMBRO", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildStaffCard(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: const Color(0xFFF2CA50).withOpacity(0.1),
            child: Text(data['nome'][0].toUpperCase(), style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data['nome'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                Text(data['cargo'].toString().toUpperCase(), style: const TextStyle(color: Color(0xFFF2CA50), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
            onPressed: () => _repository.removeStaff(doc.id),
          )
        ],
      ),
    );
  }

  void _showAddStaffModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1C1C1B),
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("NOVO COLABORADOR", style: GoogleFonts.manrope(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18)),
            const SizedBox(height: 24),
            _buildModalInput("Nome Completo", _nameController),
            _buildModalInput("E-mail de Acesso", _emailController),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedRole,
              dropdownColor: const Color(0xFF1C1C1B),
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: "Cargo", labelStyle: TextStyle(color: Colors.white38)),
              items: ['Barbeiro', 'Manicure', 'Extensionista', 'Recepcionista'].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
              onChanged: (v) => setState(() => _selectedRole = v!),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity, height: 60,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
                onPressed: () async {
                  await _repository.addStaffMember(name: _nameController.text, email: _emailController.text, role: _selectedRole);
                  if(mounted) Navigator.pop(context);
                  _nameController.clear();
                  _emailController.clear();
                },
                child: const Text("CADASTRAR", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildModalInput(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.white38, fontSize: 12),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(child: Padding(
      padding: EdgeInsets.only(top: 100),
      child: Text("Nenhum colaborador cadastrado.", style: TextStyle(color: Colors.white24)),
    ));
  }
}