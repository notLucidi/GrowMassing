"use client";

import React, { useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, Handle, Position, Node, Edge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore, ProjectState } from '../store/useStore';
import { Check, Edit2, Package } from 'lucide-react';
import ItemImage from './ItemImage';

const X_GAP = 300;
const Y_GAP = 240;

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
    
    const recipe = recipesData[id] || recipesData[id - 1];
    const isBase = !recipe;
    const isTruncated = recipe && depth >= project.maxDepth;
    const uid = parentUid ? `${parentUid}-${direction}-${id}` : `root-${id}`;
    
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
      const [i1, i2] = recipe;
      const splicesRequired = Math.ceil(actualNeeded / project.seedReturnRate);
      
      leftW = traverse(i1, depth + 1, x, y + Y_GAP, uid, 'L', splicesRequired);
      rightW = traverse(i2, depth + 1, x + (leftW * X_GAP), y + Y_GAP, uid, 'R', splicesRequired);
      
      edges.push({ id: `e-${uid}-L`, source: uid, target: `${uid}-L-${i1}`, animated: true, style: { stroke: '#475569', strokeWidth: 2 } });
      edges.push({ id: `e-${uid}-R`, source: uid, target: `${uid}-R-${i2}`, animated: true, style: { stroke: '#475569', strokeWidth: 2 } });
    }

    const totalW = isBase || isTruncated ? 1 : leftW + rightW;
    const finalX = isBase || isTruncated ? x : x + ((leftW * X_GAP) / 2) - (X_GAP / 4);

    nodes.push({ id: uid, position: { x: finalX, y }, data, type: 'customItemNode' });
    return totalW;
  }

  traverse(project.targetId, 0, 0, 0, null, null, project.targetAmount);
  return { nodes, edges };
}

const CustomNode = ({ data }: any) => {
  const { toggleNodeDone, setNodeNote, updateStock, activeProjectId, projects } = useStore();
  const project = projects.find(p => p.id === activeProjectId);
  const isDone = project?.doneNodes[data.uid] || false;
  const note = project?.notes[data.uid] || '';
  const stock = project?.currentStock[data.uid] || 0;
  
  const rarityColor = data.item.rarity > 100 ? '#fbbf24' : '#60a5fa';

  return (
    <div className={`w-[260px] bg-slate-900 border-2 rounded-2xl p-4 shadow-2xl transition-all duration-300 ${isDone || data.actualNeeded === 0 ? 'border-teal-500 bg-slate-900/80 opacity-70 scale-95' : 'border-slate-700 hover:border-slate-500 hover:shadow-slate-800/50'}`}>
      <Handle type="target" position={Position.Top} className="w-16 h-2 !bg-slate-600 rounded-full border-none -top-1" />
      
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="w-12 h-12 shrink-0 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
          <ItemImage name={data.item.name} className="w-8 h-8 object-contain drop-shadow-md" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 truncate">Rarity <span style={{ color: rarityColor }}>{data.item.rarity}</span></div>
          <div className={`font-bold text-sm leading-tight break-words mt-0.5 ${isDone ? 'text-teal-500 line-through' : 'text-slate-100'}`}>
            {data.item.name}
          </div>
        </div>
        <button 
          onClick={() => activeProjectId && toggleNodeDone(activeProjectId, data.uid)}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-teal-500 border-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'border-slate-600 text-transparent hover:border-teal-500 hover:text-teal-500'}`}
        >
          <Check className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5 pt-3 border-t border-slate-800">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400">Target Demand:</span>
          <span className="text-teal-400">{data.amountNeeded.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-950 rounded-lg p-2 border border-slate-800 focus-within:border-teal-600 focus-within:ring-1 focus-within:ring-teal-600/50 transition-all">
           <Package className="w-4 h-4 text-orange-500 shrink-0" />
           <input 
             type="number" 
             placeholder="Stock Dimiliki" 
             value={stock || ''}
             onChange={(e) => activeProjectId && updateStock(activeProjectId, data.uid, Number(e.target.value))}
             className="bg-transparent outline-none w-full text-orange-400 font-semibold placeholder:text-slate-700 placeholder:font-normal"
           />
        </div>

        <div className="flex justify-between text-xs font-semibold bg-red-950/40 p-2 rounded-lg border border-red-900/40">
          <span className="text-slate-400">Net Splice Needed:</span>
          <span className="text-red-400">{data.actualNeeded.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
          <Edit2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <input 
            type="text" 
            placeholder="Tambahkan Catatan..." 
            value={note}
            onChange={(e) => activeProjectId && setNodeNote(activeProjectId, data.uid, e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-300 placeholder:text-slate-600 font-medium"
          />
        </div>
      </div>

      {data.isTruncated && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-300 bg-red-900 px-3 py-1 rounded-full shadow-lg border border-red-700 whitespace-nowrap">
          MAX DEPTH REACHED
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-16 h-2 !bg-slate-600 rounded-full border-none -bottom-1" />
    </div>
  );
};

const nodeTypes = { customItemNode: CustomNode };

export default function MassingTree({ project, itemsData, recipesData }: { project: ProjectState, itemsData: any, recipesData: any }) {
  const { setMaxDepth, setTargetAmount, setSeedReturnRate } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { nodes: calcNodes, edges: calcEdges } = useMemo(() => {
    return generateTree(project, recipesData, itemsData);
  }, [project.targetId, project.targetAmount, project.maxDepth, project.currentStock, project.seedReturnRate, recipesData, itemsData]);

  useEffect(() => {
    setNodes((nds) => {
      if (nds.length === 0 || nds[0]?.id !== calcNodes[0]?.id) return calcNodes;
      return calcNodes.map(newN => {
        const oldN = nds.find(n => n.id === newN.id);
        return oldN ? { ...newN, position: oldN.position } : newN;
      });
    });
    setEdges(calcEdges);
  }, [calcNodes, calcEdges, setNodes, setEdges]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Responsive Top Toolbar */}
      <div className="absolute top-16 md:top-6 left-1/2 -translate-x-1/2 z-20 w-[92%] md:w-auto bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        
        {/* Nama & Target */}
        <div className="flex-1 w-full md:w-auto border-b border-slate-700 pb-2 md:pb-0 md:border-none">
          <h3 className="text-base md:text-lg font-extrabold text-white truncate max-w-[200px] md:max-w-xs">{project.name}</h3>
          <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] md:max-w-xs">Item: {itemsData[project.targetId]?.name || 'Unknown'}</p>
        </div>
        
        <div className="hidden md:block h-10 w-px bg-slate-700"></div>
        
        {/* Controls Container (Scrollable on very small mobile) */}
        <div className="flex flex-row flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Target Jml</label>
            <input 
              type="number" min="1"
              value={project.targetAmount || ''} 
              onChange={(e) => setTargetAmount(project.id, Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-1.5 text-teal-400 outline-none text-sm focus:border-teal-500 font-bold shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[80px]">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider" title="Seed Drop Rate per Tree. Farmable > 1, Unfarmable < 1">Seed Rate</label>
            <input 
              type="number" step="0.05" min="0.1"
              value={project.seedReturnRate || 1} 
              onChange={(e) => setSeedReturnRate(project.id, Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-1.5 text-orange-400 outline-none text-sm focus:border-orange-500 font-bold shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
            <label className="text-[11px] text-slate-400 flex justify-between font-bold uppercase tracking-wider">
              <span>Depth</span>
              <span className="text-teal-400">{project.maxDepth}</span>
            </label>
            <input 
              type="range" min="1" max="30" 
              value={project.maxDepth} 
              onChange={(e) => setMaxDepth(project.id, Number(e.target.value))}
              className="w-full mt-1 accent-teal-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#0b1120]"
        minZoom={0.05}
      >
        <Background color="#1e293b" gap={24} size={2} />
        <Controls className="bg-slate-800 border-slate-700 fill-teal-500 mb-4 mr-4 shadow-xl" />
      </ReactFlow>
    </div>
  );
}
