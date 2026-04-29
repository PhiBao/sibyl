"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "info", onClose, duration = 4000 }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const colors = {
    success: "border-neon-green/40 bg-neon-green/10 text-neon-green",
    error: "border-danger/40 bg-danger/10 text-danger",
    info: "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan",
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 border text-[12px] font-bold tracking-wider shadow-2xl backdrop-blur-md max-w-[90vw] whitespace-nowrap ${colors[type]} ${exiting ? "toast-exit" : "toast-enter"}`}
    >
      {type === "success" && "[ ✓ ] "}
      {type === "error" && "[ ✕ ] "}
      {type === "info" && "[ i ] "}
      {message}
    </div>
  );
}
