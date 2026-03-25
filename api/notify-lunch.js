const admin = require('firebase-admin');

// Inicialização do Firebase Admin (usando variáveis de ambiente)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { atelierId, status } = req.body; // status: 'almoco' ou 'aberto'

  try {
    // 1. Busca os dados do Atelier para pegar o nome
    const atelierDoc = await db.collection('ateliers').doc(atelierId).get();
    const atelierName = atelierDoc.data().nome_negocio;

    // 2. Busca todos os clientes que estão com status 'waiting' na fila deste atelier
    const snapshot = await db.collection('fila_virtual')
      .where('atelierId', isEqualTo: atelierId)
      .where('status', '==', 'waiting')
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'Fila vazia, ninguém notificado.' });
    }

    // 3. Prepara as mensagens
    const messages = snapshot.docs.map(doc => {
      const client = doc.data();
      const text = status === 'almoco' 
        ? `🚨 *AVISO: PAUSA PARA ALMOÇO*\n\nOlá ${client.cliente_nome}, o profissional do *${atelierName}* entrou em pausa para almoço agora.\n\nFique tranquilo! Sua posição na fila está guardada. Retornaremos em instantes! ☕`
        : `✅ *ESTAMOS DE VOLTA!*\n\nOlá ${client.cliente_nome}, nossa pausa para almoço terminou. Os atendimentos do *${atelierName}* foram retomados agora!`;

      // Aqui você dispararia para sua API de WhatsApp (Exemplo Z-API)
      return axios.post(`https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text`, {
        phone: client.cliente_zap,
        message: text
      });
    });

    // 4. Dispara todas as notificações em massa
    await Promise.allSettled(messages);

    return res.status(200).json({ success: true, count: messages.length });

  } catch (error) {
    console.error('Erro no disparo:', error);
    return res.status(500).json({ error: error.message });
  }
}
