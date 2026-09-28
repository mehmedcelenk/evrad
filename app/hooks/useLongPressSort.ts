"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEventHandler,
  type PointerEventHandler,
} from "react";
import { useAppRuntime } from "../core/AppRuntimeContext";
import { triggerHaptic } from "../core/haptics";
import { moveItem } from "../core/sort";

const HOLD_DELAY_MS = 240;
const CANCEL_DISTANCE_PX = 12;

interface SortableItem {
  id: string;
  sortOrder: number;
}

interface ActivePress<T> {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  active: boolean;
  timer: number;
  autoScrollFrame: number | null;
  onMove: (event: PointerEvent) => void;
  onEnd: (event: PointerEvent) => void;
  startItems: T[];
}

function releasePress<T>(press: ActivePress<T>) {
  window.clearTimeout(press.timer);
  if (press.autoScrollFrame !== null) cancelAnimationFrame(press.autoScrollFrame);
  window.removeEventListener("pointermove", press.onMove, true);
  window.removeEventListener("pointerup", press.onEnd, true);
  window.removeEventListener("pointercancel", press.onEnd, true);
}

export function useLongPressSort<T extends SortableItem>({
  items,
  onChange,
  onPersist,
  getAnnouncement,
  onError,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  onPersist: (items: T[]) => Promise<void>;
  getAnnouncement: (item: T, position: number) => string;
  onError: () => void;
}) {
  const { hapticEnabled } = useAppRuntime();
  const itemsRef = useRef(items);
  const pressRef = useRef<ActivePress<T> | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => { itemsRef.current = items; }, [items]);

  const finish = useCallback((press: ActivePress<T>, persist: boolean) => {
    releasePress(press);

    if (press.active) {
      if (!persist) {
        itemsRef.current = press.startItems;
        onChange(press.startItems);
        setAnnouncement("");
      } else {
        const item = itemsRef.current.find((candidate) => candidate.id === press.id);
        const position = itemsRef.current.findIndex((candidate) => candidate.id === press.id) + 1;
        if (item) setAnnouncement(getAnnouncement(item, position));
        onPersist(itemsRef.current).catch(onError);
      }
    }

    if (pressRef.current === press) pressRef.current = null;
    document.body.classList.remove("is-sorting");
    setDraggingId(null);
    setDragOffsetY(0);
  }, [getAnnouncement, onChange, onError, onPersist]);

  useEffect(() => () => {
    const press = pressRef.current;
    if (press) releasePress(press);
    document.body.classList.remove("is-sorting");
  }, []);

  const pointerDown = useCallback<PointerEventHandler<HTMLElement>>((event) => {
    if (event.button !== 0 || pressRef.current) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest(".completion-light, .card-actions, .font-controls, a, input, textarea, select")) {
      return;
    }
    const cardEl = event.currentTarget.dataset.sortId ? event.currentTarget : target?.closest<HTMLElement>("[data-sort-id]");
    const id = cardEl?.dataset.sortId;
    if (!id) return;

    const press = {} as ActivePress<T>;
    press.id = id;
    press.pointerId = event.pointerId;
    press.startX = event.clientX;
    press.startY = event.clientY;
    press.originX = event.clientX;
    press.originY = event.clientY;
    press.currentX = event.clientX;
    press.currentY = event.clientY;
    press.active = false;
    press.startItems = itemsRef.current;
    press.autoScrollFrame = null;
    const moveOverTarget = () => {
      const targetCard = document.elementsFromPoint(press.currentX, press.currentY)
        .map((element) => element.closest<HTMLElement>("[data-card-id]"))
        .find((element) => element?.dataset.cardId && element.dataset.cardId !== press.id);
      const targetId = targetCard?.dataset.cardId;
      if (!targetId) return;
      const next = moveItem(itemsRef.current, press.id, targetId);
      if (next === itemsRef.current) return;
      itemsRef.current = next;
      onChange(next);
      press.originY = press.currentY;
      setDragOffsetY(0);
      triggerHaptic(hapticEnabled, 5);
    };
    const autoScroll = () => {
      if (!press.active || pressRef.current !== press) return;
      const edge = 88;
      const bottomEdge = window.innerHeight - edge;
      const distance = press.currentY < edge
        ? press.currentY - edge
        : press.currentY > bottomEdge
          ? press.currentY - bottomEdge
          : 0;
      if (distance !== 0) {
        const speed = Math.sign(distance) * Math.min(14, Math.max(3, Math.abs(distance) / 5));
        window.scrollBy(0, speed);
        moveOverTarget();
      }
      press.autoScrollFrame = requestAnimationFrame(autoScroll);
    };
    press.onMove = (moveEvent) => {
      if (moveEvent.pointerId !== press.pointerId) return;
      const distance = Math.hypot(moveEvent.clientX - press.originX, moveEvent.clientY - press.originY);
      if (!press.active) {
        if (distance > CANCEL_DISTANCE_PX) finish(press, false);
        return;
      }

      const horizontalDistance = Math.abs(moveEvent.clientX - press.startX);
      const verticalDistance = Math.abs(moveEvent.clientY - press.startY);
      if (horizontalDistance > CANCEL_DISTANCE_PX && horizontalDistance > verticalDistance) {
        finish(press, false);
        return;
      }

      moveEvent.preventDefault();
      press.currentX = moveEvent.clientX;
      press.currentY = moveEvent.clientY;
      setDragOffsetY(press.currentY - press.originY);
      moveOverTarget();
    };
    press.onEnd = (endEvent) => {
      if (endEvent.pointerId === press.pointerId) {
        if (press.active) {
          const suppressClick = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            window.removeEventListener("click", suppressClick, true);
          };
          window.addEventListener("click", suppressClick, true);
          window.setTimeout(() => window.removeEventListener("click", suppressClick, true), 120);
        }
        finish(press, endEvent.type !== "pointercancel");
      }
    };
    press.timer = window.setTimeout(() => {
      if (pressRef.current !== press) return;
      press.active = true;
      document.body.classList.add("is-sorting");
      setDraggingId(id);
      triggerHaptic(hapticEnabled, 12);
      press.autoScrollFrame = requestAnimationFrame(autoScroll);
    }, HOLD_DELAY_MS);

    pressRef.current = press;
    window.addEventListener("pointermove", press.onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", press.onEnd, true);
    window.addEventListener("pointercancel", press.onEnd, true);
  }, [finish, hapticEnabled, onChange]);

  const keyDown = useCallback<KeyboardEventHandler<HTMLElement>>((event) => {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const id = event.currentTarget.dataset.sortId;
    if (!id) return;
    event.preventDefault();
    const currentIndex = itemsRef.current.findIndex((item) => item.id === id);
    if (currentIndex < 0) return;
    const targetIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? itemsRef.current.length - 1
        : Math.max(0, Math.min(itemsRef.current.length - 1, currentIndex + (event.key === "ArrowUp" ? -1 : 1)));
    const target = itemsRef.current[targetIndex];
    if (!target || target.id === id) return;
    const next = moveItem(itemsRef.current, id, target.id);
    itemsRef.current = next;
    onChange(next);
    const item = next.find((candidate) => candidate.id === id);
    const position = next.findIndex((candidate) => candidate.id === id) + 1;
    if (item) setAnnouncement(getAnnouncement(item, position));
    onPersist(next).catch(onError);
  }, [getAnnouncement, onChange, onError, onPersist]);

  return {
    draggingId,
    dragOffsetY,
    announcement,
    handleProps: { onPointerDown: pointerDown, onKeyDown: keyDown },
  };
}
