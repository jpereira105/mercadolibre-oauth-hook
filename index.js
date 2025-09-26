// en consola npm install express ejs  
import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.get('/dashboard', (req, res) => {
  try {
    const tokenData = JSON.parse(fs.readFileSync('./token.json', 'utf-8'));
    res.render('token', { token: tokenData });
  } catch (error) {
    res.status(500).send('Error al leer el token.');
  }
});

app.listen(PORT, () => {
  console.log(`📊 Dashboard corriendo en http://localhost:${PORT}/dashboard`);
});
