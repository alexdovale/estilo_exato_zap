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
  int _currentStep = 0;
  bool _isLoading = false;
  final SetupRepository _repository = SetupRepository();

  // Dados dos Formulários
  Map<String, dynamic> location = {'pais': 'Brasil', 'cep': '', 'endereco': '', 'cidade': ''};
  Map<String, dynamic> segmentation = {'ramo': 'Barbearia', 'valor_base': '', 'equipe_size': '1'};
  List<Map<String, dynamic>> myServices = [];
  List<Map<String, dynamic>> myStaff = [];

  // Controllers para os modais
  final _serviceNameController = TextEditingController();
  final _priceController = TextEditingController();
  final _timeController = TextEditingController();
  
  final _staffNameController = TextEditingController();
  final _staffPhoneController = TextEditingController();

  final List<String> branchSuggestions = [
    'Barbearia', 'Cabeleireiro', 'Unhas', 'Cílios / Sobrancelhas', 
    'Estética', 'Maquiagem', 'Massoterapia', 'Tatuagem / Piercing'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Image.network(
          'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
          height: 40,
          errorBuilder: (context, error, stackTrace) => const Text("ESTILO EXATO", style: TextStyle(color: Color(0xFFF2CA50))),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent, size: 22),
            tooltip: 'Sair da Conta',
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Theme(
          // Customizando as cores do Stepper para combinar com o tema dark/gold
          data: ThemeData(
            canvasColor: const Color(0xFF131313),
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: const Color(0xFFF2CA50),
              onSurface: Colors.white,
            ),
          ),
          child: Stepper(
            type: StepperType.vertical,
            currentStep: _currentStep,
            elevation: 0,
            onStepContinue: () {
              if (_currentStep < 3) {
                setState(() => _currentStep += 1);
              } else {
                _finalize();
              }
            },
            onStepCancel: () {
              if (_currentStep > 0) setState(() => _currentStep -= 1);
            },
            controlsBuilder: (context, details) {
              return Padding(
                padding: const EdgeInsets.only(top: 32, bottom: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 55,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF2CA50),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: _isLoading ? null : details.onStepContinue,
                          child: _isLoading && _currentStep == 3
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                              : Text(
                                  _currentStep == 3 ? "FINALIZAR" : "CONTINUAR", 
                                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)
                                ),
                        ),
                      ),
                    ),
                    if (_currentStep > 0) ...[
                      const SizedBox(width: 16),
                      TextButton(
                        onPressed: _isLoading ? null : details.onStepCancel,
                        child: const Text("VOLTAR", style: TextStyle(color: Colors.white38, fontWeight: FontWeight.bold)),
                      ),
                    ]
                  ],
                ),
              );
            },
            steps: [
              _stepLocation(),
              _stepSegmentation(),
              _stepServices(),
              _stepStaff(),
            ],
          ),
        ),
      ),
    );
  }

  // --- PASSO 1: LOCALIZAÇÃO ---
  Step _stepLocation() {
    return Step(
      title: Text("Localização", style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.bold, color: _currentStep == 0 ? Colors.white : Colors.white54)),
      isActive: _currentStep >= 0,
      state: _currentStep > 0 ? StepState.complete : StepState.indexed,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          _buildTextField("País", (v) => location['pais'] = v, initial: location['pais']),
          _buildTextField("CEP", (v) => location['cep'] = v, initial: location['cep'], isNumber: true),
          _buildTextField("Cidade", (v) => location['cidade'] = v, initial: location['cidade']),
          _buildTextField("Endereço Completo", (v) => location['endereco'] = v, initial: location['endereco']),
        ],
      ),
    );
  }

  // --- PASSO 2: SEGMENTAÇÃO ---
  Step _stepSegmentation() {
    return Step(
      title: Text("Segmentação", style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.bold, color: _currentStep == 1 ? Colors.white : Colors.white54)),
      isActive: _currentStep >= 1,
      state: _currentStep > 1 ? StepState.complete : StepState.indexed,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          const Text("Ramo de Atuação", style: TextStyle(color: Colors.white38, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: branchSuggestions.contains(segmentation['ramo']) ? segmentation['ramo'] : branchSuggestions.first,
            dropdownColor: const Color(0xFF1C1C1B),
            icon: const Icon(Icons.arrow_drop_down, color: Color(0xFFF2CA50)),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF1C1C1B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            items: branchSuggestions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (v) => setState(() => segmentation['ramo'] = v),
          ),
          const SizedBox(height: 16),
          _buildTextField("Valor médio do seu serviço principal (R\$)", (v) => segmentation['valor_base'] = v, initial: segmentation['valor_base'], isNumber: true),
        ],
      ),
    );
  }

  // --- PASSO 3: SERVIÇOS ---
  Step _stepServices() {
    return Step(
      title: Text("Serviços", style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.bold, color: _currentStep == 2 ? Colors.white : Colors.white54)),
      isActive: _currentStep >= 2,
      state: _currentStep > 2 ? StepState.complete : StepState.indexed,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          if (myServices.isEmpty)
            const Padding(
              padding: EdgeInsets.only(bottom: 16.0),
              child: Text("Nenhum serviço adicionado. Adicione pelo menos um para começar.", style: TextStyle(color: Colors.white24)),
            ),
          ...myServices.asMap().entries.map((entry) => _serviceCard(entry.key, entry.value)),
          const SizedBox(height: 8),
          _buildAddTrigger("ADICIONAR NOVO SERVIÇO", Icons.add_circle_outline, _showAddServiceModal),
        ],
      ),
    );
  }

  // --- PASSO 4: PROFISSIONAIS ---
  Step _stepStaff() {
    return Step(
      title: Text("Profissionais", style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.bold, color: _currentStep == 3 ? Colors.white : Colors.white54)),
      isActive: _currentStep >= 3,
      state: _currentStep == 3 ? StepState.indexed : StepState.complete,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          if (myStaff.isEmpty)
            const Padding(
              padding: EdgeInsets.only(bottom: 16.0),
              child: Text("Adicione você e/ou sua equipe.", style: TextStyle(color: Colors.white24)),
            ),
          ...myStaff.asMap().entries.map((entry) => _staffCard(entry.key, entry.value)),
          const SizedBox(height: 8),
          _buildAddTrigger("ADICIONAR PROFISSIONAL", Icons.person_add_alt_1, _showAddStaffModal),
        ],
      ),
    );
  }

  // --- WIDGETS AUXILIARES E CARDS ---

  Widget _buildTextField(String label, Function(String) onChange, {String? initial, bool isNumber = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white38, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: initial,
            keyboardType: isNumber ? TextInputType.number : TextInputType.text,
            style: const TextStyle(color: Colors.white),
            onChanged: onChange,
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF1C1C1B),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddTrigger(String label, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFF2CA50).withOpacity(0.3), width: 2, style: BorderStyle.solid), 
          borderRadius: BorderRadius.circular(12)
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFFF2CA50)),
            const SizedBox(width: 12),
            Text(label, style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _serviceCard(int index, Map<String, dynamic> s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s['nome'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                Text("${s['duracao']} min", style: const TextStyle(color: Colors.white38, fontSize: 12)),
              ],
            ),
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

  Widget _staffCard(int index, Map<String, dynamic> p) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1C1C1B), borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFFF2CA50).withOpacity(0.2),
                child: const Icon(Icons.person, color: Color(0xFFF2CA50)),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p['nome'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  Text(p['celular'], style: const TextStyle(color: Colors.white38, fontSize: 12)),
                ],
              ),
            ],
          ),
          IconButton(icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20), 
            onPressed: () => setState(() => myStaff.removeAt(index))),
        ],
      ),
    );
  }

  // --- MODAIS (BOTTOM SHEETS) ---

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
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF2CA50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  if (_serviceNameController.text.isEmpty) return;
                  setState(() {
                    myServices.add({
                      'nome': _serviceNameController.text,
                      'preco': double.tryParse(_priceController.text) ?? 0.0,
                      'duracao': int.tryParse(_timeController.text) ?? 30,
                    });
                  });
                  _serviceNameController.clear(); _priceController.clear(); _timeController.clear();
                  Navigator.pop(context);
                },
                child: const Text("SALVAR SERVIÇO", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  void _showAddStaffModal() {
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
            Text("NOVO PROFISSIONAL", style: GoogleFonts.manrope(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 24),
            _modalField("Nome do Profissional", _staffNameController, "Ex: João Silva"),
            const SizedBox(height: 16),
            _modalField("WhatsApp", _staffPhoneController, "Ex: 11999999999", isNumber: true),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity, height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF2CA50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  if (_staffNameController.text.isEmpty) return;
                  setState(() {
                    myStaff.add({
                      'nome': _staffNameController.text,
                      'celular': _staffPhoneController.text,
                      'cargo': segmentation['ramo'] ?? 'Profissional',
                    });
                  });
                  _staffNameController.clear(); _staffPhoneController.clear();
                  Navigator.pop(context);
                },
                child: const Text("SALVAR PROFISSIONAL", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
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

  // --- FINALIZAR ---
  void _finalize() async {
    setState(() => _isLoading = true);
    try {
      await _repository.completeFullSetup(
        location: location,
        segmentation: segmentation,
        services: myServices,
        staff: myStaff
      );
      // SubscriptionGuard ou o main.dart redirecionarão após salvar
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erro ao salvar: $e"), backgroundColor: Colors.red));
      setState(() => _isLoading = false);
    }
  }
}