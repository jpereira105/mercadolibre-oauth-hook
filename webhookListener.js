// webhookListener.js
import express from 'express';
import { exec } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/hook', (req, res) => {
  const code = req.query.code;
  if (!code) {
    console.error('❌ No se recibió el code en el webhook');
    return res.status(400).send('Falta el parámetro code');
  }

  console.log('📥 Code recibido:', code);

  // Ejecuta el script principal con el code recibido
  exec(`node index240925.js ${code}`, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Error al ejecutar index240925.js:', err.message);
      return res.status(500).send('Error interno al procesar el token');
    }

    console.log('📦 Resultado del intercambio:\n', stdout);
    res.send('✅ Code procesado y token solicitado');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook escuchando en http://localhost:${PORT}/hook`);
});
