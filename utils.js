export function extractItemId(url) {
  const match = url.match(/MLA-\d+/);
  return match ? match[0].replace("-", "") : null;
}