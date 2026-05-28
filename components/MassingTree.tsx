'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, Handle, Position,
  Node, Edge, useNodesState, useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore, ProjectState } from '../store/useStore';
import ItemImage from './ItemImage';
import {
  Check, Edit2, Hammer, Leaf, FlameKindling, Droplets, Wind, Mountain,
  ChevronDown, ChevronUp, TrendingUp, Package, Layers, TreePine,
  Wheat, BarChart3, Settings2, AlertCircle, CheckCircle2, Zap,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// TREE FRUIT MAX DROPS (default = 4 if not listed)
// ──────────────────────────────────────────────────────────────────────────────
const TREE_MAX_DROPS: Record<number, number> = Object.fromEntries(
  '2|16,4|16,10|8,14|16,16|16,52|16,54|8,56|8,58|8,100|8,102|8,104|12,116|16,118|8,162|8,164|8,166|8,168|8,170|8,172|8,174|8,176|8,178|8,180|8,182|8,184|8,186|8,198|8,200|8,248|8,260|8,284|8,324|8,336|12,340|8,378|8,380|8,412|8,414|8,416|8,418|8,420|8,422|8,424|8,426|8,432|8,434|8,436|8,440|8,442|16,454|8,460|8,510|8,512|8,514|8,516|8,518|8,520|8,522|8,526|8,554|8,596|8,612|8,620|8,626|8,628|8,630|8,632|8,634|8,636|8,638|8,640|8,642|8,644|8,646|8,648|8,654|8,682|8,668|8,832|8,850|8,856|8,880|8,884|8,888|8,944|8,954|8,1132|8,1134|8,1138|8,1154|8,1258|8,1260|8,1262|8,1264|8,1266|8,1268|8,1270|8,1300|8,1324|8,1498|8,1500|8,1536|8,1538|8,1554|8,1556|8,1558|8,1560|8,1562|8,1564|8,1566|8,1630|16,1654|8,1786|1,1787|1,1788|1,1789|1,1790|1,2008|8,2012|8,2014|8,2016|8,2020|8,2022|8,2024|8,2026|8,2028|8,2034|1,2035|1,2036|1,2037|1,2070|8,2786|8,2788|8,2790|8,2796|8,2808|8,2988|8,2990|8,3004|8,3080|8,3082|8,3084|8,3260|8,3472|8,3520|8,3556|8,3564|8,3838|8,3930|8,4308|8,4310|8,4312|8,4314|8,4316|8,4318|8,4490|1,4491|1,4584|8,4634|8,4636|8,4638|8,4640|8,4642|8,5666|8,5726|8,5728|8,5730|8,5990|8,6030|8,6032|8,6034|8,6386|8,6388|8,6542|8,6544|8,6808|8,6810|8,6812|8'
    .split(',')
    .map((s) => { const [k, v] = s.split('|'); return [Number(k), Number(v)]; })
);

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const getMaxDrop = (id: number) => TREE_MAX_DROPS[id] ?? 4;

function isFarmable(item: any) {
  return item && item.growTime > 0;
}

function chiIcon(chi?: string) {
  switch (chi?.toUpperCase()) {
    case 'FIRE':  return <FlameKindling size={10} />;
    case 'WIND':  return <Wind size={10} />;
    case 'WATER': return <Droplets size={10} />;
    default:      return <Mountain size={10} />;
  }
}
function chiClass(chi?: string) {
  switch (chi?.toUpperCase()) {
    case 'FIRE':  return 'chi-fire';
    case 'WIND':  return 'chi-wind';
    case 'WATER': return 'chi-water';
    default:      return 'chi-earth';
  }
}

function rarityColor(r: number) {
  if (r >= 100) return '#fbbf24';
  if (r >= 60)  return '#c084fc';
  if (r >= 20)  return '#60a5fa';
  return '#6ee7b7';
}

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString() : String(n);
}

// ──────────────────────────────────────────────────────────────────────────────
// TREE GENERATION
// ──────────────────────────────────────────────────────────────────────────────
const X_GAP = 320;
const Y_GAP = 220;

function generateTree(
  project: ProjectState,
  recipesData: Record<number, [number, number]>,
  itemsData: Record<number, any>,
  chiData: Record<number, string>
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function traverse(
    id: number, depth: number,
    x: number, y: number,
    parentUid: string | null,
    direction: 'L' | 'R' | null,
    amountNeeded: number
  ): number {
    const recipe = recipesData[id];
    const isBase = !recipe;
    const isTruncated = !!recipe && depth >= project.maxDepth;
    const uid = parentUid ? `${parentUid}-${direction}-${id}` : `root-${id}`;

    const stock = project.currentStock[id] ?? 0;
    const actualNeeded = Math.max(0, amountNeeded - stock);
    const item = itemsData[id] ?? { name: `#${id}`, rarity: 0, itemID: id, growTime: 0, breakHits: 4 };
    const farmable = isFarmable(item);
    const chi = chiData[id];
    const maxDrop = getMaxDrop(id);

    const data = {
      id, uid, depth, isBase, isTruncated,
      amountNeeded, actualNeeded, stock,
      item, farmable, chi, maxDrop,
    };

    let leftW = 0, rightW = 0;
    if (!isBase && !isTruncated) {
      const [i1, i2] = recipe;
      const splicesReq = Math.ceil(actualNeeded / project.seedReturnRate);
      leftW  = traverse(i1, depth + 1, x, y + Y_GAP, uid, 'L', splicesReq);
      rightW = traverse(i2, depth + 1, x + leftW * X_GAP, y + Y_GAP, uid, 'R', splicesReq);
      const edgeStyle = { stroke: '#1d3454', strokeWidth: 1.5 };
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

// Collect unique base item requirements
function getBaseRequirements(
  targetId: number,
  targetAmount: number,
  maxDepth: number,
  recipesData: Record<number, [number, number]>,
  seedReturnRate: number
): Record<number, number> {
  const req: Record<number, number> = {};
  function walk(id: number, depth: number, amount: number) {
    const recipe = recipesData[id];
    if (!recipe || depth >= maxDepth) {
      req[id] = (req[id] ?? 0) + amount;
      return;
    }
    const [i1, i2] = recipe;
    const splices = Math.ceil(amount / seedReturnRate);
    walk(i1, depth + 1, splices);
    walk(i2, depth + 1, splices);
  }
  walk(targetId, 0, targetAmount);
  return req;
}

// Count total splices (intermediate nodes)
function countSplices(
  targetId: number,
  targetAmount: number,
  maxDepth: number,
  recipesData: Record<number, [number, number]>,
  seedReturnRate: number
): number {
  let total = 0;
  function walk(id: number, depth: number, amount: number) {
    const recipe = recipesData[id];
    if (!recipe || depth >= maxDepth) return;
    total += Math.ceil(amount / seedReturnRate);
    const [i1, i2] = recipe;
    const splices = Math.ceil(amount / seedReturnRate);
    walk(i1, depth + 1, splices);
    walk(i2, depth + 1, splices);
  }
  walk(targetId, 0, targetAmount);
  return total;
}

// ──────────────────────────────────────────────────────────────────────────────
// CUSTOM NODE
// ──────────────────────────────────────────────────────────────────────────────
const CustomNode = React.memo(({ data }: { data: any }) => {
  const { toggleNodeDone, setNodeNote, updateStock, activeProjectId, projects } = useStore();
  const project = projects.find((p) => p.id === activeProjectId);
  const isDone = !!project?.doneNodes[data.uid];
  const note = project?.notes[data.uid] ?? '';
  const [showNote, setShowNote] = useState(false);
  const [localNote, setLocalNote] = useState(note);

  const pct = data.amountNeeded > 0 ? Math.min(100, (data.stock / data.amountNeeded) * 100) : 100;
  const deficit = data.actualNeeded;

  const isRoot = data.depth === 0;
  const borderColor = isRoot ? '#f59e0b' : data.isBase ? '#22c55e' : data.isTruncated ? '#475569' : '#254a78';
  const bgColor = isRoot
    ? 'rgba(30,20,5,0.95)'
    : data.isBase
    ? 'rgba(5,20,12,0.95)'
    : data.isTruncated
    ? 'rgba(8,12,20,0.85)'
    : 'rgba(8,14,24,0.95)';

  const progressColor = pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="relative transition-all duration-200 hover:scale-[1.02]"
      style={{
        width: 268,
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 14,
        boxShadow: `0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
        opacity: isDone ? 0.6 : 1,
      }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: borderColor, width: 56, height: 4, borderRadius: 2, top: -2, border: 'none' }} />

      {/* Header */}
      <div className="flex items-start gap-3 p-3 pb-2">
        <div className="shrink-0 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ItemImage itemID={data.id} name={data.item.name} rarity={data.item.rarity} size={44} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {data.chi && (
              <span className={`badge ${chiClass(data.chi)}`}>
                {chiIcon(data.chi)} {data.chi}
              </span>
            )}
            {data.isBase && (
              <span className="badge badge-green"><Leaf size={8} /> Base</span>
            )}
            {isRoot && (
              <span className="badge badge-amber">Target</span>
            )}
          </div>
          <div className={`font-bold text-sm leading-tight ${isDone ? 'line-through opacity-50' : 'text-white'}`}
            style={{ fontFamily: 'var(--font-nunito)' }}>
            {data.item.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono" style={{ color: rarityColor(data.item.rarity), fontFamily: 'var(--font-mono)' }}>
              R{data.item.rarity}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              #{data.id}
            </span>
          </div>
        </div>
        {/* Done button */}
        <button
          onClick={() => activeProjectId && toggleNodeDone(activeProjectId, data.uid)}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{
            background: isDone ? '#22c55e' : 'transparent',
            border: `2px solid ${isDone ? '#22c55e' : '#2a4a6a'}`,
            color: isDone ? 'white' : '#2a4a6a',
          }}
        >
          <Check size={12} />
        </button>
      </div>

      {/* Stats row */}
      <div className="px-3 pb-2 grid grid-cols-3 gap-1.5">
        <div className="rounded-lg p-1.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-dim)' }}>Need</div>
          <div className="text-xs font-bold font-mono text-amber-400">{fmt(data.amountNeeded)}</div>
        </div>
        <div className="rounded-lg p-1.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-dim)' }}>Stock</div>
          <div className="text-xs font-bold font-mono" style={{ color: data.stock > 0 ? '#22c55e' : 'var(--text-dim)' }}>
            {fmt(data.stock)}
          </div>
        </div>
        <div className="rounded-lg p-1.5 text-center" style={{ background: deficit > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.07)', border: `1px solid ${deficit > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
          <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-dim)' }}>Deficit</div>
          <div className={`text-xs font-bold font-mono ${deficit > 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(deficit)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-3 pb-2">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%`, background: progressColor }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>Stock Progress</span>
          <span className="text-[9px] font-mono font-bold" style={{ color: progressColor }}>{pct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Hit count + farmable row */}
      <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
        {data.item.breakHits > 0 && (
          <div className="flex items-center gap-1 badge badge-gray">
            <Hammer size={8} />
            <span>{data.item.breakHits} hits</span>
          </div>
        )}
        {data.item.growTime > 0 && (
          <div className="flex items-center gap-1 badge badge-green">
            <Leaf size={8} />
            <span>Farmable</span>
          </div>
        )}
        {data.item.growTime === 0 && !data.isBase && (
          <div className="flex items-center gap-1 badge badge-red">
            <AlertCircle size={8} />
            <span>Seed Loss</span>
          </div>
        )}
        {getMaxDrop(data.id) > 4 && (
          <div className="flex items-center gap-1 badge badge-blue">
            <Zap size={8} />
            <span>Drop ×{getMaxDrop(data.id)}</span>
          </div>
        )}
      </div>

      {/* Stock input */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Package size={12} className="text-orange-400 shrink-0" />
          <input
            type="number"
            min={0}
            placeholder="Stock owned…"
            value={data.stock || ''}
            onChange={(e) => activeProjectId && updateStock(activeProjectId, data.id, Number(e.target.value))}
            className="bg-transparent outline-none w-full text-orange-300 font-bold text-xs placeholder:text-slate-700 placeholder:font-normal"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </div>

      {/* Note */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setShowNote(!showNote)}
          className="flex items-center gap-1 text-[10px] w-full"
          style={{ color: note ? 'var(--text-secondary)' : 'var(--text-dim)' }}
        >
          <Edit2 size={9} />
          {note ? note.slice(0, 28) + (note.length > 28 ? '…' : '') : 'Add note…'}
          {showNote ? <ChevronUp size={9} className="ml-auto" /> : <ChevronDown size={9} className="ml-auto" />}
        </button>
        {showNote && (
          <input
            type="text"
            className="mt-1 w-full bg-transparent outline-none text-xs placeholder:text-slate-700"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-nunito)', paddingBottom: 2 }}
            placeholder="Type note…"
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value)}
            onBlur={() => activeProjectId && setNodeNote(activeProjectId, data.uid, localNote)}
            autoFocus
          />
        )}
      </div>

      {data.isTruncated && (
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap"
          style={{ background: '#2d1515', color: '#f87171', borderColor: '#7f1d1d' }}>
          DEPTH LIMIT
        </div>
      )}

      <Handle type="source" position={Position.Bottom}
        style={{ background: borderColor, width: 56, height: 4, borderRadius: 2, bottom: -2, border: 'none' }} />
    </div>
  );
});
CustomNode.displayName = 'CustomNode';

const nodeTypes = { gm_node: CustomNode };

// ──────────────────────────────────────────────────────────────────────────────
// STOCK TAB
// ──────────────────────────────────────────────────────────────────────────────
function StockTab({
  project, itemsData, recipesData,
}: { project: ProjectState; itemsData: any; recipesData: any }) {
  const { updateStock } = useStore();
  const requirements = useMemo(
    () => getBaseRequirements(project.targetId, project.targetAmount, project.maxDepth, recipesData, project.seedReturnRate),
    [project.targetId, project.targetAmount, project.maxDepth, project.seedReturnRate, recipesData]
  );

  const sorted = useMemo(
    () =>
      Object.entries(requirements)
        .map(([id, total]) => {
          const itemId = Number(id);
          const item = itemsData[itemId] ?? { name: `#${itemId}`, rarity: 0, growTime: 0, breakHits: 4 };
          const stock = project.currentStock[itemId] ?? 0;
          const deficit = Math.max(0, total - stock);
          return { itemId, item, total, stock, deficit };
        })
        .sort((a, b) => b.deficit - a.deficit),
    [requirements, project.currentStock, itemsData]
  );

  const totalNeeded = sorted.reduce((s, r) => s + r.total, 0);
  const totalStock  = sorted.reduce((s, r) => s + r.stock, 0);
  const totalDef    = sorted.reduce((s, r) => s + r.deficit, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Summary */}
      <div className="p-4 grid grid-cols-3 gap-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="stat-chip">
          <span className="val text-amber-400">{fmt(totalNeeded)}</span>
          <span className="lbl">Total Needed</span>
        </div>
        <div className="stat-chip">
          <span className="val text-green-400">{fmt(totalStock)}</span>
          <span className="lbl">In Stock</span>
        </div>
        <div className="stat-chip">
          <span className="val" style={{ color: totalDef > 0 ? '#f87171' : '#4ade80', fontSize: 18 }}>{fmt(totalDef)}</span>
          <span className="lbl">Deficit</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="grid gap-2 px-4 py-2 sticky top-0 text-[10px] font-black uppercase tracking-wider border-b"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-dim)',
            gridTemplateColumns: '36px 1fr 70px 70px 80px 60px 60px' }}>
          <span />
          <span>Item</span>
          <span className="text-right">Needed</span>
          <span className="text-right">Stock</span>
          <span className="text-center">Edit Stock</span>
          <span className="text-center">Hits</span>
          <span className="text-center">Farm</span>
        </div>

        {sorted.map(({ itemId, item, total, stock, deficit }) => {
          const pct = total > 0 ? Math.min(100, (stock / total) * 100) : 100;
          return (
            <div
              key={itemId}
              className="grid gap-2 px-4 py-2 border-b items-center hover:bg-white/[0.02] transition-colors fade-in"
              style={{ borderColor: 'var(--border)', gridTemplateColumns: '36px 1fr 70px 70px 80px 60px 60px' }}
            >
              {/* Image */}
              <ItemImage itemID={itemId} name={item.name} rarity={item.rarity} size={30} className="rounded-md" />

              {/* Name + progress */}
              <div className="min-w-0">
                <div className="text-sm font-bold truncate text-white/90">{item.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="progress-track flex-1">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span className="text-[9px] font-mono shrink-0" style={{ color: 'var(--text-dim)' }}>{pct.toFixed(0)}%</span>
                </div>
              </div>

              {/* Needed */}
              <div className="text-right font-mono text-xs text-amber-300">{fmt(total)}</div>

              {/* Stock */}
              <div className="text-right font-mono text-xs" style={{ color: deficit > 0 ? '#f87171' : '#4ade80' }}>
                {fmt(stock)}
                {deficit > 0 && <div className="text-[9px]" style={{ color: '#f87171' }}>−{fmt(deficit)}</div>}
              </div>

              {/* Edit stock */}
              <div>
                <input
                  type="number"
                  min={0}
                  value={stock || ''}
                  placeholder="0"
                  onChange={(e) => updateStock(project.id, itemId, Number(e.target.value))}
                  className="gm-input text-center text-xs py-1 px-2"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Hit count */}
              <div className="text-center">
                {item.breakHits > 0 ? (
                  <span className="badge badge-gray">
                    <Hammer size={8} /> {item.breakHits}
                  </span>
                ) : <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>—</span>}
              </div>

              {/* Farmable */}
              <div className="text-center">
                {item.growTime > 0
                  ? <span className="badge badge-green"><Leaf size={8} /> {Math.round(item.growTime / 60)}m</span>
                  : <span className="badge badge-red">No</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// HARVEST TAB
// ──────────────────────────────────────────────────────────────────────────────
function HarvestTab({
  project, itemsData,
}: { project: ProjectState; itemsData: any }) {
  const { updateHarvestSettings } = useStore();
  const hs = project.harvestSettings;

  const [searchQ, setSearchQ] = useState('');
  const [showDrop, setShowDrop] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQ) return [];
    const q = searchQ.toLowerCase();
    return Object.values(itemsData as Record<number, any>)
      .filter((it: any) => it.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQ, itemsData]);

  const targetItem = hs.harvestTargetId ? itemsData[hs.harvestTargetId] : null;
  const maxDrop = hs.harvestTargetId ? getMaxDrop(hs.harvestTargetId) : 4;

  const calcResult = useMemo(() => {
    if (!hs.numTrees || !hs.harvestTargetId) return null;
    const base = hs.magplant ? maxDrop : (1 + maxDrop) / 2;
    const extras = (hs.farmerRole ? 1 : 0) + (hs.ringOfFlowers ? 1 : 0);
    const withExtras = base + extras;
    const final = hs.goldenBooster ? withExtras * 2 : withExtras;
    const total = Math.floor(final * hs.numTrees);
    const perHour = Math.floor((3600 / Math.max(1, targetItem?.growTime ?? 3600)) * final);
    const perDay  = Math.floor((86400 / Math.max(1, targetItem?.growTime ?? 3600)) * final);
    return { perTree: final.toFixed(2), total, perHour, perDay, seedsBack: hs.numTrees };
  }, [hs, maxDrop, targetItem]);

  const Toggle = ({ label, field, value }: { label: string; field: keyof typeof hs; value: boolean }) => (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer select-none">
      <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <label className="toggle-switch">
        <input type="checkbox" checked={value} onChange={(e) => updateHarvestSettings(project.id, { [field]: e.target.checked })} />
        <span className="toggle-slider" />
      </label>
    </label>
  );

  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
          🌿 Select Item to Harvest
        </div>

        {/* Target item search */}
        <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as any)) setShowDrop(false); }}>
          <input
            className="gm-input"
            placeholder="Search item…"
            value={searchQ || targetItem?.name || ''}
            onChange={(e) => { setSearchQ(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
          />
          {showDrop && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-50"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}>
              {searchResults.map((it: any) => (
                <div key={it.itemID}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                  onMouseDown={() => {
                    updateHarvestSettings(project.id, { harvestTargetId: it.itemID });
                    setSearchQ('');
                    setShowDrop(false);
                  }}>
                  <ItemImage itemID={it.itemID} name={it.name} rarity={it.rarity} size={28} className="rounded" />
                  <div>
                    <div className="text-sm font-bold">{it.name}</div>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
                      #{it.itemID} · Max Drop: {getMaxDrop(it.itemID)} · {it.growTime > 0 ? `${Math.round(it.growTime / 60)}m grow` : 'Not farmable'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected item info */}
        {targetItem && (
          <div className="mt-3 flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ItemImage itemID={hs.harvestTargetId!} name={targetItem.name} rarity={targetItem.rarity} size={40} className="rounded-lg" />
            <div>
              <div className="font-bold text-sm">{targetItem.name}</div>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="badge badge-blue">Max Drop: {maxDrop}</span>
                {targetItem.growTime > 0
                  ? <span className="badge badge-green">🕐 {Math.round(targetItem.growTime / 60)}m</span>
                  : <span className="badge badge-red">Not Farmable</span>}
                <span className="badge badge-amber">R{targetItem.rarity}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Config */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>⚙ Config</div>
        <div className="mb-3">
          <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Number of Trees</label>
          <input type="number" min={1} className="gm-input" value={hs.numTrees}
            onChange={(e) => updateHarvestSettings(project.id, { numTrees: Number(e.target.value) })} />
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          <Toggle label="🧲 Magplant Remote (max drops always)" field="magplant" value={hs.magplant} />
          <Toggle label="✨ Golden Booster (×2 items)" field="goldenBooster" value={hs.goldenBooster} />
          <Toggle label="🌾 Farmer Role (+1 per harvest)" field="farmerRole" value={hs.farmerRole} />
          <Toggle label="💍 Ring of Flowers (+1 per harvest)" field="ringOfFlowers" value={hs.ringOfFlowers} />
        </div>
      </div>

      {/* Results */}
      {calcResult && (
        <div className="rounded-xl p-4 fade-in" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="text-xs font-black uppercase tracking-widest mb-3 text-green-400">📊 Results</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-chip">
              <span className="val text-amber-300">{calcResult.perTree}</span>
              <span className="lbl">Items / Harvest</span>
            </div>
            <div className="stat-chip">
              <span className="val text-green-400">{fmt(calcResult.total)}</span>
              <span className="lbl">Total ({fmt(hs.numTrees)} trees)</span>
            </div>
            <div className="stat-chip">
              <span className="val text-blue-300" style={{ fontSize: 16 }}>{fmt(calcResult.perHour)}</span>
              <span className="lbl">Items / Hour</span>
            </div>
            <div className="stat-chip">
              <span className="val text-purple-300" style={{ fontSize: 16 }}>{fmt(calcResult.perDay)}</span>
              <span className="lbl">Items / Day</span>
            </div>
            <div className="stat-chip col-span-2">
              <span className="val text-green-300" style={{ fontSize: 16 }}>{fmt(calcResult.seedsBack)}</span>
              <span className="lbl">Seeds Returned (1 per break)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STATS TAB
// ──────────────────────────────────────────────────────────────────────────────
function StatsTab({
  project, itemsData, recipesData,
}: { project: ProjectState; itemsData: any; recipesData: any }) {
  const requirements = useMemo(
    () => getBaseRequirements(project.targetId, project.targetAmount, project.maxDepth, recipesData, project.seedReturnRate),
    [project.targetId, project.targetAmount, project.maxDepth, project.seedReturnRate, recipesData]
  );
  const totalSplices = useMemo(
    () => countSplices(project.targetId, project.targetAmount, project.maxDepth, recipesData, project.seedReturnRate),
    [project.targetId, project.targetAmount, project.maxDepth, project.seedReturnRate, recipesData]
  );

  const baseEntries = Object.entries(requirements).map(([id, total]) => {
    const itemId = Number(id);
    const item = itemsData[itemId] ?? { name: `#${itemId}`, growTime: 0, breakHits: 4 };
    const stock = project.currentStock[itemId] ?? 0;
    return { itemId, item, total, stock };
  });

  const totalBaseSeeds   = baseEntries.reduce((s, r) => s + r.total, 0);
  const totalHits        = baseEntries.reduce((s, r) => s + r.total * (r.item.breakHits || 4), 0);
  const farmableTypes    = baseEntries.filter((r) => r.item.growTime > 0).length;
  const nonFarmableTypes = baseEntries.filter((r) => r.item.growTime === 0).length;
  const totalStocked     = baseEntries.reduce((s, r) => s + r.stock, 0);
  const deficit          = Math.max(0, totalBaseSeeds - totalStocked);

  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-chip col-span-2">
          <span className="val text-amber-400" style={{ fontSize: 28 }}>{fmt(totalSplices)}</span>
          <span className="lbl">Total Splices Required</span>
        </div>
        <div className="stat-chip">
          <span className="val text-blue-300">{fmt(totalBaseSeeds)}</span>
          <span className="lbl">Total Base Seeds</span>
        </div>
        <div className="stat-chip">
          <span className="val" style={{ color: deficit > 0 ? '#f87171' : '#4ade80', fontSize: 18 }}>{fmt(deficit)}</span>
          <span className="lbl">Total Deficit</span>
        </div>
        <div className="stat-chip">
          <span className="val text-red-300">{fmt(totalHits)}</span>
          <span className="lbl">Est. Total Hits</span>
        </div>
        <div className="stat-chip">
          <span className="val" style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{baseEntries.length}</span>
          <span className="lbl">Unique Base Types</span>
        </div>
        <div className="stat-chip">
          <span className="val text-green-400" style={{ fontSize: 18 }}>{farmableTypes}</span>
          <span className="lbl">Farmable Types</span>
        </div>
        <div className="stat-chip">
          <span className="val text-red-400" style={{ fontSize: 18 }}>{nonFarmableTypes}</span>
          <span className="lbl">Non-Farmable Types</span>
        </div>
      </div>

      {/* Per-item breakdown */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-2 text-xs font-black uppercase tracking-widest" style={{ background: 'var(--bg-card)', color: 'var(--text-dim)' }}>
          Base Seed Breakdown
        </div>
        {baseEntries.sort((a, b) => b.total - a.total).map(({ itemId, item, total }) => (
          <div key={itemId} className="flex items-center gap-3 px-4 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <ItemImage itemID={itemId} name={item.name} rarity={item.rarity} size={28} className="rounded shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{item.name}</div>
              <div className="flex gap-2 mt-0.5">
                {item.breakHits > 0 && <span className="badge badge-gray"><Hammer size={7} /> {item.breakHits} hits</span>}
                {item.growTime > 0
                  ? <span className="badge badge-green"><Leaf size={7} /> {Math.round(item.growTime / 60)}m</span>
                  : <span className="badge badge-red">No farm</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-amber-300 font-bold">{fmt(total)}</div>
              <div className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>×{item.breakHits || 4} = {fmt(total * (item.breakHits || 4))} hits</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
export default function MassingTree({
  project, itemsData, recipesData, chiData,
}: {
  project: ProjectState;
  itemsData: Record<number, any>;
  recipesData: Record<number, [number, number]>;
  chiData: Record<number, string>;
}) {
  const { setMaxDepth, setTargetAmount, setSeedReturnRate } = useStore();
  const [activeTab, setActiveTab] = useState<'tree' | 'stock' | 'harvest' | 'stats'>('tree');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [controlsOpen, setControlsOpen] = useState(true);

  const { nodes: calcNodes, edges: calcEdges } = useMemo(
    () => generateTree(project, recipesData, itemsData, chiData),
    [project.targetId, project.targetAmount, project.maxDepth, project.currentStock, project.seedReturnRate, recipesData, itemsData, chiData]
  );

  useEffect(() => {
    setNodes((nds) => {
      if (!nds.length || nds[0]?.id !== calcNodes[0]?.id) return calcNodes;
      return calcNodes.map((n) => {
        const old = nds.find((o) => o.id === n.id);
        return old ? { ...n, position: old.position } : n;
      });
    });
    setEdges(calcEdges);
  }, [calcNodes, calcEdges, setNodes, setEdges]);

  const targetName = itemsData[project.targetId]?.name ?? `#${project.targetId}`;

  const tabs = [
    { id: 'tree' as const,    icon: <TreePine size={16} />,  label: 'Tree' },
    { id: 'stock' as const,   icon: <Package size={16} />,   label: 'Stock' },
    { id: 'harvest' as const, icon: <Wheat size={16} />,     label: 'Harvest' },
    { id: 'stats' as const,   icon: <BarChart3 size={16} />, label: 'Stats' },
  ];

  return (
    <div className="relative flex flex-col w-full h-full" style={{ background: 'var(--bg-base)' }}>
      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0 z-20 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {/* Title */}
        <div className="min-w-0 mr-2 hidden md:block">
          <div className="font-black text-sm truncate" style={{ maxWidth: 180 }}>{project.name}</div>
          <div className="text-[10px] truncate" style={{ color: 'var(--text-dim)', maxWidth: 180 }}>{targetName}</div>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-1 bg-black/20 rounded-lg p-1 border" style={{ borderColor: 'var(--border)' }}>
          {tabs.map((t) => (
            <button key={t.id} className={`tab-pill flex items-center gap-1.5 ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Controls toggle */}
        <button
          onClick={() => setControlsOpen(!controlsOpen)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors"
          style={{
            background: controlsOpen ? 'rgba(56,189,248,0.08)' : 'transparent',
            borderColor: controlsOpen ? 'rgba(56,189,248,0.3)' : 'var(--border)',
            color: controlsOpen ? 'var(--accent-blue)' : 'var(--text-secondary)',
          }}>
          <Settings2 size={13} /> Settings
        </button>
      </div>

      {/* ── CONTROLS PANEL ── */}
      {controlsOpen && (
        <div className="shrink-0 px-4 py-3 border-b grid grid-cols-2 md:grid-cols-4 gap-3 fade-in"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>
              Target Amount
            </label>
            <input type="number" min={1} className="gm-input text-amber-300" value={project.targetAmount || ''}
              onChange={(e) => setTargetAmount(project.id, Number(e.target.value))}
              style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>
              Seed Return Rate
            </label>
            <input type="number" step={0.05} min={0.05} max={2} className="gm-input text-orange-300" value={project.seedReturnRate}
              onChange={(e) => setSeedReturnRate(project.id, Number(e.target.value))}
              style={{ fontFamily: 'var(--font-mono)' }} />
          </div>
          <div className="col-span-2 md:col-span-2">
            <label className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>
              <span>Tree Depth</span>
              <span style={{ color: 'var(--accent-blue)' }}>{project.maxDepth}</span>
            </label>
            <input type="range" min={1} max={30} value={project.maxDepth}
              onChange={(e) => setMaxDepth(project.id, Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
              <span>1</span><span>15</span><span>30</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 48px)' }}>
        {/* Tree tab */}
        {activeTab === 'tree' && (
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.04}
            style={{ background: 'var(--bg-base)' }}
          >
            <Background color="#1a3050" gap={28} size={1.5} />
            <Controls />
          </ReactFlow>
        )}
        {activeTab === 'stock' && (
          <div className="h-full overflow-auto">
            <StockTab project={project} itemsData={itemsData} recipesData={recipesData} />
          </div>
        )}
        {activeTab === 'harvest' && (
          <div className="h-full overflow-auto">
            <HarvestTab project={project} itemsData={itemsData} />
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="h-full overflow-auto">
            <StatsTab project={project} itemsData={itemsData} recipesData={recipesData} />
          </div>
        )}
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <div className="mobile-tabbar">
        {tabs.map((t) => (
          <button key={t.id} className={`mob-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
