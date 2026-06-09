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
        title: Text("MINHA EQUIPE", style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2)),
        backgroundColor: Colors.transparent,
        leading: const BackButton(color: Color(0xFFF2CA50)),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _repository.getTeamStream(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

          final docs = snapshot.data!.docs;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text("Colaboradores Ativos", 
                style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
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
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFF2CA50),
        child: const Icon(Icons.add, color: Colors.black),
        onPressed: () => _showAddStaffModal(),
      ),
    );
  }

  Widget _buildStaffCard(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: const Color(0xFFF2CA50).withOpacity(0.1),
            child: Text(data['nome'][0], style: const TextStyle(color: Color(0xFFF2CA50))),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data['nome'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                Text(data['cargo'], style: const TextStyle(color: Color(0xFFF2CA50), fontSize: 10, fontWeight: FontWeight.bold)),
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
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("NOVO COLABORADOR", style: GoogleFonts.manrope(fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 24),
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: "Nome Completo")),
            TextField(controller: _emailController, decoration: const InputDecoration(labelText: "E-mail de Acesso")),
            const SizedBox(height: 16),
            DropdownButton<String>(
              value: _selectedRole,
              isExpanded: true,
              dropdownColor: const Color(0xFF1C1C1B),
              style: const TextStyle(color: Colors.white),
              items: ['Barbeiro', 'Manicure', 'Extensionista', 'Recepcionista'].map((role) => DropdownMenuItem(value: role, child: Text(role))).toList(),
              onChanged: (v) => setState(() => _selectedRole = v!),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50), minimumSize: const Size(double.infinity, 50)),
              onPressed: () async {
                await _repository.addStaffMember(name: _nameController.text, email: _emailController.text, role: _selectedRole);
                Navigator.pop(context);
                _nameController.clear();
                _emailController.clear();
              },
              child: const Text("CADASTRAR", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(child: Text("Nenhum colaborador cadastrado.", style: TextStyle(color: Colors.white24)));
  }
}