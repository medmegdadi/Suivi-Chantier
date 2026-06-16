import { CheckCircle2, AlertCircle, Clock, Building2, LayoutDashboard } from "lucide-react";

interface DashboardCardsProps {
  total: number;
  finished: number;
  inProgress: number;
  progressPercentLocal: number;
  globalProgressPercent: number;
  totalSiteRooms: number | null;
  uninspectedAreDone: boolean;
}

export function DashboardCards({ total, finished, inProgress, progressPercentLocal, globalProgressPercent, totalSiteRooms, uninspectedAreDone }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
        <div className="bg-gray-100 p-3 rounded-lg text-gray-700">
          <Building2 size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Locaux Inspectés</p>
          <p className="text-2xl font-bold text-gray-900">
            {total}
            {totalSiteRooms && <span className="text-sm text-gray-400 font-normal ml-1">/ {totalSiteRooms}</span>}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
        <div className="bg-green-100 p-3 rounded-lg text-green-700">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Inspectés Terminés</p>
          <p className="text-2xl font-bold text-gray-900">{finished}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
        <div className="bg-orange-100 p-3 rounded-lg text-orange-700">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">En Cours</p>
          <p className="text-2xl font-bold text-gray-900">{inProgress}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
        <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Avancement (Inspectés)</p>
          <p className="text-2xl font-bold text-blue-700">{progressPercentLocal.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-indigo-600 p-6 rounded-xl shadow-md flex items-center space-x-4 text-white hover:bg-indigo-700 transition-colors relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <AlertCircle size={64} />
        </div>
        <div className="bg-indigo-500/50 p-3 rounded-lg">
          <AlertCircle size={24} />
        </div>
        <div className="relative z-10">
          <p className="text-sm text-indigo-100 font-medium">Avancement Global</p>
          {totalSiteRooms ? (
            <p className="text-2xl font-bold">{globalProgressPercent.toFixed(1)}%</p>
          ) : (
             <p className="text-sm mt-1">Non défini <br/><span className="text-xs opacity-75">(Voir Paramètres)</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
