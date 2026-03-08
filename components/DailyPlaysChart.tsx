"use client";

import { useState, useEffect } from "react";

interface Point {
  day: number;
  date: string;
  plays: number;
}

interface Data {
  launchDate: string | null;
  points: Point[];
}

const CHART_WIDTH = 340;
const CHART_HEIGHT = 140;
const MARGIN_LEFT = 44;
const MARGIN_RIGHT = 12;
const MARGIN_TOP = 8;
const MARGIN_BOTTOM = 36;
const PLOT_WIDTH = CHART_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

function getYTicks(max: number): number[] {
  if (max <= 0) return [0];
  if (max <= 5) return [0, 1, 2, 3, 4, 5].filter((n) => n <= max);
  const step = max <= 10 ? 2 : max <= 30 ? 5 : max <= 100 ? 10 : 20;
  const ticks: number[] = [0];
  for (let v = step; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

function getXTicks(maxDay: number): number[] {
  if (maxDay <= 0) return [0];
  if (maxDay <= 7) return Array.from({ length: maxDay + 1 }, (_, i) => i);
  const step = maxDay <= 14 ? 2 : maxDay <= 30 ? 5 : 10;
  const ticks: number[] = [0];
  for (let d = step; d < maxDay; d += step) ticks.push(d);
  ticks.push(maxDay);
  return ticks;
}

export default function DailyPlaysChart() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily-plays", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) setData(json.data);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data || data.points.length === 0) {
    return (
      <div className="w-full h-36 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        {loading ? "Loading chart..." : "No data yet"}
      </div>
    );
  }

  const maxPlays = Math.max(...data.points.map((p) => p.plays), 1);
  const maxDay = data.points[data.points.length - 1]?.day ?? 0;

  const rawYTicks = getYTicks(maxPlays);
  const yTicks =
    rawYTicks.length >= 2
      ? rawYTicks.filter((_, i) => i !== rawYTicks.length - 2)
      : rawYTicks;
  const xTicks = getXTicks(maxDay);

  const scaleX = (day: number) =>
    MARGIN_LEFT + (day / Math.max(maxDay, 1)) * PLOT_WIDTH;
  const scaleY = (plays: number) =>
    MARGIN_TOP + PLOT_HEIGHT - (plays / maxPlays) * PLOT_HEIGHT;

  const points = data.points;
  const solidPoints = points.length > 1 ? points.slice(0, -1) : [];
  const todayPoint = points.length > 0 ? points[points.length - 1] : null;
  const yesterdayPoint = points.length >= 2 ? points[points.length - 2] : null;

  const solidLinePoints = solidPoints
    .map((p) => `${scaleX(p.day)},${scaleY(p.plays)}`)
    .join(" ");

  const totalW = CHART_WIDTH + 8;
  const totalH = CHART_HEIGHT + 12;

  return (
    <div className="w-full h-full min-h-[100px] flex">
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y axis line */}
        <line
          x1={MARGIN_LEFT}
          y1={MARGIN_TOP}
          x2={MARGIN_LEFT}
          y2={MARGIN_TOP + PLOT_HEIGHT}
          stroke="#d3d6da"
          strokeWidth="1"
        />
        {/* X axis line */}
        <line
          x1={MARGIN_LEFT}
          y1={MARGIN_TOP + PLOT_HEIGHT}
          x2={MARGIN_LEFT + PLOT_WIDTH}
          y2={MARGIN_TOP + PLOT_HEIGHT}
          stroke="#d3d6da"
          strokeWidth="1"
        />

        {/* Y axis labels */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={MARGIN_LEFT}
              y1={scaleY(v)}
              x2={MARGIN_LEFT + PLOT_WIDTH}
              y2={scaleY(v)}
              stroke="#e8e9eb"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <text
              x={MARGIN_LEFT - 6}
              y={scaleY(v) + 4}
              textAnchor="end"
              fill="#6b7280"
              fontSize="12"
            >
              {v}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {xTicks.map((d, i) => {
          const isLast = i === xTicks.length - 1;
          return (
            <text
              key={d}
              x={scaleX(d)}
              y={MARGIN_TOP + PLOT_HEIGHT + 16}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="12"
            >
              {isLast ? "Today" : d}
            </text>
          );
        })}

        {/* X axis label */}
        <text
          x={MARGIN_LEFT + PLOT_WIDTH / 2}
          y={totalH - 6}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="13"
        >
          Days since launch
        </text>

        {/* Y axis label */}
        <text
          x={14}
          y={MARGIN_TOP + PLOT_HEIGHT / 2}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="13"
          transform={`rotate(-90, 14, ${MARGIN_TOP + PLOT_HEIGHT / 2})`}
        >
          Players
        </text>

        {/* Solid line up to yesterday */}
        {solidLinePoints && (
          <polyline
            points={solidLinePoints}
            fill="none"
            stroke="#6aaa64"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dotted line from yesterday to today */}
        {yesterdayPoint && todayPoint && (
          <line
            x1={scaleX(yesterdayPoint.day)}
            y1={scaleY(yesterdayPoint.plays)}
            x2={scaleX(todayPoint.day)}
            y2={scaleY(todayPoint.plays)}
            stroke="#6aaa64"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
        )}

        {/* Today as dotted circle */}
        {todayPoint && (
          <circle
            cx={scaleX(todayPoint.day)}
            cy={scaleY(todayPoint.plays)}
            r="4"
            fill="none"
            stroke="#6aaa64"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
        )}

      </svg>
    </div>
  );
}
