class ComandaItem {
  final String id;
  final String nome;
  final double valor;
  final String tipo; // 'servico' ou 'produto'

  ComandaItem({required this.id, required this.nome, required this.valor, required this.tipo});
}