const admin = require('firebase-admin');

// Inicialize o Firebase Admin (Use variáveis de ambiente para segurança)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const notification = req.body;

    // 1. O Mercado Pago avisa que houve uma atualização na assinatura (preapproval)
    if (notification.type === 'subscription_preapproval' || notification.action === 'updated') {
      const id = notification.data.id;

      // 2. Busca os detalhes da assinatura no Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/preapproval/${id}`, {
        headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
      });
      const subscription = await response.json();

      // 3. Se estiver pago (authorized), libera o atelier no Firestore
      if (subscription.status === 'authorized') {
        const atelierId = subscription.external_reference; // O ID que enviamos no checkout

        await db.collection('ateliers').doc(atelierId).update({
          status_assinatura: 'ativo',
          data_expiracao: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // +30 dias
        });
      }
    }
    res.status(200).send('OK');
  } else {
    res.status(405).send('Método não permitido');
  }
};
