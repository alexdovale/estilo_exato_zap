import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class SetupRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<void> completeSetup(String profession) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    await _db.collection('ateliers').doc(uid).update({
      'configurado': true,
      'tipo_servico': profession,
      'tema': (profession == 'Barbearia') ? 'obsidian' : 'aura',
    });
  }
}