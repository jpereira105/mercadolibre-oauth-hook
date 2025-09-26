import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

export function loadToken() {
  if (fs.existsSync('token.json')) {
    return JSON.parse(fs.readFileSync('token.json'));
  }
  return null;
}

export async function refreshToken(refresh_token) {
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      refresh_token
    })
  });

  const data = await res.json();
  if (data.access_token) {
    fs.writeFileSync('token.json', JSON.stringify(data, null, 2));
    console.log('🔄 Token actualizado');
    return data.access_token;
  } else {
    console.error('❌ Error al refrescar token:', data);
    return null;
  }
}
