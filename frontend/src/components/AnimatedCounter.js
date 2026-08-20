"use client";

import { useEffect, useState, useRef } from "react";

export default function AnimatedCounter({ value, duration = 1200 }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef(null);

  useEffect(() => {
    // Extract numeric part and any suffix (%, comma-formatted numbers, etc.)
    const match = String(value).match(/^([\d,]+\.?\d*)(.*)$/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const numericTarget = parseFloat(match[1].replace(/,/g, ""));
    const suffix = match[2] || "";
    const hasDecimal = match[1].includes(".");
    const hasComma = match[1].includes(",");

    let start = null;
    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = numericTarget * eased;

      let formatted = hasDecimal ? current.toFixed(1) : Math.round(current).toString();
      if (hasComma) formatted = Number(formatted).toLocaleString("en-IN");

      setDisplay(formatted + suffix);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span ref={ref}>{display}</span>;
}