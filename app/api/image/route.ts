import { NextResponse } from 'next/server';

// Layer 1 Cache: In-Memory Map (Sangat cepat, hidup selama serverless function aktif)
const urlCache = new Map<string, string>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return new NextResponse('Name parameter is required', { status: 400 });
  }

  // Hilangkan " Seed" agar API mencari blok utamanya di Fandom
  const isSeed = name.endsWith(' Seed');
  const searchName = isSeed ? name.replace(' Seed', '') : name;
  const formattedName = searchName.replace(/ /g, '_');

  // Cek Layer 1 Cache
  if (urlCache.has(formattedName)) {
    return NextResponse.redirect(urlCache.get(formattedName)!, 302);
  }

  try {
    const wikiUrl = `https://growtopia.fandom.com/wiki/${formattedName}`;
    
    // Layer 2 Cache: Next.js Data Cache (Menyimpan respon HTML Fandom selama 24 jam)
    const response = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      next: { revalidate: 86400 } 
    });

    if (!response.ok) {
      return new NextResponse('Page not found on Fandom', { status: 404 });
    }

    const html = await response.text();
    
    // Ekstraksi og:image (Berisi URL crop spesifik Fandom seperti referensi yang diminta)
    const match = html.match(/<meta property="og:image" content="([^"]+)"/);

    if (match && match[1]) {
      const imageUrl = match[1];
      urlCache.set(formattedName, imageUrl); // Simpan ke Layer 1
      
      // Redirect browser langsung ke CDN Fandom
      return NextResponse.redirect(imageUrl, 302);
    }

    return new NextResponse('Image meta tag not found', { status: 404 });
  } catch (error) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
