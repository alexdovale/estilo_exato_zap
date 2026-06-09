import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class SetupRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<void> completeSetup(String profession, List<Map<String, dynamic>> services) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) throw Exception("Usuário não logado");

    // 1. Usamos um Batch (Lote) para salvar todos os serviços de uma vez
    final batch = _db.batch();

    for (var service in services) {
      var docRef = _db.collection('services').doc(); 
      batch.set(docRef, {
        'atelierId': uid,
        'nome': service['nome'],
        'preco': service['preco'],
        'duracao': service['duracao'],
        'criado_em': FieldValue.serverTimestamp(),
      });
    }

    // 2. Atualiza o perfil da empresa para 'configurado = true'
    var atelierRef = _db.collection('ateliers').doc(uid);
    batch.update(atelierRef, {
      'configurado': true,
      'tipo_servico': profession,
      // Se tiver 'barbearia' no nome, fica escuro, se não, fica claro (Estética/Unhas)
      'tema': (profession.toLowerCase().contains('barbearia')) ? 'obsidian' : 'aura',
    });

    // 3. Executa o envio para o banco de dados
    await batch.commit();
  }
}