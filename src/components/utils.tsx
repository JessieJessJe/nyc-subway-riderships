const scaleCoordinates = (latitude: number, longitude: number, canvasDimensions: { width: number; height: number }) => {
    const latMin = 40.6; // Adjusted to move closer
    const latMax = 40.9; // Adjusted to move closer
    const lonMin = -74.2; // Adjusted to move closer
    const lonMax = -73.8; // Adjusted to move closer

    const x = ((longitude - lonMin) / (lonMax - lonMin)) * canvasDimensions.width;
    const y = ((latMax - latitude) / (latMax - latMin)) * canvasDimensions.height;

    return { x, y };
};

export default scaleCoordinates;
