interface Props {
  currentBand: number;
  targetBand: number;
}

export function BandProgressIndicator({ currentBand, targetBand }: Props) {
  const progress = (currentBand / targetBand) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Current: {currentBand.toFixed(1)}</span>
        <span>Target: {targetBand.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}