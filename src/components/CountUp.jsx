import React, { useEffect, useState } from 'react';

export default function CountUp({ end, duration = 1200, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const endVal = parseFloat(end.toString().replace(/[^0-9.]/g, '')) || 0;
    const isInt = Number.isInteger(endVal);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function: easeOutExpo
      const easeVal = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      const current = easeVal * endVal;

      setCount(current);

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCount(endVal);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  // Format back into string if original was currency or percent
  const formatValue = () => {
    if (end.toString().startsWith('$')) {
      return `$${Math.round(count).toLocaleString()}`;
    }
    if (end.toString().endsWith('%')) {
      return `${Math.round(count)}%`;
    }
    return Math.round(count).toLocaleString();
  };

  return (
    <span>
      {prefix}
      {formatValue()}
      {suffix}
    </span>
  );
}
