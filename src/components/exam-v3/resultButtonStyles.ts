export const RESULT_BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

export const RESULT_BUTTON_PRIMARY =
  `${RESULT_BUTTON_BASE} bg-[var(--primary)] text-white border-2 border-[var(--primary)] border-b-[4px] border-b-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]`;

export const RESULT_BUTTON_SECONDARY =
  `${RESULT_BUTTON_BASE} bg-white text-[var(--text-body)] border-2 border-[var(--border)] border-b-[4px] border-b-[var(--border)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:border-b-[5px] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px]`;

export const RESULT_BUTTON_GHOST =
  `${RESULT_BUTTON_BASE} text-[var(--primary)] hover:bg-[var(--primary-light)]`;
