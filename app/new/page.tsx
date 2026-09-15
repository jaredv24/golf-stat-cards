import { GolferForm } from "@/components/GolferForm";

export default function NewGolferPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 font-pixel text-xs text-ink sm:text-sm">Build your card</h1>
      <GolferForm />
    </div>
  );
}
