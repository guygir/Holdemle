"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  startTime: number;
  className?: string;
  pausedSeconds?: number | null;
}

export function Timer({ startTime, className, pausedSeconds }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (pausedSeconds != null) {
      setSeconds(pausedSeconds);
      return;
    }
    const tick = () =>
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, pausedSeconds]);

  const displaySeconds = pausedSeconds != null ? pausedSeconds : seconds;
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;

  return (
    <span className={className}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}
