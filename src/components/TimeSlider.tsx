import React from 'react';

interface TimeSliderProps {
    sliderIndex: number;
    dayHourCombinations: string[];
    isAnimating: boolean;
    onSliderChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleAnimation: () => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
    sliderIndex,
    dayHourCombinations,
    isAnimating,
    onSliderChange,
    onToggleAnimation,
}) => {
    return (
        <div className="w-full h-[40px] flex pt-0 items-center justify-center gap-4">
            <button
                className="px-2 py-2 max-w-[40px] max-h-[40px] bg-gray-100 text-black rounded hover:bg-white transition duration-200 flex items-center justify-center"
                onClick={onToggleAnimation}
            >
                <i className={isAnimating ? 'fas fa-stop' : 'fas fa-play'}></i>
            </button>
            <div className="relative">
                <input
                    type="range"
                    min="0"
                    max={dayHourCombinations.length - 1}
                    value={sliderIndex}
                    onChange={onSliderChange}
                    className="w-[60vw] appearance-none rounded-lg h-2 hover:bg-gray-300"
                />
                <div className="absolute w-full top-0 flex justify-between">
                    <div className="relative w-full">
                        <span className="absolute top-6 text-xs md:text-base text-gray-300 hover:text-red-500 -translate-x-1/2">
                            Intense Flooding
                        </span>
                        <div
                            className="absolute"
                            style={{
                                left: `${(37 / (dayHourCombinations.length - 1)) * 100}%`,
                                transform: 'translateX(-50%)',
                            }}
                        >
                            <div className="w-1 h-6 bg-gray-300 hover:bg-red-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};