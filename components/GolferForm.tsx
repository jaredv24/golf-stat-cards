"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { resizePhotoForUpload } from "@/lib/resize-photo";
import { SKILLS, SKILL_LABELS, type Skill } from "@/lib/schema";
import { POSE_KEYS, POSE_LABELS } from "@/lib/poses";

const DEFAULT_RATING = 5;

type Phase = "form" | "generating" | "choosing" | "saving";

export function GolferForm() {
  const router = useRouter();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<Skill, number>>(() =>
    Object.fromEntries(SKILLS.map((skill) => [skill, DEFAULT_RATING])) as Record<Skill, number>
  );
  const [phase, setPhase] = useState<Phase>("form");
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
  const [pendingFields, setPendingFields] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photoFile) {
      setError("Add a photo first");
      return;
    }

    setPhase("generating");
    setError(null);

    // Captured before the first await — React nulls out event.currentTarget
    // once the synchronous part of the handler finishes.
    const formEl = event.currentTarget;

    try {
      const resizedPhoto = await resizePhotoForUpload(photoFile);
      const form = new FormData(formEl);
      form.set("photo", resizedPhoto);

      const fields: Record<string, string> = {};
      for (const [key, value] of form.entries()) {
        if (key !== "photo" && typeof value === "string") fields[key] = value;
      }
      setPendingFields(fields);

      const genForm = new FormData();
      genForm.set("photo", resizedPhoto);
      genForm.set("favoriteColor", fields.favoriteColor ?? "");
      genForm.set("pose", fields.pose ?? "random");

      const response = await fetch("/api/golfers/generate", { method: "POST", body: genForm });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Something went wrong");
      }

      setAvatarOptions(body.avatars);
      setPhase("choosing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("form");
    }
  }

  async function handleChoose(avatarDataUrl: string) {
    if (!pendingFields) return;
    setPhase("saving");
    setError(null);

    try {
      const response = await fetch("/api/golfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingFields, avatarDataUrl }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Something went wrong");
      }

      router.push(`/golfer/${body.golfer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("choosing");
    }
  }

  if (phase === "choosing" || phase === "saving") {
    return (
      <div>
        <h2 className="mb-4 text-center font-pixel text-xs text-ink">Pick your avatar</h2>
        <div className="grid grid-cols-3 gap-3">
          {avatarOptions.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleChoose(src)}
              disabled={phase === "saving"}
              className="overflow-hidden rounded border-2 border-hairline transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable remote src */}
              <img
                src={src}
                alt={`Avatar option ${i + 1}`}
                className="aspect-[3/4] w-full object-cover [image-rendering:pixelated]"
              />
            </button>
          ))}
        </div>
        {phase === "saving" && (
          <p className="mt-4 text-center text-xs text-ink-muted">Saving your card…</p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  const submitting = phase === "generating";

  return (
    <form onSubmit={handleGenerate} className="space-y-6">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-xs text-ink-secondary" htmlFor="age">
            Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min={5}
            max={100}
            step={1}
            required
            placeholder="34"
            className="w-full rounded border border-hairline bg-page px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs text-ink-secondary" htmlFor="height">
            Height
          </label>
          <input
            id="height"
            name="height"
            type="text"
            required
            maxLength={20}
            placeholder={`5'11"`}
            className="w-full rounded border border-hairline bg-page px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs text-ink-secondary" htmlFor="favoriteColor">
          Favorite color
        </label>
        <input
          id="favoriteColor"
          name="favoriteColor"
          type="color"
          defaultValue="#3987e5"
          required
          className="h-10 w-20 cursor-pointer rounded border border-hairline bg-page p-1"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs text-ink-secondary" htmlFor="pose">
          Pose
        </label>
        <select
          id="pose"
          name="pose"
          defaultValue="random"
          className="w-full rounded border border-hairline bg-page px-3 py-2 text-ink outline-none focus:border-accent"
        >
          <option value="random">Surprise me</option>
          {POSE_KEYS.map((key) => (
            <option key={key} value={key}>
              {POSE_LABELS[key]}
            </option>
          ))}
        </select>
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
        {submitting ? "Generating your avatars…" : "Generate avatar options"}
      </button>
      {submitting && (
        <p className="text-center text-xs text-ink-muted">
          This can take up to 30 seconds — hang tight.
        </p>
      )}
    </form>
  );
}
