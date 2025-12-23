import ReactMarkdown from "react-markdown";
import Image from "next/image";

export default function PassageView({
  passage,
}: {
  passage: { title: string; content: string; imageUrl?: string };
}) {
  const title = passage.title.replace(/\\n/g, "\n");
  const content = passage.content.replace(/\\n/g, "\n");

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="px-6 py-3 border-b">
        <div className="prose prose-2xl prose-strong font-semibold text-gray-800 max-w-none">
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => (
                <h2
                  className="text-3xl font-bold text-gray-900"
                  {...props}
                />
              ),
            }}
          >
            {title}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto overscroll-contain p-6 bg-white [scrollbar-gutter:stable] 
      text-black space-y-6">
        {/* Show image FIRST if exists */}
        {passage.imageUrl && (
          <div className="flex justify-center mb-4">
            <Image
              src={passage.imageUrl}
              alt={passage.title || "Passage image"}
              width={600}
              height={400}
              className="rounded-lg object-contain max-w-full h-auto"
            />
          </div>
        )}
        
        {/* Then show the passage content */}
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <p
                className="whitespace-pre-wrap leading-relaxed text-[15px] text-slate-800"
                {...props}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
