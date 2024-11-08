export interface StationData {
    station_complex_id: string;
    transit_day: string;
    transit_hour: string;
    station_complex: string;
    total_ridership: number;
    latitude: number;
    longitude: number;
    borough: string;
}

export interface CanvasDimensions {
    width: number;
    height: number;
}

export interface TimeState {
    day: string;
    hour: string;
}