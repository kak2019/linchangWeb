"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { WORKBENCH_URL } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { useI18n } from "@/components/i18n-provider";
import Magnetic from "@/components/magnetic";
import {
  BrushUnderline,
  InkBlob,
  Mountains,
} from "@/components/decorations";
import BrandLogo from "@/components/brand-logo";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const DESKTOP_INPUT_QUERY = "(hover: hover) and (pointer: fine)";
const TOUCH_INPUT_QUERY = "(any-pointer: coarse)";

function HeroChars({ text, id }: { text: string; id: string }) {
  return text.split(/(\s+)/).map((token, tokenIndex) => {
    if (!token) return null;
    if (/^\s+$/.test(token)) {
      return (
        <span
          key={`${id}-space-${tokenIndex}`}
          className="hero-line-char inline-block will-change-transform"
        >
          {"\u00A0"}
        </span>
      );
    }

    return (
      <span
        key={`${id}-word-${tokenIndex}`}
        className="inline-block whitespace-nowrap"
      >
        {Array.from(token).map((char, charIndex) => (
          <span
            key={`${id}-${tokenIndex}-${charIndex}`}
            className="hero-line-char inline-block will-change-transform"
          >
            {char}
          </span>
        ))}
      </span>
    );
  });
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const playbackTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { locale, messages } = useI18n();
  const copy = messages.ui.hero;

  const beginPlayback = useCallback(() => {
    const video = videoRef.current;
    if (startedRef.current || !video) return;
    startedRef.current = true;

    // Call play within the tap handler. Safari can reject delayed playback;
    // keep the title and links visible unless playback actually starts.
    void video.play().then(() => {
      if (
        !startedRef.current || reducedMotion ||
        !window.matchMedia(DESKTOP_INPUT_QUERY).matches ||
        window.matchMedia(TOUCH_INPUT_QUERY).matches
      ) return;

      const charsLine1 = gsap.utils.toArray<HTMLElement>(
        ".hero-line-1 .hero-line-char",
        sectionRef.current,
      );
      const charsLine2 = gsap.utils.toArray<HTMLElement>(
        ".hero-line-2 .hero-line-char",
        sectionRef.current,
      );
      const fades = gsap.utils.toArray<HTMLElement>(
        ".hero-fade",
        sectionRef.current,
      );

      playbackTimelineRef.current?.kill();
      const timeline = gsap.timeline({ delay: 0.05 });
      playbackTimelineRef.current = timeline;
      timeline
        .to(
          charsLine1,
          {
            xPercent: -160,
            opacity: 0,
            duration: 0.85,
            ease: "power2.in",
            stagger: 0.035,
          },
          0,
        )
        .to(
          charsLine2,
          {
            xPercent: 160,
            opacity: 0,
            duration: 0.85,
            ease: "power2.in",
            stagger: 0.035,
          },
          0,
        )
        .to(
          ".hero-brush-path",
          { opacity: 0, duration: 0.4, ease: "power2.in" },
          0,
        )
        .to(
          fades,
          {
            opacity: 0,
            yPercent: -20,
            duration: 0.55,
            ease: "power2.in",
            stagger: 0.05,
          },
          0.05,
        );
    }).catch(() => {
      startedRef.current = false;
    });
  }, [reducedMotion]);

  const restoreIntroContent = useCallback(() => {
    if (!startedRef.current) return;
    startedRef.current = false;
    playbackTimelineRef.current?.kill();
    playbackTimelineRef.current = null;
    videoRef.current?.pause();

    const chars = gsap.utils.toArray<HTMLElement>(
      ".hero-line-char",
      sectionRef.current,
    );
    const fades = gsap.utils.toArray<HTMLElement>(
      ".hero-fade",
      sectionRef.current,
    );

    gsap.killTweensOf([...chars, ...fades]);
    gsap.killTweensOf(".hero-brush-path");
    gsap.to(chars, {
      xPercent: 0,
      yPercent: 0,
      opacity: 1,
      duration: 0.65,
      ease: "power3.out",
      stagger: 0.015,
    });
    gsap.to(fades, {
      y: 0,
      yPercent: 0,
      opacity: 1,
      duration: 0.45,
      ease: "power3.out",
      stagger: 0.035,
    });
    gsap.to(".hero-brush-path", {
      opacity: 1,
      strokeDashoffset: 0,
      duration: 0.35,
      ease: "power2.out",
    });
  }, []);

  useEffect(() => () => {
    startedRef.current = false;
    playbackTimelineRef.current?.kill();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (
        reducedMotion || !window.matchMedia(DESKTOP_INPUT_QUERY).matches ||
        window.matchMedia(TOUCH_INPUT_QUERY).matches
      ) return;
      if (window.scrollY > 30) beginPlayback();
      else restoreIntroContent();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [beginPlayback, restoreIntroContent, reducedMotion]);

  useGSAP(
    () => {
      if (reducedMotion) return;

      const mm = gsap.matchMedia();
      mm.add({
        desktop: `(min-width: 1024px) and ${DESKTOP_INPUT_QUERY}`,
        touch: TOUCH_INPUT_QUERY,
      }, (context) => {
        if (!context.conditions?.desktop || context.conditions.touch) return;
        if (!sectionRef.current || !mediaRef.current) return;

        gsap.fromTo(
          mediaRef.current,
          { scaleX: 1, scaleY: 1 },
          {
            scaleX: 1.16,
            scaleY: 1.16,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      const chars = gsap.utils.toArray<HTMLElement>(
        ".hero-line-char",
        sectionRef.current,
      );
      const fades = gsap.utils.toArray<HTMLElement>(
        ".hero-fade",
        sectionRef.current,
      );

      if (reducedMotion) {
        gsap.set([...chars, ...fades], { clearProps: "all" });
        gsap.set(".hero-brush-path", { strokeDashoffset: 0 });
        return;
      }

      const mm = gsap.matchMedia();
      mm.add({ desktop: DESKTOP_INPUT_QUERY, touch: TOUCH_INPUT_QUERY }, (context) => {
        if (!context.conditions?.desktop || context.conditions.touch) return;
        const underlineDelay = chars.length * 0.045 + 0.5;
        gsap
          .timeline({ delay: 0.54 })
          .fromTo(
            chars,
            { yPercent: 45, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power4.out",
              stagger: 0.045,
            },
            0,
          )
          .fromTo(
            fades,
            { y: 18, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.09,
            },
            0.4,
          )
          .fromTo(
            ".hero-brush-path",
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 0.85,
              ease: "power2.inOut",
            },
            underlineDelay,
          );
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [reducedMotion, locale], revertOnUpdate: true },
  );

  const onSectionClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;
    beginPlayback();
  };

  return (
    <section
      ref={sectionRef}
      id="top"
      onClick={onSectionClick}
      className="home-hero relative h-[200svh] cursor-pointer bg-night text-paper-soft lg:h-[260svh]"
    >
      <div className="hero-viewport sticky top-0 h-[100svh] overflow-hidden">
      {/* 视频背景 */}
      <div
        ref={mediaRef}
        className="absolute -inset-y-[8%] inset-x-0 will-change-transform"
        aria-hidden
      >
        <video
          ref={videoRef}
          className="h-full w-full animate-pan object-cover"
          muted
          loop
          playsInline
          preload="none"
          poster="/hero-poster.jpg"
          onPlaying={() => setVideoReady(true)}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 墨色氛围层 */}
      <div className="absolute inset-0 bg-night/25" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_44%,rgba(22,19,16,0.12),rgba(22,19,16,0.52)_78%,rgba(22,19,16,0.86))]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-night/55 via-transparent to-night/65"
        aria-hidden
      />
      <InkBlob
        className="left-[8%] top-[16%] h-[30rem] w-[30rem] animate-ink-breathe mix-blend-screen"
        color="rgba(177,140,69,0.18)"
      />
      <InkBlob
        className="right-[4%] top-[38%] h-[26rem] w-[26rem] animate-ink-breathe mix-blend-screen"
        color="rgba(156,51,64,0.22)"
      />
      <div
        className="paper-grain absolute inset-0 opacity-[0.18] mix-blend-overlay"
        aria-hidden
      />

      {/* 主体内容 */}
      <div className="hero-content relative z-10 flex h-full flex-col items-center justify-center px-5 pb-28 pt-28 text-center md:px-10">
        <div className="flex max-w-[880px] flex-col items-center">
          <span className="hero-fade inline-flex items-center gap-2.5 rounded-full border border-paper-soft/25 bg-night/35 px-4 py-1.5 text-[11px] tracking-wide text-paper-soft/90 backdrop-blur-sm">
            <i
              className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cinnabar"
              aria-hidden
            />
            {copy.engine}
          </span>

          <p className="hero-fade mt-7 text-[10px] font-medium tracking-[0.32em] text-gold-soft">
            NARRATIVE LEARNING, REIMAGINED
          </p>

          <h1
            key={locale}
            className="mt-4 font-serif text-[2.75rem] font-semibold leading-[1.18] tracking-tight text-shadow-ink sm:text-6xl md:text-7xl lg:text-[5.3rem]"
          >
            <span className="hero-title-line hero-line-1 block will-change-transform">
              <HeroChars text={copy.line1} id="line1" />
            </span>
            <span className="hero-title-line hero-line-2 block will-change-transform">
              <HeroChars text={copy.line2Prefix} id="line2" />
              <em className="relative mx-1 inline-block font-brush font-normal not-italic text-gold-soft">
                <HeroChars text={copy.emphasis} id="em" />
                <BrushUnderline className="hero-brush-path" />
              </em>
              <span className="hero-line-char inline-block will-change-transform">
                {locale === "en" ? "." : "。"}
              </span>
            </span>
          </h1>

          <p className="hero-fade mt-7 max-w-[640px] font-serif text-base leading-[1.9] text-paper-soft/85 text-shadow-ink md:text-lg">
            {copy.description}
          </p>

          <div className="hero-fade mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Magnetic className="flex h-12 w-full sm:w-auto">
              <a
                href={WORKBENCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-full w-full items-center justify-center gap-5 overflow-hidden rounded-md bg-cinnabar px-7 text-sm text-paper-soft shadow-[0_14px_34px_rgba(112,34,46,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cinnabar-deep hover:shadow-[0_18px_42px_rgba(112,34,46,0.45)] sm:gap-10"
              >
                <span
                  className="absolute left-0 top-0 h-full w-[38%] animate-shine bg-gradient-to-r from-transparent via-white/35 to-transparent"
                  aria-hidden
                />
                {copy.start}
              </a>
            </Magnetic>
            <a
              href="#experience"
              className="inline-flex h-12 w-full items-center justify-center rounded-md border border-paper-soft/35 bg-paper-soft/10 px-7 text-sm text-paper-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-paper-soft/60 hover:bg-paper-soft/20 sm:w-auto"
            >
              {copy.learnMore}
            </a>
          </div>
        </div>
      </div>

      {/* 远山剪影过渡 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-24 md:h-36">
        <Mountains className="h-full" />
      </div>

      {/* 视频加载过渡 */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 bg-night transition-opacity duration-1000 ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
        style={{
          backgroundImage: "url(/hero-poster.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      {/* CSS dismisses the curtain even when hydration fails or is delayed. */}
      <div className="hero-intro-curtain pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden>
        <div
          className="hero-curtain-top absolute inset-x-0 top-0 h-1/2 bg-night"
        >
          <div className="paper-grain absolute inset-0 opacity-[0.08]" />
        </div>
        <div
          className="hero-curtain-bottom absolute inset-x-0 bottom-0 h-1/2 bg-night"
        >
          <div className="paper-grain absolute inset-0 opacity-[0.08]" />
        </div>

        <div
          className="hero-curtain-mark absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5"
        >
          <span className="relative">
            <BrandLogo size={84} />
            <span className="absolute -inset-4 -z-10 animate-breathe rounded-full bg-cinnabar/20 blur-2xl" />
          </span>
          <span className="font-brush text-2xl tracking-[0.2em] text-paper-soft">
            {copy.introTitle}
          </span>
          <span className="text-[9px] tracking-[0.42em] text-gold-soft">
            NARRATIVEOS
          </span>
          <span className="h-px w-28 animate-breathe bg-gradient-to-r from-transparent via-cinnabar to-transparent" />
        </div>
      </div>
      </div>
    </section>
  );
}
