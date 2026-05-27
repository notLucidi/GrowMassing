import React from 'react';

export default function ItemImage({ itemID, name, className }: { itemID: number, name: string, className?: string }) {
  // ID ganjil = Seed, ID genap = Item
  const isSeed = itemID % 2 !== 0;
  
  // Index sprite berdasarkan ID
  const sheetIndex = Math.floor(itemID / 2);
  
  // Konfigurasi berdasarkan spesifikasi file (2112px / 32px = 66 kolom)
  const COLUMNS = 66; 
  const SPRITE_SIZE = 32;

  const col = sheetIndex % COLUMNS;
  const row = Math.floor(sheetIndex / COLUMNS);

  const xOffset = col * SPRITE_SIZE;
  const yOffset = row * SPRITE_SIZE;

  const sheetUrl = isSeed ? '/SeedSprites.png' : '/ItemSprites.png';

  return (
    <div 
      className={className}
      title={name}
      style={{
        width: `${SPRITE_SIZE}px`,
        height: `${SPRITE_SIZE}px`,
        backgroundImage: `url('${sheetUrl}')`,
        backgroundPosition: `-${xOffset}px -${yOffset}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        // Menggunakan lebar total spritesheet agar backgroundSize akurat
        backgroundSize: `${COLUMNS * SPRITE_SIZE}px auto` 
      }}
    />
  );
}
