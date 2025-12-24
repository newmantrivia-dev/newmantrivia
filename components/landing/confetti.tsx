"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export function ConfettiEffect() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <Confetti
      width={windowDimensions.width}
      height={windowDimensions.height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.3}
      colors={["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}
    />
  );
}
