const { MercadoPagoConfig, Payment } = require('mercadopago');

// Inicializa o Cliente do Mercado Pago com o seu Token de Acesso
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});
const payment = new Payment(client);

module.exports = async (req, res) => {
    // --- INÍCIO DA CONFIGURAÇÃO DE CORS (OBRIGATÓRIO PARA WEB) ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite chamadas de qualquer domínio (Codespaces, Vercel, etc)
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Trata a requisição de pré-teste (Preflight) que o navegador faz
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // --- FIM DA CONFIGURAÇÃO DE CORS ---

    // Garante que apenas requisições POST sejam aceitas
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { atelierId, metodo, email, valorBase, planoNome, token } = req.body;

        // 1. APLICA DESCONTO DE 3% SE FOR PIX
        let valorFinal = parseFloat(valorBase);
        if (metodo === 'pix') {
            valorFinal = valorFinal * 0.97;
        }

        // 2. MONTA O OBJETO DE PAGAMENTO PARA O MERCADO PAGO
        const paymentData = {
            body: {
                transaction_amount: Number(valorFinal.toFixed(2)),
                description: `Assinatura ${planoNome} - EstiloExatoZap`,
                payment_method_id: metodo, // 'pix', 'bolbradesco' ou 'visa'/'master'
                payer: {
                    email: email,
                },
                // External Reference é vital para o Webhook saber qual Atelier liberar no Firebase
                external_reference: atelierId,
                // URL que o Mercado Pago chamará para avisar que o pagamento foi aprovado
                notification_url: "https://sua-api.vercel.app/api/webhook-mp", 
            }
        };

        // Se for cartão de crédito, inclui o token gerado pelo front-end
        if (token) {
            paymentData.body.token = token;
            paymentData.body.installments = 1;
        }

        // 3. ENVIA O PEDIDO PARA O MERCADO PAGO
        const result = await payment.create(paymentData);

        // 4. RETORNA OS DADOS PARA O APP FLUTTER EXIBIR (QR CODE OU LINK)
        res.status(200).json({
            id: result.id,
            status: result.status,
            qr_code: result.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
            copy_paste: result.point_of_interaction?.transaction_data?.qr_code, // Código copia e cola
            ticket_url: result.transaction_details?.external_resource_url, // Link do boleto
        });

    } catch (error) {
        console.error("Erro ao processar no Mercado Pago:", error);
        res.status(400).json({
            message: "Erro ao gerar pagamento",
            error: error.message
        });
    }
};
