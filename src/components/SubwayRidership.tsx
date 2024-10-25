import React, { useEffect, useState, useRef } from 'react';
import data from '../assets/MTA_ridership_data.json'; // Import JSON data without type assertion
// Ensure data is typed as an array of StationData
const typedData: StationData[] = data as StationData[]; // Type assertion after import


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
    const bgRef = useRef<HTMLCanvasElement | null>(null);

    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

    const updateCanvasDimensions = () => {

        const height = window.innerHeight * 0.8; // 90% of viewport height
        const width = height; // 90% of viewport width
        setCanvasDimensions({ width, height });
    };
    useEffect(() => {
        // Set initial dimensions
        updateCanvasDimensions();

        // Update dimensions on window resize
        window.addEventListener('resize', updateCanvasDimensions);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('resize', updateCanvasDimensions);
        };
    }, []);


    const [currentTime, setCurrentTime] = useState<{ day: string, hour: string }>({ day: '', hour: '' });
    const [dayHourCombinations, setDayHourCombinations] = useState<string[]>([]);
    const [sliderIndex, setSliderIndex] = useState(0); // Index for slider
    const [isAnimating, setIsAnimating] = useState(false); // Animation state

    // Scale lat/lon values to canvas coordinates
    const scaleCoordinates = (latitude: number, longitude: number) => {
        const latMin = 40.6; // Adjusted to move closer
        const latMax = 40.9; // Adjusted to move closer
        const lonMin = -74.2; // Adjusted to move closer
        const lonMax = -73.8; // Adjusted to move closer

        const x = ((longitude - lonMin) / (lonMax - lonMin)) * canvasDimensions.width;
        const y = ((latMax - latitude) / (latMax - latMin)) * canvasDimensions.height;

        return { x, y };
    };

    const maxRidership = Math.max(...typedData.map(s => s.total_ridership));
    //   const maxRidership = Math.max(...typedData.map(s => s.total_ridership));
    const minRidership = Math.min(...typedData.map(s => s.total_ridership));
    // Draw data points on canvas based on the selected day and hour
    const drawOnCanvas = (ctx: CanvasRenderingContext2D, day: string, hour: string) => {
        ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height); // Clear the canvas

        // Define color variables
        const pink = '#C63CBC'; // Pink
        const orange = '#FF4500'; // Orange
        const darkBlue = '#141233'; // Darker blue
        const black = '#000000'; // Black

        // Determine the background color based on the time of day
        const hourInt = parseInt(hour, 10); // Convert hour to integer
        let gradient;

        // Create gradient based on the hour
        if (hourInt > 5 && hourInt <= 7) {
            // Sunrise (5 AM to 7 AM)
            const ratio = (hourInt - 5) / 2; // Ratio from 0 to 1
            gradient = ctx.createLinearGradient(0, canvasDimensions.height, 0, canvasDimensions.height - 100);


            gradient.addColorStop(0, interpolateColor(pink, orange, ratio)); // Pink to orange
            gradient.addColorStop(1, interpolateColor(black, darkBlue, ratio)); // Black to dark blue
        } else if (hourInt >= 7 && hourInt <= 14) {
            gradient = darkBlue;
        } else if (hourInt >= 15 && hourInt < 18) {
            gradient = darkBlue;
        } else if (hourInt >= 18 && hourInt < 20) {
            const ratio = (hourInt - 18) / 2; // Ratio from 0 to 1
            gradient = ctx.createLinearGradient(0, canvasDimensions.height, 0, canvasDimensions.height - 100);
            gradient.addColorStop(0, interpolateColor(orange, pink, ratio)); // Orange to pink
            gradient.addColorStop(1, interpolateColor(darkBlue, black, ratio)); // Dark blue to black
        } else if (hourInt >= 21 && hourInt < 24) {
            gradient = black;
        } else {
            gradient = black; // Default color
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Fill the background canvas with the gradient
        if (bgRef.current) {
            const bgCtx = bgRef.current.getContext('2d');
            if (bgCtx) {
                bgCtx.clearRect(0, 0, window.innerWidth, window.innerHeight); // Clear the background canvas
                bgCtx.fillStyle = gradient; // Set the fill style to the gradient
                bgCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
            }
        }
        // Draw subway stations
        typedData.forEach((station: StationData) => {
            if (station.transit_day === day && station.transit_hour === hour) {
                const { x, y } = scaleCoordinates(station.latitude, station.longitude);


                // Calculate Midpoint
                const midpointRidership = (maxRidership - minRidership) / 3 + minRidership; // Calculate the midpoint of ridership

                let brightness: number;
                let radius: number;

                let minRadius = 4;
                let maxRadius = 8;

                if (station.total_ridership <= midpointRidership) {
                    // Lower half of ridership
                    brightness = 0.8; // Set brightness to 0.5
                    const normalizedRidership = station.total_ridership / maxRidership; // Normalize based on the lower half
                    radius = minRadius + (normalizedRidership * (maxRadius - minRadius)); // Adjust radius based on normalized ridership

                    gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, getColorForRidership(station.total_ridership, midpointRidership, 1)); // Inner color based on ridership
                    gradient.addColorStop(0.5, getColorForRidership(station.total_ridership, midpointRidership, brightness)); // Inner color based on ridership
                    gradient.addColorStop(1, getColorForRidership(station.total_ridership, midpointRidership, brightness * 0.01)); // Light gray based on ridership

                } else {
                    // Upper half of ridership
                    const normalizedRidership = (station.total_ridership) / (maxRidership); // Normalize based on the upper half
                    brightness = 0.8 + (normalizedRidership * 0.2); // Change brightness from 0.5 to 1
                    radius = maxRadius; // Set radius to max

                    gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, `rgba(255, 255, 255, 1)`); // Mid color (white with variable brightness)
                    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${brightness})`); // Outer color (fades out to white)
                    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`); // Outer color (transparent)
                }

                // Draw the circle with gradient
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        });
    };

    // Function to interpolate between two colors
    const interpolateColor = (color1: string, color2: string, factor: number) => {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        const result = rgb1.map((c, i) => Math.round(c + factor * (rgb2[i] - c)));
        return `rgb(${result.join(',')})`;
    };

    // Function to convert hex color to RGB
    const hexToRgb = (hex: string) => {
        const bigint = parseInt(hex.replace(/^#/, ''), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    // Function to determine color based on ridership
    const getColorForRidership = (ridership: number, maxRidership: number, brightness: number) => {
        // Normalize ridership to a value between 0 and 1
        const normalizedRidership = Math.min(1, ridership / maxRidership);

        // Calculate RGB values based on normalized ridership
        const grayValue = Math.round(100 + (155 * normalizedRidership)); // From 128 (gray) to 255 (white)

        return `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${brightness})`; // Return gray color with variable brightness
    };

    // Get unique day-hour combinations
    useEffect(() => {
        const combinations = Array.from(
            new Set(typedData.map((station: StationData) => `${station.transit_day} ${station.transit_hour}`))
        ).sort(); // Sorting ensures combinations are in order
        setDayHourCombinations(combinations);

        // Set initial time
        if (combinations.length > 0) {
            const [day, hour] = combinations[0].split(' ');
            setCurrentTime({ day, hour });
        }

        console.log('com', combinations)
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

    // Toggle animation
    const toggleAnimation = () => {
        setIsAnimating(!isAnimating);
    };

    // Animation loop
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isAnimating) {
            interval = setInterval(() => {
                setSliderIndex((prevIndex) => {
                    const newIndex = (prevIndex + 1) % dayHourCombinations.length;
                    const currentCombination = dayHourCombinations[newIndex];
                    const [day, hour] = currentCombination.split(' ');
                    setCurrentTime({ day, hour });

                    return newIndex;
                });
            }, 1000); // Each combination lasts 1 second
        } else if (interval) {
            clearInterval(interval);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAnimating, dayHourCombinations]);

    // Redraw canvas when currentTime changes
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
        <div className="absolute top-0 left-0 bg-black w-screen h-screen">
            <canvas ref={bgRef}
                className="absolute top-0 left-0 w-screen h-screen"></canvas>
            <canvas ref={canvasRef}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                className="absolute top-[20vh] left-1/2 transform -translate-x-1/2"
                style={{ width: canvasDimensions.height, height: canvasDimensions.height }}></canvas>

            <header className="absolute top-0 left-0 w-full flex justify-between items-start p-4 font-instrument text-left">
                <div className="flex flex-col items-start space-y-2 max-w-[15vw]">
                    <h1 className="text-white text-5xl">
                        A <span className="font-extrabold">Rainy</span> Day in New York
                    </h1>
                    <h1 className="text-white text-2xl">Visualizing NYC Subway Ridership Amid Record Rainfall on September 29, 2023</h1>
                </div>
                <nav>
                    <a
                        href="https://github.com/yourusername" // Replace with your GitHub URL
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline text-2xl"
                    >
                        About
                    </a>
                </nav>
            </header >

            <div className="absolute top-0 left-0 p-4 w-full h-[20vh] text-center">
                <p className="text-2xl text-white font-instrument">{currentTime.day} </p>
                <p className="text-5xl font-bold text-white font-instrument">{currentTime.hour}</p>

                <div className="w-full h-[40px] flex pt-0 items-center justify-center gap-4 ">
                    <button
                        className="px-2 py-2 w-[40px] h-[40px] bg-gray-100 text-black rounded hover:bg-white transition duration-200 flex items-center justify-center" // Added h-[40px] and justify-center
                        onClick={toggleAnimation}>
                        <i className={isAnimating ? 'fas fa-stop' : 'fas fa-play'}></i> {/* Icon changes based on animation state */}
                    </button>
                    <div className="relative">
                        <input
                            type="range"
                            min="0"
                            max={dayHourCombinations.length - 1}
                            value={sliderIndex}
                            onChange={handleSliderChange}
                            className="w-[80vh] appearance-none rounded-lg h-2 hover:bg-gray-300"
                        />
                        {/* Single Triangle Mark */}
                        <div className="absolute w-full top-0 flex justify-between">
                            <div className="relative w-full">
                                <span className="absolute top-6 text-s text-gray-300 hover:text-red-500 -translate-x-1/2">Intense Flooding</span>
                                <div
                                    className="absolute"
                                    style={{
                                        left: `${(37 / (dayHourCombinations.length - 1)) * 100}%`, // specificIndex should be calculated based on your day and hour
                                        transform: 'translateX(-50%)', // Center the mark on the calculated position
                                    }}
                                >
                                    <div className="w-1 h-6 bg-gray-300 hover:bg-red-500" /> {/* Adjust width and height as needed */}
                                </div>
                            </div>
                        </div>
                        <style>
                            {`
                                input[type='range'] {
                                    -webkit-appearance: none; /* Remove default styling */
                                    appearance: none; /* Remove default styling */
                                }

                                input[type='range']::-webkit-slider-thumb {
                                    -webkit-appearance: none; /* Remove default styling */
                                    appearance: none; /* Remove default styling */
                                    width: 20px; /* Width of the thumb */
                                    height: 20px; /* Height of the thumb */
                                    border-radius: 50%; /* Make the thumb circular */
                                    background: white; /* Color of the thumb */
                                    cursor: pointer; /* Pointer cursor on hover */
                                    border: 2px solid #ccc; /* Optional border for the thumb */
                                }

                                input[type='range']::-moz-range-thumb {
                                    width: 20px; /* Width of the thumb */
                                    height: 20px; /* Height of the thumb */
                                    border-radius: 50%; /* Make the thumb circular */
                                    background: white; /* Color of the thumb */
                                    cursor: pointer; /* Pointer cursor on hover */
                                    border: 2px solid #ccc; /* Optional border for the thumb */
                                }

                                input[type='range']::-ms-thumb {
                                    width: 20px; /* Width of the thumb */
                                    height: 20px; /* Height of the thumb */
                                    border-radius: 50%; /* Make the thumb circular */
                                    cursor: pointer; /* Pointer cursor on hover */
                                    border: 2px solid #ccc; /* Optional border for the thumb */
                                }
                            `}
                        </style>
                    </div>
                </div>

            </div>

        </div >
    );
};

export default SubwayRidership;
