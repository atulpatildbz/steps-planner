// Compact number: 3200 -> "3.2k", 4000 -> "4k", 920 -> "920".
export const fmtK = (n) => {
  const v = Math.round(Number(n) || 0);
  if (Math.abs(v) >= 1000) {
    const k = (v / 1000).toFixed(1).replace(/\.0$/, "");
    return `${k}k`;
  }
  return String(v);
};

// Signed compact: +1k / −1.2k
export const fmtSignedK = (n) => {
  const v = Math.round(Number(n) || 0);
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${fmtK(Math.abs(v))}`;
};
