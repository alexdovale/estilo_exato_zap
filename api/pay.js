const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

module.exports = async (req, res) => {
  const { atelierId, metodo, email, valorBase, planoNome, token } = req.body;

  // Lógica de Preço do seu SaaS
  let valorFinal = parseFloat(valorBase);
  if (metodo === 'pix') valorFinal = valorFinal * 0.97; // Desconto 3%

  const paymentData = {
    body: {
      transaction_amount: Number(valorFinal.toFixed(2)),
      description: `Assinatura ${planoNome} - EstiloExatoZap`,
      payment_method_id: metodo, // 'pix', 'bolbradesco' ou 'visa/master'
      payer: { email: email },
      external_reference: atelierId, // Vínculo com o Firebase
      notification_url: "https://sua-api.vercel.app/api/webhook", // URL da sua Vercel
    }
  };

  if (token) paymentData.body.token = token; // Para Cartão de Crédito

  try {
    const result = await payment.create(paymentData);
    res.status(200).json({
      id: result.id,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      copy_paste: result.point_of_interaction?.transaction_data?.qr_code,
      ticket_url: result.transaction_details?.external_resource_url,
    });
  } catch (e) {
    res.status(400).json(e);
  }
};
