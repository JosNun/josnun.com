import type { APIRoute } from 'astro';
import svg from '../assets/og/og-default.svg?raw';
import { pngResponse, svgToPng } from '../utils/og';

export const GET: APIRoute = async () => pngResponse(await svgToPng(svg, 1200, 630));
