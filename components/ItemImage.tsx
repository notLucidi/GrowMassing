import React, { useState, useEffect } from 'react';

const imageCache = new Map<string, string>();

export default function ItemImage({ name, rarity, className }: { name: string, rarity: number, className?: string }) {
  const [imgUrl, setImgUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const isSeed = name.endsWith(' Seed');
  const baseName = isSeed ? name.replace(' Seed', '') : name;

  useEffect(() => {
    let isMounted = true;
    const formattedName = baseName.replace(/ /g, '_');

    if (imageCache.has(formattedName)) {
      setImgUrl(imageCache.get(formattedName)!);
      return;
    }

    const fetchImage = async () => {
      try {
        // 1. Ambil HTML Halaman via action=parse (Aman dari CORS & Cloudflare)
        const res = await fetch(`https://growtopia.fandom.com/api.php?action=parse&page=${encodeURIComponent(formattedName)}&prop=text&format=json&origin=*`);
        const data = await res.json();
        
        if (!data.parse || !data.parse.text) throw new Error("Page not found");

        const htmlString = data.parse.text['*'];

        // 2. Gunakan DOMParser bawaan browser sebagai pengganti Cheerio (load)
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // 3. Targetkan elemen persis seperti script GitHub ($("div.card-header .growsprite > img"))
        const imgEl = doc.querySelector('.card-header .growsprite img') || doc.querySelector('.growsprite img');

        if (imgEl) {
          // Ambil atribut src (Kadang img menggunakan data-src untuk lazy loading)
          let src = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');
          
          if (src) {
            // 4. Replace format seperti script GitHub
            src = src.replace('webp', 'png');
            
            imageCache.set(formattedName, src);
            if (isMounted) setImgUrl(src);
            return;
          }
        }
        
        if (isMounted) setError(true);
      } catch (err) {
        if (isMounted) setError(true);
      }
    };

    fetchImage();

    return () => { isMounted = false; };
  }, [baseName]);

  const getInitials = (str: string) => {
    const words = str.split(/[\s-]/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  const getFallbackStyle = (r: number) => {
    if (r >= 100) return 'bg-yellow-900/40 text-yellow-400 border-yellow-600/50';
    if (r >= 60) return 'bg-purple-900/40 text-purple-400 border-purple-600/50';
    if (r >= 20) return 'bg-blue-900/40 text-blue-400 border-blue-600/50';
    return 'bg-slate-800 text-slate-300 border-slate-600';
  };

  if (error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center rounded-lg border shadow-inner w-full h-full ${getFallbackStyle(rarity)} ${className}`} 
        title={name}
      >
        <span className="font-extrabold text-[12px] tracking-tighter leading-none mt-0.5">
          {getInitials(baseName)}
        </span>
        {isSeed && <span className="text-[8px] leading-none mt-0.5" title="Seed">🌱</span>}
      </div>
    );
  }

  if (!imgUrl) {
    return <div className={`animate-pulse bg-slate-800 rounded-lg w-full h-full border border-slate-700 ${className}`}></div>;
  }

  return (
    <img 
      src={imgUrl} 
      alt={name} 
      className={className} 
      loading="lazy" 
      onError={() => setError(true)} 
    />
  );
}
