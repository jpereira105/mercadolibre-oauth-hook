import express from 'express';
import { exec } from 'child_process';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta que Mercado Libre usa como redirect_uri
app.get('/callback', (req, res) => {
  const authCode = req.query.code;

  if (!authCode) {
    return res.status(400).send('No se recibió el código de autorización.');
  }

  console.log('✅ Código recibido:', authCode);

  // Ejecutar el script de intercambio de token
  const scriptPath = path.resolve('./tokenExchange.js');
  const command = `node ${scriptPath} ${authCode}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error al ejecutar tokenExchange:', error);
      return res.status(500).send('Error al intercambiar el token.');
    }

    console.log('📦 STDOUT:', stdout);
    console.error('⚠️ STDERR:', stderr);
    res.send('Token intercambiado correctamente. Podés cerrar esta ventana.');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook escuchando en http://localhost:${PORT}/callback`);
});
