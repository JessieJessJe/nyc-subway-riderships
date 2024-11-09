export const scaleCoordinates = (
    latitude: number,
    longitude: number,
    canvasDimensions: { width: number; height: number },
) => {
    const latMin = 40.6; // Northernmost latitude
    const latMax = 40.9; // Southernmost latitude
    const lonMin = -74.1; // Westernmost longitude
    const lonMax = -73.7; // Easternmost longitude

    // Calculate the range for latitude and longitude
    const latRange = latMax - latMin;
    const lonRange = lonMax - lonMin;

    // Determine the scaling factor and offset based on the smaller dimension
    const scaleFactor = Math.min(canvasDimensions.width, canvasDimensions.height);
    const isWidthBased = canvasDimensions.width < canvasDimensions.height;

    // Calculate the x and y coordinates based on the canvas dimensions
    const x_raw = ((longitude - lonMin) / lonRange) * scaleFactor;
    const y_raw = ((latMax - latitude) / latRange) * scaleFactor;

    // Apply offset based on the scaling dimension
    const x = isWidthBased ? x_raw : x_raw + (canvasDimensions.width - scaleFactor) / 2;
    const y = isWidthBased ? y_raw + (canvasDimensions.height - scaleFactor) / 2 : y_raw;

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