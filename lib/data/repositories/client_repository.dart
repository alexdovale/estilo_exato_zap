import 'package:cloud_firestore/cloud_firestore.dart';

class ClientRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Busca os dados da Barbearia/Estúdio (Nome, Tema)
  Future<Map<String, dynamic>?> getAtelierInfo(String atelierId) async {
    final doc = await _db.collection('ateliers').doc(atelierId).get();
    return doc.data();
  }

  // Ouve quem está sendo atendido AGORA
  Stream<QuerySnapshot> getCurrentServingStream(String atelierId) {
    return _db
        .collection('fila_virtual')
        .where('atelierId', isEqualTo: atelierId)
        .where('status', isEqualTo: 'in_service')
        .snapshots();
  }

  // O cliente entra na fila pelo próprio celular
  Future<void> joinQueue({
    required String atelierId,
    required String name,
    required String phone,
  }) async {
    await _db.collection('fila_virtual').add({
      'atelierId': atelierId,
      'cliente_nome': name,
      'cliente_zap': phone,
      'servico': 'Solicitado via App', 
      'status': 'waiting',
      'origem': 'app', // Identifica que ele entrou sozinho
      'ticket': 99,
      'timestamp': FieldValue.serverTimestamp(),
    });
  }
}