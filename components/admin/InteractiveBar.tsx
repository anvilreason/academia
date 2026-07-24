"use client";

import { useEffect, useRef, useState } from "react";

type NumberFormat = "number" | "currency" | "percent";

function formatValue(value: number, format: NumberFormat) {
  if (format === "currency") {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: value % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value);
  }
  const number = new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
  }).format(value);
  return format === "percent" ? `${number}%` : number;
}

export function InteractiveBar({
  value,
  percent,
  label,
  orientation,
  className = "",
  format = "number",
}: {
  value: number;
  percent: number;
  label: string;
  orientation: "vertical" | "horizontal";
  className?: string;
  format?: NumberFormat;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [active, setActive] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function animate() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    setActive(true);
    const startedAt = performance.now();
    const duration = 460;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setActive(false);
    setDisplayValue(0);
  }

  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <button
      aria-label={`${label}：${formatValue(value, format)}`}
      className={`interactive-bar ${orientation} ${className} ${
        active ? "is-interacting" : ""
      }`}
      onBlur={reset}
      onFocus={animate}
      onMouseEnter={animate}
      onMouseLeave={reset}
      style={{ "--bar-size": `${safePercent}%` } as React.CSSProperties}
      type="button"
    >
      <span className="chart-tooltip" role="tooltip">
        <strong>{formatValue(displayValue, format)}</strong>
        <small>{label}</small>
      </span>
    </button>
  );
}
