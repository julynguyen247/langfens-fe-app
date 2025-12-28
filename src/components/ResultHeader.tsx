import { ReactNode } from 'react';

interface MetricItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

interface ResultHeaderProps {
  title: string;
  subtitle?: string;
  score: number | string;
  scoreLabel?: string;
  scoreColor?: string;
  metrics?: MetricItem[];
  children?: ReactNode;
}

/**
 * ResultHeader - Shared header component for result pages
 * @description Left-Right split: Big Score left + Metrics grid right
 */
export default function ResultHeader({
  title,
  subtitle,
  score,
  scoreLabel = 'Overall Score',
  scoreColor = 'text-[#3B82F6]',
  metrics = [],
  children,
}: ResultHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-8 md:p-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left: Score Section */}
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-slate-900 mb-2">{title}</h1>
          {subtitle && (
            <p className="text-slate-500 text-sm mb-6">{subtitle}</p>
          )}
          <div className="flex items-baseline gap-3">
            <span className={`font-serif text-7xl font-bold ${scoreColor}`}>
              {score}
            </span>
            <span className="text-slate-400 text-lg">{scoreLabel}</span>
          </div>
        </div>

        {/* Right: Metrics Grid */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            {metrics.map((metric, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 rounded-xl p-4 text-center min-w-[100px]"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {metric.icon && (
                    <span className={`material-symbols-rounded text-lg ${metric.color || 'text-slate-400'}`}>
                      {metric.icon}
                    </span>
                  )}
                  <span className={`font-bold text-2xl ${metric.color || 'text-slate-800'}`}>
                    {metric.value}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
}
