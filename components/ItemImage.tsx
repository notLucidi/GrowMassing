import React, { useState } from 'react';

export default function ItemImage({ name, className }: { name: string, className?: string }) {
  const [error, setError] = useState<boolean>(false);

  // 1. Deteksi apakah item adalah seed
  const isSeed = name.endsWith(' Seed');
  
  // 2. Hapus kata " Seed" untuk mencari gambar block-nya
  const searchName = isSeed ? name.replace(' Seed', '') : name;
  
  // 3. Format spasi menjadi underscore sesuai standar Fandom Wiki
  const formattedName = searchName.replace(/ /g, '_');

  // 4. Special:FilePath memaksa pengembalian file PNG resolusi asli
  const imgUrl = `https://growtopia.fandom.com/wiki/Special:FilePath/${encodeURIComponent(formattedName)}.png`;

  // UI Fallback jika gambar memang tidak pernah di-upload di Wiki (404)
  if (error) {
    return (
      <div className={`bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner ${className}`}>
        <span className="text-xl drop-shadow-md">{isSeed ? '🌱' : '📦'}</span>
      </div>
    );
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
