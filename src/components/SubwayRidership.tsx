import React, { useEffect, useState, useRef, useMemo } from 'react';
import data from '../assets/MTA_ridership_data.json';
import { useCanvasDrawing } from './useCanvasDrawing';
import { StationData, CanvasDimensions, TimeState } from './type';
import { TimeSlider } from './TimeSlider';

const typedData: StationData[] = data as StationData[];

const SubwayRidership: React.FC = () => {
    // Canvas refs and dimensions
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({ width: 0, height: 0 });

    // Animation and time states
    const [currentTime, setCurrentTime] = useState<TimeState>({ day: '', hour: '' });
    const [dayHourCombinations, setDayHourCombinations] = useState<string[]>([]);
    const [sliderIndex, setSliderIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);

    // Memoized calculations
    const maxRidership = useMemo(() => Math.max(...typedData.map(s => s.total_ridership)), []);
    const minRidership = useMemo(() => Math.min(...typedData.map(s => s.total_ridership)), []);
    const midpointRidership = useMemo(() => (maxRidership - minRidership) / 3 + minRidership, [maxRidership, minRidership]);

    // Get canvas drawing utilities
    const { drawOnCanvas } = useCanvasDrawing(canvasDimensions, maxRidership, minRidership, midpointRidership);

    // Canvas dimension management
    const updateCanvasDimensions = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // If width is smaller than height, make the canvas a square with the height as the size
        if (width < height) {
            setCanvasDimensions({ width: height, height });
        } else {
            setCanvasDimensions({ width, height });
        }
    };

    useEffect(() => {
        updateCanvasDimensions();
        window.addEventListener('resize', updateCanvasDimensions);
        return () => window.removeEventListener('resize', updateCanvasDimensions);
    }, []);

    // Initialize day-hour combinations
    useEffect(() => {
        const combinations = Array.from(
            new Set(typedData.map((station: StationData) => `${station.transit_day} ${station.transit_hour}`))
        ).sort();
        setDayHourCombinations(combinations);

        if (combinations.length > 0) {
            const [day, hour] = combinations[0].split(' ');
            setCurrentTime({ day, hour });
        }
    }, []);

    // Handle slider interaction
    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newIndex = parseInt(event.target.value);
        setSliderIndex(newIndex);
        updateTimeFromIndex(newIndex);
    };

    // Update time based on slider index
    const updateTimeFromIndex = (index: number) => {
        const currentCombination = dayHourCombinations[index];
        const [day, hour] = currentCombination.split(' ');
        setCurrentTime({ day, hour });
    };

    // Toggle animation
    const toggleAnimation = () => setIsAnimating(!isAnimating);

    // Animation loop
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isAnimating) {
            interval = setInterval(() => {
                setSliderIndex((prevIndex) => {
                    const newIndex = (prevIndex + 1) % dayHourCombinations.length;
                    updateTimeFromIndex(newIndex);
                    return newIndex;
                });
            }, 500);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAnimating, dayHourCombinations]);

    // Canvas drawing effect
    useEffect(() => {
        if (dayHourCombinations.length > 0 && currentTime.day && currentTime.hour) {
            const canvas = canvasRef.current;

            if (canvas) {
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    // Clear the canvas before drawing
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw background
                    drawOnCanvas(ctx, null, currentTime.day, currentTime.hour, typedData);
                }
            }
        }
    }, [currentTime, dayHourCombinations, drawOnCanvas]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-black">
            <div className="fixed  top-0 left-0 w-[100vw] z-10">
                <div className="flex justify-between items-start p-4 font-instrument text-left">
                    <div className="flex flex-col items-start space-y-2 w-[15vw]">
                        <h1 className="text-white text-lg md:text-2xl lg:text-4xl">
                            A <span className="font-extrabold">Rainy</span> Day in New York
                        </h1>
                        <h1 className="text-white text-base md:text-xl lg:text-2xl">
                            Visualizing NYC Subway Ridership Amid Record Rainfall on September 29, 2023
                        </h1>
                    </div>
                    <div className="flex-grow text-center w-[70vw]" >
                        <div className="w-full text-center">
                            <p className="text-white text-base md:text-xl lg:text-2xl font-instrument">{currentTime.day}</p>
                            <p className="text-white text-lg md:text-3xl lg:text-5xl font-bold font-instrument">{currentTime.hour}</p>
                        </div>
                        <TimeSlider
                            sliderIndex={sliderIndex}
                            dayHourCombinations={dayHourCombinations}
                            isAnimating={isAnimating}
                            onSliderChange={handleSliderChange}
                            onToggleAnimation={toggleAnimation}
                        />
                    </div>
                    <nav className="text-right w-[15vw]">
                        <a
                            href="https://github.com/JessieJessJe/mta-riderships"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:underline text-white text-base md:text-xl lg:text-2xl "
                        >
                            About
                        </a>
                    </nav>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                className="relative"

            />
        </div>
    );
};

export default SubwayRidership;