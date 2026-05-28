'use client';

import React, { useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Background, Controls, Handle, Position,
  Node, Edge, useNodesState, useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore, ProjectState } from '../store/useStore';
import ItemImage from './ItemImage';
import {
  Check, Hammer, Leaf, Package, TreePine, Wheat, 
  BarChart3, Settings2, Gem, Save
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// CUSTOM STYLES
// ──────────────────────────────────────────────────────────────────────────────
const INJECTED_CSS = `
  .glass-panel {
    background: rgba(9, 9, 11, 0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .glow-purple { box-shadow: 0 0 24px rgba(168, 85, 247, 0.15); }
  .glow-emerald { box-shadow: 0 0 24px rgba(16, 185, 129, 0.15); }
  
  .mobile-tabbar { display: none; }
  @media (max-width: 768px) {
    .mobile-tabbar {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(9, 9, 11, 0.95); backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255,255,255,0.05); z-index: 50;
      padding-bottom: env(safe-area-inset-bottom, 12px);
    }
    .mob-tab {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 12px 0; font-size: 10px; color: #71717a; transition: all 0.2s; font-weight: 600;
    }
    .mob-tab.active { color: #a855f7; }
    .mob-tab.active svg { transform: scale(1.1); color: #a855f7; }
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
`;

// ──────────────────────────────────────────────────────────────────────────────
// DATA & HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const FARMABLE_NAMES = new Set([
  "air duct", "alien block", "amber glass", "aqua block", "autumn leaf block", "autumn viney block",
  "autumn viney wallpaper", "barn block", "black block", "blackrock wall", "blue block",
  "blue star wallpaper", "blue royal wallpaper", "boulder", "bountiful bamboo background",
  "bountiful bamboo ladder", "bountiful bamboo platform", "bountiful bamboo spikes",
  "bountiful climbing hydrangea lattice", "bountiful corpse flower", "bountiful flowering garland",
  "bountiful flowering lattice", "bountiful growtopian-eating looming plant", "bountiful jungle temple",
  "bountiful jungle temple background", "bountiful jungle temple door", "bountiful jungle temple pillar",
  "bountiful lattice fence", "bountiful monkshood", "bountiful white doll's eyes", "bricks",
  "brick background", "brown block", "cave background", "cave dirt", "chandelier", "checker wallpaper",
  "clouds background", "cobblestone block", "copper plumbing", "coral", "dark aqua block",
  "dark blue block", "dark brown block", "dark cave background", "dark green block", "dark grey block",
  "dark orange block", "dark purple block", "dark red block", "dark yellow block", "death spikes",
  "deep rock", "deep sand", "dirt", "director's chair", "dwarven background", "dwarven wall",
  "egg shell spikes", "evil brick background", "evil bricks", "fertile soil block", "fish tank",
  "flowery wallpaper", "frozen stone cliffs", "garbage", "glacier background", "glass pane",
  "golden block", "grass", "green block", "grey block", "grimstone", "hanging guytrap",
  "heartcastle stone", "heartcastle stone background", "high tech block", "ice", "igneous rock",
  "ion conduit", "ladder", "laser grid", "lattice background", "lava", "lava cube", "lava rock",
  "leaf block", "lovewillow's lace", "lovewillow", "magic bell", "magic infused stone",
  "magic infused stone background", "marble block", "mars rock", "martian soil", "martian tree",
  "monochromatic dirt", "monochromatic cave background", "monochromatic lava", "mossy cobblestone block",
  "ocean rock", "orange block", "orange stuff", "pastel aqua block", "pastel aqua flower block",
  "pastel blue block", "pastel blue flower block", "pastel bunny block", "pastel bricks",
  "pastel checkered wallpaper", "pastel green block", "pastel green flower block", "pastel mondrian block",
  "pastel orange block", "pastel orange flower block", "pastel pink block", "pastel pink flower block",
  "pastel purple block", "pastel purple flower block", "pastel yellow block", "pastel yellow flower block",
  "pencil", "pepper tree", "pinball bumper", "purple block", "purple stuff", "red block", "red bricks",
  "red royal wallpaper", "red wood wall", "rice", "rock", "rock background", "rock platform",
  "roshambo block", "sand", "sandstone wall", "sheet music: blank", "sheet music: bass note",
  "sheet music: drums", "sheet music: electric guitar", "sheet music: flat bass", "sheet music: flat piano",
  "sheet music: flat sax", "sheet music: flute note", "sheet music: lyre note", "sheet music: piano note",
  "sheet music: sax note", "sheet music: sharp bass", "sheet music: sharp piano", "sheet music: sharp sax",
  "sheet music: spanish guitar note", "sheet music: repeat begin", "sheet music: repeat end",
  "sheet music: violin note", "sorcerer stone", "space connector", "space dirt", "space dirt background",
  "space junk background", "space junk dirt", "starship floor tile", "starship floor grill",
  "starship light wall", "starship wall", "steam tubes", "steel block", "stone wall", "stripey wallpaper",
  "sugar cane", "surgical block", "surgical background", "table lamp", "tangram block", "texas limestone",
  "treasure chest", "venus guytrap", "viney block", "viney wallpaper", "wall like an egyptian",
  "weeping willow branch", "weeping willow foliage", "wheat", "white block", "window", "wood block",
  "wooden background", "wooden platform", "wooden window", "writing desk", "xenoid block", "yellow block"
]);

function isFarmable(item: any) {
  if (!item || !item.name) return false;
  let baseName = item.name.toLowerCase().replace(' seed', '').trim();
  if (FARMABLE_NAMES.has(baseName)) return true;
  if (baseName.startsWith('tangram block')) return true;
  return false;
}

const TREE_MAX_DROPS: Record<number, number> = Object.fromEntries(
  '2|16,4|16,10|8,14|16,16|16,52|16,54|8,56|8,58|8,100|8,102|8,104|12,116|16,118|8,162|8,164|8,166|8,168|8,170|8,172|8,174|8,176|8,178|8,180|8,182|8,184|8,186|8,198|8,200|8,248|8,260|8,284|8,324|8,336|12,340|8,378|8,380|8,412|8,414|8,416|8,418|8,420|8,422|8,424|8,426|8,432|8,434|8,436|8,440|8,442|16,454|8,460|8,510|8,512|8,514|8,516|8,518|8,520|8,522|8,526|8,554|8,596|8,612|8,620|8,626|8,628|8,630|8,632|8,634|8,636|8,638|8,640|8,642|8,644|8,646|8,648|8,654|8,682|8,668|8,832|8,850|8,856|8,880|8,884|8,888|8,944|8,954|8,1132|8,1134|8,1138|8,1154|8,1258|8,1260|8,1262|8,1264|8,1266|8,1268|8,1270|8,1300|8,1324|8,1498|8,1500|8,1536|8,1538|8,1554|8,1556|8,1558|8,1560|8,1562|8,1564|8,1566|8,1630|16,1654|8,1786|1,1787|1,1788|1,1789|1,1790|1,2008|8,2012|8,2014|8,2016|8,2020|8,2022|8,2024|8,2026|8,2028|8,2034|1,2035|1,2036|1,2037|1,2070|8,2786|8,2788|8,2790|8,2796|8,2808|8,2988|8,2990|8,3004|8,3080|8,3082|8,3084|8,3260|8,3472|8,3520|8,3556|8,3564|8,3838|8,3930|8,4308|8,4310|8,4312|8,4314|8,4316|8,4318|8,4490|1,4491|1,4584|8,4634|8,4636|8,4638|8,4640|8,4642|8,5666|8,5726|8,5728|8,5730|8,5990|8,6030|8,6032|8,6034|8,6386|8,6388|8,6542|8,6544|8,6808|8,6810|8,6812|8'
    .split(',')
    .map((s) => { const [k, v] = s.split('|'); return [Number(k), Number(v)]; })
);

const RARITY_TABLE: Record<number, number> = {
  1: 22, 5: 44, 10: 71, 20: 125, 25: 153, 30: 174, 40: 269, 50: 378,
  60: 501, 70: 638, 75: 711, 80: 788, 90: 951, 100: 1128
};

function getGemsPer100(rarity: number) {
  const keys = Object.keys(RARITY_TABLE).map(Number).sort((a,b)=>a-b);
  if (RARITY_TABLE[rarity]) return RARITY_TABLE[rarity];
  let lower = keys[0], upper = keys[keys.length-1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (rarity > keys[i] && rarity < keys[i+1]) { lower = keys[i]; upper = keys[i+1]; break; }
  }
  const ratio = (rarity - lower) / (upper - lower);
  return RARITY_TABLE[lower] + ratio * (RARITY_TABLE[upper] - RARITY_TABLE[lower]);
}

function fmt(n: number) { return n >= 1000 ? n.toLocaleString() : String(n); }

// ──────────────────────────────────────────────────────────────────────────────
// AUTO-CORRECTION & SECURE RECIPE LOOKUP
// ──────────────────────────────────────────────────────────────────────────────
function getCorrectedRecipe(id: number, itemsData: Record<number, any>, recipesData: Record<number, [number, number]>) {
  const item = itemsData[id];
  const isSeedItem = item ? item.name.toLowerCase().endsWith('seed') : false;
  
  let recipe = recipesData[id];
  if (!recipe && isSeedItem) {
    recipe = recipesData[id - 1];
  }
  
  if (recipe) {
    let [i1, i2] = recipe;
    
    if (item && (item.name.toLowerCase().includes('pastel') || item.name.toLowerCase().includes('paste '))) {
      const magicEggObj = Object.values(itemsData).find((i: any) => i.name.toLowerCase() === 'magic egg');
      const magicEggId = magicEggObj ? magicEggObj.itemID : 716;
      
      if (i1 === 610 || i1 === 611) i1 = magicEggId;
      if (i2 === 610 || i2 === 611) i2 = magicEggId;
    }
    
    return [i1, i2] as [number, number];
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// TREE GENERATION
// ──────────────────────────────────────────────────────────────────────────────
const X_GAP = 340;
const Y_GAP = 240;

function generateTree(
  project: ProjectState, recipesData: Record<number, [number, number]>, itemsData: Record<number, any>
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function traverse(id: number, depth: number, x: number, y: number, parentUid: string | null, direction: 'L' | 'R' | null, amountNeeded: number): number {
    const recipe = getCorrectedRecipe(id, itemsData, recipesData);
    const isBase = !recipe;
    const isTruncated = !!recipe && depth >= project.maxDepth;
    const uid = parentUid ? `${parentUid}-${direction}-${id}` : `root-${id}`;
    const stock = project.currentStock[id] ?? 0;
    const actualNeeded = Math.max(0, amountNeeded - stock);
    const item = itemsData[id] ?? { name: `#${id}`, rarity: 0, itemID: id, growTime: 0, breakHits: 4 };

    const data = { id, uid, depth, isBase, isTruncated, amountNeeded, actualNeeded, stock, item, farmable: isFarmable(item) };

    let leftW = 0, rightW = 0;
    if (!isBase && !isTruncated) {
      const [i1, i2] = recipe;
      const splicesReq = Math.ceil(actualNeeded / project.seedReturnRate);
      leftW  = traverse(i1, depth + 1, x, y + Y_GAP, uid, 'L', splicesReq);
      rightW = traverse(i2, depth + 1, x + leftW * X_GAP, y + Y_GAP, uid, 'R', splicesReq);
      const edgeStyle = { stroke: '#3f3f46', strokeWidth: 2 };
      edges.push({ id: `e-${uid}-L`, source: uid, target: `${uid}-L-${i1}`, animated: false, style: edgeStyle });
      edges.push({ id: `e-${uid}-R`, source: uid, target: `${uid}-R-${i2}`, animated: false, style: edgeStyle });
    }

    const totalW = isBase || isTruncated ? 1 : leftW + rightW;
    const finalX = isBase || isTruncated ? x : x + (leftW * X_GAP) / 2 - X_GAP / 4;

    nodes.push({ id: uid, position: { x: finalX, y }, data, type: 'gm_node' });
    return totalW;
  }

  traverse(project.targetId, 0, 0, 0, null, null, project.targetAmount);
  return { nodes, edges };
}

function getBaseRequirements(targetId: number, targetAmount: number, maxDepth: number, recipesData: Record<number, [number, number]>, seedReturnRate: number, itemsData: Record<number, any>) {
  const req: Record<number, number> = {};
  function walk(id: number, depth: number, amount: number) {
    const recipe = getCorrectedRecipe(id, itemsData, recipesData);
    if (!recipe || depth >= maxDepth) { req[id] = (req[id] ?? 0) + amount; return; }
    const [i1, i2] = recipe;
    const splices = Math.ceil(amount / seedReturnRate);
    walk(i1, depth + 1, splices); walk(i2, depth + 1, splices);
  }
  walk(targetId, 0, targetAmount);
  return req;
}

function countSplices(targetId: number, targetAmount: number, maxDepth: number, recipesData: Record<number, [number, number]>, seedReturnRate: number, itemsData: Record<number, any>) {
  let total = 0;
  function walk(id: number, depth: number, amount: number) {
    const recipe = getCorrectedRecipe(id, itemsData, recipesData);
    if (!recipe || depth >= maxDepth) return;
    total += Math.ceil(amount / seedReturnRate);
    const [i1, i2] = recipe;
    const splices = Math.ceil(amount / seedReturnRate);
    walk(i1, depth + 1, splices); walk(i2, depth + 1, splices);
  }
  walk(targetId, 0, targetAmount);
  return total;
}

// ──────────────────────────────────────────────────────────────────────────────
// CUSTOM NODE UI
// ──────────────────────────────────────────────────────────────────────────────
const CustomNode = React.memo(({ data }: { data: any }) => {
  const { toggleNodeDone, updateStock, activeProjectId, projects } = useStore();
  const project = projects.find((p) => p.id === activeProjectId);
  const isDone = !!project?.doneNodes[data.uid];

  const pct = data.amountNeeded > 0 ? Math.min(100, (data.stock / data.amountNeeded) * 100) : 100;
  const deficit = data.actualNeeded;
  const isRoot = data.depth === 0;
  
  const borderColor = isRoot ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : data.isBase ? 'border-emerald-500/50' : 'border-zinc-700';
  const bgColor = isRoot ? 'bg-zinc-950/95' : 'bg-zinc-900/90';

  return (
    <div className={`relative w-[280px] p-4 rounded-2xl backdrop-blur-md transition-all duration-300 border ${borderColor} ${bgColor} ${isDone ? 'opacity-50 grayscale-[50%]' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-500 !border-none !w-8 !h-1.5 !rounded-full !-top-1" />

      <div className="flex gap-3 items-center mb-4">
         <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
           <ItemImage itemID={data.id} name={data.item.name} rarity={data.item.rarity} className="w-8 h-8 object-contain" />
         </div>
         <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-sm truncate ${isDone ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>{data.item.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">R{data.item.rarity}</span>
               {data.farmable ? (
                 <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Farmable</span>
               ) : (
                 <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">Seed Loss</span>
               )}
            </div>
         </div>
         <button onClick={() => activeProjectId && toggleNodeDone(activeProjectId, data.uid)} 
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-700 text-transparent hover:border-emerald-500 hover:text-emerald-500'}`}>
           <Check size={14} strokeWidth={3} />
         </button>
      </div>

      <div className="space-y-3">
         <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-semibold tracking-wider">
               <span>PROGRESS</span>
               <span className={pct >= 100 ? 'text-emerald-400' : 'text-purple-400'}>{pct.toFixed(0)}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-purple-500 glow-purple'}`} style={{ width: `${pct}%` }} />
            </div>
         </div>

         <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950/50 rounded-lg p-2 text-center border border-zinc-800/50">
               <div className="text-[9px] text-zinc-500 uppercase tracking-wide font-bold">Need</div>
               <div className="text-xs font-mono font-bold text-zinc-200">{fmt(data.amountNeeded)}</div>
            </div>
            <div className="bg-zinc-950/50 rounded-lg p-2 text-center border border-zinc-800/50">
               <div className="text-[9px] text-zinc-500 uppercase tracking-wide font-bold">Stock</div>
               <div className="text-xs font-mono font-bold text-emerald-400">{fmt(data.stock)}</div>
            </div>
            <div className="bg-zinc-950/50 rounded-lg p-2 text-center border border-zinc-800/50">
               <div className="text-[9px] text-zinc-500 uppercase tracking-wide font-bold">Deficit</div>
               <div className="text-xs font-mono font-bold text-red-400">{fmt(deficit)}</div>
            </div>
         </div>

         <div className="flex items-center gap-2 bg-zinc-950 rounded-lg px-3 py-2 border border-zinc-800 focus-within:border-purple-500/50 transition-colors">
            <Package size={14} className="text-purple-400 shrink-0" />
            <input type="number" min={0} value={data.stock || ''} onChange={(e) => activeProjectId && updateStock(activeProjectId, String(data.id), Number(e.target.value))} 
              placeholder="Update stock..." className="bg-transparent w-full outline-none text-xs text-zinc-200 font-mono" />
         </div>
      </div>

      {data.isTruncated && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black px-3 py-1 rounded-full bg-red-950 border border-red-900 text-red-400 whitespace-nowrap shadow-lg">
          MAX DEPTH LIMIT
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-500 !border-none !w-8 !h-1.5 !rounded-full !-bottom-1" />
    </div>
  );
});
CustomNode.displayName = 'CustomNode';
const nodeTypes = { gm_node: CustomNode };

// ──────────────────────────────────────────────────────────────────────────────
// TAB: STOCK
// ──────────────────────────────────────────────────────────────────────────────
function StockTab({ project, itemsData, recipesData }: any) {
  const requirements = useMemo(() => getBaseRequirements(project.targetId, project.targetAmount, project.maxDepth, recipesData, project.seedReturnRate, itemsData), [project, recipesData, itemsData]);
  const { updateStock } = useStore();

  const sorted = useMemo(() => Object.entries(requirements).map(([id, total]) => {
      const itemId = Number(id);
      const item = itemsData[itemId] ?? { name: `#${itemId}`, rarity: 0, growTime: 0, breakHits: 4 };
      const stock = project.currentStock[itemId] ?? 0;
      const deficit = Math.max(0, (total as number) - stock);
      return { itemId, item, total: total as number, stock, deficit };
    }).sort((a, b) => b.deficit - a.deficit), [requirements, project.currentStock, itemsData]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto flex flex-col gap-4 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-purple-400 font-mono">{fmt(sorted.reduce((s, r) => s + r.total, 0))}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">Total Needed</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-emerald-400 font-mono">{fmt(sorted.reduce((s, r) => s + r.stock, 0))}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">Total Stock</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center glow-purple">
          <span className="text-2xl font-black text-red-400 font-mono">{fmt(sorted.reduce((s, r) => s + r.deficit, 0))}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">Total Deficit</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map(({ itemId, item, total, stock, deficit }) => {
          const pct = total > 0 ? Math.min(100, (stock / total) * 100) : 100;
          return (
            <div key={itemId} className="flex flex-col md:flex-row md:items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-4 w-full md:w-auto md:flex-1">
                 <div className="w-10 h-10 shrink-0 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden">
                   <ItemImage itemID={itemId} name={item.name} rarity={item.rarity} className="w-7 h-7 object-contain" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="text-sm font-bold text-zinc-100 truncate">{item.name}</div>
                   <div className="flex items-center gap-2 mt-1.5">
                     <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex-1">
                       <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${pct}%`}} />
                     </div>
                     <span className="text-[9px] font-mono text-zinc-400">{pct.toFixed(0)}%</span>
                   </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                 <div className="text-center md:text-right bg-zinc-950/50 md:bg-transparent rounded-lg p-2 md:p-0 border md:border-none border-zinc-800">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold">Need</div>
                   <div className="text-xs font-mono font-bold text-zinc-300">{fmt(total)}</div>
                 </div>
                 <div className="text-center md:text-right bg-zinc-950/50 md:bg-transparent rounded-lg p-2 md:p-0 border md:border-none border-zinc-800">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold">Stock</div>
                   <div className="text-xs font-mono font-bold text-emerald-400">{fmt(stock)}</div>
                 </div>
                 <div className="text-center md:text-right bg-zinc-950/50 md:bg-transparent rounded-lg p-2 md:p-0 border md:border-none border-zinc-800">
                   <div className="text-[9px] text-zinc-500 uppercase font-bold">Deficit</div>
                   <div className="text-xs font-mono font-bold text-red-400">{fmt(deficit)}</div>
                 </div>
              </div>

              <div className="w-full md:w-36 mt-2 md:mt-0 shrink-0">
                 <div className="flex items-center gap-2 bg-zinc-950 rounded-lg px-3 py-2 border border-zinc-700 focus-within:border-purple-500 transition-colors">
                    <Package size={14} className="text-zinc-500" />
                    <input type="number" min={0} value={stock || ''} onChange={(e) => updateStock(project.id, String(itemId), Number(e.target.value))} 
                      className="bg-transparent w-full outline-none text-xs text-zinc-200 font-mono" placeholder="0" />
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB: HARVEST
// ──────────────────────────────────────────────────────────────────────────────
const Toggle = ({ label, field, value, disabled = false, project, updateHarvestSettings }: any) => (
  <label className={`flex items-center justify-between p-3 rounded-lg border border-transparent transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800/50 hover:border-zinc-800 cursor-pointer'}`}>
    <span className="text-sm font-semibold text-zinc-300">{label}</span>
    <input type="checkbox" disabled={disabled} checked={value} onChange={(e) => updateHarvestSettings(project.id, { [field]: e.target.checked })} 
      className="w-5 h-5 accent-purple-500 rounded bg-zinc-900 border-zinc-700 cursor-pointer" />
  </label>
);

function HarvestTab({ project, itemsData }: any) {
  const { updateHarvestSettings } = useStore();
  const hs = project.harvestSettings;
  const [searchQ, setSearchQ] = useState('');
  const [showDrop, setShowDrop] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQ) return [];
    return Object.values(itemsData as Record<number, any>).filter((it: any) => it.name.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8);
  }, [searchQ, itemsData]);

  const targetItem = hs.harvestTargetId ? itemsData[hs.harvestTargetId] : null;

  const calcResult = useMemo(() => {
    if (!hs.numTrees || !hs.harvestTargetId || !targetItem) return null;
    
    const isFarm = isFarmable(targetItem);
    const baseFruit = isFarm ? 4 : 2;
    
    let harvestMod = 0;
    if (hs.hos && hs.fuel) harvestMod += 0.10;
    if (hs.dcs) harvestMod += 0.02;
    
    const avgFruitFinal = baseFruit * (1 + harvestMod);
    const totalBlocksHarvested = Math.floor(hs.numTrees * avgFruitFinal);
    
    let breakMod = 0;
    if (hs.ancesBlue) breakMod += 0.10; 
    if (hs.builder) breakMod += 0.03;
    
    const totalBlocksBroken = Math.floor(totalBlocksHarvested * (1 + breakMod));
    
    const seedsGained = Math.floor(totalBlocksBroken * 0.2727);
    const seedProfit = seedsGained - hs.numTrees;
    
    const gemsPer100 = getGemsPer100(targetItem.rarity || 1);
    const baseGems = (totalBlocksBroken / 100) * gemsPer100;
    
    let gemMod = 0;
    if (hs.ancesRed) gemMod += 0.05;
    if (hs.gemini) gemMod += 0.05;
    if (hs.farmer) gemMod += 0.05;
    
    const totalGems = Math.round(baseGems * (1 + gemMod));

    return { 
      avgFruitFinal: avgFruitFinal.toFixed(2), 
      totalBlocks: totalBlocksHarvested, 
      totalBlocksBroken,
      seedsGained,
      seedProfit,
      totalGems 
    };
  }, [hs, targetItem]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-6 pb-24">
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Leaf size={14} className="text-emerald-500" /> Select Seed Target
        </h3>
        <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as any)) setShowDrop(false); }}>
          <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-purple-500 transition-colors"
            placeholder="Search item to plant..." value={searchQ || targetItem?.name || ''} onChange={(e) => { setSearchQ(e.target.value); setShowDrop(true); }} onFocus={() => setShowDrop(true)} />
          {showDrop && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-50 shadow-2xl">
              {searchResults.map((it: any) => (
                <div key={it.itemID} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800 transition-colors"
                  onMouseDown={() => { updateHarvestSettings(project.id, { harvestTargetId: it.itemID }); setSearchQ(''); setShowDrop(false); }}>
                  <ItemImage itemID={it.itemID} name={it.name} rarity={it.rarity} className="w-7 h-7 object-contain rounded" />
                  <div>
                    <div className="text-sm font-bold text-zinc-200">{it.name}</div>
                    <div className="text-[10px] font-mono text-zinc-500">Max Drop: {getMaxDrop(it.itemID)} · {isFarmable(it) ? 'Farmable' : 'Unfarmable (Seed Loss)'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Settings2 size={14} className="text-purple-500" /> Harvesting & Breaking Modifiers
        </h3>
        
        <div className="mb-5">
          <label className="block text-xs font-bold text-zinc-300 mb-2">Number of Seeds to Plant</label>
          <input type="number" min={1} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-purple-400 font-mono font-bold outline-none focus:border-purple-500"
            value={hs.numTrees} onChange={(e) => updateHarvestSettings(project.id, { numTrees: Number(e.target.value) })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
            <div className="text-[10px] font-black uppercase text-emerald-500 mb-2 px-2">🌿 Harvesting Gear (Extra Blocks)</div>
            <Toggle label="Harvester of Sorrow (HoS)" field="hos" value={hs.hos} project={project} updateHarvestSettings={updateHarvestSettings} />
            <Toggle label="Fuel Pack (+10% Double Fruit)" field="fuel" value={hs.fuel} disabled={!hs.hos} project={project} updateHarvestSettings={updateHarvestSettings} />
            <Toggle label="Dream Catcher Staff (+2% Block)" field="dcs" value={hs.dcs} project={project} updateHarvestSettings={updateHarvestSettings} />
          </div>

          <div className="space-y-1 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
            <div className="text-[10px] font-black uppercase text-blue-500 mb-2 px-2">🔨 Breaking Gear (Extra Seed & Gems)</div>
            <Toggle label="Ancestral Tesseract (+10% Seed)" field="ancesBlue" value={hs.ancesBlue} project={project} updateHarvestSettings={updateHarvestSettings} />
            <Toggle label="Builder Role (+3% Seed)" field="builder" value={hs.builder} project={project} updateHarvestSettings={updateHarvestSettings} />
            <Toggle label="Ancestral Lens (+5% Gems)" field="ancesRed" value={hs.ancesRed} project={project} updateHarvestSettings={updateHarvestSettings} />
            <Toggle label="Gemini Ring (+5% Gems)" field="gemini" value={hs.gemini} project={project} updateHarvestSettings={updateHarvestSettings} />
            <Toggle label="Farmer Role (+5% Gems)" field="farmer" value={hs.farmer} project={project} updateHarvestSettings={updateHarvestSettings} />
          </div>
        </div>
      </div>

      {calcResult && (
        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-2xl p-5 shadow-lg glow-emerald">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
            <BarChart3 size={14} /> Cycle Estimations (Seed ➡ Block ➡ Seed)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 text-center">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mb-1">Harvested Blocks</div>
              <div className="text-lg font-black text-emerald-400 font-mono">{fmt(calcResult.totalBlocks)}</div>
              <div className="text-[9px] text-zinc-500 mt-1">Avg {calcResult.avgFruitFinal} fruits/tree</div>
            </div>
            <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 text-center">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mb-1 flex items-center justify-center gap-1"><Gem size={10}/> Est. Gems</div>
              <div className="text-lg font-black text-purple-400 font-mono">{fmt(calcResult.totalGems)}</div>
              <div className="text-[9px] text-zinc-500 mt-1">From breaking {fmt(calcResult.totalBlocksBroken)} blks</div>
            </div>
            <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 text-center">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mb-1">Total Seed Given</div>
              <div className="text-lg font-black text-blue-400 font-mono">{fmt(calcResult.seedsGained)}</div>
              <div className="text-[9px] text-zinc-500 mt-1">~27.27% Drop Rate</div>
            </div>
            <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 text-center">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mb-1">Net Seed Profit</div>
              <div className={`text-lg font-black font-mono ${calcResult.seedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {calcResult.seedProfit > 0 ? '+' : ''}{fmt(calcResult.seedProfit)}
              </div>
              <div className="text-[9px] text-zinc-500 mt-1">Modal {fmt(hs.numTrees)} seed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB: STATS
// ──────────────────────────────────────────────────────────────────────────────
function StatsTab({ project, itemsData, recipesData }: any) {
  const requirements = useMemo(() => getBaseRequirements(project.targetId, project.targetAmount, project.maxDepth, recipesData, project.seedReturnRate, itemsData), [project, recipesData, itemsData]);
  const totalSplices = useMemo(() => countSplices(project.targetId, project.targetAmount, project.maxDepth, recipesData, project.seedReturnRate, itemsData), [project, recipesData, itemsData]);

  const baseEntries = Object.entries(requirements).map(([id, total]) => {
    const itemId = Number(id);
    const item = itemsData[itemId] ?? { name: `#${itemId}`, growTime: 0, breakHits: 4 };
    const stock = project.currentStock[itemId] ?? 0;
    return { itemId, item, total: total as number, stock };
  });

  const totalBaseSeeds   = baseEntries.reduce((s, r) => s + r.total, 0);
  const totalHits        = baseEntries.reduce((s, r) => s + r.total * (r.item.breakHits || 4), 0);
  const totalStocked     = baseEntries.reduce((s, r) => s + r.stock, 0);
  const deficit          = Math.max(0, totalBaseSeeds - totalStocked);

  const isGain = project.seedReturnRate > 1;
  const isLoss = project.seedReturnRate < 1;
  const seedVariance = Math.floor(totalSplices * Math.abs(project.seedReturnRate - 1));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-6 pb-24">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 bg-purple-950/20 border border-purple-900/50 rounded-2xl p-5 flex flex-col items-center justify-center glow-purple">
          <span className="text-3xl font-black text-purple-400 font-mono">{fmt(totalSplices)}</span>
          <span className="text-xs text-purple-300/70 uppercase tracking-widest font-bold mt-1">Total Splices Required</span>
        </div>
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-red-400 font-mono">{fmt(totalHits)}</span>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1 flex items-center gap-1"><Hammer size={12}/> Est. Breaking Hits</span>
        </div>
        
        {(isGain || isLoss) && (
          <div className={`col-span-2 md:col-span-4 rounded-2xl p-5 flex items-center justify-between border ${isGain ? 'bg-emerald-950/20 border-emerald-900/50 glow-emerald' : 'bg-red-950/20 border-red-900/50'}`}>
             <div>
               <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${isGain ? 'text-emerald-500' : 'text-red-500'}`}>
                 {isGain ? '📈 Estimated Seed Gain' : '📉 Estimated Seed Loss'}
               </h4>
               <p className="text-sm text-zinc-400 font-medium">Based on {project.seedReturnRate}x return rate across splices.</p>
             </div>
             <div className={`text-3xl font-black font-mono ${isGain ? 'text-emerald-400' : 'text-red-400'}`}>
               {isGain ? '+' : '-'}{fmt(seedVariance)}
             </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="bg-zinc-950 px-5 py-3 border-b border-zinc-800 text-xs font-black uppercase tracking-widest text-zinc-500">
          Base Seed Breakdown
        </div>
        <div className="divide-y divide-zinc-800/50">
          {baseEntries.sort((a, b) => b.total - a.total).map(({ itemId, item, total }) => (
            <div key={itemId} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/30 transition-colors">
              <ItemImage itemID={itemId} name={item.name} rarity={item.rarity} className="w-8 h-8 rounded-lg shrink-0 border border-zinc-700 object-contain" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-200 truncate">{item.name}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono"><Hammer size={8} className="inline mr-1 -mt-0.5"/> {item.breakHits || 4}</span>
                  {isFarmable(item) ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-400">Farmable</span> : <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/50 text-red-400">Seed Loss</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-purple-400">{fmt(total)}</div>
                <div className="font-mono text-[9px] text-zinc-500 mt-0.5">Total: {fmt(total * (item.breakHits || 4))} hits</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT EXPORT
// ──────────────────────────────────────────────────────────────────────────────
export default function MassingTree({ project, itemsData, recipesData }: any) {
  const { setMaxDepth, setTargetAmount, setSeedReturnRate, projects } = useStore();
  const [activeTab, setActiveTab] = useState<'tree' | 'stock' | 'harvest' | 'stats'>('tree');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [controlsOpen, setControlsOpen] = useState(false);

  const { nodes: calcNodes, edges: calcEdges } = useMemo(() => generateTree(project, recipesData, itemsData), [project, recipesData, itemsData]);

  useEffect(() => {
    setNodes((nds) => {
      if (!nds.length || nds[0]?.id !== calcNodes[0]?.id) return calcNodes;
      return calcNodes.map((n) => { const old = nds.find((o) => o.id === n.id); return old ? { ...n, position: old.position } : n; });
    });
    setEdges(calcEdges);
  }, [calcNodes, calcEdges, setNodes, setEdges]);

  const [saveToast, setSaveToast] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('growmass_autosave_backup', JSON.stringify(projects));
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000); 
    }, 1500); 
    return () => clearTimeout(timer);
  }, [projects]);

  const targetName = itemsData[project.targetId]?.name ?? `#${project.targetId}`;
  const tabs = [
    { id: 'tree' as const,    icon: <TreePine size={18} />,  label: 'Tree' },
    { id: 'stock' as const,   icon: <Package size={18} />,   label: 'Stock' },
    { id: 'harvest' as const, icon: <Wheat size={18} />,     label: 'Harvest' },
    { id: 'stats' as const,   icon: <BarChart3 size={18} />, label: 'Stats' },
  ];

  return (
    <div className="relative flex flex-col w-full h-full bg-black text-zinc-200 font-sans overflow-hidden">
      <style>{INJECTED_CSS}</style>
      
      <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 ${saveToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <Save size={14} /> Auto-Saved
      </div>

      <div className="glass-panel flex items-center justify-between px-4 md:px-6 py-3 z-20 shrink-0">
        <div className="min-w-0 mr-4">
          <div className="font-black text-base truncate text-white">{project.name}</div>
          <div className="text-xs truncate text-purple-400 font-medium">Target: {targetName}</div>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === t.id ? 'bg-purple-500 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <button onClick={() => setControlsOpen(!controlsOpen)} className={`flex items-center justify-center w-10 h-10 md:w-auto md:px-4 rounded-xl border transition-all ${controlsOpen ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 glow-purple' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}>
          <Settings2 size={18} className="md:mr-2" />
          <span className="hidden md:inline text-sm font-bold">Settings</span>
        </button>
      </div>

      <div className={`shrink-0 bg-zinc-950 border-b border-zinc-800 overflow-hidden transition-all duration-300 ease-in-out ${controlsOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 border-transparent'}`}>
        <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Amount</label>
            <input type="number" min={1} value={project.targetAmount || ''} onChange={(e) => setTargetAmount(project.id, Number(e.target.value))} 
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-purple-400 outline-none text-sm font-mono font-bold focus:border-purple-500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500" title="Farmable > 1, Unfarmable < 1">Seed Ratio</label>
            <input type="number" step={0.05} min={0.1} value={project.seedReturnRate} onChange={(e) => setSeedReturnRate(project.id, Number(e.target.value))} 
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-emerald-400 outline-none text-sm font-mono font-bold focus:border-emerald-500" />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span>Tree Depth Limit</span> <span className="text-purple-400">{project.maxDepth}</span>
            </label>
            <input type="range" min={1} max={30} value={project.maxDepth} onChange={(e) => setMaxDepth(project.id, Number(e.target.value))} className="w-full mt-2 accent-purple-500" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-[#09090b]">
        {activeTab === 'tree' && (
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView minZoom={0.04}>
            <Background color="#27272a" gap={32} size={1.5} />
            <Controls className="bg-zinc-900 border-zinc-800 fill-purple-500 mb-16 md:mb-4 shadow-xl" />
          </ReactFlow>
        )}
        {activeTab === 'stock' && <div className="h-full overflow-y-auto"><StockTab project={project} itemsData={itemsData} recipesData={recipesData} /></div>}
        {activeTab === 'harvest' && <div className="h-full overflow-y-auto"><HarvestTab project={project} itemsData={itemsData} /></div>}
        {activeTab === 'stats' && <div className="h-full overflow-y-auto"><StatsTab project={project} itemsData={itemsData} recipesData={recipesData} /></div>}
      </div>

      <div className="mobile-tabbar">
        {tabs.map((t) => (
          <button key={t.id} className={`mob-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.icon} <span className="mt-1">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
