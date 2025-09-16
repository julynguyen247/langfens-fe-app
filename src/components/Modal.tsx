"use client";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { closeBtn } from "@/utils/icons";
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  preventScroll?: boolean;
  className?: string;
}

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  initialFocusRef,
  preventScroll = true,
  className = "",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useLockBodyScroll(preventScroll && open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const target =
      initialFocusRef?.current || closeBtnRef.current || panelRef.current;
    target?.focus();
  }, [open, initialFocusRef]);

  if (typeof window === "undefined") return null;
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="fixed opacity-100 animate-in fade-in duration-150"
        onClick={() => closeOnBackdrop && onClose()}
      />

      <div className="min-h-full flex items-center justify-center">
        <div
          ref={panelRef}
          tabIndex={-1}
          className={`w-full max-w-md rounded-2xl bg-white text-slate-900 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 ${className}`}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between gap-4 p-2 border-b border-slate-200">
              <h2 id="modal-title" className="text-md font-semibold leading-6">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  ref={closeBtnRef}
                  onClick={onClose}
                  className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Close"
                >
                  {closeBtn}
                </button>
              )}
            </div>
          )}

          <div className="p-5">{children}</div>

          {footer && (
            <div className="p-5 pt-0 flex flex-wrap items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
