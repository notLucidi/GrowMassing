import React, { useState, useEffect } from 'react';

// Cache untuk menghindari hit API berkali-kali untuk item yang sama
const imageCache = new Map<string, string>();

export default function ItemImage({ name, rarity, className }: { name: string, rarity: number, className?: string }) {
  const [imgUrl, setImgUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const isSeed = name.endsWith(' Seed');
  // Hapus kata ' Seed' jika ada, agar mencari base block-nya
  const baseName = isSeed ? name.replace(' Seed', '') : name;

  useEffect(() => {
    let isMounted = true;
    
    // Fandom Wiki mengganti spasi menjadi underscore untuk format file
    const formattedName = baseName.replace(/ /g, '_');

    // Cek cache dulu
    if (imageCache.has(formattedName)) {
      setImgUrl(imageCache.get(formattedName)!);
      return;
    }

    const fetchImage = async () => {
      try {
        // Menggunakan MediaWiki API: prop=imageinfo&iiprop=url
        // Secara spesifik mencari 'File:Nama_Item.png'
        const apiUrl = `https://growtopia.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(formattedName)}.png&prop=imageinfo&iiprop=url&format=json&origin=*`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        const pages = data.query?.pages;
        if (!pages) throw new Error("No page data");

        const pageId = Object.keys(pages)[0];
        
        // Cek apakah halaman (file gambar) ditemukan
        if (pageId !== '-1' && pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
          // url ini adalah direct link ke gambar PNG-nya
          let url = pages[pageId].imageinfo[0].url;
          
          // Opsional: Biasanya wiki memiliki cache "/revision/..." pada URL-nya.
          // Membuang string setelah /revision/ biasanya mengembalikan gambar resolusi penuh (non-thumbnail).
          url = url.split('/revision/')[0];

          imageCache.set(formattedName, url);
          if (isMounted) setImgUrl(url);
        } else {
          // Jika file .png tidak ditemukan
          if (isMounted) setError(true);
        }
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
