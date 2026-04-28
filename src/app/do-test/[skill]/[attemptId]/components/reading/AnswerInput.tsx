'use client';

import React, { memo, useState, useCallback } from 'react';

interface AnswerInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  isReviewMode?: boolean;
  correctAnswer?: string;
  className?: string;
}

const AnswerInput = memo(function AnswerInput({
  id,
  value,
  onChange,
  placeholder = 'Type your answer...',
  maxLength = 50,
  disabled = false,
  isReviewMode = false,
  correctAnswer,
  className = '',
}: AnswerInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled && !isReviewMode) {
        onChange(e.target.value);
      }
    },
    [disabled, isReviewMode, onChange]
  );

  const handleFocus = useCallback(() => {
    if (!disabled && !isReviewMode) {
      setIsFocused(true);
    }
  }, [disabled, isReviewMode]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Review mode styling
  const getReviewModeClass = () => {
    if (!isReviewMode || correctAnswer === undefined) return '';
    
    const isCorrect = value.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
    if (isCorrect) return 'border-green-500 bg-green-50';
    return 'border-red-500 bg-red-50';
  };

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled || isReviewMode}
        className={`
          w-full px-4 py-3 
          rounded-[1rem] 
          border-[3px] 
          font-sans text-base
          transition-all duration-150
          placeholder:text-[var(--text-muted)] placeholder:font-normal
          disabled:cursor-not-allowed disabled:opacity-60
          ${isFocused && !isReviewMode 
            ? 'border-[var(--primary)] shadow-[0_0_0_3px_rgba(0,0,0,0.05)]' 
            : 'border-[var(--border)]'}
          ${getReviewModeClass()}
          focus:outline-none focus:border-[var(--primary)]
        `}
        style={{
          fontFamily: 'var(--font-sans)',
        }}
        aria-label={`Answer for question ${id}`}
        aria-describedby={isReviewMode ? `${id}-review` : undefined}
      />
      
      {/* Character count */}
      {!isReviewMode && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span 
            className="text-xs text-[var(--text-muted)] font-mono"
            aria-live="polite"
          >
            {value.length}/{maxLength}
          </span>
        </div>
      )}

      {/* Review mode indicator */}
      {isReviewMode && correctAnswer !== undefined && (
        <div 
          id={`${id}-review`}
          className="mt-2 text-sm"
        >
          {value.trim().toUpperCase() === correctAnswer.trim().toUpperCase() ? (
            <span className="text-green-600 font-semibold">Correct!</span>
          ) : (
            <span className="text-red-600 font-semibold">
              Correct answer: {correctAnswer}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export default AnswerInput;
