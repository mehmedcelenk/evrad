"use client";

import { useEffect, useRef, useState } from "react";
import { getSectionRoute, mainSections, type MainSection } from "../core/module-registry";

export function useSectionPager(initialSection: MainSection) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const initial = useRef(initialSection);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [navigationSection, setNavigationSection] = useState(initialSection);
  const navigate = useRef<(section: MainSection, smooth?: boolean) => void>(() => undefined);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const pages = Array.from(viewport.children) as HTMLElement[];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = initial.current;
    let frame = 0;
    let motionFrame = 0;
    let idle = 0;
    let moving = false;
    let programmatic = false;
    let indicated = initial.current;
    let width = viewport.clientWidth;
    const indexOf = (section: MainSection) => mainSections.findIndex((item) => item.id === section);
    const sectionAtScroll = () => mainSections[Math.max(0, Math.min(pages.length - 1, Math.round(viewport.scrollLeft / (width || 1))))].id;
    const sizeAt = (position: number) => {
      const lowerIndex = Math.max(0, Math.min(pages.length - 1, Math.floor(position)));
      const upperIndex = Math.max(0, Math.min(pages.length - 1, Math.ceil(position)));
      const lowerHeight = pages[lowerIndex].offsetHeight;
      const upperHeight = pages[upperIndex].offsetHeight;
      const progress = Math.max(0, Math.min(1, position - lowerIndex));
      const nextHeight = lowerHeight + (upperHeight - lowerHeight) * progress;
      if (nextHeight) viewport.style.height = `${Math.round(nextHeight)}px`;
    };
    const setMoving = (next: boolean) => {
      moving = next;
      viewport.dataset.moving = String(next);
    };
    const indicate = (section: MainSection) => {
      if (indicated === section) return;
      indicated = section;
      setNavigationSection(section);
    };
    const publish = (section: MainSection) => {
      indicate(section);
      if (active === section) return;
      active = section;
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    const paint = () => {
      frame = 0;
      const position = viewport.scrollLeft / (width || 1);
      // Keep active/inert stable mid-gesture; WebKit can cancel a touch whose origin becomes inert.
      indicate(sectionAtScroll());
      sizeAt(position);
      pages.forEach((page, index) => {
        const distance = reducedMotion.matches ? 0 : Math.min(1, Math.abs(position - index));
        page.style.setProperty("--page-dist", distance.toFixed(3));
      });
    };
    const settle = () => {
      window.clearTimeout(idle);
      publish(sectionAtScroll());
      paint();
      setMoving(false);
      const route = getSectionRoute(active);
      if (window.location.pathname !== route) window.history.replaceState(window.history.state, "", route);
    };
    const stopAnimation = () => {
      cancelAnimationFrame(motionFrame);
      motionFrame = 0;
      programmatic = false;
      delete viewport.dataset.programmatic;
    };
    const animateTo = (section: MainSection) => {
      window.clearTimeout(idle);
      cancelAnimationFrame(motionFrame);
      indicate(section);
      setMoving(true);
      programmatic = true;
      viewport.dataset.programmatic = "true";
      const start = viewport.scrollLeft;
      const target = indexOf(section) * width;
      const distance = Math.abs(target - start) / (width || 1);
      const duration = Math.min(440, 220 + distance * 110);
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        viewport.scrollLeft = start + (target - start) * eased;
        paint();
        if (progress < 1) {
          motionFrame = requestAnimationFrame(tick);
          return;
        }
        viewport.scrollLeft = target;
        paint();
        // Keep native snapping disabled through the final painted frame.
        motionFrame = requestAnimationFrame(() => {
          motionFrame = 0;
          programmatic = false;
          delete viewport.dataset.programmatic;
          settle();
        });
      };
      motionFrame = requestAnimationFrame(tick);
    };
    const snap = () => {
      if (programmatic) return;
      const section = sectionAtScroll();
      const target = indexOf(section) * width;
      if (reducedMotion.matches || Math.abs(target - viewport.scrollLeft) < 1) {
        viewport.scrollLeft = target;
        settle();
      } else {
        animateTo(section);
      }
    };
    const scroll = () => {
      if (programmatic) return;
      if (!moving) setMoving(true);
      if (!frame) frame = requestAnimationFrame(paint);
      window.clearTimeout(idle);
      // Fallback for WebKit versions without scrollend.
      idle = window.setTimeout(snap, 120);
    };
    navigate.current = (section, smooth = true) => {
      window.clearTimeout(idle);
      window.scrollTo({ top: 0, behavior: "instant" });
      const left = indexOf(section) * width;
      if (!smooth || reducedMotion.matches || Math.abs(left - viewport.scrollLeft) < 1) {
        stopAnimation();
        indicate(section);
        setMoving(true);
        viewport.scrollTo({ left, behavior: "instant" });
        settle();
      } else {
        animateTo(section);
      }
    };
    const popstate = () => {
      const section = mainSections.find((item) => item.route === window.location.pathname);
      if (section) navigate.current(section.id, false);
    };
    const resize = new ResizeObserver(() => {
      if (viewport.clientWidth !== width) {
        stopAnimation();
        width = viewport.clientWidth;
        viewport.scrollTo({ left: indexOf(active) * width, behavior: "instant" });
        paint();
      }
      if (!moving) sizeAt(indexOf(active));
    });
    viewport.scrollLeft = indexOf(active) * width;
    viewport.dataset.moving = "false";
    paint();
    pages.forEach((page) => resize.observe(page));
    viewport.addEventListener("scroll", scroll, { passive: true });
    viewport.addEventListener("scrollend", snap);
    viewport.addEventListener("pointerdown", stopAnimation, { passive: true });
    viewport.addEventListener("wheel", stopAnimation, { passive: true });
    window.addEventListener("popstate", popstate);
    reducedMotion.addEventListener("change", paint);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(motionFrame);
      window.clearTimeout(idle);
      resize.disconnect();
      viewport.removeEventListener("scroll", scroll);
      viewport.removeEventListener("scrollend", snap);
      viewport.removeEventListener("pointerdown", stopAnimation);
      viewport.removeEventListener("wheel", stopAnimation);
      window.removeEventListener("popstate", popstate);
      reducedMotion.removeEventListener("change", paint);
    };
  }, []);

  useEffect(() => {
    if (initial.current === initialSection) return;
    initial.current = initialSection;
    navigate.current(initialSection, false);
  }, [initialSection]);

  return {
    viewportRef,
    activeSection,
    navigationSection,
    selectSection: (section: MainSection, smooth = true) => navigate.current(section, smooth),
  };
}
