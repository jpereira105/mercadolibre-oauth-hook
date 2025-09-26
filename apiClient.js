import fetch from 'node-fetch';
import { loadToken, refreshToken } from './tokenManager.js';

export async function getItemData(itemId) {
  let tokenData = loadToken();
  if (!tokenData) {
    console.error("❌ No hay token guardado.");
    return null;
  }

  let access_token = tokenData.access_token;
  const url = `https://api.mercadolibre.com/items/${itemId}`;
  const descriptionUrl = `${url}/description`;

  const [itemRes, descRes] = await Promise.all([
    fetch(url, { headers: { Authorization: `Bearer ${access_token}` } }),
    fetch(descriptionUrl, { headers: { Authorization: `Bearer ${access_token}` } })
  ]);

  if (itemRes.status === 401 || descRes.status === 401) {
    console.warn("⚠️ Token expirado. Intentando refrescar...");
    access_token = await refreshToken(tokenData.refresh_token);
    if (!access_token) return null;
    return await getItemData(itemId); // Reintenta
  }

  if (!itemRes.ok || !descRes.ok) {
    console.error(`❌ Error en API: ${itemRes.status} / ${descRes.status}`);
    return null;
  }

  const itemData = await itemRes.json();
  const descData = await descRes.json();

  return {
    titulo: itemData.title,
    precio: itemData.price,
    moneda: itemData.currency_id,
    ubicacion: itemData.seller_address?.city?.name,
    descripcion: descData.plain_text,
    imagenes: itemData.pictures?.map(pic => pic.url) ?? []
  };
}