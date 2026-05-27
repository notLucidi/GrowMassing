"use client";

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import MassingTree from '../components/MassingTree';
import { Save, Upload, Plus, Trash, Folder, Loader2, Menu, X } from 'lucide-react';

export default function Home() {
  const { 
    projects, activeProjectId, itemsData, recipesData, 
    setGlobalData, createProject, setActiveProject, deleteProject, saveData, loadData 
  } = useStore();

  const [newProjName, setNewProjName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk Mobile

  useEffect(() => {
    async function initData() {
      try {
        const [itemsRes, splicesRes] = await Promise.all([fetch('/items.json'), fetch('/splices.txt')]);
        if (!itemsRes.ok || !splicesRes.ok) throw new Error("Gagal memuat file aset.");

        const itemsJson = await itemsRes.json();
        const itemMap: Record<number, any> = {};
        itemsJson.items.forEach((item: any) => { itemMap[item.itemID] = item; });

        const splicesText = await splicesRes.text();
        const recipes: Record<number, [number, number]> = {};
        splicesText.split('\n').forEach(line => {
          const parts = line.trim().split('|');
          if (parts.length === 3) recipes[Number(parts[0])] = [Number(parts[1]), Number(parts[2])];
        });

        setGlobalData(itemMap, recipes);
      } catch (err) { console.error(err); } finally { setIsLoadingData(false); }
    }
    initData();
  }, [setGlobalData]);

  const filteredItems = useMemo(() => {
    if (!searchQuery || !itemsData) return [];
    const lowerQ = searchQuery.toLowerCase();
    return Object.values(itemsData)
      .filter((item: any) => item.name.toLowerCase().includes(lowerQ))
      .slice(0, 15);
  }, [searchQuery, itemsData]);

  const handleCreateProject = () => {
    if (!newProjName.trim() || !selectedTargetId) {
      alert("Isi Nama Project dan pilih Target dari dropdown.");
      return;
    }
    createProject(newProjName, selectedTargetId);
    setNewProjName('');
    setSearchQuery('');
    setSelectedTargetId(null);
    setIsSidebarOpen(false); // Tutup sidebar otomatis di HP setelah buat project
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (isLoadingData) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
      <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
      <p className="text-slate-400 font-medium">Memuat database Growtopia...</p>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden text-sm relative bg-slate-950">
      
      {/* Mobile Header Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-teal-400 shadow-xl"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay untuk Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <div className={`fixed md:relative z-40 w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-800 mt-12 md:mt-0">
          <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2"><Folder className="w-5 h-5"/> Projects</h2>
        </div>
        
        <div className="p-4 border-b border-slate-800 flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="Nama Project (ex: Mass Portcullis)" 
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-teal-500 transition-colors"
          />
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari Target (Pilih yg berakhiran Seed)" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setSelectedTargetId(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-teal-500 transition-colors"
            />
            {showSuggestions && searchQuery && filteredItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 custom-scrollbar">
                {filteredItems.map(item => (
                  <div 
                    key={item.itemID} 
                    className="p-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                    onClick={() => {
                      setSelectedTargetId(item.itemID);
                      setSearchQuery(item.name);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="font-semibold text-slate-200">{item.name}</div>
                    <div className="text-[10px] text-slate-400">ID: {item.itemID} | Rarity: {item.rarity}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleCreateProject} className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2 flex items-center justify-center gap-2 font-semibold transition-colors shadow-lg shadow-teal-900/20">
            <Plus className="w-4 h-4"/> Buat Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {projects.map(p => (
            <div 
              key={p.id}
              onClick={() => { setActiveProject(p.id); setIsSidebarOpen(false); }}
              className={`p-3 rounded-lg mb-2 cursor-pointer flex justify-between items-center group transition-all duration-200 ${activeProjectId === p.id ? 'bg-teal-900/40 border border-teal-500/50 text-teal-200 shadow-md' : 'hover:bg-slate-800 text-slate-400 border border-transparent'}`}
            >
              <div className="font-medium truncate pr-2">{p.name}</div>
              <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-opacity">
                <Trash className="w-4 h-4"/>
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center text-slate-600 mt-10 text-xs">Belum ada project</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-2">
          <button onClick={saveData} className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-lg py-2 flex items-center justify-center gap-2 transition-colors border border-slate-700">
            <Save className="w-4 h-4"/> Save
          </button>
          <label className="flex-1 bg-slate-800 hover:bg-slate-700 rounded-lg py-2 flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4"/> Load
            <input type="file" accept=".json" className="hidden" onChange={(e) => {
               const file = e.target.files?.[0];
               if (!file) return;
               const reader = new FileReader();
               reader.onload = (e) => loadData(JSON.parse(e.target?.result as string));
               reader.readAsText(file);
            }} />
          </label>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        {activeProject ? (
           <MassingTree project={activeProject} itemsData={itemsData} recipesData={recipesData} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 px-4 text-center">
            Pilih atau buat project baru di sidebar untuk memulai kalkulasi.
          </div>
        )}
      </div>
    </div>
  );
}
