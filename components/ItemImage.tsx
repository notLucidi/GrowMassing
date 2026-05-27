import React, { useState, useEffect } from 'react';

// Cache di memori (Map) agar item yang sama tidak di-fetch berulang kali
const imageCache = new Map<string, string>();

export default function ItemImage({ name, className }: { name: string, className?: string }) {
  const [imgUrl, setImgUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    // Format nama: Hapus " Seed" dan ganti spasi jadi underscore
    const searchName = name.endsWith(' Seed') ? name.replace(' Seed', '') : name;
    const formattedName = searchName.replace(/ /g, '_');

    // Cek Cache
    if (imageCache.has(formattedName)) {
      setImgUrl(imageCache.get(formattedName)!);
      return;
    }

    const fetchImage = async () => {
      try {
        // Fetch langsung ke MediaWiki API dengan CORS bypass (origin=*)
        const res = await fetch(`https://growtopia.fandom.com/api.php?action=query&titles=File:${formattedName}.png&prop=imageinfo&iiprop=url&format=json&origin=*`);
        const data = await res.json();
        
        const pages = data.query.pages;
        const pageIds = Object.keys(pages);
        
        if (pageIds[0] !== '-1' && pages[pageIds[0]].imageinfo) {
          // Ambil URL murni tanpa resize dari fandom
          const url = pages[pageIds[0]].imageinfo[0].url.split('/revision')[0];
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
  }, [name]);

  if (error) {
    return <div className={`bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 ${className}`}>?</div>;
  }

  if (!imgUrl) {
    return <div className={`bg-slate-800 animate-pulse rounded-md ${className}`}></div>;
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
