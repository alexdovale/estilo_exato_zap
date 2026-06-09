import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../data/repositories/client_repository.dart';

class PublicQueuePage extends StatefulWidget {
  final String atelierId;
  const PublicQueuePage({super.key, required this.atelierId});

  @override
  State<PublicQueuePage> createState() => _PublicQueuePageState();
}

class _PublicQueuePageState extends State<PublicQueuePage> {
  final _clientRepo = ClientRepository();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  
  Map<String, dynamic>? atelierData;
  bool isLoading = true;
  bool isJoining = false;

  @override
  void initState() {
    super.initState();
    _loadAtelier();
  }

  _loadAtelier() async {
    atelierData = await _clientRepo.getAtelierInfo(widget.atelierId);
    setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Scaffold(backgroundColor: Color(0xFF131313), body: Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50))));
    if (atelierData == null) return const Scaffold(backgroundColor: Color(0xFF131313), body: Center(child: Text("Atelier não encontrado", style: TextStyle(color: Colors.white))));

    // MÁGICA: Tema muda se for Barbearia (Dark) ou Estética (Light)
    bool isDark = atelierData!['tema'] != 'aura'; 
    Color primaryColor = isDark ? const Color(0xFFF2CA50) : const Color(0xFF72594A);
    Color bgColor = isDark ? const Color(0xFF131313) : const Color(0xFFFAF9F6);
    Color cardColor = isDark ? const Color(0xFF1C1C1B) : Colors.white;
    Color textColor = isDark ? Colors.white : const Color(0xFF1A1C1A);

    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
        slivers:[
          SliverAppBar(
            expandedHeight: 120, pinned: true,
            backgroundColor: isDark ? const Color(0xFF131313) : Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(atelierData!['nome_negocio'].toString().toUpperCase(), 
                style: GoogleFonts.manrope(fontWeight: FontWeight.w900, fontSize: 14, color: primaryColor, letterSpacing: 2)),
              centerTitle: true,
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children:[
                  _buildLiveStatus(primaryColor, cardColor, textColor, isDark),
                  const SizedBox(height: 40),
                  _buildJoinForm(primaryColor, cardColor, textColor, isDark),
                  const SizedBox(height: 40),
                  Text("Powered by EstiloExatoZap", style: TextStyle(color: primaryColor.withOpacity(0.4), fontSize: 10, letterSpacing: 2)),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildLiveStatus(Color color, Color cardBg, Color text, bool isDark) {
    return StreamBuilder<QuerySnapshot>(
      stream: _clientRepo.getCurrentServingStream(widget.atelierId),
      builder: (context, snapshot) {
        String currentClient = "Cadeira disponível";
        if (snapshot.hasData && snapshot.data!.docs.isNotEmpty) {
          currentClient = snapshot.data!.docs.first['cliente_nome'];
        }

        return Container(
          width: double.infinity, padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3), width: 2)),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children:[
                  const Icon(Icons.sensors, color: Colors.green, size: 16),
                  const SizedBox(width: 8),
                  Text("AO VIVO", style: GoogleFonts.workSans(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 2)),
                ],
              ),
              const SizedBox(height: 16),
              Text(currentClient, textAlign: TextAlign.center, style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: text)),
              Text("Sendo atendido agora", style: TextStyle(fontSize: 10, color: isDark ? Colors.white38 : Colors.black38, letterSpacing: 1, fontWeight: FontWeight.bold)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildJoinForm(Color color, Color cardBg, Color text, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children:[
        Text("ENTRAR NA FILA VIRTUAL", style: GoogleFonts.workSans(fontWeight: FontWeight.bold, fontSize: 10, color: color, letterSpacing: 2)),
        const SizedBox(height: 24),
        TextField(controller: _nameController, style: TextStyle(color: text), decoration: InputDecoration(labelText: "Seu Nome Completo", prefixIcon: Icon(Icons.person, color: color), filled: true, fillColor: isDark ? const Color(0xFF1C1C1B) : Colors.black.withOpacity(0.03), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
        const SizedBox(height: 16),
        TextField(controller: _phoneController, keyboardType: TextInputType.phone, style: TextStyle(color: text), decoration: InputDecoration(labelText: "WhatsApp (com DDD)", prefixIcon: Icon(Icons.phone, color: color), filled: true, fillColor: isDark ? const Color(0xFF1C1C1B) : Colors.black.withOpacity(0.03), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity, height: 60,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: color, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            onPressed: isJoining ? null : () async {
              if(_nameController.text.isEmpty || _phoneController.text.isEmpty) return;
              setState(() => isJoining = true);
              await _clientRepo.joinQueue(atelierId: widget.atelierId, name: _nameController.text, phone: _phoneController.text);
              setState(() => isJoining = false);
              _showSuccessDialog();
            },
            child: isJoining ? const CircularProgressIndicator(color: Colors.black) : Text("GARANTIR MEU LUGAR", style: TextStyle(color: isDark ? Colors.black : Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ),
        )
      ],
    );
  }

  void _showSuccessDialog() {
    showModalBottomSheet(
      context: context, backgroundColor: const Color(0xFF25D366),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) => Container(
        height: 300, padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children:[
            const Icon(Icons.check_circle, color: Colors.white, size: 64),
            const SizedBox(height: 16),
            const Text("VOCÊ ESTÁ NA FILA!", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
            const Text("Fique atento ao seu WhatsApp. Avisaremos quando sua vez estiver chegando.", textAlign: TextAlign.center, style: TextStyle(color: Colors.white)),
            const SizedBox(height: 16),
            TextButton(onPressed: () => Navigator.pop(context), child: const Text("ENTENDI", style: TextStyle(color: Colors.white, decoration: TextDecoration.underline)))
          ],
        ),
      ),
    );
  }
}