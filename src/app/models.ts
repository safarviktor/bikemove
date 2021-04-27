export interface Trip
{
  id: number;
  startedAt: Date; 
  endedAt: Date;
  durationSeconds: number;
  startStationName: string;
  startLatitude: number;
  startLongitude: number;
  endStationName: string;
  endLatitude: number;
  endLongitude: number;
} 