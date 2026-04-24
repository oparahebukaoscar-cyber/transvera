"use client";
import React from "react";

const TerminalFeedClient = () => {
  const initial = React.useMemo(() => Array.from({ length: 20 }).map((_, i) => `INIT - boot sequence ${i}`), []);
  const [lines, setLines] = React.useState<string[]>(initial);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const id = setInterval(() => {
      setLines(prev => {
        const next = [...prev.slice(-19), `${new Date().toISOString()} - INFO - tick ${Math.floor(Math.random() * 9999)}`];
        return next;
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (wrapRef.current) wrapRef.current.scrollTop = wrapRef.current.scrollHeight;
  }, [lines]);

  return (
    <div ref={wrapRef} className="bg-black/95 text-[10px] font-mono text-[#BEF264] p-3 rounded-lg h-40 overflow-auto">
      {lines.map((l, i) => (
        <div key={i} className="whitespace-pre">{l}</div>
      ))}
    </div>
  );
};

export default TerminalFeedClient;
