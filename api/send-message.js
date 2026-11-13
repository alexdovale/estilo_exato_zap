// api/send-message.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { phone, message } = req.body;

    // AQUI VOCÊ PRECISA DAS SUAS CHAVES DA Z-API
    // Você pode criar uma conta em z-api.io
    const instanceId = "SUA_INSTANCIA_AQUI";
    final token = "SEU_TOKEN_AQUI";

    try {
      const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          message: message
        })
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(405).send('Método não permitido');
}
