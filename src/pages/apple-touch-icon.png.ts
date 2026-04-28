import type { APIRoute } from 'astro';
import svg from '../assets/og/apple-touch-icon.svg?raw';
import { pngResponse, svgToPng } from '../utils/og';

export const GET: APIRoute = async () => pngResponse(await svgToPng(svg, 180, 180));
