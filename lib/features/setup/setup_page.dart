import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/repositories/setup_repository.dart';

class SetupPage extends StatefulWidget {
  const SetupPage({super.key});

  @override
  State<SetupPage> createState() => _SetupPageState();
}

class _SetupPageState extends State<SetupPage> {
  String? selectedBranch;
  List<Map<String, dynamic>> myServices = [];
  bool _isLoading = false;
  
  final SetupRepository _repository = SetupRepository();
  
  final _branchController = TextEditingController();
  final _serviceNameController = TextEditingController();
  final _priceController = TextEditingController();
  final _timeController = TextEditingController();

  final List<String> branchSuggestions = [
    'Barbearia', 'Cabeleireiro', 'Unhas', 'Cílios / Sobrancelhas', 
    'Estética', 'Maquiagem', 'Massoterapia', 'Tatuagem / Piercing'
  ];

  void _addService() {
    if (_serviceNameController.text.isEmpty) return;
    setState(() {
      myServices.add({
        'nome': _serviceNameController.text,
        'preco': double.tryParse(_priceController.text) ?? 0.0,
        'duracao': int.tryParse(_timeController.text) ?? 30,
      });
      _serviceNameController.clear();
      _priceController.clear();
      _timeController.clear();
    });
    Navigator.pop(context); // Fecha a janelinha
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        // LOGO NO CENTRO
        title: Image.network(
          'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
          height: 40,
          errorBuilder: (context, error, stackTrace) => const Text("ESTILO EXATO", style: TextStyle(color: Color(0xFFF2CA50))),
        ),
        // BOTÃO DE VOLTAR (Esquerda)
        leading: selectedBranch != null 
          ? IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFFF2CA50)), 
              onPressed: () => setState(() { selectedBranch = null; myServices.clear(); })
            )
          : null,
        // BOTÃO DE SAIR (Direita)
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent, size: 22),
            tooltip: 'Sair da Conta',
            onPressed: () async {
              await FirebaseAuth.instance.signOut(); // Desloga o usuário
            },
          ),
        ],
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
              Text(selectedBranch == null ? "Qual o seu ramo?" : "Monte seu catálogo", 
                style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(height: 32),
              
              if (selectedBranch == null) 
                Expanded(child: _buildBranchStep())
              else 
                Expanded(child: _buildCatalogStep()),

              if (selectedBranch != null) _buildFinalizeButton(),
            ],
          ),
        ),
      ),
    );
  }

  // --- PASSO 1: ESCOLHER OU CRIAR RAMO ---
  Widget _buildBranchStep() {
    return ListView(
      children: [
        ...branchSuggestions.map((branch) => _branchTile(branch)),
        const Divider(color: Colors.white10, height: 40),
        _buildCustomBranchInput(),
      ],
    );
  }

  Widget _branchTile(String title) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        trailing: const Icon(Icons.arrow_forward_ios, color: Color(0xFFF2CA50), size: 14),
        onTap: () => setState(() => selectedBranch = title),
      ),
    );
  }

  Widget _buildCustomBranchInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("NÃO ENCONTROU O SEU?", style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        TextField(
          controller: _branchController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: "Digite seu ramo (ex: Pet Shop)",
            hintStyle: const TextStyle(color: Colors.white10),
            filled: true,
            fillColor: const Color(0xFF1C1C1B),
            suffixIcon: IconButton(
              icon: const Icon(Icons.check_circle, color: Color(0xFFF2CA50)),
              onPressed: () {
                if (_branchController.text.isNotEmpty) {
                  setState(() => selectedBranch = _branchController.text);
                }
              },
            ),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  // --- PASSO 2: CRIAR CATÁLOGO ---
  Widget _buildCatalogStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: const Color(0xFFF2CA50).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Text("RAMO: ${selectedBranch!.toUpperCase()}", 
            style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 10)),
        ),
        const SizedBox(height: 24),
        Expanded(
          child: myServices.isEmpty 
            ? const Center(child: Text("Nenhum serviço adicionado ainda.", style: TextStyle(color: Colors.white24)))
            : ListView.builder(
                itemCount: myServices.length,
                itemBuilder: (context, index) => _serviceCard(index),
              ),
        ),
        const SizedBox(height: 16),
        _buildAddServiceTrigger(),
      ],
    );
  }

  Widget _serviceCard(int index) {
    final s = myServices[index];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(s['nome'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              Text("${s['duracao']} min", style: const TextStyle(color: Colors.white38, fontSize: 12)),
            ],
          ),
          Row(
            children: [
              Text("R\$ ${s['preco'].toStringAsFixed(2)}", style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20), 
                onPressed: () => setState(() => myServices.removeAt(index))),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildAddServiceTrigger() {
    return InkWell(
      onTap: () => _showAddServiceModal(),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(border: Border.all(color: const Color(0xFFF2CA50).withOpacity(0.3), width: 2, style: BorderStyle.solid), borderRadius: BorderRadius.circular(12)),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_circle_outline, color: Color(0xFFF2CA50)),
            SizedBox(width: 12),
            Text("ADICIONAR NOVO SERVIÇO", style: TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  void _showAddServiceModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1C1C1B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("NOVO SERVIÇO", style: GoogleFonts.manrope(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 24),
            _modalField("Nome do Serviço", _serviceNameController, "Ex: Corte Degradê"),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _modalField("Preço (R\$)", _priceController, "0.00", isNumber: true)),
                const SizedBox(width: 16),
                Expanded(child: _modalField("Tempo (min)", _timeController, "30", isNumber: true)),
              ],
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity, height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
                onPressed: _addService,
                child: const Text("SALVAR SERVIÇO", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _modalField(String label, TextEditingController controller, String hint, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
        TextField(
          controller: controller,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white10),
            enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
            focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFF2CA50))),
          ),
        ),
      ],
    );
  }

  // --- BOTÃO DE FINALIZAR COM A LÓGICA DE SALVAMENTO ---
  Widget _buildFinalizeButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24.0),
      child: SizedBox(
        width: double.infinity, height: 60,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
          onPressed: (myServices.isEmpty || _isLoading) ? null : () async {
            setState(() => _isLoading = true);
            try {
              // Salva no banco de dados!
              await _repository.completeSetup(selectedBranch!, myServices);
              // Como atualizamos 'configurado: true' no banco, o main.dart vai nos levar pro Admin Dashboard sozinho!
            } catch (e) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erro ao salvar: $e"), backgroundColor: Colors.red));
              setState(() => _isLoading = false);
            }
          },
          child: _isLoading 
            ? const CircularProgressIndicator(color: Colors.black) 
            : const Text("ABRIR MEU NEGÓCIO", style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900)),
        ),
      ),
    );
  }
}