import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FinanceRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String? uid = FirebaseAuth.instance.currentUser?.uid;

  Stream<QuerySnapshot> getTransactionsStream() {
    return _db.collection('transacoes')
        .where('atelierId', isEqualTo: uid)
        .orderBy('data', descending: true)
        .snapshots();
  }

  Map<String, double> calculateStats(List<QueryDocumentSnapshot> docs) {
    double today = 0; double month = 0;
    DateTime now = DateTime.now();
    for (var doc in docs) {
      double valor = (doc['valor'] as num).toDouble();
      DateTime data = (doc['data'] as Timestamp).toDate();
      if (data.day == now.day && data.month == now.month && data.year == now.year) today += valor;
      if (data.month == now.month && data.year == now.year) month += valor;
    }
    return {'today': today, 'month': month};
  }
}