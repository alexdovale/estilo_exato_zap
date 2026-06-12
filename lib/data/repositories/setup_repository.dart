import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class SetupRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String uid = FirebaseAuth.instance.currentUser!.uid;

  Future<void> completeFullSetup({
    required Map<String, dynamic> location,
    required Map<String, dynamic> segmentation,
    required List<Map<String, dynamic>> services,
    required List<Map<String, dynamic>> staff,
  }) async {
    final batch = _db.batch();

    // 1. Atualiza o perfil principal do Atelier
    var atelierRef = _db.collection('ateliers').doc(uid);
    batch.update(atelierRef, {
      'configurado': true,
      'endereco': location,
      'segmentacao': segmentation,
      'tipo_servico': segmentation['ramo'],
      'tema': segmentation['ramo'] == 'Barbearia' ? 'obsidian' : 'aura',
    });

    // 2. Salva os Serviços
    for (var s in services) {
      var sRef = _db.collection('services').doc();
      batch.set(sRef, {...s, 'atelierId': uid});
    }

    // 3. Salva a Equipe (Staff)
    for (var p in staff) {
      var pRef = _db.collection('ateliers').doc(uid).collection('equipe').doc();
      batch.set(pRef, {...p, 'ativo': true});
    }

    await batch.commit();
  }
}