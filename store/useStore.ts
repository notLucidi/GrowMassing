import { create } from 'zustand';

export interface HarvestSettings {
  harvestTargetId: number | null;
  numTrees: number;
  // Harvest Modifiers
  hos: boolean;
  fuel: boolean;
  dcs: boolean;
  // Breaking Modifiers
  ancesBlue: boolean;
  builder: boolean;
  ancesRed: boolean;
  gemini: boolean;
  farmer: boolean;
}

export interface ProjectState {
  id: string;
  name: string;
  targetId: number;
  targetAmount: number;
  maxDepth: number;
  seedReturnRate: number;
  doneNodes: Record<string, boolean>;
  notes: Record<string, string>;
  currentStock: Record<string, number>;
  harvestSettings: HarvestSettings;
}

interface AppState {
  projects: ProjectState[];
  activeProjectId: string | null;
  itemsData: Record<number, any> | null;
  recipesData: Record<number, [number, number]> | null;
  
  setGlobalData: (items: any, recipes: any) => void;
  createProject: (name: string, targetId: number) => void;
  setActiveProject: (id: string) => void;
  deleteProject: (id: string) => void;
  
  toggleNodeDone: (projectId: string, uid: string) => void;
  setNodeNote: (projectId: string, uid: string, note: string) => void;
  updateStock: (projectId: string, uid: string, amount: number) => void;
  setMaxDepth: (projectId: string, depth: number) => void;
  setTargetAmount: (projectId: string, amount: number) => void;
  setSeedReturnRate: (projectId: string, rate: number) => void;
  updateHarvestSettings: (projectId: string, settings: Partial<HarvestSettings>) => void;

  saveData: () => void;
  loadData: (data: any) => void;
}

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  itemsData: null,
  recipesData: null,

  setGlobalData: (items, recipes) => set({ itemsData: items, recipesData: recipes }),
  
  createProject: (name, targetId) => set((state) => {
    const newProj: ProjectState = {
      id: crypto.randomUUID(),
      name,
      targetId,
      targetAmount: 1000,
      maxDepth: 15,
      seedReturnRate: 0.8,
      doneNodes: {},
      notes: {},
      currentStock: {},
      harvestSettings: {
        harvestTargetId: null,
        numTrees: 1000,
        hos: false, fuel: false, dcs: false,
        ancesBlue: false, builder: false, ancesRed: false, gemini: false, farmer: false
      }
    };
    return { projects: [...state.projects, newProj], activeProjectId: newProj.id };
  }),

  setActiveProject: (id) => set({ activeProjectId: id }),
  
  deleteProject: (id) => set((state) => ({ 
    projects: state.projects.filter(p => p.id !== id),
    activeProjectId: state.activeProjectId === id ? (state.projects.length > 1 ? state.projects[0].id : null) : state.activeProjectId
  })),

  toggleNodeDone: (projectId, uid) => set((state) => ({
    projects: state.projects.map(p => p.id === projectId ? { ...p, doneNodes: { ...p.doneNodes, [uid]: !p.doneNodes[uid] } } : p)
  })),

  setNodeNote: (projectId, uid, note) => set((state) => ({
    projects: state.projects.map(p => p.id === projectId ? { ...p, notes: { ...p.notes, [uid]: note } } : p)
  })),

  updateStock: (projectId, uid, amount) => set((state) => ({
    projects: state.projects.map(p => p.id === projectId ? { ...p, currentStock: { ...p.currentStock, [uid]: amount } } : p)
  })),

  setMaxDepth: (projectId, depth) => set((state) => ({
    projects: state.projects.map(p => p.id === projectId ? { ...p, maxDepth: depth } : p)
  })),
  
  setTargetAmount: (projectId, amount) => set((state) => ({
    projects: state.projects.map(p => p.id === projectId ? { ...p, targetAmount: amount } : p)
  })),

  setSeedReturnRate: (projectId, rate) => set((state) => ({
    projects: state.projects.map(p => p.id === projectId ? { ...p, seedReturnRate: rate } : p)
  })),

  updateHarvestSettings: (projectId, settings) => set((state) => ({
    projects: state.projects.map(p => p.id === projectId ? { 
      ...p, 
      harvestSettings: { ...p.harvestSettings, ...settings } 
    } : p)
  })),

  saveData: () => {
    const { projects } = get();
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'growtopia_projects.json';
    a.click();
  },

  loadData: (data) => set(() => {
    const migratedData = data.map((p: any) => ({
      ...p,
      harvestSettings: {
        harvestTargetId: p.harvestSettings?.harvestTargetId ?? null,
        numTrees: p.harvestSettings?.numTrees ?? 1000,
        hos: p.harvestSettings?.hos ?? false,
        fuel: p.harvestSettings?.fuel ?? false,
        dcs: p.harvestSettings?.dcs ?? false,
        ancesBlue: p.harvestSettings?.ancesBlue ?? false,
        builder: p.harvestSettings?.builder ?? false,
        ancesRed: p.harvestSettings?.ancesRed ?? false,
        gemini: p.harvestSettings?.gemini ?? false,
        farmer: p.harvestSettings?.farmer ?? false,
      }
    }));
    return { projects: migratedData, activeProjectId: migratedData.length > 0 ? migratedData[0].id : null };
  })
}));
