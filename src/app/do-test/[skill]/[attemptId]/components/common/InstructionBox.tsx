// app/practice/[group]/[item]/do/components/InstructionBox.tsx
export default function InstructionBox({
  title,
  note,
  items,
  className = "",
  sticky = true,
}: {
  title: string; // "Question 1–6 Do the following statements…"
  note?: string; // dòng mô tả phụ (optional)
  items: { label: string; text: string }[]; // TRUE/FALSE/NOT GIVEN …
  className?: string;
  sticky?: boolean; // sticky header trong panel
}) {
  return (
    <div
      className={[
        "rounded-xl p-4 text-white",
        "bg-blue-600",
        sticky ? "sticky top-0 z-10" : "",

        sticky
          ? "bg-blue-600/95 backdrop-blur supports-[backdrop-filter]:bg-blue-600/75"
          : "",
        className,
      ].join(" ")}
    >
      <p className="font-semibold leading-6">{title}</p>
      {note && <p className="text-blue-100 text-sm mt-1">{note}</p>}

      <div className="mt-3 grid gap-1 text-sm">
        {items.map((it) => (
          <div key={it.label} className="flex gap-2">
            <span className="font-extrabold uppercase">{it.label}</span>
            <span className="text-blue-100">{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
