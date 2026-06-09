import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class TeamRepository {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String ownerId = FirebaseAuth.instance.currentUser!.uid;

  // 1. Listar todos os funcionários do seu atelier
  Stream<QuerySnapshot> getTeamStream() {
    return _db.collection('ateliers').doc(ownerId).collection('equipe').snapshots();
  }

  // 2. Adicionar um novo colaborador
  Future<void> addStaffMember({
    required String name,
    required String email,
    required String role,
  }) async {
    await _db.collection('ateliers').doc(ownerId).collection('equipe').add({
      'nome': name,
      'email': email,
      'cargo': role,
      'criado_em': FieldValue.serverTimestamp(),
      'ativo': true,
    });
    
    // NOTA: Em um sistema real, aqui você dispararia uma função para 
    // criar o usuário no Firebase Auth também.
  }

  // 3. Remover colaborador
  Future<void> removeStaff(String id) async {
    await _db.collection('ateliers').doc(ownerId).collection('equipe').doc(id).delete();
  }
}