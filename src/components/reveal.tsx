"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  threshold = 0.12,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.remove("is-pending");
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    // Server-rendered content stays visible until observation is available.
    node.classList.add("is-pending");
    observer.observe(node);
    return () => {
      node.classList.remove("is-pending");
      observer.disconnect();
    };
  }, [threshold, reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        "reveal",
        (visible || reducedMotion) && "is-visible",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
