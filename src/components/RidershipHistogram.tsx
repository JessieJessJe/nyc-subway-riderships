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

        // Set up the SVG container
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Clear previous content
        svg.selectAll('*').remove();

        // Create ridership buckets
        const buckets = d3.bin()
            .domain([0, d3.max(data, d => d.total_ridership) || 0])
            .thresholds(d3.range(0, d3.max(data, d => d.total_ridership) || 0, 100))
            (data.map(d => d.total_ridership));

        // Set up scales
        const x = d3.scaleLinear()
            .domain([0, d3.max(buckets, d => d.x1) || 0])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(buckets, d => d.length) || 0])
            .range([height, 0]);

        // Add bars
        svg.selectAll('.bar')
            .data(buckets)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.x0 ?? 0))
            .attr('y', d => y(d.length))
            .attr('width', d => x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1)
            .attr('height', d => height - y(d.length))
            .attr('fill', 'steelblue');

        // Add x-axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add y-axis
        svg.append('g')
            .call(d3.axisLeft(y));

    }, [data, width, height]);

    return <svg ref={svgRef}></svg>;
};

export default RidershipHistogram;