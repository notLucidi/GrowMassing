"use client";

import React, { useMemo, useCallback } from 'react';
import ReactFlow, { Background, Controls, Handle, Position, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore, ProjectState } from '../store/useStore';
import { Check, Edit2, PlayCircle } from 'lucide-react';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;
const X_GAP = 220;
const Y_GAP = 150;

function generateTree(
  targetId: number, 
  maxDepth: number, 
  recipesData: Record<number, [number, number]>, 
  itemsData: Record<number, any>
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // DFS recursive function
  function traverse(id: number, depth: number, x: number, y: number, parentUid: string | null = null, direction: 'L' | 'R' | null = null): number {
    const isBase = !recipesData[id];
    const isTruncated = recipesData[id] && depth >= maxDepth;
    
    // Unique ID for UI because one item can appear multiple times
    const uid = parentUid ? `${parentUid}-${direction}-${id}` : `root-${id}`;
    
    const nodeWidthCalc = (isBase || isTruncated) ? 1 : 2;

    const data = {
      id,
      uid,
      depth,
      isBase,
      isTruncated,
      item: itemsData[id] || { name: `Unknown ${id}`, rarity: 0 }
    };

    let shift = 0;
    
    if (!isBase && !isTruncated) {
      const [i1, i2] = recipesData[id];
      
      const leftW = traverse(i1, depth + 1, x, y + Y_GAP, uid, 'L');
      shift = leftW * X_GAP;
      
      traverse(i2, depth + 1, x + shift, y + Y_GAP, uid, 'R');
      
      // Edges
      edges.push({ id: `e-${uid}-L`, source: uid, target: `${uid}-L-${i1}`, animated: true, style: { stroke: '#94a3b8' } });
      edges.push({ id: `e-${uid}-R`, source: uid, target: `${uid}-R-${i2}`, animated: true, style: { stroke: '#94a3b8' } });
    }

    // Adjust X position based on children
    const finalX = x + (shift / 2);
    
    nodes.push({
      id: uid,
      position: { x: finalX, y },
      data,
      type: 'customItemNode',
    });

    return isBase || isTruncated ? 1 : leftW * 2; // Rough width estimation for parent centering
  }

  traverse(targetId, 0, 0, 0);
  
  return { nodes, edges };
}

// ================= Custom Node =================
const CustomNode = ({ data }: any) => {
  const { toggleNodeDone, setNodeNote, activeProjectId, projects, updateStartFrom } = useStore();
  const project = projects.find(p => p.id === activeProjectId);
  const isDone = project?.doneNodes[data.uid] || false;
  const note = project?.notes[data.uid] || '';
  const startAmount = project?.startFrom[data.id] || 0;
  
  const rarityColor = data.item.rarity > 100 ? '#fbbf24' : '#60a5fa'; // Example rarity color

  return (
    <div className={`w-44 bg-slate-800 border-2 rounded-xl p-3 shadow-lg transition-colors ${isDone ? 'border-teal-500 bg-slate-800/80' : 'border-slate-600'}`}>
      <Handle type="target" position={Position.Top} className="w-10 !bg-slate-500" />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-xs text-slate-400">Rarity: <span style={{ color: rarityColor }}>{data.item.rarity}</span></div>
          <div className={`font-bold text-sm leading-tight ${isDone ? 'text-teal-400 line-through' : 'text-slate-100'}`}>
            {data.item.name}
          </div>
        </div>
        <button 
          onClick={() => activeProjectId && toggleNodeDone(activeProjectId, data.uid)}
          className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${isDone ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-500 text-transparent hover:border-teal-500'}`}
        >
          <Check className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2 mt-2 pt-2 border-t border-slate-700">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Edit2 className="w-3 h-3" />
          <input 
            type="text" 
            placeholder="Note..." 
            value={note}
            onChange={(e) => activeProjectId && setNodeNote(activeProjectId, data.uid, e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-300 placeholder:text-slate-600"
          />
        </div>
        
        {data.isBase && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
             <PlayCircle className="w-3 h-3 text-orange-400" />
             <input 
               type="number" 
               placeholder="Start From" 
               value={startAmount || ''}
               onChange={(e) => activeProjectId && updateStartFrom(activeProjectId, data.id, Number(e.target.value))}
               className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 outline-none w-full text-orange-300"
               title="Stock saat ini (Start From)"
             />
          </div>
        )}
      </div>

      {data.isTruncated && (
        <div className="text-[10px] text-red-400 mt-2 text-center bg-red-950/30 py-1 rounded">
          Max Depth Reached
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-10 !bg-slate-500" />
    </div>
  );
};

const nodeTypes = { customItemNode: CustomNode };

// ================= Main Component =================
export default function MassingTree({ project, itemsData, recipesData }: { project: ProjectState, itemsData: any, recipesData: any }) {
  const { setMaxDepth } = useStore();

  const { nodes, edges } = useMemo(() => {
    return generateTree(project.targetId, project.maxDepth, recipesData, itemsData);
  }, [project.targetId, project.maxDepth, recipesData, itemsData]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-6">
        <div>
          <h3 className="text-lg font-bold text-white">{project.name}</h3>
          <p className="text-xs text-slate-400">Target: {itemsData[project.targetId]?.name || 'Unknown'}</p>
        </div>
        <div className="h-8 w-px bg-slate-700"></div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 flex justify-between">
            <span>Tree Depth Limit</span>
            <span className="font-bold text-teal-400">{project.maxDepth}</span>
          </label>
          <input 
            type="range" 
            min="1" max="15" 
            value={project.maxDepth} 
            onChange={(e) => setMaxDepth(project.id, Number(e.target.value))}
            className="w-32 accent-teal-500 cursor-pointer"
          />
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-950"
        minZoom={0.1}
      >
        <Background color="#1e293b" gap={16} size={1} />
        <Controls className="bg-slate-800 border-slate-700 fill-teal-500" />
      </ReactFlow>
    </div>
  );
}
