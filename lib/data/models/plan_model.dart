import 'package:cloud_firestore/cloud_firestore.dart';

class PlanModel {
  final String id;
  final String name;
  final String description;
  final double price;

  PlanModel({required this.id, required this.name, required this.description, required this.price});

  factory PlanModel.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map;
    return PlanModel(
      id: doc.id,
      name: data['nome'] ?? '',
      description: data['descricao'] ?? '',
      price: (data['preco'] as num).toDouble(),
    );
  }
}