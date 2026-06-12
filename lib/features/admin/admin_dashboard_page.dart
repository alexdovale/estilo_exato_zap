import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:share_plus/share_plus.dart';
import 'package:http/http.dart' as http; // Requer: flutter pub add http
import 'dart:convert';

import '../../data/repositories/queue_repository.dart';
import '../../data/models/queue_item.dart';

// Importações das telas
import 'comanda_page.dart';
import 'walk_in_registration_page.dart';
import 'profile_page.dart';
import '../reports/finance_report_page.dart';

class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  final QueueRepository _repository = QueueRepository();
  String businessName = "Carregando...";
  String profession = "Profissional";
  bool isAdmin = false;
  bool _isNotifying = false; // Controle de loading do Zap
  final String uid = FirebaseAuth.instance.currentUser!.uid;

  @override
  void initState() {
    super.initState();
    _loadBusinessInfo();
  }

  // Busca se é Dono ou Funcionário e personaliza o painel
  _loadBusinessInfo() async {
    var doc = await FirebaseFirestore.instance.collection('ateliers').doc(uid).get();
    
    if (doc.exists) {
      if (mounted) {
        setState(() {
          businessName = doc.data()?['nome_negocio'] ?? "Meu Negócio";
          profession = doc.data()?['tipo_servico'] ?? "Profissional";
          isAdmin = true; 
        });
      }
    } else {
      if (mounted) {
        setState(() {
          businessName = "Painel de Atendimento";
          profession = "Colaborador";
          isAdmin = false;
        });
      }
    }
  }

  // --- FUNÇÃO PARA DISPARAR O WHATSAPP VIA VERCEL ---
  Future<void> _sendWhatsAppNotification(QueueItem item) async {
    try {
      // Pega o zap do cliente no documento da fila
      var clientDoc = await FirebaseFirestore.instance.collection('fila_virtual').doc(item.id).get();
      String phone = clientDoc.data()?['cliente_zap'] ?? "";

      if (phone.isNotEmpty) {
        // Altere para a URL oficial do seu projeto na Vercel
        final url = Uri.parse('https://estilo-exato-zap.vercel.app/api/send-message');
        
        await http.post(
          url,
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "phone": phone,
            "message": "Olá ${item.clientName}, sua vez chegou no $businessName! ✂️\nEstamos te esperando na cadeira.",
          }),
        );
      }
    } catch (e) {
      debugPrint("Erro ao notificar WhatsApp: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131313),
      appBar: _buildAppBar(),
      
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF2CA50),
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const WalkInRegistrationPage()));
        },
        icon: const Icon(Icons.person_add, color: Colors.black),
        label: const Text("NOVO CLIENTE", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),

      body: StreamBuilder<List<QueueItem>>(
        stream: _repository.getQueueStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFF2CA50)));
          }
          
          final queue = snapshot.data ?? [];
          final inService = queue.where((item) => item.status == 'in_service').toList();
          final waiting = queue.where((item) => item.status == 'waiting').toList();

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                _buildHeader(waiting.length),
                const SizedBox(height: 32),
                
                _buildSectionTitle("ATENDIMENTO ATUAL"),
                inService.isNotEmpty ? _buildCurrentClientCard(inService.first) : _buildEmptyChairCard(),
                
                const SizedBox(height: 32),
                
                _buildSectionTitle("FILA DE ESPERA"),
                Expanded(
                  child: waiting.isEmpty 
                    ? const Center(child: Text("Fila vazia", style: TextStyle(color: Colors.white10))) 
                    : ListView.builder(
                        itemCount: waiting.length,
                        itemBuilder: (context, index) => _buildWaitingItem(waiting[index], index + 1),
                      ),
                ),

                // BOTÃO DE CHAMADA COM NOTIFICAÇÃO ZAP
                if (waiting.isNotEmpty && inService.isEmpty)
                  _buildCallNextButton(waiting.first),
                
                const SizedBox(height: 12),
                _buildShareLinkButton(),
                const SizedBox(height: 80),
              ],
            ),
          );
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      automaticallyImplyLeading: false, 
      title: Image.network(
        'https://raw.githubusercontent.com/alexdovale/estilo_exato_zap/main/COMPLETO.png',
        height: 45,
        errorBuilder: (context, error, stackTrace) => Text(
          businessName.toUpperCase(), 
          style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 12)
        ),
      ),
      actions: [
        if (isAdmin) 
          IconButton(
            icon: const Icon(Icons.bar_chart_rounded, color: Color(0xFFF2CA50)), 
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => FinanceReportPage()))
          ),
        if (isAdmin) 
          IconButton(
            icon: const Icon(Icons.settings, color: Color(0xFFF2CA50)), 
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfilePage()))
          ),
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.redAccent, size: 22), 
          onPressed: () => FirebaseAuth.instance.signOut()
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildCallNextButton(QueueItem item) {
    return SizedBox(
      width: double.infinity, height: 60,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
        onPressed: _isNotifying ? null : () async {
          setState(() => _isNotifying = true);
          
          // 1. Busca o telefone do cliente no Firestore antes de chamar
          var doc = await FirebaseFirestore.instance.collection('fila_virtual').doc(item.id).get();
          String phone = doc.data()?['cliente_zap'] ?? "";

          // 2. Dispara o WhatsApp
          if (phone.isNotEmpty) {
            await _repository.notifyClient(phone, item.clientName, businessName);
          }

          // 3. Move o cliente para a cadeira
          await _repository.callNext(item.id);
          
          if(mounted) setState(() => _isNotifying = false);
        },
        child: _isNotifying 
          ? const CircularProgressIndicator(color: Colors.black)
          : Text("CHAMAR ${item.clientName.toUpperCase()}", style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900)),
      ),
    );
  }

  // --- OUTROS WIDGETS AUXILIARES ---
  
  Widget _buildHeader(int count) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start, 
      children: [
        Text(
          isAdmin ? "PAINEL ADMINISTRATIVO" : "PAINEL DA EQUIPE", 
          style: GoogleFonts.workSans(color: const Color(0xFFF2CA50), fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)
        ), 
        Text(
          "$count na espera", 
          style: GoogleFonts.manrope(fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white)
        )
      ]
    );
  }
  
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12), 
      child: Text(
        title, 
        style: GoogleFonts.workSans(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)
      )
    );
  }
  
  Widget _buildCurrentClientCard(QueueItem item) {
    return Container(
      padding: const EdgeInsets.all(20), 
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1B), 
        borderRadius: BorderRadius.circular(16), 
        border: Border.all(color: const Color(0xFFF2CA50).withOpacity(0.3))
      ), 
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween, 
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start, 
            children: [
              Text(item.clientName, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)), 
              Text(item.service.toUpperCase(), style: const TextStyle(color: Color(0xFFF2CA50), fontSize: 11, fontWeight: FontWeight.bold))
            ]
          ), 
          ElevatedButton(
            onPressed: () => _showFinishDialog(item), 
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green), 
            child: const Text("FINALIZAR", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white))
          )
        ]
      )
    );
  }
  
  Widget _buildEmptyChairCard() {
    return Container(
      width: double.infinity, 
      padding: const EdgeInsets.all(32), 
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white10, style: BorderStyle.solid), 
        borderRadius: BorderRadius.circular(16)
      ), 
      child: const Center(
        child: Text("CADEIRA DISPONÍVEL", style: TextStyle(color: Colors.white10, fontWeight: FontWeight.bold, fontSize: 12))
      )
    );
  }
  
  Widget _buildWaitingItem(QueueItem item, int pos) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12), 
      padding: const EdgeInsets.all(16), 
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1B), 
        borderRadius: BorderRadius.circular(12)
      ), 
      child: Row(
        children: [
          Text("#$pos", style: const TextStyle(color: Color(0xFFF2CA50), fontWeight: FontWeight.bold, fontSize: 16)), 
          const SizedBox(width: 16), 
          Expanded(child: Text(item.clientName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600))), 
          const Icon(Icons.chat_bubble_outline, color: Color(0xFFF2CA50), size: 16)
        ]
      )
    );
  }
  
  Widget _buildShareLinkButton() {
    return TextButton.icon(
      onPressed: () => Share.share("Olá! Entre na minha fila virtual aqui: https://estilo-exato-zap.vercel.app/#/fila/$uid"), 
      icon: const Icon(Icons.share, color: Color(0xFFF2CA50), size: 18), 
      label: const Text("COMPARTILHAR LINK DA FILA", style: TextStyle(color: Colors.white70, fontSize: 12))
    );
  }

  void _showFinishDialog(QueueItem item) {
    double valorServico = 50.0; // Valor padrão
    double valorProdutos = 0.0;
    double valorRecebido = 0.0;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder( // StatefulBuilder para atualizar o modal internamente
        builder: (context, setModalState) {
          double totalGeral = valorServico + valorProdutos;
          double troco = valorRecebido > totalGeral ? valorRecebido - totalGeral : 0.0;

          return AlertDialog(
            backgroundColor: const Color(0xFF1C1C1B),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Text("Finalizar Atendimento", style: GoogleFonts.manrope(color: Colors.white, fontWeight: FontWeight.bold)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Cliente: ${item.clientName}", style: const TextStyle(color: Colors.white70, fontSize: 14)),
                  const Divider(color: Colors.white10, height: 30),
                  
                  // --- SEÇÃO DE VALORES ---
                  const Text("VALOR DO SERVIÇO", style: TextStyle(color: Color(0xFFF2CA50), fontSize: 9, fontWeight: FontWeight.bold)),
                  TextField(
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    decoration: const InputDecoration(prefixText: "R\$ ", isDense: true, hintText: "50.00", hintStyle: TextStyle(color: Colors.white10)),
                    onChanged: (v) => setModalState(() => valorServico = double.tryParse(v) ?? 0.0),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // --- VENDA DE PRODUTOS (UPSELL) ---
                  const Text("ADICIONAR PRODUTOS", style: TextStyle(color: Colors.white38, fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _productChip("Pomada", 35.0, (val) => setModalState(() => valorProdutos += val)),
                      const SizedBox(width: 8),
                      _productChip("Óleo", 25.0, (val) => setModalState(() => valorProdutos += val)),
                    ],
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // --- TOTAL E RECEBIMENTO ---
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("TOTAL A PAGAR:", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        Text("R\$ ${totalGeral.toStringAsFixed(2)}", 
                          style: const TextStyle(color: Color(0xFFF2CA50), fontSize: 20, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // --- CÁLCULO DE TROCO ---
                  const Text("VALOR RECEBIDO (DINHEIRO)", style: TextStyle(color: Colors.white38, fontSize: 9)),
                  TextField(
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 18),
                    decoration: const InputDecoration(hintText: "Quanto o cliente te deu?", hintStyle: TextStyle(color: Colors.white10)),
                    onChanged: (v) => setModalState(() => valorRecebido = double.tryParse(v) ?? 0.0),
                  ),
                  
                  if (troco > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text("TROCO: R\$ ${troco.toStringAsFixed(2)}", 
                        style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text("CANCELAR", style: TextStyle(color: Colors.white24))),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF2CA50)),
                onPressed: () async {
                  await _repository.finishAndRecordTransaction(
                    ticketId: item.id, 
                    clientName: item.clientName, 
                    serviceName: "${item.service} + Produtos", 
                    value: totalGeral
                  );
                  if (mounted) Navigator.pop(context);
                },
                child: const Text("CONCLUIR E RECEBER", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ],
          );
        }
      ),
    );
  }

  // Widget auxiliar para os botões de produtos
  Widget _productChip(String label, double price, Function(double) onAdd) {
    return ActionChip(
      backgroundColor: Colors.white.withOpacity(0.05),
      label: Text("$label +R\$$price", style: const TextStyle(color: Colors.white, fontSize: 10)),
      onPressed: () => onAdd(price),
    );
  }
}