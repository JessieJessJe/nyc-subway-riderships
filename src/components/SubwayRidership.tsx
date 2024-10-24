import React, { useEffect, useState, useRef } from 'react';
import data from '../assets/MTA_ridership_data.json'; // Import JSON data

// Define the data structure based on your dataset
interface StationData {
  station_complex_id: string;
  transit_day: string;
  transit_hour: string;
  station_complex: string;
  total_ridership: number;
  latitude: number;
  longitude: number;
  borough: string;
}

const SubwayRidership: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWidth = 800; // Set canvas width
  const canvasHeight = 600; // Set canvas height

  const [currentTime, setCurrentTime] = useState<{ day: string, hour: string }>({ day: '', hour: '' });
  const [dayHourCombinations, setDayHourCombinations] = useState<string[]>([]);
  const [sliderIndex, setSliderIndex] = useState(0); // Index for slider

  // Scale lat/lon values to canvas coordinates
  const scaleCoordinates = (latitude: number, longitude: number) => {
    const latMin = 40.5;
    const latMax = 41;
    const lonMin = -74.3;
    const lonMax = -73.7;
    
    const x = ((longitude - lonMin) / (lonMax - lonMin)) * canvasWidth;
    const y = ((latMax - latitude) / (latMax - latMin)) * canvasHeight;
    
    return { x, y };
  };

  // Draw data points on canvas based on the selected day and hour
  const drawOnCanvas = (ctx: CanvasRenderingContext2D, day: string, hour: string) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear the canvas

    data.forEach((station: StationData) => {
      if (station.transit_day === day && station.transit_hour === hour) {
        const { x, y } = scaleCoordinates(station.latitude, station.longitude);
        const brightness = Math.min(255, Math.max(50, station.total_ridership * 5)); // Scale ridership to brightness

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, 0, 1)`; // Yellow-ish color based on brightness
        ctx.fill();
      }
    });
  };

  // Get unique day-hour combinations
  useEffect(() => {
    const combinations = Array.from(
      new Set(data.map((station: StationData) => `${station.transit_day} ${station.transit_hour}`))
    ).sort(); // Sorting ensures combinations are in order
    setDayHourCombinations(combinations);

    // Set initial time
    if (combinations.length > 0) {
      const [day, hour] = combinations[0].split(' ');
      setCurrentTime({ day, hour });
    }
  }, []);

  // Handle slider change
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(event.target.value);
    setSliderIndex(newIndex);

    const currentCombination = dayHourCombinations[newIndex];
    const [day, hour] = currentCombination.split(' ');
    setCurrentTime({ day, hour });

    // Redraw the canvas with the new day/hour combination
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawOnCanvas(ctx, day, hour);
      }
    }
  };

  // Redraw canvas when slider index changes
  useEffect(() => {
    if (dayHourCombinations.length > 0 && currentTime.day && currentTime.hour) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawOnCanvas(ctx, currentTime.day, currentTime.hour);
        }
      }
    }
  }, [currentTime, dayHourCombinations]);

  return (
    <div>
      <h1>NYC Subway Ridership Data - Canvas with Sliding Scale</h1>
      <p>Current Time: {currentTime.day} {currentTime.hour}</p>

      {/* Slider to control the current time */}
      <input
        type="range"
        min="0"
        max={dayHourCombinations.length - 1}
        value={sliderIndex}
        onChange={handleSliderChange}
        style={{ width: '100%' }}
      />
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} style={{ border: '1px solid black' }}></canvas>
    </div>
  );
};

export default SubwayRidership;
