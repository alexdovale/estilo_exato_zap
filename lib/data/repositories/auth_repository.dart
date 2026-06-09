import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AuthRepository {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<void> registerAtelier({
    required String email,
    required String password,
    required String businessName,
  }) async {
    UserCredential user = await _auth.createUserWithEmailAndPassword(email: email, password: password);
    DateTime now = DateTime.now();
    
    // Dá 14 dias de teste grátis
    DateTime trialExpiry = now.add(const Duration(days: 14));

    await _db.collection('ateliers').doc(user.user!.uid).set({
      'atelierId': user.user!.uid,
      'nome_negocio': businessName,
      'email': email,
      'status_assinatura': 'trial',
      'data_expiracao': Timestamp.fromDate(trialExpiry),
      'configurado': false, // Obriga a ir para a tela de Setup
      'criado_em': Timestamp.fromDate(now),
    });
  }
}