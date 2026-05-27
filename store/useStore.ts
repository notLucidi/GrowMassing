import { create } from 'zustand';

export interface ProjectState {
  id: string;
  name: string;
  targetId: number;
  targetAmount: number;
  maxDepth: number;
  doneNodes: Record<string, boolean>;
  notes: Record<string, string>;
  currentStock: Record<string, number>; // uid -> amount
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
      targetAmount: 1, // Default target amount
      maxDepth: 15,    // Default depth diperbesar
      doneNodes: {},
      notes: {},
      currentStock: {}
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

  saveData: () => {
    const { projects } = get();
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'growtopia_projects.json';
    a.click();
  },

  loadData: (data) => set({ projects: data, activeProjectId: data.length > 0 ? data[0].id : null })
}));
