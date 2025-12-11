import Link from "next/link";

interface PracticeHeaderProps {
  title: string;
  subtitle: string;
  href?: string;
  description: string;
}

export default function PracticeHeader({
  title,
  subtitle,
  href = "#",
  description,
}: PracticeHeaderProps) {
  return (
    <header className="w-full flex flex-col sm:flex-row sm:items-center gap-28 py-4 bg-white px-16 text-black">
      <div className="flex flex-col text-2xl ">
        <span className="font-semibold text-lg text-slate-900">{title}</span>
        <Link
          href={href}
          className="text-[#317EFF] hover:underline text-2xl font-bold"
        >
          {subtitle}
        </Link>
      </div>

      <p className="font-semibold text-sm max-w-xl">{description}</p>
    </header>
  );
}
