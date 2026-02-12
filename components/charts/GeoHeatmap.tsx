"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * Geographic Heatmap (India)
 * Visualizes company presence or market share by region.
 * Uses a simplified GeoJSON/SVG path approach for India.
 */

interface GeoData {
    state: string;
    value: number;
}

export default function GeoHeatmap({ data }: { data: GeoData[] }) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data.length) return;

        const width = 500;
        const height = 600;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', 'transparent');

        svg.selectAll('*').remove();

        // Note: In a real app, we would load a proper India states GeoJSON.
        // For this V3 implementation, we use a placeholder visualization
        // that groups by major regions (North, South, East, West, Central).

        const regions = [
            { name: 'North', x: 200, y: 100, r: 80 },
            { name: 'South', x: 230, y: 450, r: 90 },
            { name: 'East', x: 380, y: 250, r: 70 },
            { name: 'West', x: 100, y: 300, r: 85 },
            { name: 'Central', x: 230, y: 280, r: 100 }
        ];

        const color = d3.scaleSequential(d3.interpolateYlOrBr)
            .domain([0, d3.max(data, d => d.value) || 100]);

        const g = svg.append('g');

        g.selectAll('circle')
            .data(regions)
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.r)
            .attr('fill', d => {
                const regionData = data.find(rd => rd.state === d.name);
                return color(regionData ? regionData.value : 10);
            })
            .attr('opacity', 0.6)
            .attr('stroke', '#d4af37')
            .attr('stroke-width', 2);

        g.selectAll('text')
            .data(regions)
            .enter()
            .append('text')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '12px')
            .text(d => d.name);

    }, [data]);

    return (
        <div className="glass p-6 rounded-2xl">
            <h3 className="text-accent-gold font-display text-xl mb-4">Regional Market Presence</h3>
            <div className="flex justify-center">
                <svg ref={svgRef}></svg>
            </div>
            <div className="mt-4 text-center text-xs text-slate-400">
                Heatmap density indicates concentration of operations/assets in major Indian hubs.
            </div>
        </div>
    );
}
