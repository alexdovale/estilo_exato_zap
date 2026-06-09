import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class QueueItem {
  final String id;
  final String clientName;
  final String status;
  final int ticketNumber;
  final String service;

  QueueItem({required this.id, required this.clientName, required this.status, required this.ticketNumber, required this.service});

  factory QueueItem.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map;
    return QueueItem(
      id: doc.id,
      clientName: data['cliente_nome'] ?? '',
      status: data['status'] ?? 'waiting',
      ticketNumber: data['ticket'] ?? 0,
      service: data['servico'] ?? 'Corte',
    );
  }
}

class QueueRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  String? get atelierId => FirebaseAuth.instance.currentUser?.uid;

  Stream<List<QueueItem>> getQueueStream() {
    if (atelierId == null) return Stream.value([]);
    return _db.collection('fila_virtual')
        .where('atelierId', isEqualTo: atelierId)
        .where('status', isNotEqualTo: 'finished')
        .snapshots().map((snapshot) => snapshot.docs.map((doc) => QueueItem.fromFirestore(doc)).toList());
  }

  Future<void> callNext(String id) async {
    await _db.collection('fila_virtual').doc(id).update({'status': 'in_service'});
  }

  Future<void> finishAndRecordTransaction({required String ticketId, required String clientName, required String serviceName, required double value}) async {
    final batch = _db.batch();
    batch.update(_db.collection('fila_virtual').doc(ticketId), {'status': 'finished'});
    batch.set(_db.collection('transacoes').doc(), {
      'atelierId': atelierId, 'cliente_nome': clientName, 'servico': serviceName, 'valor': value, 'data': FieldValue.serverTimestamp(),
    });
    await batch.commit();
  }
}