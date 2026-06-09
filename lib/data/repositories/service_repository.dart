import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ServiceRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String uid = FirebaseAuth.instance.currentUser!.uid;

  // Busca todos os serviços deste atelier
  Stream<QuerySnapshot> getServicesStream() {
    return _db.collection('services')
        .where('atelierId', isEqualTo: uid)
        .snapshots();
  }

  // Adiciona um novo serviço manual
  Future<void> addService(String name, double price, int duration) async {
    await _db.collection('services').add({
      'atelierId': uid,
      'nome': name,
      'preco': price,
      'duracao': duration,
      'criado_em': FieldValue.serverTimestamp(),
    });
  }

  // Remove um serviço
  Future<void> deleteService(String id) async {
    await _db.collection('services').doc(id).delete();
  }
}