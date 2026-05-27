import React from 'react';

export default function ItemImage({ itemID, name, className }: { itemID: number, name: string, className?: string }) {
  // 1. Sesuaikan dengan dimensi sprite kamu
  const COLUMNS = 66; // 2112 / 32 = 66
  const SPRITE_SIZE = 32;

  // 2. Hitung posisi koordinat
  const col = itemID % COLUMNS;
  const row = Math.floor(itemID / COLUMNS);

  const xOffset = col * SPRITE_SIZE;
  const yOffset = row * SPRITE_SIZE;

  // 3. Tentukan file (Ganjil = Seed, Genap = Block)
  // Berdasarkan catatanmu: ID 0=Blank, ID 1=Blank Seed, ID 2=Dirt, ID 3=Dirt Seed
  const sheetUrl = (itemID % 2 !== 0) ? '/SeedSprites.png' : '/ItemSprites.png';

  return (
    <div 
      className={className}
      title={name}
      style={{
        width: '32px',
        height: '32px',
        backgroundImage: `url('${sheetUrl}')`,
        backgroundPosition: `-${xOffset}px -${yOffset}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated', // Agar tetap tajam
        backgroundSize: '2112px 4096px' // Wajib didefinisikan agar background tidak terdistorsi
      }}
    />
  );
}
