// en consola npm install express ejs  
import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Ruta principal del dashboard
app.get('/dashboard', (req, res) => {
  try {
    const tokenData = JSON.parse(fs.readFileSync('./token.json', 'utf-8'));
    res.render('token', { token: tokenData });
  } catch (error) {
    res.status(500).send('Error al leer el token.');
  }
});

// Ruta para refrescar el token
app.get('/refresh', async (req, res) => {
  try {
    const tokenData = JSON.parse(fs.readFileSync('./token.json', 'utf-8'));

    const response = await axios.post('https://api.mercadolibre.com/oauth/token', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: tokenData.refresh_token
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    fs.writeFileSync('token.json', JSON.stringify(response.data, null, 2));
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Error al refrescar el token:', error.response?.data || error.message);
    res.status(500).send('Error al refrescar el token.');
  }
});

// Escucha en el puerto
app.listen(PORT, () => {
  console.log(`📊 Dashboard corriendo en http://localhost:${PORT}/dashboard`);
});
