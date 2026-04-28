import sharp from 'sharp';

export interface OgInput {
  title: string;
  date: Date;
}

function wrapTitle(title: string, maxChars: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const xmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => xmlEscapes[c]);
}

function formatDateUpper(date: Date): string {
  return date
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .toUpperCase();
}

function sizeForTitle(length: number): { fontSize: number; lineHeight: number; maxChars: number } {
  if (length <= 25) return { fontSize: 96, lineHeight: 108, maxChars: 18 };
  if (length <= 50) return { fontSize: 80, lineHeight: 92, maxChars: 22 };
  if (length <= 80) return { fontSize: 64, lineHeight: 74, maxChars: 28 };
  return { fontSize: 52, lineHeight: 62, maxChars: 35 };
}

export function buildOgSvg({ title, date }: OgInput): string {
  const { fontSize, lineHeight, maxChars } = sizeForTitle(title.length);
  const lines = wrapTitle(title, maxChars);
  const centerY = 305;
  const blockMid = ((lines.length - 1) * lineHeight) / 2;
  const firstBaseline = centerY - blockMid + fontSize * 0.3;
  const tspans = lines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#f4f1ea"/>
  <line x1="80" y1="120" x2="200" y2="120" stroke="#7a9b89" stroke-width="1"/>
  <text x="80" y="${firstBaseline}" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${fontSize}" font-weight="300" fill="#1a3a2e" letter-spacing="-2">${tspans}</text>
  <line x1="80" y1="490" x2="200" y2="490" stroke="#7a9b89" stroke-width="1"/>
  <text x="80" y="535" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, monospace" font-size="22" fill="#4a6b5c" letter-spacing="3">${escapeXml(formatDateUpper(date))}</text>
  <text x="80" y="575" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, monospace" font-size="20" fill="#7a9b89">josnun.com</text>
</svg>`;
}

export async function svgToPng(
  svg: string | Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  const input = typeof svg === 'string' ? Buffer.from(svg) : svg;
  return sharp(input).resize(width, height).png().toBuffer();
}

export function pngResponse(png: Buffer): Response {
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
}
