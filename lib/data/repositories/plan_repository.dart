import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class PlanRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  String get uid => FirebaseAuth.instance.currentUser!.uid;

  // Lista os planos do Atelier logado
  Stream<QuerySnapshot> getPlansStream() {
    return _db.collection('ateliers').doc(uid).collection('planos').snapshots();
  }

  // Adiciona um novo plano definido pelo barbeiro
  Future<void> addPlan(String name, String desc, double price) async {
    await _db.collection('ateliers').doc(uid).collection('planos').add({
      'nome': name,
      'descricao': desc,
      'preco': price,
      'criado_em': FieldValue.serverTimestamp(),
    });
  }

  Future<void> deletePlan(String id) async {
    await _db.collection('ateliers').doc(uid).collection('planos').doc(id).delete();
  }
}