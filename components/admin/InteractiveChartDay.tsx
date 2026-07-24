"use client";

import { useEffect, useRef, useState } from "react";

type NumberFormat = "number" | "currency";

type ChartSeries = {
  className: string;
  label: string;
  value: number;
  percent: number;
  format?: NumberFormat;
};

function formatValue(value: number, format: NumberFormat = "number") {
  if (format === "currency") {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function InteractiveChartDay({
  dateLabel,
  displayedDate,
  rootClassName,
  barsClassName,
  series,
}: {
  dateLabel: string;
  displayedDate?: string;
  rootClassName: string;
  barsClassName: string;
  series: ChartSeries[];
}) {
  const [displayValues, setDisplayValues] = useState(
    series.map(() => 0),
  );
  const [interacting, setInteracting] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function animate() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    setInteracting(true);
    const startedAt = performance.now();
    const duration = 460;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValues(series.map((item) => item.value * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setInteracting(false);
    setDisplayValues(series.map(() => 0));
  }

  return (
    <div
      aria-label={`${dateLabel}：${series
        .map((item) => `${item.label} ${formatValue(item.value, item.format)}`)
        .join("，")}`}
      className={`${rootClassName} ${
        interacting ? "is-interacting" : ""
      }`}
      onBlur={reset}
      onFocus={animate}
      onMouseEnter={animate}
      onMouseLeave={reset}
      tabIndex={0}
    >
      <div className={barsClassName}>
        {series.map((item) => (
          <span
            className={`chart-series-bar ${item.className}`}
            key={item.label}
            style={{
              "--bar-size": `${Math.min(
                100,
                Math.max(0, item.percent),
              )}%`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <small>{displayedDate ?? dateLabel}</small>
      <span className="chart-group-tooltip" role="tooltip">
        <small>{dateLabel}</small>
        {series.map((item, index) => (
          <span key={item.label}>
            <i className={item.className} />
            <b>{item.label}</b>
            <strong>
              {formatValue(displayValues[index], item.format)}
            </strong>
          </span>
        ))}
      </span>
    </div>
  );
}
