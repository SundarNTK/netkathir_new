const LABELS = [
  { t: "LLM Integration", pos: "left-[79%] top-[17%]", delay: 0, dur: 7 },
  { t: "Smart Chatbots", pos: "left-[56%] top-[30%]", delay: 1.4, dur: 8 },
  { t: "AI Automation", pos: "left-[81%] top-[46%]", delay: 0.7, dur: 6.5 },
  { t: "RAG Pipelines", pos: "left-[57%] top-[64%]", delay: 2.1, dur: 7.5 },
  { t: "AI Agents", pos: "left-[77%] top-[76%]", delay: 1.0, dur: 8.5 },
];

/** Premium glass tags that drift around the robot (desktop / tablet landscape only). */
export default function FloatingLabels() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
      {LABELS.map((l) => (
        <span
          key={l.t}
          className={`absolute ${l.pos} flex items-center gap-2.5 rounded-full border border-white/80 bg-white/85 px-4 py-2.5 text-[0.82rem] font-semibold tracking-tight text-ink shadow-[0_14px_30px_-14px_rgba(22,101,52,0.5)]`}
          style={{ willChange: "transform", animation: `label-float ${l.dur}s ease-in-out ${l.delay}s infinite` }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-cyan opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_2px_rgba(34,197,94,0.8)]" />
          </span>
          {l.t}
        </span>
      ))}
    </div>
  );
}
