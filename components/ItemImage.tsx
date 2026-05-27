import React from 'react';

export default function ItemImage({ itemID, name, className }: { itemID: number, name: string, className?: string }) {
  // 1. Tentukan apakah item adalah seed (ID Ganjil)
  const isSeed = itemID % 2 !== 0;
  
  // 2. Hitung index posisi pada grid (ID 0 & 1 = index 0, ID 2 & 3 = index 1, dst)
  const sheetIndex = Math.floor(itemID / 2);
  
  // 3. Asumsi jumlah kolom spritesheet Fandom adalah 32 (Lebar 1024px / 32px)
  // Jika gambar bergeser, ubah angka 32 ini sesuai jumlah item per baris pada gambarmu.
  const COLUMNS = 32; 
  const SPRITE_SIZE = 32;

  const col = sheetIndex % COLUMNS;
  const row = Math.floor(sheetIndex / COLUMNS);

  const xOffset = col * SPRITE_SIZE;
  const yOffset = row * SPRITE_SIZE;

  // Pilih file sumber
  const sheetUrl = isSeed ? '/SeedSprites.jpg' : '/ItemSprites.jpg';

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
        // imageRendering pixelated untuk memastikan sprite GT tetap tajam saat di-zoom
        imageRendering: 'pixelated', 
        // Skala menyesuaikan ukuran container (misal container w-10 h-10)
        backgroundSize: `${COLUMNS * SPRITE_SIZE}px auto` 
      }}
    />
  );
}
