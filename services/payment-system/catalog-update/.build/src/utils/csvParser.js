export function parseCsv(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  const rows = lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim());
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i];
    });
    return obj;
  });

  return rows;
}
