import type { SentenceComparison } from '@/types/writing';

interface Props {
  comparisons: SentenceComparison[];
}

export function SentenceComparisonTable({ comparisons }: Props) {
  if (comparisons.length === 0) {
    return <p className="text-gray-500">No sentence comparisons available.</p>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sentence-by-Sentence Improvements</h3>
      {comparisons.map((sc, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-red-600 text-sm">Original</h4>
              <p className="mt-1">{sc.original}</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-600 text-sm">Improved</h4>
              <p className="mt-1">{sc.improved}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-600 text-sm">Explanation</h4>
            <p className="mt-1 text-sm">{sc.explanation}</p>
          </div>
          <div className="flex gap-2">
            <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100">
              {sc.category}
            </span>
            {sc.severity && (
              <span className={`inline-block px-2 py-1 text-xs rounded ${
                sc.severity === 'high' ? 'bg-red-100' :
                sc.severity === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                {sc.severity}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}