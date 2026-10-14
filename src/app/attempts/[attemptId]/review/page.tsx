import { redirect } from "next/navigation";

export default async function ReviewRedirectPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  redirect(`/attempts/${attemptId}`);
}
