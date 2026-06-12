// api/webhooks/mercadopago.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const topic = req.query.topic; // O Mercado Pago envia o tipo no link (ex: payment)
    const id = req.query.id;      // O ID do pagamento ou assinatura

    if (topic === 'payment' || topic === 'merchant_order') {
      try {
        // 1. Busca os dados no Mercado Pago
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
          headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        });
        const payment = await paymentResponse.json();

        if (payment.status === 'approved') {
          // 2. Atualiza o status no Firebase usando o external_reference (seu UID do dono)
          await db.collection('ateliers').doc(payment.external_reference).update({
            status_assinatura: 'ativo',
            data_expiracao: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
          });
        }
      } catch (err) {
        console.error("Erro no Webhook:", err);
      }
    }
    return res.status(200).send('OK');
  }
}