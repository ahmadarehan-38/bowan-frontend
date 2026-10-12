export function normalizeBrandColor(value, fallback) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) return fallback;

  const hex = value.slice(1);
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }

  if (hue < 65 || hue > 170 || saturation < 0.08) return value;

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const section = 270 / 60;
  const secondary = chroma * (1 - Math.abs((section % 2) - 1));
  const match = lightness - chroma / 2;
  const [red, green, blue] = [secondary, 0, chroma].map((channel) => Math.round((channel + match) * 255));

  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
