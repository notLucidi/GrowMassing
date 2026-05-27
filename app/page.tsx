"use client";

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import MassingTree from '../components/MassingTree';
import { Save, Upload, Plus, Trash, Folder, Loader2 } from 'lucide-react';

export default function Home() {
  const { 
    projects, 
    activeProjectId, 
    itemsData, 
    recipesData, 
    setGlobalData, 
    createProject, 
    setActiveProject, 
    deleteProject, 
    saveData, 
    loadData 
  } = useStore();

  const [newProjName, setNewProjName] = useState('');
  const [newProjTarget, setNewProjTarget] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Otomatis memuat database lokal dari folder public/
  useEffect(() => {
    async function initData() {
      try {
        const [itemsRes, splicesRes] = await Promise.all([
          fetch('/items.json'),
          fetch('/splices.txt')
        ]);

        if (!itemsRes.ok || !splicesRes.ok) {
          throw new Error("Gagal memuat file aset dari folder public.");
        }

        const itemsJson = await itemsRes.json();
        const itemMap: Record<number, any> = {};
        itemsJson.items.forEach((item: any) => {
          itemMap[item.itemID] = item;
        });

        const splicesText = await splicesRes.text();
        const recipes: Record<number, [number, number]> = {};
        splicesText.split('\n').forEach(line => {
          const parts = line.trim().split('|');
          if (parts.length === 3) {
            recipes[Number(parts[0])] = [Number(parts[1]), Number(parts[2])];
          }
        });

        setGlobalData(itemMap, recipes);
      } catch (err) {
        console.error("Gagal melakukan auto-load database:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    initData();
  }, [setGlobalData]);

  const handleCreateProject = () => {
    if (!newProjName.trim() || !newProjTarget.trim()) return;
    let targetId = Number(newProjTarget);
    if (isNaN(targetId) && itemsData) {
      const found = Object.values(itemsData).find((i: any) => i.name.toLowerCase() === newProjTarget.toLowerCase());
      if (found) targetId = (found as any).itemID;
    }
    if (!targetId || isNaN(targetId)) {
      alert("Item tidak ditemukan. Masukkan ID atau Nama Item dengan benar.");
      return;
    }
    createProject(newProjName, targetId);
    setNewProjName('');
    setNewProjTarget('');
  };

  const handleLoadProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        loadData(data);
      } catch (err) { alert("File JSON Proyek tidak valid."); }
    };
    reader.readAsText(file);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Memuat database Growtopia...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-sm">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2"><Folder className="w-5 h-5"/> Projects</h2>
        </div>
        
        <div className="p-4 border-b border-slate-800 flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="Nama Project (ex: Mass Portcullis)" 
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-teal-500"
          />
          <input 
            type="text" 
            placeholder="Target Item (ID/Name)" 
            value={newProjTarget}
            onChange={(e) => setNewProjTarget(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-teal-500"
          />
          <button onClick={handleCreateProject} className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2 flex items-center justify-center gap-2 font-semibold transition">
            <Plus className="w-4 h-4"/> Buat Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {projects.map(p => (
            <div 
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              className={`p-3 rounded-lg mb-2 cursor-pointer flex justify-between items-center group transition ${activeProjectId === p.id ? 'bg-teal-900/30 border border-teal-700/50 text-teal-200' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <div className="font-medium truncate">{p.name}</div>
              <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1">
                <Trash className="w-4 h-4"/>
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-2">
          <button onClick={saveData} className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-lg py-2 flex items-center justify-center gap-2 transition border border-slate-700">
            <Save className="w-4 h-4"/> Save
          </button>
          <label className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-lg py-2 flex items-center justify-center gap-2 transition border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4"/> Load
            <input type="file" accept=".json" className="hidden" onChange={handleLoadProjectFile} />
          </label>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 bg-slate-950 flex flex-col">
        {activeProject ? (
           <MassingTree project={activeProject} itemsData={itemsData} recipesData={recipesData} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Pilih atau buat project baru di sidebar.
          </div>
        )}
      </div>
    </div>
  );
}