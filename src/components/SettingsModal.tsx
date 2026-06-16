import { useState, FormEvent, useEffect } from "react";
import { SiteSettings, UninspectedMode } from "../types";
import { X } from "lucide-react";

interface SettingsModalProps {
  settings: SiteSettings;
  onClose: () => void;
  onSave: (settings: SiteSettings) => Promise<void>;
}

export function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
  const [totalRooms, setTotalRooms] = useState<string>("");
  const [uninspectedMode, setUninspectedMode] = useState<UninspectedMode>("unknown");
  const [enableGlobalEstimation, setEnableGlobalEstimation] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings.totalSiteRooms) {
      setTotalRooms(settings.totalSiteRooms.toString());
    }
    if (settings.uninspectedMode) setUninspectedMode(settings.uninspectedMode);
    if (settings.enableGlobalEstimation !== undefined) setEnableGlobalEstimation(settings.enableGlobalEstimation);
  }, [settings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await onSave({
      totalSiteRooms: totalRooms === "" ? null : parseInt(totalRooms, 10),
      uninspectedMode,
      enableGlobalEstimation
    });
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-lg">
            Paramètres du Projet
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto max-h-[80vh]">
          <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">Activer l'estimation globale</label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-blue-600 outline-none focus:outline-none" checked={enableGlobalEstimation} onChange={e => setEnableGlobalEstimation(e.target.checked)}/>
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Calcule un pourcentage d'avancement pour tout le chantier en se basant sur les inspections et la couverture totale de la base BIM (Revit).</p>

              {enableGlobalEstimation && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Statut des locaux non inspectés</label>
                  <p className="text-xs text-gray-500 mb-2">
                    Comment le système doit-il considérer les locaux de la base BIM qui n'ont pas encore de rapport Dalux ?
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="uninspected" value="unknown" checked={uninspectedMode === 'unknown'} onChange={() => setUninspectedMode('unknown')} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Inconnu (Recommandé)</p>
                        <p className="text-xs text-gray-500">Ne compte pas dans l'avancement inspecté. L'avancement global estime que le reste n'est pas commencé (0%).</p>
                      </div>
                    </label>
                    <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="uninspected" value="zero" checked={uninspectedMode === 'zero'} onChange={() => setUninspectedMode('zero')} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Non commencé (0%)</p>
                        <p className="text-xs text-gray-500">Approche conservatrice. Baisse drastiquement l'avancement global.</p>
                      </div>
                    </label>
                    <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="uninspected" value="hundred" checked={uninspectedMode === 'hundred'} onChange={() => setUninspectedMode('hundred')} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Terminé (100%)</p>
                        <p className="text-xs text-gray-500">À utiliser uniquement si les rapports ne concernent que les zones à problèmes et que tout le reste est validé.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>
        
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="settings-form"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isLoading ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
        </div>
      </div>
    </div>
  );
}
