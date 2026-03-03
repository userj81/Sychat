import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SychatBot/1.0)',
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch');
    }

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"[^>]*>/i);
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>/i);
    const ogSiteMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"[^>]*>/i);

    const preview = {
      title: titleMatch?.[1]?.trim() || new URL(url).hostname,
      description: descMatch?.[1]?.trim() || null,
      image: ogImageMatch?.[1]?.trim() || null,
      siteName: ogSiteMatch?.[1]?.trim() || new URL(url).hostname,
    };

    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { title: new URL(url).hostname, description: null, image: null, siteName: new URL(url).hostname },
      { status: 200 }
    );
  }
}
