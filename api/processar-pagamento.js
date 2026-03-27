const { MercadoPagoConfig, Payment } = require('mercadopago');
const admin = require('firebase-admin');

// Inicialização (Use variáveis de ambiente no dashboard da Vercel)
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const { atelierId, metodo, email, token, planoNome, valorBase } = req.body;

  // 1. VALIDAÇÃO DE PREÇO (Segurança no Servidor)
  let valorFinal = parseFloat(valorBase);
  if (metodo === 'pix') {
    valorFinal = valorFinal * 0.97; // Aplica desconto de 3%
  }

  const paymentData = {
    body: {
      transaction_amount: parseFloat(valorFinal.toFixed(2)),
      description: `Assinatura EstiloExatoZap - Plano ${planoNome}`,
      payment_method_id: metodo, // 'pix', 'bolbradesco' ou o ID do cartão
      payer: { email: email },
      external_reference: atelierId, // UID do Firebase para o Webhook saber quem pagou
      notification_url: "https://sua-api.vercel.app/api/webhook-mp", // URL do seu webhook
    }
  };

  // Se for Cartão, adiciona o token gerado pelo Flutter
  if (token) {
    paymentData.body.token = token;
    paymentData.body.installments = 1;
  }

  try {
    const result = await payment.create(paymentData);
    
    // Retorna para o Flutter o que ele precisa exibir (QR Code, Linha digitável ou Sucesso)
    res.status(200).json({
      id: result.id,
      status: result.status,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: result.transaction_details?.external_resource_url, // Link do boleto
    });
  } catch (error) {
    res.status(400).json(error);
  }
};
