"use client";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
const closeBtn = (
  <svg
    width="21"
    height="21"
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5 21C4.70101 21 0 16.2989 0 10.5C0 4.70101 4.70101 0 10.5 0C16.2989 0 21 4.70101 21 10.5C21 16.2989 16.2989 21 10.5 21ZM10.5 18.9C15.1392 18.9 18.9 15.1392 18.9 10.5C18.9 5.86081 15.1392 2.1 10.5 2.1C5.86081 2.1 2.1 5.86081 2.1 10.5C2.1 15.1392 5.86081 18.9 10.5 18.9ZM10.5 9.01509L13.4698 6.04523L14.9547 7.53015L11.9849 10.5L14.9547 13.4698L13.4698 14.9547L10.5 11.9849L7.53015 14.9547L6.04523 13.4698L9.01509 10.5L6.04523 7.53015L7.53015 6.04523L10.5 9.01509Z"
      fill="black"
    />
  </svg>
);

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
