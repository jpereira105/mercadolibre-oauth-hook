// tokenExchange.js
import axios from 'axios';
import fs from 'fs';

const code = process.argv[2]; // El código recibido desde el webhook

if (!code) {
  console.error('❌ No se recibió el código de autorización.');
  process.exit(1);
}

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://mercadolibre-oauth-hook.onrender.com/callback';

const exchangeToken = async () => {
  try {
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    console.log('✅ Token recibido:', access_token);

    // Guardar el token en archivo local (opcional)
    fs.writeFileSync('token.json', JSON.stringify(response.data, null, 2));

    console.log('📦 Token guardado en token.json');
  } catch (error) {
    console.error('❌ Error al intercambiar el token:', error.response?.data || error.message);
  }
};

exchangeToken();
