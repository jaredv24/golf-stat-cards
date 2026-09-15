"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { resizePhotoForUpload } from "@/lib/resize-photo";
import { SKILLS, SKILL_LABELS, type Skill } from "@/lib/schema";

const DEFAULT_RATING = 5;

export function GolferForm() {
  const router = useRouter();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<Skill, number>>(() =>
    Object.fromEntries(SKILLS.map((skill) => [skill, DEFAULT_RATING])) as Record<Skill, number>
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photoFile) {
      setError("Add a photo first");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Captured before the first await — React nulls out event.currentTarget
    // once the synchronous part of the handler finishes.
    const formEl = event.currentTarget;

    try {
      const resizedPhoto = await resizePhotoForUpload(photoFile);
      const form = new FormData(formEl);
      form.set("photo", resizedPhoto);

      const response = await fetch("/api/golfers", { method: "POST", body: form });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Something went wrong");
      }

      router.push(`/golfer/${body.golfer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-xs text-ink-secondary" htmlFor="photo">
          Your photo
        </label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border-2 border-hairline bg-page">
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote src
              <img
                src={photoPreview}
                alt="Selected preview"
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={handlePhotoChange}
            className="block w-full text-xs text-ink-secondary file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-2 file:font-pixel file:text-[9px] file:text-ink"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs text-ink-secondary" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={60}
          placeholder="Tiger W."
          className="w-full rounded border border-hairline bg-page px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs text-ink-secondary" htmlFor="handicap">
          Handicap
        </label>
        <input
          id="handicap"
          name="handicap"
          type="number"
          step="0.1"
          min={-10}
          max={54}
          required
          placeholder="14.2"
          className="w-full rounded border border-hairline bg-page px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="space-y-4">
        {SKILLS.map((skill) => (
          <div key={skill}>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-secondary">
              <label htmlFor={skill}>{SKILL_LABELS[skill]}</label>
              <span className="tabular-nums text-ink">{ratings[skill]}</span>
            </div>
            <input
              id={skill}
              name={skill}
              type="range"
              min={1}
              max={10}
              step={1}
              value={ratings[skill]}
              onChange={(event) =>
                setRatings((prev) => ({ ...prev, [skill]: Number(event.target.value) }))
              }
              className="w-full accent-[--color-accent]"
            />
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-accent px-4 py-3 font-pixel text-[10px] text-ink transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Generating your 8-bit avatar…" : "Create my stat card"}
      </button>
      {submitting && (
        <p className="text-center text-xs text-ink-muted">
          This can take up to 30 seconds — hang tight.
        </p>
      )}
    </form>
  );
}
