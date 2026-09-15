"use client";

import { useState } from "react";

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "golfer"
  );
}

export function CardCapture({ golferId, name }: { golferId: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setBusy(true);
    setError(null);

    try {
      const fileName = `${slugify(name)}-stat-card.png`;
      const res = await fetch(`/api/golfers/${golferId}/card`);
      if (!res.ok) {
        throw new Error("Couldn't prepare the card image");
      }
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        // On phones this opens the native share sheet, which includes
        // "Save Image" — the direct path into the Photos app.
        await navigator.share({ files: [file], title: fileName });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Couldn't save the card");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="mx-auto mt-4 block w-full max-w-sm rounded bg-accent px-4 py-3 font-pixel text-[10px] text-ink transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing…" : "Download card"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
