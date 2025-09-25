import puppeteer from "puppeteer";
import fetch from "node-fetch";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

// 🔐 Credenciales de tu app
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const CODE = process.argv[2]; // lo pasás al ejecutar el script

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("❌ Variables de entorno faltantes. Verificá tu archivo .env");
  process.exit(1);
}

if (!CODE) {
  console.error("❌ No se recibió el code. Ejecutá: node index240925.js TU_CODE");
  process.exit(1);
}

async function getAccessToken(code) {
  try {
    const { code_verifier } = JSON.parse(fs.readFileSync('verifier.json'));
    console.log("🔍 Usando code_verifier:", code_verifier);

    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier // ← este es el que faltaba
      })
    });

    const data = await res.json();

    if (data.access_token) {
      fs.writeFileSync('token.json', JSON.stringify(data, null, 2));
      console.log("✅ Token guardado en token.json");
    } else {
      console.error("❌ Error al obtener token:", data);
    }
  } catch (error) {
    console.error("❌ Error en la solicitud:", error.message);
  }
}

getAccessToken(CODE);

// 🧠 Extrae el ID del ítem desde la URL
function extractItemId(url) {
  const match = url.match(/MLA-\d+/);
  return match ? match[0].replace("-", "") : null;
}

// 📦 Carga token desde archivo
function loadToken() {
  if (fs.existsSync('token.json')) {
    return JSON.parse(fs.readFileSync('token.json'));
  }
  return null;
}

// 🔄 Refresca token si está vencido
async function refreshToken(refresh_token) {
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      REDIRECT_URI: REDIRECT_URI,
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

// 📡 Consulta la API con token
async function getDataFromAPI(itemId) {
  let tokenData = loadToken();
  if (!tokenData) {
    console.error("❌ No hay token guardado. Ejecutá el flujo OAuth primero.");
    return null;
  }

  let access_token = tokenData.access_token;
  const url = `https://api.mercadolibre.com/items/${itemId}`;
  const descriptionUrl = `${url}/description`;

  try {
    const [itemRes, descRes] = await Promise.all([
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      }),
      fetch(descriptionUrl, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      })
    ]);

    // Si el token expiró, intentamos refrescarlo
    if (itemRes.status === 401 || descRes.status === 401) {
      console.warn("⚠️ Token expirado. Intentando refrescar...");
      access_token = await refreshToken(tokenData.refresh_token);
      if (!access_token) return null;

      return await getDataFromAPI(itemId); // Reintenta con nuevo token
    }

    if (!itemRes.ok || !descRes.ok) {
      console.error(`❌ Error en API: ${itemRes.status} / ${descRes.status}`);
      return null;
    }

    const itemData = await itemRes.json();
    const descData = await descRes.json();

    return {
      titulo: itemData.title ?? "Sin título",
      precio: itemData.price ?? "Sin precio",
      moneda: itemData.currency_id ?? "Sin moneda",
      ubicacion: itemData.seller_address?.city?.name ?? "Sin ubicación",
      descripcion: descData.plain_text ?? "Sin descripción",
      imagenes: Array.isArray(itemData.pictures)
        ? itemData.pictures.map(pic => pic.url)
        : []
    };
  } catch (error) {
    console.error("❌ Error al consultar la API:", error.message);
    return null;
  }
}

// 🧪 Fallback con Puppeteer si la API falla
async function getApartamentData(apartamentLink) {
  const itemId = extractItemId(apartamentLink);
  if (!itemId) {
    console.error("❌ No se pudo extraer el item ID de la URL.");
    return;
  }

  const apiData = await getDataFromAPI(itemId);
  if (apiData) {
    console.log("📡 Datos desde la API:");
    console.log(apiData);
    return;
  }

  console.log("🔄 API falló, usando fallback desde Puppeteer...");

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  try {
    await page.goto(apartamentLink, { waitUntil: 'networkidle2' });

    await page.waitForFunction(() => {
      return typeof window.__PRELOADED_STATE__ !== 'undefined' &&
             Object.keys(window.__PRELOADED_STATE__).length > 0;
    }, { timeout: 90000 });

    const components = await page.evaluate(() => window.__PRELOADED_STATE__);
    console.log("🧠 Estado global desde Puppeteer:");
    console.log(JSON.stringify(components, null, 2));

    const fallbackData = {
      titulo: components?.item?.title ?? "Sin título",
      precio: components?.item?.price ?? "Sin precio",
      moneda: components?.item?.currency_id ?? "Sin moneda",
      ubicacion: components?.item?.seller_address?.city?.name ?? "Sin ubicación",
      descripcion: components?.item?.description ?? "Sin descripción",
      imagenes: components?.item?.pictures?.map(pic => pic.url) ?? []
    };

    console.log("📦 Datos desde fallback:");
    console.log(fallbackData);

  } catch (error) {
    console.error("❌ Error en Puppeteer:", error.message);
    await page.screenshot({ path: 'error_state.png' });
  } finally {
    await browser.close();
  }
}

// 🏠 URL del departamento a consultar
const apartamentToParsed =
  "https://departamento.mercadolibre.com.ar/MLA-1413050342-departamentos-semipisos-en-venta-a-estrenar-de-3-ambientes-en-recoleta-gran-categoria-_JM";

getApartamentData(apartamentToParsed);
