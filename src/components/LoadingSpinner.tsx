"use client";

export default function LoadingSpinner({ text = "LOADING..." }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-border" />
          <div className="absolute inset-0 border-2 border-neon-green border-t-transparent animate-spin" />
        </div>
        <p className="text-neon-green text-xs font-bold tracking-widest animate-pulse">{text}</p>
      </div>
    </div>
  );
}
