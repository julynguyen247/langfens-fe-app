import ReactMarkdown from "react-markdown";

export default function PassageView({
  passage,
}: {
  passage: { title: string; content: string };
}) {
  const title = passage.title.replace(/\\n/g, "\n");
  const content = passage.content.replace(/\\n/g, "\n");

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="px-6 py-3 border-b">
        <div className="prose prose-xl font-semibold text-gray-800 max-w-none">
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => (
                <h2
                  className="text-2xl font-semibold text-gray-800"
                  {...props}
                />
              ),
            }}
          >
            {title}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto overscroll-contain p-6 bg-white [scrollbar-gutter:stable] text-black space-y-6">
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
