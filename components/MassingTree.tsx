"use client";

import React, { useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position, 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore, ProjectState } from '../store/useStore';
import { Check, Edit2, Package } from 'lucide-react';

const X_GAP = 280;
const Y_GAP = 220;

function generateTree(
  project: ProjectState, 
  recipesData: Record<number, [number, number]>, 
  itemsData: Record<number, any>
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  function traverse(
    id: number, 
    depth: number, 
    x: number, 
    y: number, 
    parentUid: string | null = null, 
    direction: 'L' | 'R' | null = null,
    amountNeeded: number
  ): number {
    
    // PERBAIKAN BUG 3 NODE:
    // Jika ID adalah Seed, cari resep Block-nya (id - 1) di splices.txt
    const recipe = recipesData[id] || recipesData[id - 1];
    
    const isBase = !recipe;
    const isTruncated = recipe && depth >= project.maxDepth;
    const uid = parentUid ? `${parentUid}-${direction}-${id}` : `root-${id}`;
    
    // Kurangi kebutuhan dengan stock yang di-input manual di node ini
    const stock = project.currentStock[uid] || 0;
    const actualNeeded = Math.max(0, amountNeeded - stock);

    const data = {
      id, uid, depth, isBase, isTruncated,
      amountNeeded, 
      actualNeeded, 
      item: itemsData[id] || { name: `Unknown ${id}`, rarity: 0 }
    };

    let leftW = 0, rightW = 0;

    if (!isBase && !isTruncated) {
      const [i1, i2] = recipe; // Menggunakan resep yang berhasil ditemukan
      
      leftW = traverse(i1, depth + 1, x, y + Y_GAP, uid, 'L', actualNeeded);
      rightW = traverse(i2, depth + 1, x + (leftW * X_GAP), y + Y_GAP, uid, 'R', actualNeeded);
      
      edges.push({ id: `e-${uid}-L`, source: uid, target: `${uid}-L-${i1}`, animated: true, style: { stroke: '#94a3b8' } });
      edges.push({ id: `e-${uid}-R`, source: uid, target: `${uid}-R-${i2}`, animated: true, style: { stroke: '#94a3b8' } });
    }

    const totalW = isBase || isTruncated ? 1 : leftW + rightW;
    const finalX = isBase || isTruncated ? x : x + ((leftW * X_GAP) / 2) - (X_GAP / 4);

    nodes.push({ id: uid, position: { x: finalX, y }, data, type: 'customItemNode' });
    return totalW;
  }

  traverse(project.targetId, 0, 0, 0, null, null, project.targetAmount);
  return { nodes, edges };
}

// ================= Custom Node =================
const CustomNode = ({ data }: any) => {
  const { toggleNodeDone, setNodeNote, updateStock, activeProjectId, projects } = useStore();
  const project = projects.find(p => p.id === activeProjectId);
  const isDone = project?.doneNodes[data.uid] || false;
  const note = project?.notes[data.uid] || '';
  const stock = project?.currentStock[data.uid] || 0;
  
  const rarityColor = data.item.rarity > 100 ? '#fbbf24' : '#60a5fa';
  
  // URL API GTID (encodeURIComponent agar spasi menjadi %20 dan api tidak error)
  const imageUrl = `https://gtid.pro/api/item-image?name=${encodeURIComponent(data.item.name)}`;

  return (
    <div className={`w-64 bg-slate-800 border-2 rounded-xl p-3 shadow-xl transition-colors ${isDone || data.actualNeeded === 0 ? 'border-teal-500 bg-slate-800/60 opacity-80' : 'border-slate-600'}`}>
      <Handle type="target" position={Position.Top} className="w-12 !bg-slate-500" />
      
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="w-10 h-10 shrink-0 bg-slate-900 rounded-md border border-slate-700 flex items-center justify-center overflow-hidden">
          <img 
            src={imageUrl} 
            alt={data.item.name} 
            className="w-8 h-8 object-contain drop-shadow-md"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <div className="text-[10px] text-slate-400 truncate">Rarity: <span style={{ color: rarityColor }}>{data.item.rarity}</span></div>
          <div className={`font-bold text-sm leading-tight break-words ${isDone ? 'text-teal-400 line-through' : 'text-slate-100'}`}>
            {data.item.name}
          </div>
        </div>
        <button 
          onClick={() => activeProjectId && toggleNodeDone(activeProjectId, data.uid)}
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition ${isDone ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-500 text-transparent hover:border-teal-500'}`}
        >
          <Check className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2 mt-2 pt-2 border-t border-slate-700">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Target Parent:</span>
          <span className="text-teal-400 font-bold">{data.amountNeeded.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 rounded p-1 border border-slate-700 focus-within:border-teal-500">
           <Package className="w-3 h-3 text-orange-400 shrink-0" />
           <input 
             type="number" 
             placeholder="Stock Dimiliki" 
             value={stock || ''}
             onChange={(e) => activeProjectId && updateStock(activeProjectId, data.uid, Number(e.target.value))}
             className="bg-transparent outline-none w-full text-orange-300 placeholder:text-slate-600"
             title="Stock yang sudah ada"
           />
        </div>

        <div className="flex justify-between text-xs bg-red-950/30 p-1 rounded border border-red-900/50">
          <span className="text-slate-400">Need to Splice:</span>
          <span className="text-red-400 font-bold">{data.actualNeeded.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Edit2 className="w-3 h-3 shrink-0" />
          <input 
            type="text" 
            placeholder="Tambahkan Note..." 
            value={note}
            onChange={(e) => activeProjectId && setNodeNote(activeProjectId, data.uid, e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-300 placeholder:text-slate-600"
          />
        </div>
      </div>

      {data.isTruncated && (
        <div className="text-[10px] text-red-400 mt-2 text-center bg-red-950/30 py-1 rounded">
          Max Depth Reached
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-12 !bg-slate-500" />
    </div>
  );
};

const nodeTypes = { customItemNode: CustomNode };

// ================= Main Component =================
export default function MassingTree({ project, itemsData, recipesData }: { project: ProjectState, itemsData: any, recipesData: any }) {
  const { setMaxDepth, setTargetAmount } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { nodes: calcNodes, edges: calcEdges } = useMemo(() => {
    return generateTree(project, recipesData, itemsData);
  }, [project.targetId, project.targetAmount, project.maxDepth, project.currentStock, recipesData, itemsData]);

  // Sync dengan State Nodes (Agar bisa di geser/drag)
  useEffect(() => {
    setNodes((nds) => {
      // Jika Node kosong atau project diganti, render ulang total posisinya.
      if (nds.length === 0 || nds[0]?.id !== calcNodes[0]?.id) return calcNodes;
      
      // Jika update berasal dari Note/Stock, Timpa datanya tapi PERTAHANKAN posisinya (drag tetap di tempat)
      return calcNodes.map(newN => {
        const oldN = nds.find(n => n.id === newN.id);
        return oldN ? { ...newN, position: oldN.position } : newN;
      });
    });
    setEdges(calcEdges);
  }, [calcNodes, calcEdges, setNodes, setEdges]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-6">
        <div>
          <h3 className="text-lg font-bold text-white">{project.name}</h3>
          <p className="text-xs text-slate-400">Item: {itemsData[project.targetId]?.name || 'Unknown'}</p>
        </div>
        
        <div className="h-8 w-px bg-slate-700"></div>
        
        <div className="flex flex-col gap-1 w-32">
          <label className="text-xs text-slate-400 font-bold">Target Jumlah</label>
          <input 
            type="number" 
            min="1"
            value={project.targetAmount || ''} 
            onChange={(e) => setTargetAmount(project.id, Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-teal-400 outline-none text-sm focus:border-teal-500 font-bold"
          />
        </div>

        <div className="h-8 w-px bg-slate-700"></div>

        <div className="flex flex-col gap-1 w-32">
          <label className="text-xs text-slate-400 flex justify-between">
            <span>Depth Limit</span>
            <span className="font-bold text-teal-400">{project.maxDepth}</span>
          </label>
          <input 
            type="range" 
            min="1" max="30" 
            value={project.maxDepth} 
            onChange={(e) => setMaxDepth(project.id, Number(e.target.value))}
            className="accent-teal-500 cursor-pointer"
          />
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-950"
        minZoom={0.05}
      >
        <Background color="#1e293b" gap={16} size={1} />
        <Controls className="bg-slate-800 border-slate-700 fill-teal-500" />
      </ReactFlow>
    </div>
  );
}
