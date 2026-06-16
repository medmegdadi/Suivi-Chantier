import { useState, useEffect, FormEvent } from "react";
import { RoomStatus } from "../types";
import { X } from "lucide-react";

interface RoomModalProps {
  room?: RoomStatus | null;
  onClose: () => void;
  onSave: (room: Partial<RoomStatus>) => Promise<void>;
  isLoading: boolean;
}

export function RoomModal({ room, onClose, onSave, isLoading }: RoomModalProps) {
  const [formData, setFormData] = useState<Partial<RoomStatus>>({
    roomName: "",
    floor: "RDC",
    zone: "Nord",
    status: "Non commencé",
    progress: 0,
    missingWork: []
  });

  const [tasksText, setTasksText] = useState("");

  useEffect(() => {
    if (room) {
      setFormData(room);
      setTasksText(room.missingWork.join("\n"));
    }
  }, [room]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Parse tasks list
    const tasks = tasksText
      .split("\n")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Auto-calculate progress and status if not manually set, or just use what's provided
    // Here we'll just trust the inputs to keep it simple and flexible for the admin
    onSave({
      ...formData,
      missingWork: tasks
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-lg">
            {room ? 'Modifier le local' : 'Ajouter un local'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto w-full">
          <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du local</label>
              <input
                required
                type="text"
                value={formData.roomName}
                onChange={e => setFormData({ ...formData, roomName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
                <select
                  value={formData.floor}
                  onChange={e => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {["SS2", "SS1", "RDC", "R+1", "R+2", "Toiture"].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <select
                  value={formData.zone}
                  onChange={e => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {["Nord", "Sud", "Zone 1", "Zone 2", "Zone 3"].map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {["Non inspecté", "En cours", "Bloqué", "Terminé"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avancement (%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Travaux Restants (un par ligne)</label>
              <textarea
                value={tasksText}
                onChange={e => setTasksText(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                placeholder="Manque bouche de soufflage..."
              />
            </div>
            
          </form>
        </div>
        
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="room-form"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
