import { RoomStatus, Role } from "../types";
import { CheckCircle2, Clock, Pencil, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

interface DataTableProps {
  rooms: RoomStatus[];
  role?: Role;
  onEdit?: (room: RoomStatus) => void;
  onDelete?: (id: string) => void;
}

export function DataTable({ rooms, role, onEdit, onDelete }: DataTableProps) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
        <p className="text-gray-500">Aucune donnée disponible. Veuillez importer un rapport Dalux.</p>
      </div>
    );
  }

  const isAdmin = role === 'admin';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <th className="px-6 py-4">Local</th>
              <th className="px-6 py-4">Étage</th>
              <th className="px-6 py-4">Zone</th>
              <th className="px-6 py-4 w-1/3">Travaux Restants</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Avancement</th>
              {isAdmin && <th className="px-6 py-4 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.map((room) => (
              <tr 
                key={room.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  room.status === 'Terminé' && "bg-green-50/30"
                )}
              >
                <td className="px-6 py-4 font-medium text-gray-900">{room.roomName}</td>
                <td className="px-6 py-4 text-gray-600">{room.floor}</td>
                <td className="px-6 py-4 text-gray-600">{room.zone}</td>
                <td className="px-6 py-4">
                  {room.missingWork.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {room.missingWork.map((work, idx) => (
                        <li key={idx}>{work}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Aucun travail restant</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium space-x-1.5",
                      room.status === 'Terminé' ? "bg-green-100 text-green-700" :
                      room.status === 'Non inspecté' ? "bg-gray-100 text-gray-700" :
                      room.status === 'Bloqué' ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    )}
                  >
                    {room.status === 'Terminé' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    <span>{room.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <span className="text-sm font-medium text-gray-900">{room.progress}%</span>
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          room.progress === 100 ? "bg-green-500" : "bg-orange-400"
                        )}
                        style={{ width: `${room.progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                       <button 
                         onClick={() => onEdit?.(room)}
                         className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                         title="Modifier"
                       >
                         <Pencil size={16} />
                       </button>
                       <button 
                         onClick={() => onDelete?.(room.id)}
                         className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                         title="Supprimer"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
