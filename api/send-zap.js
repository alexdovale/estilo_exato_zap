// Este código roda na Vercel e manda o Zap
export default async function handler(req, res) {
  const { phone, message } = req.body;

  const response = await fetch('https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phone,
      message: message
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
