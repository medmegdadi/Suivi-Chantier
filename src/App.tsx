import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, LogOut, Plus, Settings } from 'lucide-react';
import { RoomStatus, User, SiteSettings } from './types';
import { DashboardStats } from './components/DashboardStats';
import { ImportSection } from './components/ImportSection';
import { DataTable } from './components/DataTable';
import { Login } from './components/Login';
import { RoomModal } from './components/RoomModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({ 
    totalSiteRooms: null, 
    uninspectedMode: 'unknown',
    enableGlobalEstimation: true
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals specific state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomStatus | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("Tous");
  const [zoneFilter, setZoneFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState("Tous");

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyzeUpload = async (payload: { file?: File; text?: string }) => {
    setIsLoading(true);
    try {
      let body: FormData | string;
      let headers: HeadersInit = {};

      if (payload.file) {
        const formData = new FormData();
        formData.append("reportFile", payload.file);
        body = formData;
      } else {
        headers = { 'Content-Type': 'application/json' };
        body = JSON.stringify({ reportText: payload.text });
      }

      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de l\'analyse');
      }
      
      const data = await response.json();
      if (data.rooms) {
        // Enregistrer les nouveaux locaux analysés
        const saveRes = await fetch("/api/rooms", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rooms: data.rooms })
        });
        if (saveRes.ok) {
           const savedRooms = await saveRes.json();
           setRooms(savedRooms);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur s'est produite lors de l'analyse du rapport.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce local ?")) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRoom = async (roomData: Partial<RoomStatus>) => {
    setIsLoading(true);
    try {
      if (editingRoom?.id) {
        // Update
        const res = await fetch(`/api/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roomData)
        });
        if (res.ok) {
          fetchRooms();
        }
      } else {
        // Add
        const res = await fetch('/api/rooms/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roomData)
        });
        if (res.ok) {
          fetchRooms();
        }
      }
      setIsModalOpen(false);
      setEditingRoom(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room: RoomStatus) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleSaveSettings = async (newSettings: SiteSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings })
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setIsSettingsOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Unique values for filters
  const floors = useMemo(() => ["Tous", ...Array.from(new Set(rooms.map(r => r.floor))).sort()], [rooms]);
  const zones = useMemo(() => ["Toutes", ...Array.from(new Set(rooms.map(r => r.zone))).sort()], [rooms]);
  const statuses = useMemo(() => ["Tous", "Terminé", "En cours", "Non inspecté", "Bloqué"], []);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.roomName.toLowerCase().includes(search.toLowerCase());
      const matchesFloor = floorFilter === "Tous" || room.floor === floorFilter;
      const matchesZone = zoneFilter === "Toutes" || room.zone === zoneFilter;
      const matchesStatus = statusFilter === "Tous" || room.status === statusFilter;
      return matchesSearch && matchesFloor && matchesZone && matchesStatus;
    }).sort((a, b) => {
       const priority: Record<string, number> = { 'Bloqué': 4, 'En cours': 3, 'Terminé': 2, 'Non inspecté': 1 };
       const aP = priority[a.status] || 0;
       const bP = priority[b.status] || 0;
       if (aP !== bP) return bP - aP;
       return b.progress - a.progress;
    });
  }, [rooms, search, floorFilter, zoneFilter, statusFilter]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">CHU Dakhla - Suivi de Chantier</h1>
            <p className="text-gray-500 mt-1">Plateforme digitale d'analyse des rapports Dalux</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200 transition-colors"
                title="Paramètres globaux"
              >
                <Settings size={20} />
                <span className="ml-1 text-sm hidden md:inline">Paramètres</span>
               </button>
            )}
            <div className="text-sm text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
              Connecté : <span className="font-semibold">{user.username}</span> ({user.role})
            </div>
            <button 
              onClick={() => setUser(null)}
              className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Dashboard KPIs */}
        <DashboardStats rooms={rooms} settings={settings} />

        {/* Import Tool - Only visible to Admins */}
        {isAdmin && <ImportSection onAnalyze={handleAnalyzeUpload} isLoading={isLoading} />}

        {/* Filters and Table */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative w-full md:w-96 flex items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un local..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {isAdmin && (
                <button
                  onClick={openAddModal}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <Plus size={16} />
                  <span className="hidden md:inline">Ajouter</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm w-full md:w-auto">
                <Filter size={16} className="text-gray-500" />
                <span className="font-medium text-gray-700">Statut:</span>
                <select 
                  className="bg-transparent font-medium text-gray-900 outline-none ring-0 w-full md:w-auto"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Floor Filter */}
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm w-full md:w-auto">
                <Filter size={16} className="text-gray-500" />
                <span className="font-medium text-gray-700">Étage:</span>
                <select 
                  className="bg-transparent font-medium text-gray-900 outline-none ring-0 w-full md:w-auto"
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                >
                  {floors.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm w-full md:w-auto">
                <Filter size={16} className="text-gray-500" />
                <span className="font-medium text-gray-700">Zone:</span>
                <select 
                  className="bg-transparent font-medium text-gray-900 outline-none ring-0 w-full md:w-auto"
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                >
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
          </div>

          <DataTable 
            rooms={filteredRooms} 
            role={user.role} 
            onEdit={openEditModal}
            onDelete={handleDeleteRoom}
          />
        </div>

      </div>

      {isModalOpen && (
        <RoomModal 
          room={editingRoom} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveRoom}
          isLoading={isLoading}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
