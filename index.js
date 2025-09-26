// en consola npm install express ejs  
import { extractItemId } from './utils.js';
import { getItemData } from './apiClient.js';
import { scrapeWithPuppeteer } from './puppeteerFallback.js';

const url = "https://departamento.mercadolibre.com.ar/MLA-1413050342-departamentos-semipisos-en-venta-a-estrenar-de-3-ambientes-en-recoleta-gran-categoria-_JM";
const itemId = extractItemId(url);

(async () => {
  const apiData = await getItemData(itemId);
  if (apiData) {
    console.log("📡 Datos desde la API:", apiData);
    return;
  }

  console.log("🔄 API falló, usando fallback...");
  const fallbackData = await scrapeWithPuppeteer(url);
  console.log("📦 Datos desde fallback:", fallbackData);
})();
