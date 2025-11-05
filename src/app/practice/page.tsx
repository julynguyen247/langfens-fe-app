// app/practice/page.tsx
import { redirect } from "next/navigation";

export default function PracticeIndex() {
  redirect("/practice/reading?item=reading_full");
}
