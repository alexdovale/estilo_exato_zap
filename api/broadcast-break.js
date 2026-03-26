const admin = require('firebase-admin');
const axios = require('axios'); // Para chamar a API de WhatsApp (Z-API ou Twilio)

module.exports = async (req, res) => {
  const { atelierId, status } = req.body;

  // 1. Busca todos os clientes esperando ('waiting') para este atelier
  const snapshot = await admin.firestore()
    .collection('fila_virtual')
    .where('atelierId', '==', atelierId)
    .where('status', '==', 'waiting')
    .get();

  const msg = status === 'almoco' 
    ? "☕ *Pausa para Almoço:* Olá! O profissional entrou em pausa agora e retorna em 1 hora. Sua posição na fila está mantida e avisaremos assim que voltarmos!"
    : "🚀 *Retornamos:* Já estamos de volta! Prepare-se, a fila voltou a andar.";

  // 2. Loop de envio (Exemplo usando uma API genérica de WhatsApp)
  const promises = snapshot.docs.map(doc => {
    const cliente = doc.data();
    return axios.post('URL_DA_SUA_API_ZAP', {
      phone: cliente.cliente_zap,
      message: msg
    });
  });

  await Promise.all(promises);
  res.status(200).send("Notificações enviadas.");
};
