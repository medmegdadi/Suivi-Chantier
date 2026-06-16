export type Role = 'admin' | 'viewer';

export interface User {
  username: string;
  role: Role;
}

export type UninspectedMode = 'unknown' | 'zero' | 'hundred';

export interface SiteSettings {
  totalSiteRooms: number | null;
  uninspectedMode: UninspectedMode;
  enableGlobalEstimation: boolean;
}

export interface RoomStatus {
  id: string;
  roomName: string;
  floor: 'SS2' | 'SS1' | 'RDC' | 'R+1' | 'R+2' | 'Toiture' | string;
  zone: 'Nord' | 'Sud' | 'Zone 1' | 'Zone 2' | 'Zone 3' | string;
  status: 'Terminé' | 'En cours' | 'Non inspecté' | 'Bloqué' | string;
  progress: number;
  missingWork: string[];
}
