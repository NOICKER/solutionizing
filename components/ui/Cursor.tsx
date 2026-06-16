"use client";

import { useEffect } from "react";

export default function Cursor() {
  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none)").matches;
    const cursorEl = document.getElementById("sol-cursor");
    if (!cursorEl) return;

    if (isTouch) {
      cursorEl.style.display = "none";
      document.body.style.cssText += "cursor: auto !important;";
      document.querySelectorAll("a, button").forEach(
        (el) => ((el as HTMLElement).style.cursor = "auto")
      );
      return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    const updateCursor = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursorEl.style.transform = `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%))`;
      rafId = requestAnimationFrame(updateCursor);
    };
    rafId = requestAnimationFrame(updateCursor);

    // Bind hover state to all interactive elements, including dynamically added ones
    const bindHover = () => {
      document
        .querySelectorAll("a, button, input, select, textarea, [role='button']")
        .forEach((el) => {
          if ((el as HTMLElement).dataset.cursorBound) return;
          (el as HTMLElement).dataset.cursorBound = "true";
          el.addEventListener("mouseenter", () => {
            if (el.closest('[data-hide-cursor="true"]')) {
              cursorEl.classList.add("hide");
            } else {
              cursorEl.classList.add("hover");
            }
          });
          el.addEventListener("mouseleave", () => {
            cursorEl.classList.remove("hover", "hide");
          });
        });
    };
    bindHover();

    const mutationObserver = new MutationObserver(bindHover);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <>
      {/* Cursor dot */}
      <div
        id="sol-cursor"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 12,
          height: 12,
          borderRadius: "999px",
          background: "#ff6b1a",
          opacity: 1,
          pointerEvents: "none",
          zIndex: 10000,
          transform: "translate(-50%, -50%)",
          transition:
            "width 0.3s cubic-bezier(0.16,1,0.3,1), height 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s cubic-bezier(0.16,1,0.3,1), background 0.3s cubic-bezier(0.16,1,0.3,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
      {/* Hover expansion - controlled via JS adding .hover class */}
      <style>{`
        #sol-cursor.hover {
          width: 24px !important;
          height: 24px !important;
          background: #ff6b1a !important;
          opacity: 0.4 !important;
        }
        #sol-cursor.hide {
          opacity: 0 !important;
          transform: translate(-50%, -50%) scale(0) !important;
        }
      `}</style>
    </>
  );
}
