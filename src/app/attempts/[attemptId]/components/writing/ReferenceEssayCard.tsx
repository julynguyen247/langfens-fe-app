import type { ReferenceEssay } from '@/types/writing';

interface Props {
  essay: ReferenceEssay;
}

export function ReferenceEssayCard({ essay }: Props) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">Band {essay.band.toFixed(1)} Essay</h4>
          <p className="text-sm text-gray-500">Similarity: {(essay.similarity_score * 100).toFixed(0)}%</p>
        </div>
      </div>
      <p className="mt-2 text-sm">{essay.text}</p>
    </div>
  );
}