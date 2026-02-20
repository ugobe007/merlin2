/**
 * PowerProfileChart Component
 * ============================
 * SVG-based 24-hour load curve visualization showing:
 * - Baseline demand (gray area)
 * - Peak cap line (dashed)
 * - BESS-optimized demand (green overlay)
 * - Peak shaving visualization
 * 
 * Created: January 21, 2026
 * Phase 5: Live Battery Sizing + Power Profile Preview
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LoadCurve } from '@/services/truequote';

interface PowerProfileChartProps {
  loadCurve: LoadCurve | null;
  targetCapKW?: number;
  className?: string;
  height?: number;
  showLegend?: boolean;
}

// Chart dimensions
const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };

/**
 * Format kW value for axis labels
 */
function formatAxisValue(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toFixed(0);
}

/**
 * Generate SVG path for area chart
 */
function generateAreaPath(
  points: { hour: number; demandKW: number }[],
  width: number,
  height: number,
  maxY: number
): string {
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;
  
  const xScale = (hour: number) => PADDING.left + (hour / 23) * chartWidth;
  const yScale = (demand: number) => PADDING.top + chartHeight - (demand / maxY) * chartHeight;
  
  // Start at bottom left
  let path = `M ${xScale(0)} ${PADDING.top + chartHeight}`;
  
  // Line to first point
  path += ` L ${xScale(0)} ${yScale(points[0].demandKW)}`;
  
  // Curve through all points
  for (let i = 1; i < points.length; i++) {
    path += ` L ${xScale(points[i].hour)} ${yScale(points[i].demandKW)}`;
  }
  
  // Close at bottom right
  path += ` L ${xScale(23)} ${PADDING.top + chartHeight}`;
  path += ' Z';
  
  return path;
}

/**
 * Generate SVG path for line chart
 */
function _generateLinePath(
  points: { hour: number; demandKW: number }[],
  width: number,
  height: number,
  maxY: number
): string {
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;
  
  const xScale = (hour: number) => PADDING.left + (hour / 23) * chartWidth;
  const yScale = (demand: number) => PADDING.top + chartHeight - (demand / maxY) * chartHeight;
  
  let path = `M ${xScale(points[0].hour)} ${yScale(points[0].demandKW)}`;
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${xScale(points[i].hour)} ${yScale(points[i].demandKW)}`;
  }
  
  return path;
}

export function PowerProfileChart({ 
  loadCurve, 
  targetCapKW,
  className, 
  height = 200,
  showLegend = true 
}: PowerProfileChartProps) {
  const width = 400; // Will be scaled by viewBox
  
  // Calculate chart bounds
  const { maxY, yTicks, capY } = useMemo(() => {
    if (!loadCurve) {
      return { maxY: 100, yTicks: [0, 25, 50, 75, 100], capY: undefined };
    }
    
    const max = Math.max(loadCurve.peakKW, targetCapKW ?? 0) * 1.1;
    const roundedMax = Math.ceil(max / 100) * 100;
    
    // Generate nice Y-axis ticks
    const tickCount = 5;
    const tickStep = roundedMax / (tickCount - 1);
    const ticks = Array.from({ length: tickCount }, (_, i) => Math.round(i * tickStep));
    
    return {
      maxY: roundedMax,
      yTicks: ticks,
      capY: targetCapKW,
    };
  }, [loadCurve, targetCapKW]);
  
  // Generate paths
  const { baselinePath, bessPath, capLine } = useMemo(() => {
    if (!loadCurve) {
      return { baselinePath: '', bessPath: '', capLine: '' };
    }
    
    const chartHeight = height - PADDING.top - PADDING.bottom;
    const yScale = (demand: number) => PADDING.top + chartHeight - (demand / maxY) * chartHeight;
    
    return {
      baselinePath: generateAreaPath(loadCurve.baseline, width, height, maxY),
      bessPath: generateAreaPath(loadCurve.withBess, width, height, maxY),
      capLine: capY 
        ? `M ${PADDING.left} ${yScale(capY)} L ${width - PADDING.right} ${yScale(capY)}`
        : '',
    };
  }, [loadCurve, maxY, capY, height]);
  
  // X-axis labels (every 6 hours)
  const xLabels = ['12am', '6am', '12pm', '6pm', '12am'];
  const xPositions = [0, 6, 12, 18, 24].map(h => 
    PADDING.left + (h / 24) * (width - PADDING.left - PADDING.right)
  );
  
  if (!loadCurve) {
    return (
      <div className={cn(
        'rounded-lg border border-dashed border-muted-foreground/30 p-4',
        'flex items-center justify-center text-muted-foreground',
        className
      )}
      style={{ height }}
      >
        <span className="text-sm">Load profile will appear here</span>
      </div>
    );
  }
  
  const chartHeight = height - PADDING.top - PADDING.bottom;
  
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = PADDING.top + chartHeight - (tick / maxY) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={width - PADDING.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-muted-foreground"
              >
                {formatAxisValue(tick)}
              </text>
            </g>
          );
        })}
        
        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={xPositions[i]}
            y={height - 8}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {label}
          </text>
        ))}
        
        {/* Y-axis label */}
        <text
          x={12}
          y={height / 2}
          textAnchor="middle"
          className="text-[10px] fill-muted-foreground"
          transform={`rotate(-90, 12, ${height / 2})`}
        >
          Demand (kW)
        </text>
        
        {/* Baseline area (gray) */}
        <path
          d={baselinePath}
          fill="#d1d5db"
          fillOpacity={0.5}
          stroke="#9ca3af"
          strokeWidth={1}
        />
        
        {/* BESS-optimized area (green) */}
        <path
          d={bessPath}
          fill="#22c55e"
          fillOpacity={0.3}
          stroke="#16a34a"
          strokeWidth={2}
        />
        
        {/* Peak cap line (dashed) */}
        {capLine && (
          <path
            d={capLine}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="none"
          />
        )}
        
        {/* Peak shaving indicator */}
        {loadCurve.peakReduction > 0 && (
          <>
            {/* Arrow showing reduction */}
            <g transform={`translate(${width - 60}, ${PADDING.top + 10})`}>
              <rect
                x={0}
                y={0}
                width={50}
                height={32}
                rx={4}
                fill="white"
                stroke="#22c55e"
                strokeWidth={1}
              />
              <text
                x={25}
                y={14}
                textAnchor="middle"
                className="text-[9px] fill-green-600 font-medium"
              >
                Peak cut
              </text>
              <text
                x={25}
                y={26}
                textAnchor="middle"
                className="text-[11px] fill-green-700 font-bold"
              >
                -{formatAxisValue(loadCurve.peakReduction)} kW
              </text>
            </g>
          </>
        )}
      </svg>
      
      {/* Legend */}
      {showLegend && (
        <div className="px-4 pb-3 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-300/50 border border-gray-400" />
            <span className="text-muted-foreground">Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/30 border-2 border-green-600" />
            <span className="text-muted-foreground">With BESS</span>
          </div>
          {capLine && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 border-t-2 border-dashed border-red-500" />
              <span className="text-muted-foreground">Target cap</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PowerProfileChart;
