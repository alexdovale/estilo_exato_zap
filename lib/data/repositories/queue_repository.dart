import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/queue_item.dart';

class QueueRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  String? get atelierId => FirebaseAuth.instance.currentUser?.uid;

  // 1. OUVIR A FILA (Com o drible do Índice)
  Stream<List<QueueItem>> getQueueStream() {
    if (atelierId == null) return Stream.value([]);
    
    return _db.collection('fila_virtual')
        .where('atelierId', isEqualTo: atelierId)
        .snapshots()
        .map((snapshot) {
          // Lemos todos os documentos e filtramos no Flutter em vez do Firebase!
          var todosClientes = snapshot.docs.map((doc) => QueueItem.fromFirestore(doc)).toList();
          
          // Remove quem já terminou o serviço para não poluir a tela
          return todosClientes.where((item) => item.status != 'finished').toList();
        });
  }

  // 2. ADICIONAR CLIENTE NA LOJA (Walk-in)
  Future<void> addWalkInClient({
    required String clientName,
    required String phone,
    required String service,
  }) async {
    if (atelierId == null) return;

    await _db.collection('fila_virtual').add({
      'atelierId': atelierId,
      'cliente_nome': clientName,
      'cliente_zap': phone,
      'servico': service,
      'status': 'waiting',
      'origem': 'loja',
      'ticket': 99, 
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  // 3. CHAMAR O PRÓXIMO
  Future<void> callNext(String id) async {
    await _db.collection('fila_virtual').doc(id).update({'status': 'in_service'});
  }

  // 4. FINALIZAR E SALVAR DINHEIRO
  Future<void> finishAndRecordTransaction({
    required String ticketId, 
    required String clientName, 
    required String serviceName, 
    required double value
  }) async {
    final batch = _db.batch();
    batch.update(_db.collection('fila_virtual').doc(ticketId), {'status': 'finished'});
    
    batch.set(_db.collection('transacoes').doc(), {
      'atelierId': atelierId, 
      'cliente_nome': clientName, 
      'servico': serviceName, 
      'valor': value, 
      'data': FieldValue.serverTimestamp(),
    });
    
    await batch.commit();
  }
}