import { ReactNode } from 'react';

interface MasterCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  hover?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-4 md:p-6',
  md: 'p-6 md:p-8',
  lg: 'p-8 md:p-10',
  xl: 'p-10 md:p-12',
};

/**
 * MasterCard - The unified container component for Langfens Design System
 * @description A clean white card with rounded corners and subtle shadow
 */
export default function MasterCard({ 
  children, 
  className = '', 
  padding = 'lg',
  hover = false 
}: MasterCardProps) {
  return (
    <div 
      className={`
        bg-white border border-slate-200 rounded-[2rem] shadow-sm
        ${paddingMap[padding]}
        ${hover ? 'hover:border-blue-200 hover:shadow-md transition-all' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
