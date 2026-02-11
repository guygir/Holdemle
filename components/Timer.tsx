"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  startTime: number;
  className?: string;
}

export function Timer({ startTime, className }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () =>
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span className={className}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}
