"use client";

import { useEffect, useRef, useState } from "react";
import { getSectionRoute, mainSections, type MainSection } from "../core/module-registry";

export function useSectionPager(initialSection: MainSection) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const initial = useRef(initialSection);
  const [activeSection, setActiveSection] = useState(initialSection);
  const navigate = useRef<(section: MainSection, smooth?: boolean) => void>(() => undefined);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const pages = Array.from(viewport.children) as HTMLElement[];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = initial.current;
    let frame = 0;
    let idle = 0;
    let moving = false;
    let width = viewport.clientWidth;
    const indexOf = (section: MainSection) => mainSections.findIndex((item) => item.id === section);
    const sectionAtScroll = () => mainSections[Math.max(0, Math.min(pages.length - 1, Math.round(viewport.scrollLeft / (width || 1))))].id;
    const height = () => {
      const page = pages[indexOf(active)];
      if (page.offsetHeight) viewport.style.height = `${page.offsetHeight}px`;
    };
    const setMoving = (next: boolean) => {
      moving = next;
      viewport.dataset.moving = String(next);
      if (next) viewport.style.height = "";
    };
    const publish = (section: MainSection) => {
      if (active === section) return;
      active = section;
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    const paint = () => {
      frame = 0;
      const position = viewport.scrollLeft / (width || 1);
      // Keep active/inert stable mid-gesture; WebKit can cancel a touch whose origin becomes inert.
      pages.forEach((page, index) => {
        const distance = reducedMotion.matches ? 0 : Math.min(1, Math.abs(position - index));
        page.style.setProperty("--page-dist", distance.toFixed(3));
      });
    };
    const settle = () => {
      window.clearTimeout(idle);
      setMoving(false);
      publish(sectionAtScroll());
      paint();
      height();
      const route = getSectionRoute(active);
      if (window.location.pathname !== route) window.history.replaceState(window.history.state, "", route);
    };
    const scroll = () => {
      if (!moving) setMoving(true);
      if (!frame) frame = requestAnimationFrame(paint);
      window.clearTimeout(idle);
      // Fallback for WebKit versions without scrollend; never assumes a fixed
      // duration for the browser's native, interruptible smooth scrolling.
      idle = window.setTimeout(settle, 160);
    };
    navigate.current = (section, smooth = true) => {
      window.clearTimeout(idle);
      window.scrollTo({ top: 0, behavior: "instant" });
      setMoving(true);
      const left = indexOf(section) * width;
      if (!smooth || reducedMotion.matches || Math.abs(left - viewport.scrollLeft) < 1) {
        viewport.scrollTo({ left, behavior: "instant" });
        settle();
      } else {
        viewport.scrollTo({ left, behavior: "smooth" });
      }
    };
    const popstate = () => {
      const section = mainSections.find((item) => item.route === window.location.pathname);
      if (section) navigate.current(section.id, false);
    };
    const resize = new ResizeObserver(() => {
      if (viewport.clientWidth !== width) {
        width = viewport.clientWidth;
        viewport.scrollTo({ left: indexOf(active) * width, behavior: "instant" });
        paint();
      }
      if (!moving) height();
    });
    viewport.scrollLeft = indexOf(active) * width;
    viewport.dataset.moving = "false";
    paint();
    height();
    pages.forEach((page) => resize.observe(page));
    viewport.addEventListener("scroll", scroll, { passive: true });
    viewport.addEventListener("scrollend", settle);
    window.addEventListener("popstate", popstate);
    reducedMotion.addEventListener("change", paint);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      resize.disconnect();
      viewport.removeEventListener("scroll", scroll);
      viewport.removeEventListener("scrollend", settle);
      window.removeEventListener("popstate", popstate);
      reducedMotion.removeEventListener("change", paint);
    };
  }, []);

  useEffect(() => {
    if (initial.current === initialSection) return;
    initial.current = initialSection;
    navigate.current(initialSection, false);
  }, [initialSection]);

  return { viewportRef, activeSection, selectSection: (section: MainSection, smooth = true) => navigate.current(section, smooth) };
}
