import puppeteer from 'puppeteer';

export async function scrapeWithPuppeteer(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.__PRELOADED_STATE__);

    const data = await page.evaluate(() => window.__PRELOADED_STATE__.item);
    return {
      titulo: data?.title,
      precio: data?.price,
      moneda: data?.currency_id,
      ubicacion: data?.seller_address?.city?.name,
      descripcion: data?.description,
      imagenes: data?.pictures?.map(pic => pic.url) ?? []
    };
  } catch (error) {
    console.error("❌ Error en Puppeteer:", error.message);
    return null;
  } finally {
    await browser.close();
  }
}
