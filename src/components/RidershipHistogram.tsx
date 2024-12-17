// MTAOpenData/front-end/src/components/RidershipHistogram.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { logBins, binStyles, tooltipContent, interpolateRainbowColor } from './utils';

const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

interface RidershipHistogramProps {
    data: { total_ridership: number }[];
    currentData: { total_ridership: number }[];
    selectedTime: string;
}

const RidershipHistogram: React.FC<RidershipHistogramProps> = ({ data, currentData, selectedTime }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Create tooltip once when component mounts
    useEffect(() => {
        // Remove any existing tooltips first
        d3.selectAll('.chart-tooltip').remove();

        // Create the tooltip once
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', `
                    chart-tooltip
                    absolute
                    hidden
                    bg-gray-100
                    p-3
                    rounded-lg
                    shadow-lg
                    max-w-[300px]
                    z-50
                    text-gray-800
                    text-sm
                    leading-relaxed
                `.trim())
            .html(tooltipContent);

        // Cleanup on unmount
        return () => {
            tooltip.remove();
        };
    }, []);

    // Separate the chart update logic
    const updateChart = useCallback((width: number, height: number) => {
        if (!svgRef.current) return;

        // Create ridership buckets for all data
        const buckets = d3.bin()
            .domain([logBins[0], logBins[logBins.length - 1]])
            .thresholds(logBins.slice(1, -1))
            (data.map(d => d.total_ridership));

        // Create separate buckets for current data
        const currentBuckets = d3.bin()
            .domain([logBins[0], logBins[logBins.length - 1]])
            .thresholds(logBins.slice(1, -1))
            (currentData.map(d => d.total_ridership));

        // Add margins for labels with fluid scaling
        const margin = {
            top: Math.min(Math.max(20, height * 0.1), 40),     // Scale between 20px and 40px
            right: Math.min(Math.max(30, width * 0.08), 30),    // Scale between 30px and 60px
            bottom: Math.min(Math.max(75, height * 0.35), 150),  // Scale between 75px and 150px
            left: Math.min(Math.max(30, width * 0.08), 30)      // Scale between 30px and 60px
        };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Update SVG container with margin
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Clear previous content
        svg.selectAll('*').remove();

        // Create a group element for the chart
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Update scales to use inner dimensions
        const x = d3.scaleLog()
            .domain([logBins[0], logBins[logBins.length - 1]])
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(buckets, d => d.length) || 0])
            .range([innerHeight, 0]);

        // Calculate the positions for the middle four bars
        const middleBarsStart = x(logBins[3]);  // Start of 4th bin
        const middleBarsEnd = x(logBins[7]);    // End of 7th bin

        // Define gradients
        const defs = svg.append('defs');

        // Horizontal gradient for the middle four bars
        const gradientMiddle = defs.append('linearGradient')
            .attr('id', 'gradientMiddle')
            .attr('x1', '0%')
            .attr('x2', '100%')
            .attr('y1', '0%')
            .attr('y2', '0%')
            .attr('gradientUnits', 'userSpaceOnUse')  // Important: use absolute coordinates
            .attr('x1', middleBarsStart)              // Start coordinate
            .attr('x2', middleBarsEnd);              // End coordinate

        gradientMiddle.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'rgb(200, 200, 200)');  // Dark color
        gradientMiddle.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgb(255, 7, 0)');  // Light color


        // After drawing the main bars, add bars for current selection
        g.selectAll('.current-bar')
            .data(currentBuckets)
            .enter().append('rect')
            .attr('class', 'current-bar')
            .attr('x', d => x(d.x0 ?? logBins[0]) + 1.5)
            .attr('y', d => y(d.length) + 0.5)
            .attr('width', d => {
                const width = x(d.x1 ?? logBins[logBins.length - 1]) - x(d.x0 ?? logBins[0]);
                return Math.max(0.1, width - 9);
            })
            .attr('height', d => Math.max(0.1, innerHeight - y(d.length) - 1))
            .attr('fill', (_, i) => binStyles[i].fill)
            .attr('stroke', (_, i) => binStyles[i].stroke)
            .attr('stroke-width', 1)
            .attr('shape-rendering', 'crispEdges');



        // Add bars with custom styles
        g.selectAll('.bar')
            .data(buckets)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.x0 ?? logBins[0]) + 1.5)
            .attr('y', d => y(d.length) + 0.5)
            .attr('width', d => {
                const width = x(d.x1 ?? logBins[logBins.length - 1]) - x(d.x0 ?? logBins[0]);
                return Math.max(0, width - 9);
            })
            .attr('height', d => Math.max(0.1, innerHeight - y(d.length) - 1))
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('shape-rendering', 'crispEdges');

        // Add x-axis with responsive font size
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x)
                .tickValues(logBins)
                .tickFormat(d => d.toString())
            )
            .selectAll('text')
            .attr('fill', 'white')
            .attr('y', 9)
            .style('text-anchor', 'middle')
            .style('font-size', `${Math.min(Math.max(12, width * 0.01), 14)}px`);  // Scale between 12-14px

        // Calculate bin centers for circle positions
        const binCenters = buckets.map(bucket => {
            const x0 = bucket.x0 ?? logBins[0];
            const x1 = bucket.x1 ?? logBins[logBins.length - 1];
            return Math.sqrt(x0 * x1); // Geometric mean for log scale
        });

        const minRadius = Math.min(Math.max(3, width * 0.004), 3);
        const maxRadius = Math.min(Math.max(7, width * 0.008), 7);

        // Add circles under bins
        g.selectAll('.bin-circle')
            .data(binCenters)
            .enter()
            .append('g')
            .each(function (d, i) {
                const g = d3.select(this);
                const circleId = `circle-gradient-${d}`;
                const normalizedPosition = (i - 3) / 3;  // 0 to 1 across middle bins
                const middleColor = interpolateRainbowColor(normalizedPosition);

                // Calculate radius based on bin position
                let radius;
                if (i <= 2) {  // First three and last two bins (now 9 total)
                    radius = minRadius;
                } else if (i >= 3 && i <= 6) {  // Middle four bins
                    radius = minRadius + normalizedPosition * (maxRadius - minRadius);
                } else {
                    radius = maxRadius;
                }

                // Create unique radial gradient for each circle
                const radialGradient = defs.append('radialGradient')
                    .attr('id', circleId)
                    .attr('cx', '50%')
                    .attr('cy', '50%')
                    .attr('r', '50%');

                if (i > 2 && i < 7) {  // Middle four bins

                    radialGradient.append('stop').attr('offset', '0%').attr('stop-color', middleColor);
                    radialGradient.append('stop').attr('offset', '80%').attr('stop-color', middleColor);
                    radialGradient.append('stop').attr('offset', '100%').attr('stop-color', middleColor);
                } else if (i <= 2) {  // First three bins
                    radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#000000');
                    radialGradient.append('stop').attr('offset', '90%').attr('stop-color', '#8E0485');
                    radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#8E0485');
                } else if (i >= 7) {  // Last two bins
                    radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
                    radialGradient.append('stop').attr('offset', '80%').attr('stop-color', '#ffffff');
                    radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ffffff');
                }

                // Add the circle with the gradient
                g.append('circle')
                    .attr('class', 'bin-circle')
                    .attr('cx', x(d))
                    .attr('cy', innerHeight + Math.min(Math.max(90, height * 0.25), 120))  // Scale between 90-120px
                    .attr('r', radius)
                    .attr('fill', `url(#${circleId})`)
                    .attr('stroke', d => {
                        if (i <= 2) return '#8E0485';  // First three bins
                        if (i >= 7) return '#FFFFFF';  // Last two bins
                        return middleColor;
                    })
                    .attr('stroke-width', 1);
            });

        // Add threshold tick lines only for 19.95 and 1122.02
        g.selectAll('.tick-line')
            .data([19.95, 1122.02])  // Only include threshold values
            .enter()
            .append('line')
            .attr('class', 'tick-line')
            .attr('x1', d => x(d))
            .attr('x2', d => x(d))
            .attr('y1', innerHeight + Math.min(Math.max(45, height * 0.15), 60))       // Scale between 45-60px
            .attr('y2', innerHeight + Math.min(Math.max(120, height * 0.3), 150))      // Scale between 120-150px
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4');

        // Add labels above tick lines
        g.selectAll('.tick-label')
            .data([
                { value: logBins[0], label: "0" },      // Use logBins[0] instead of 0
                { value: 19.95, label: "20" },
                { value: 1122.02, label: "1,000" },
                { value: logBins[logBins.length - 1], label: "20,000" }  // Use last logBin
            ])
            .enter()
            .append('text')
            .attr('class', 'tick-label')
            .attr('x', d => x(d.value))
            .attr('y', innerHeight + Math.min(Math.max(40, height * 0.12), 50))
            .attr('text-anchor', 'middle')
            .attr('fill', '#EFEFEF')
            .style('font-size', `${Math.min(Math.max(14, width * 0.012), 16)}px`)  // Scale between 14-16px
            .text(d => d.label);

        // Add y-axis with responsive font size
        g.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('font-size', `${Math.min(Math.max(12, width * 0.01), 14)}px`);  // Scale between 12-14px

        // Add y-axis label with responsive font size
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -margin.left + 12)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', `${Math.min(Math.max(14, width * 0.012), 16)}px`)  // Scale between 14-16px
            .text('# of Stations');

        // Add title group (fix double transform)
        const titleGroup = g.append('g')
            .attr('transform', `translate(${innerWidth / 2}, -${margin.top / 2})`);

        // Add main title with responsive font size and selected time
        titleGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', `${Math.min(Math.max(16, width * 0.014), 18)}px`)  // Scale between 16-18px
            .text(`Distribution of Station Ridership (${selectedTime})`);

        // Add tooltip icon
        const tooltipIcon = titleGroup.append('text')
            .attr('x', innerWidth / 2 - 12)
            .attr('y', 0)
            .attr('class', 'tooltip-icon transition-opacity duration-200')
            .attr('fill', 'white')
            .attr('cursor', 'pointer')
            .text('Info ⓘ')
            .style('font-size', `${Math.min(Math.max(14, width * 0.012), 16)}px`);      // Scale between 14-16px

        // Modify tooltip icon hover handlers to use Tailwind classes
        tooltipIcon
            .on('mouseenter', (event) => {
                const iconPosition = (event.target as SVGElement).getBoundingClientRect();
                const tooltip = d3.select('.chart-tooltip');
                tooltip
                    .classed('hidden', false)
                    .style('left', `${iconPosition.right}px`)
                    .style('top', `${iconPosition.top}px`);
            })
            .on('mouseleave', () => {
                d3.select('.chart-tooltip')
                    .classed('hidden', true);
            });

    }, [data, currentData, selectedTime]);

    // Add resize handler
    useEffect(() => {
        const handleResize = debounce(() => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth;
            const isMobile = window.innerWidth < 768;

            let width, height;
            if (isMobile) {
                width = containerWidth;
                height = Math.min(400, window.innerHeight * 0.4);
            } else {
                height = window.innerHeight * 0.35; // 35vh
                width = (height * 4) / 3; // maintain 4:3 ratio
            }

            updateChart(width, height);
        }, 250);

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [updateChart]);

    // Wrap SVG in a container div and add tooltip
    return (
        <div
            ref={containerRef}
            className="w-full h-[50vh] md:h-[35vh] bg-black"
        >
            <svg ref={svgRef} className="w-full h-full"></svg>
        </div>
    );
};

export default RidershipHistogram;