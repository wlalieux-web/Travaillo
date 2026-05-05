"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function CountUp({ to, suffix = "", duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return <span ref={ref}>{count.toLocaleString("fr-FR")}{suffix}</span>;
}

const stats = [
  { value: 12000, suffix: "+", label: "Équipes actives", description: "au Québec et au Canada" },
  { value: 98, suffix: "%", label: "Satisfaction client", description: "score NPS moyen" },
  { value: 3, suffix: "x", label: "Plus de jobs closés", description: "vs. sans logiciel" },
  { value: 40, suffix: "%", label: "Gain de temps", description: "sur les tâches admin" },
];

export function Stats() {
  return (
    <section id="stats" className="py-24 relative overflow-hidden bg-[#020c05]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-600/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-600/40 to-transparent" />
      <div className="absolute inset-0 bg-emerald-950/20" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-emerald-900/30">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col items-center text-center lg:px-8"
            >
              <div className="text-5xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-emerald-300 to-teal-400 tabular-nums mb-2">
                <CountUp to={stat.value} suffix={stat.suffix} duration={2 + i * 0.2} />
              </div>
              <div className="text-white/80 font-semibold mb-1">{stat.label}</div>
              <div className="text-white/30 text-sm">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
