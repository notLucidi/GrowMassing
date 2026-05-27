import React, { useState, useEffect } from 'react';

// Cache in-memory: Menyimpan hasil API agar item yang sama tidak loading 2x
const imageCache = new Map<string, string>();

export default function ItemImage({ name, rarity, className }: { name: string, rarity: number, className?: string }) {
  const [imgUrl, setImgUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const isSeed = name.endsWith(' Seed');
  const baseName = isSeed ? name.replace(' Seed', '') : name;

  useEffect(() => {
    let isMounted = true;
    const formattedName = baseName.replace(/ /g, '_');

    // Cek apakah gambar sudah ada di Cache
    if (imageCache.has(formattedName)) {
      setImgUrl(imageCache.get(formattedName)!);
      return;
    }

    const fetchImage = async () => {
      try {
        // Menggunakan API Resmi MediaWiki Fandom (Aman dari blokir Cloudflare & mendukung CORS)
        const res = await fetch(`https://growtopia.fandom.com/api.php?action=query&titles=${encodeURIComponent(formattedName)}&prop=pageimages&format=json&pithumbsize=64&origin=*`);
        const data = await res.json();
        
        const pages = data.query?.pages;
        if (!pages) throw new Error("No page data");

        const pageId = Object.keys(pages)[0];
        
        // Fandom akan otomatis memberikan link "window-crop" jika item menggunakan Spritesheet
        if (pageId !== '-1' && pages[pageId].thumbnail) {
          const url = pages[pageId].thumbnail.source;
          imageCache.set(formattedName, url);
          if (isMounted) setImgUrl(url);
        } else {
          if (isMounted) setError(true);
        }
      } catch (err) {
        if (isMounted) setError(true);
      }
    };

    fetchImage();

    return () => { isMounted = false; };
  }, [baseName]);

  // UI Fallback: Inisial nama jika gambar tidak ada (misal: Dirt -> DI)
  const getInitials = (str: string) => {
    const words = str.split(/[\s-]/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  // UI Fallback: Warna sesuai Rarity
  const getFallbackStyle = (r: number) => {
    if (r >= 100) return 'bg-yellow-900/40 text-yellow-400 border-yellow-600/50';
    if (r >= 60) return 'bg-purple-900/40 text-purple-400 border-purple-600/50';
    if (r >= 20) return 'bg-blue-900/40 text-blue-400 border-blue-600/50';
    return 'bg-slate-800 text-slate-300 border-slate-600';
  };

  // 1. Tampilkan kotak Fallback Elegan jika Fandom tidak memiliki data
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

  // 2. Tampilkan efek loading berkedip selagi menunggu API Fandom membalas
  if (!imgUrl) {
    return <div className={`animate-pulse bg-slate-800 rounded-lg w-full h-full border border-slate-700 ${className}`}></div>;
  }

  // 3. Render gambar asli jika sukses
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
