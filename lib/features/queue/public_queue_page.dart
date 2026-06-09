import 'package:flutter/material.dart';
class PublicQueuePage extends StatelessWidget {
  final String atelierId;
  const PublicQueuePage({super.key, required this.atelierId});
  @override Widget build(BuildContext context) => Scaffold(body: Center(child: Text("Fila do ID: $atelierId")));
}