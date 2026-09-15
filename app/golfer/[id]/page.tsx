import { notFound } from "next/navigation";
import { getGolfer } from "@/lib/store";
import { StatCard } from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function GolferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const golfer = await getGolfer(id);
  if (!golfer) notFound();

  return <StatCard golfer={golfer} />;
}
