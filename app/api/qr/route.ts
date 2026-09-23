import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('route_id') || 'RT-101';
    
    // Construct local deep-link URL to submission form with pre-selected route
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const targetUrl = `${protocol}://${host}/?route=${encodeURIComponent(routeId)}`;

    // Generate Data URL (PNG image)
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      route_id: routeId,
      targetUrl,
      qrDataUrl,
    });
  } catch (error) {
    console.error('QR Generation Error:', error);
    return NextResponse.json({ success: false, error: 'QR Code generation failed' }, { status: 500 });
  }
}
