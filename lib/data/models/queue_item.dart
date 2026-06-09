import 'package:cloud_firestore/cloud_firestore.dart';

class QueueItem {
  final String id;
  final String clientName;
  final String status;
  final int ticketNumber;
  final String service;

  QueueItem({
    required this.id, 
    required this.clientName, 
    required this.status, 
    required this.ticketNumber, 
    required this.service
  });

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