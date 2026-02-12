"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * Industry Heatmap Component (D3.js)
 * Visualizes Market Cap vs Growth for a set of companies.
 */

interface CompanyData {
    name: string;
    marketCap: number;
    growth: number;
    ebitda: number;
}

export default function IndustryHeatmap({ data }: { data: CompanyData[] }) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data.length) return;

        const width = 800;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', 'transparent');

        svg.selectAll('*').remove();

        const x = d3.scaleLog()
            .domain([d3.min(data, d => d.marketCap) || 1, d3.max(data, d => d.marketCap) || 10])
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.growth) || 100])
            .range([height - margin.bottom, margin.top]);

        const color = d3.scaleSequential(d3.interpolateRdYlGn)
            .domain([-20, 40]); // EBITDA margin range

        // Grid lines
        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(5, "~s"))
            .call(g => g.select(".domain").remove());

        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove());

        // Points
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => x(d.marketCap))
            .attr('cy', d => y(d.growth))
            .attr('r', 8)
            .attr('fill', d => color(d.ebitda))
            .attr('opacity', 0.8)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 12);
                // Add tooltip logic here
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 8);
            });

        // Labels
        svg.selectAll('text.label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => x(d.marketCap) + 12)
            .attr('y', d => y(d.growth) + 4)
            .text(d => d.name)
            .attr('font-size', '10px')
            .attr('fill', '#94a3b8');

    }, [data]);

    return (
        <div className="glass p-6 rounded-2xl overflow-hidden">
            <h3 className="text-accent-gold font-display text-xl mb-4">Competitor Performance Matrix</h3>
            <svg ref={svgRef}></svg>
            <div className="mt-4 flex justify-between text-xs text-slate-400">
                <span>X: Market Cap (Log Scale)</span>
                <span>Y: Revenue Growth (%)</span>
                <span>Color: EBITDA Margin (Red to Green)</span>
            </div>
        </div>
    );
}
