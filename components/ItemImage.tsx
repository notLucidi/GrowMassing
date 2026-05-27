import React from 'react';

export default function ItemImage({ 
  itemID, 
  name, 
  className, 
  customOffset 
}: { 
  itemID: number, 
  name: string, 
  className?: string,
  // Tambahkan opsional customOffset untuk override jika ID tidak sinkron dengan grid
  customOffset?: { x: number, y: number } 
}) {
  const isSeed = itemID % 2 !== 0;
  const sheetIndex = Math.floor(itemID / 2);
  
  const COLUMNS = 66; 
  const SPRITE_SIZE = 32;

  // Jika customOffset diberikan, gunakan itu. Jika tidak, pakai kalkulasi grid.
  const col = customOffset ? customOffset.x / SPRITE_SIZE : sheetIndex % COLUMNS;
  const row = customOffset ? customOffset.y / SPRITE_SIZE : Math.floor(sheetIndex / COLUMNS);

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
        backgroundSize: `${COLUMNS * SPRITE_SIZE}px auto` 
      }}
    />
  );
}
