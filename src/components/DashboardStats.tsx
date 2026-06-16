import { useMemo } from 'react';
import { RoomStatus, SiteSettings } from '../types';
import { Building2, CheckCircle2, Clock, AlertCircle, LayoutDashboard, PieChart, Target, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie } from 'recharts';

interface DashboardStatsProps {
  rooms: RoomStatus[];
  settings: SiteSettings;
}

const COLORS = {
  Terminé: '#22c55e',
  'En cours': '#f97316',
  'Non inspecté': '#9ca3af',
  'Bloqué': '#ef4444'
};

export function DashboardStats({ rooms, settings }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const totalRoomsBIM = rooms.length;
    let finished = 0;
    let inProgress = 0;
    let blocked = 0;
    let notInspected = 0;
    let totalProgressLocal = 0;

    rooms.forEach(room => {
      if (room.status === 'Terminé') finished++;
      else if (room.status === 'Bloqué') blocked++;
      else if (room.status === 'Non inspecté') notInspected++;
      else inProgress++;
      
      // Calculate progress of only inspected rooms
      if (room.status !== 'Non inspecté') {
         totalProgressLocal += room.progress;
      }
    });

    const inspectedCount = totalRoomsBIM - notInspected;
    const progressPercentLocal = inspectedCount === 0 ? 0 : totalProgressLocal / inspectedCount;
    
    // Global progress logic
    const couverture = totalRoomsBIM === 0 ? 0 : (inspectedCount / totalRoomsBIM) * 100;
    let globalProgressPercent = progressPercentLocal;

    if (totalRoomsBIM > 0 && settings.enableGlobalEstimation) {
       if (settings.uninspectedMode === 'unknown' || settings.uninspectedMode === 'zero') {
          globalProgressPercent = (totalProgressLocal) / totalRoomsBIM;
       } else if (settings.uninspectedMode === 'hundred') {
          globalProgressPercent = (totalProgressLocal + (notInspected * 100)) / totalRoomsBIM;
       }
    }

    // Chart Data
    const floorDataMap = new Map();
    const zoneDataMap = new Map();

    rooms.forEach(room => {
       // Floor
       if (!floorDataMap.has(room.floor)) {
          floorDataMap.set(room.floor, { name: room.floor, total: 0, progress: 0 });
       }
       // only calculate floor charts for inspected? Or all? Let's assume all.
       const f = floorDataMap.get(room.floor);
       f.total += 1;
       if (room.status !== 'Non inspecté') f.progress += room.progress;

       // Zone
       if (!zoneDataMap.has(room.zone)) {
          zoneDataMap.set(room.zone, { name: room.zone, total: 0, progress: 0 });
       }
       const z = zoneDataMap.get(room.zone);
       z.total += 1;
       if (room.status !== 'Non inspecté') z.progress += room.progress;
    });

    const floorData = Array.from(floorDataMap.values()).map(d => ({
       name: d.name,
       Avancement: Math.round(d.progress / Math.max(1, d.total))
    }));

    const statusData = [
      { name: 'Terminé', value: finished },
      { name: 'En cours', value: inProgress },
      { name: 'Bloqué', value: blocked },
      { name: 'Non inspecté', value: notInspected },
    ].filter(d => d.value > 0);

    return { 
      total: totalRoomsBIM, 
      inspected: inspectedCount,
      finished, 
      inProgress,
      blocked,
      notInspected,
      progressPercentLocal,
      globalProgressPercent,
      couverture,
      enableGlobalEstimation: settings.enableGlobalEstimation,
      floorData,
      statusData
    };
  }, [rooms, settings]);

  return (
    <div className="space-y-6 mb-8">
      {/* Top Cards for Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Coverage & Rooms */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
               <p className="text-sm font-semibold text-gray-500">Locaux Inspectés</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-1">
                 {stats.inspected}
                 <span className="text-sm text-gray-400 font-normal ml-1">/ {stats.total} (Base BIM)</span>
               </h3>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
               <Building2 size={24} />
            </div>
          </div>
          {stats.total > 0 && (
             <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                   <span className="font-medium text-gray-600">Couverture Chantier</span>
                   <span className="font-bold text-blue-600">{stats.couverture.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                   <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${stats.couverture}%` }}></div>
                </div>
             </div>
          )}
        </div>

        {/* Inspected Avancement */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
             <div>
                <p className="text-sm font-semibold text-gray-500">Avancement Inspecté</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.progressPercentLocal.toFixed(1)}%</h3>
             </div>
             <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
                <Target size={24} />
             </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-tight">Basé uniquement sur les {stats.inspected} locaux ayant un rapport Dalux.</p>
        </div>

        {/* Global Avancement */}
        <div className="bg-gray-900 p-5 rounded-xl shadow-md flex flex-col justify-between text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <LayoutDashboard size={80} />
           </div>
           <div className="relative z-10 flex items-start justify-between mb-2">
              <div>
                 <p className="text-sm font-medium text-gray-300">Avancement Global Estimé</p>
                 {stats.enableGlobalEstimation ? (
                    <h3 className="text-3xl font-bold text-white mt-1">{stats.globalProgressPercent.toFixed(1)}%</h3>
                 ) : (
                    <h3 className="text-xl font-bold text-gray-400 mt-2">Désactivé</h3>
                 )}
              </div>
           </div>
           {stats.enableGlobalEstimation && (
             <p className="text-xs text-gray-400 mt-1 leading-tight relative z-10">Calculé sur la base des {stats.total} locaux totaux identifiés.</p>
           )}
        </div>

        {/* Quick Status Bar */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
           <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-green-700">
                 <CheckCircle2 size={16}/> <span className="font-medium">Terminés</span>
              </div>
              <span className="font-bold">{stats.finished}</span>
           </div>
           <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-orange-600">
                 <Clock size={16}/> <span className="font-medium">En cours</span>
              </div>
              <span className="font-bold">{stats.inProgress}</span>
           </div>
           <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-500">
                 <Building2 size={16}/> <span className="font-medium">Non inspectés</span>
              </div>
              <span className="font-bold">{stats.notInspected}</span>
           </div>
        </div>

      </div>

      {/* Charts Grid */}
      {stats.total > 0 && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           {/* Floor Progression */}
           <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2">
             <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><PieChart size={16} className="mr-2 text-gray-500"/> Avancement Moyen par Étage (%)</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.floorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} />
                   <Tooltip 
                     cursor={{ fill: '#f3f4f6' }}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="Avancement" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>

           {/* Status Distribution */}
           <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
             <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center"><PieChart size={16} className="mr-2 text-gray-500"/> Répartition des Statuts</h3>
             <div className="h-64 flex flex-col justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <RechartsPieChart>
                   <Pie
                     data={stats.statusData}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {stats.statusData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   />
                 </RechartsPieChart>
               </ResponsiveContainer>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
