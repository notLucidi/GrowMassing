import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
  }

  try {
    // 1. Format nama sesuai standar URL Wiki (Spasi menjadi Underscore)
    const formattedName = name.replace(/ /g, '_');
    const wikiUrl = `https://growtopia.fandom.com/wiki/${formattedName}`;

    // 2. Fetch HTML dari Wiki
    const response = await fetch(wikiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrowTools/1.0',
      },
      next: { revalidate: 86400 } // Cache hasil selama 1 hari (86400 detik) agar Vercel tidak lelah
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const html = await response.text();

    // 3. Gunakan Regex untuk mengekstrak meta image (Thumbnail Item di Fandom)
    // <meta property="og:image" content="https://static.wikia.nocookie.net/growtopia/images/...">
    const match = html.match(/<meta property="og:image" content="([^"]+)"/);

    if (match && match[1]) {
      // Hapus query shrink/revision agar mendapatkan resolusi asli yang jernih
      const imageUrl = match[1].split('/revision/')[0];
      
      // Kembalikan Response HTTP Proxy ke gambar target agar CORS React aman
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=604800, immutable', // Cache di browser user 1 minggu
        },
      });
    } else {
      return NextResponse.json({ error: 'Image not found in page' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
