export const scaleCoordinates = (
    latitude: number,
    longitude: number,
    canvasDimensions: { width: number; height: number },
) => {
    const latMin = 40.6; // Northernmost latitude
    const latMax = 40.9; // Southernmost latitude
    const lonMin = -74.1; // Westernmost longitude
    const lonMax = -73.7; // Easternmost longitude

    // Calculate the range for latitude and longitudeR
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

// Function to interpolate between two colors on a log scale
export const interpolateRainbowColor = (factor: number) => {
    const dark = [181, 13, 170];
    const light = [230, 174, 227];

    // Use factor directly since it's already logarithmically scaled
    const result = dark.map((c, i) => Math.round(c + factor * (light[i] - c)));
    return `rgb(${result.join(',')})`;
};

export const getColorForRidership = (normalizedRidership: number, brightness: number) => {
    const rgbColor = interpolateRainbowColor(normalizedRidership);
    return `rgba(${rgbColor.slice(4, -1)}, ${brightness})`; // Assuming rgbColor is in the format 'rgb(r, g, b)'
};

export const logBins = [1, 2.69, 7.24, 19.95, 54.55, 149.54, 409.49, 1122.02, 3073.8, 8421.87, 20000];

export const binStyles = [
    { fill: '#8E0485', stroke: '#8E0485', strokeWidth: 1 },
    { fill: '#8E0485', stroke: '#8E0485', strokeWidth: 1 },
    { fill: '#8E0485', stroke: '#8E0485', strokeWidth: 1 },
    { fill: '#B50DA9', stroke: '#B50DA9', strokeWidth: 1 },
    { fill: '#C543BD', stroke: '#C543BD', strokeWidth: 1 },
    { fill: '#D778D1', stroke: '#D778D1', strokeWidth: 1 },
    { fill: '#E6AEE3', stroke: '#E6AEE3', strokeWidth: 1 },
    { fill: '#FFFFFF', stroke: '#FFFFFF', strokeWidth: 1 },
    { fill: '#FFFFFF', stroke: '#FFFFFF', strokeWidth: 1 },
    { fill: '#FFFFFF', stroke: '#FFFFFF', strokeWidth: 1 },
];

export const tooltipContent = 'This histogram uses logarithmic binning to show station ridership distribution. The x-axis uses a log scale with custom bins to highlight different traffic patterns. The lighter the color, the more ridership.';