// MTAOpenData/front-end/src/components/RidershipHistogram.tsx
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface RidershipHistogramProps {
    data: { total_ridership: number }[];
    width: number;
    height: number;
}

const RidershipHistogram: React.FC<RidershipHistogramProps> = ({ data, width, height }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Define custom log bins
        const logBins = [1, 2.69, 7.24, 19.95, 54.55, 149.54, 409.49, 1122.02, 3073.8, 8421.87, 20000];

        // Create ridership buckets with custom bins
        const buckets = d3.bin()
            .domain([logBins[0], logBins[logBins.length - 1]])
            .thresholds(logBins.slice(1, -1))
            (data.map(d => d.total_ridership));

        // Add margins for labels
        const margin = { top: 40, right: 20, bottom: 150, left: 60 };
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
        const totalWidth = middleBarsEnd - middleBarsStart;

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
            .attr('stop-color', '#E7E7E7')  // [231, 231, 231]
        gradientMiddle.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#FF000A')  // [255, 0, 10]

        // Define custom styles for each bin
        const binStyles = [
            { fill: 'black', stroke: 'white', strokeWidth: 1 },
            { fill: 'black', stroke: 'white', strokeWidth: 1 },
            { fill: 'black', stroke: 'white', strokeWidth: 1 },
            { fill: '#C8C8C8', stroke: 'white', strokeWidth: 1 },
            { fill: '#C8C8C8', stroke: 'white', strokeWidth: 1 },
            { fill: '#C8C8C8', stroke: 'white', strokeWidth: 1 },
            { fill: '#C8C8C8', stroke: 'white', strokeWidth: 1 },
            // { fill: 'url(#gradientMiddle)', stroke: 'none' },
            // { fill: 'url(#gradientMiddle)', stroke: 'none' },
            // { fill: 'url(#gradientMiddle)', stroke: 'none' },
            // { fill: 'url(#gradientMiddle)', stroke: 'none' },
            { fill: 'black', stroke: 'white', strokeWidth: 1 },
            { fill: 'black', stroke: 'white', strokeWidth: 1 },
            { fill: 'black', stroke: 'white', strokeWidth: 1 },
        ];

        // Add bars with custom styles
        g.selectAll('.bar')
            .data(buckets)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.x0 ?? logBins[0]))
            .attr('y', d => y(d.length))
            .attr('width', d => {
                const width = x(d.x1 ?? logBins[logBins.length - 1]) - x(d.x0 ?? logBins[0]);
                return Math.max(0, width - 8);  // Subtract 8px for gap, ensure width isn't negative
            })
            .attr('height', d => innerHeight - y(d.length))
            .attr('fill', (_, i) => binStyles[i].fill)
            .attr('stroke', (_, i) => binStyles[i].stroke)
            .attr('stroke-width', (_, i) => binStyles[i].strokeWidth || 0);

        // Add x-axis
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x)
                .tickValues(logBins)
                .tickFormat(d => d.toString())
            )
            .selectAll('text')
            .attr('fill', d => {
                return 'white';  // Default color for other labels
            })
            .attr('y', 9)
            .style('text-anchor', 'middle');

        // Calculate bin centers for circle positions
        const binCenters = buckets.map(bucket => {
            const x0 = bucket.x0 ?? logBins[0];
            const x1 = bucket.x1 ?? logBins[logBins.length - 1];
            return Math.sqrt(x0 * x1); // Geometric mean for log scale
        });

        const minRadius = 4;
        const maxRadius = 8;

        // Add circles under bins
        g.selectAll('.bin-circle')
            .data(binCenters)
            .enter()
            .append('g')
            .each(function (d, i) {
                const g = d3.select(this);
                const circleId = `circle-gradient-${d}`;

                // Calculate radius based on bin position
                let radius;
                if (i <= 2) {  // First three and last two bins (now 9 total)
                    radius = maxRadius;
                } else if (i >= 3 && i <= 6) {  // Middle four bins
                    const normalizedPosition = (i - 3) / 3;  // 0 to 1 across middle bins
                    radius = maxRadius - normalizedPosition * (maxRadius - minRadius);
                } else {
                    radius = minRadius;
                }

                // Create unique radial gradient for each circle
                const radialGradient = defs.append('radialGradient')
                    .attr('id', circleId)
                    .attr('cx', '50%')
                    .attr('cy', '50%')
                    .attr('r', '50%');

                if (i > 2 && i < 7) {  // Start of gradient
                    radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#C8C8C8');
                    radialGradient.append('stop').attr('offset', '80%').attr('stop-color', '#C8C8C8');
                    radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#C8C8C8');
                } else if (i <= 2) {  // First three bins
                    radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#000000');
                    radialGradient.append('stop').attr('offset', '90%').attr('stop-color', '#C1DD0A');
                    radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#C1DD0A');
                } else if (i >= 7) {  // Last two bins
                    radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#000000');
                    radialGradient.append('stop').attr('offset', '80%').attr('stop-color', '#FF0000');
                    radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#FF0000');
                }

                // Add the circle with the gradient
                g.append('circle')
                    .attr('class', 'bin-circle')
                    .attr('cx', x(d))
                    .attr('cy', innerHeight + 50)
                    .attr('r', radius)
                    .attr('fill', `url(#${circleId})`)
                    .attr('stroke', d => {
                        if (i <= 2) return '#C1DD0A';  // First three bins
                        if (i >= 7) return '#FF0000';  // Last two bins
                        return '#C8C8C8';
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
            .attr('y1', innerHeight + 50)  // Start from where circles are centered
            .attr('y2', innerHeight + 150)  // Extend down
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4');  // All lines are dashed

        // Add y-axis
        g.append('g')
            .call(d3.axisLeft(y));

        // Add y-axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .text('# of Stations');

        // Add title
        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .text('Distribution of Station Ridership (per station per hour)');

    }, [data, width, height]);

    return <svg ref={svgRef}></svg>;
};

export default RidershipHistogram;