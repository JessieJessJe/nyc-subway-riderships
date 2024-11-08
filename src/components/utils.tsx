export const scaleCoordinates = (
    latitude: number,
    longitude: number,
    canvasDimensions: { width: number; height: number },
) => {
    const latMin = 40.6; // Northernmost latitude
    const latMax = 40.9; // Southernmost latitude
    const lonMin = -74.2; // Westernmost longitude
    const lonMax = -73.8; // Easternmost longitude

    // Calculate the range for latitude and longitude
    const latRange = latMax - latMin;
    const lonRange = lonMax - lonMin;

    // Calculate the center offset for x
    const centerLon = (lonMax + lonMin) / 2;
    const centerX = ((centerLon - lonMin) / lonRange) * canvasDimensions.height;

    // Calculate the x and y coordinates based on the canvas dimensions
    const x_raw = ((longitude - lonMin) / lonRange) * canvasDimensions.height;
    const y = ((latMax - latitude) / latRange) * canvasDimensions.height;

    const x = x_raw - centerX + canvasDimensions.width / 2;

    return { x, y };
};

export const interpolateColor = (color1: string, color2: string, factor: number) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const result = rgb1.map((c, i) => Math.round(c + factor * (rgb2[i] - c)));
    return `rgb(${result.join(',')})`;
};

export const hexToRgb = (hex: string) => {
    const bigint = parseInt(hex.replace(/^#/, ''), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

export const getColorForRidership = (ridership: number, maxRidership: number, brightness: number) => {
    const normalizedRidership = Math.min(1, ridership / maxRidership);
    const grayValue = Math.round(100 + (155 * normalizedRidership));
    return `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${brightness})`;
};