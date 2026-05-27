import React, { useState } from 'react';

export default function ItemImage({ name, rarity, className }: { name: string, rarity: number, className?: string }) {
  const [error, setError] = useState<boolean>(false);

  const isSeed = name.endsWith(' Seed');
  const baseName = isSeed ? name.replace(' Seed', '') : name;
  
  // Arahkan ke API Route Next.js lokal
  const imgUrl = `/api/image?name=${encodeURIComponent(name)}`;

  // UI Fallback: Ekstraksi inisial 2 huruf (ex: Purple Block -> PB)
  const getInitials = (str: string) => {
    const words = str.split(/[\s-]/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return str.substring(0, 2).toUpperCase();
  };

  // UI Fallback: Warna background berbasis rarity
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
