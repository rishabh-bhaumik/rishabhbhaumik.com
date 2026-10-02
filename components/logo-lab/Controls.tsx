"use client";

import { Fragment, useEffect, useState } from "react";
import { CAN_EDIT_PERMANENT, loadPermanent, loadPresets, savePermanent, savePresets, type Preset } from "./presets";
import { RECORD_LENGTHS } from "./record";
import { decodeSettings, encodeSettings, slotFrom, type Settings, type Slot } from "./settings";
import { FILTERS, MOTIONS, TRANSITIONS, TRANSITION_GROUPS, type FilterKey, type LogoMaterial, type TransitionKey } from "./types";

const pill = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-[12px] transition-colors disabled:opacity-40 ${on ? "border-white bg-white text-black" : "border-white/10 text-white/65 hover:text-white"}`;

function Row({ label, children, off = false }: { label: string; children: React.ReactNode; off?: boolean }) {
  return (
    <fieldset disabled={off} className="flex min-w-0 flex-col gap-2">
      <legend className="contents">
        <span className="flex items-baseline gap-2 text-[12px] uppercase tracking-[0.6px] text-white/50">
          {label}
          {off && <span className="normal-case tracking-normal text-white/40">Fixed for this material</span>}
        </span>
      </legend>
      <div className={`flex flex-1 flex-wrap items-center gap-2 ${off ? "pointer-events-none opacity-40" : ""}`}>{children}</div>
    </fieldset>
  );
}

function Slider({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  return (
    <input
      type="range"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1 flex-1 cursor-pointer accent-white"
    />
  );
}

const Value = ({ children }: { children: React.ReactNode }) => (
  <span className="w-10 text-right text-[12px] tabular-nums text-white/65">{children}</span>
);

// ── Tabs ──────────────────────────────────────────────────────────────────────
type Tab = "controls" | "transmute" | "presets";
const TABS: { key: Tab; label: string }[] = [
  { key: "controls", label: "Controls" },
  { key: "transmute", label: "Transmute" },
  { key: "presets", label: "Presets" },
];

// ── Panels ────────────────────────────────────────────────────────────────────
function ControlsPanel({
  settings,
  set,
  material,
  supports,
  reduced,
}: {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
  material: LogoMaterial;
  supports?: { relief: boolean; light: boolean };
  reduced: boolean;
}) {
  const light = settings.light ?? material.light ?? 135;
  return (
    <>
      <Row label="Motion">
        {MOTIONS.map((m) => (
          <button key={m.key} type="button" disabled={reduced} onClick={() => set({ motion: m.key })} className={pill(settings.motion === m.key)}>
            {m.label}
          </button>
        ))}
        <span className="text-[12px] text-white/45">Drag to turn it</span>
      </Row>

      <Row label="Loop">
        <button type="button" disabled={reduced} onClick={() => set({ loop: !settings.loop })} className={pill(settings.loop)}>
          {settings.loop ? "Animating" : "Paused"}
        </button>
        <Slider label="Loop speed" value={settings.speed} min={0.1} max={3} step={0.05} onChange={(speed) => set({ speed })} />
        <Value>{settings.speed.toFixed(2)}×</Value>
      </Row>

      <Row label="Relief" off={supports?.relief === false}>
        <Slider label="Relief" value={settings.relief} min={-2} max={2.5} step={0.05} onChange={(relief) => set({ relief })} />
        <button type="button" onClick={() => set({ relief: -settings.relief })} className={pill(settings.relief < 0)}>
          {settings.relief < 0 ? "Inverted" : "Invert"}
        </button>
      </Row>

      <Row label="Light" off={supports?.light === false}>
        <Slider label="Light angle" value={light} min={0} max={360} step={1} onChange={(v) => set({ light: v })} />
        <Value>{Math.round(light)}°</Value>
      </Row>

      {[0, 1].map((i) => {
        const layer = settings.filters[i] ?? { key: "none" as FilterKey, amount: 1 };
        const update = (patch: Partial<typeof layer>) => {
          const next = [...settings.filters];
          next[i] = { ...layer, ...patch };
          set({ filters: next });
        };
        return (
          <Row key={i} label={`Filter ${i + 1}`}>
            <select
              aria-label={`Filter ${i + 1}`}
              value={layer.key}
              onChange={(e) => update({ key: e.target.value as FilterKey })}
              className="h-8 rounded-xl border border-white/10 bg-black px-2 text-[12px] text-white"
            >
              {FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            {layer.key !== "none" && (
              <Slider label={`Filter ${i + 1} amount`} value={layer.amount} min={0} max={1} step={0.01} onChange={(amount) => update({ amount })} />
            )}
          </Row>
        );
      })}
    </>
  );
}

/** What a step changes from its material's defaults. */
function tweaks(slot: Slot) {
  const bits: string[] = [];
  if (slot.relief !== 1) bits.push(slot.relief < 0 ? `Relief inverted ${Math.abs(slot.relief)}×` : `Relief ${slot.relief}×`);
  if (slot.light !== null) bits.push(`Light ${Math.round(slot.light)}°`);
  for (const f of slot.filters) if (f.key !== "none") bits.push(FILTERS.find((x) => x.key === f.key)?.label ?? f.key);
  return bits.join(" · ") || "Its own look";
}

function TransmutePanel({
  settings,
  set,
  material,
  materials,
  thumbs,
  reduced,
  editing,
  onEdit,
}: {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
  material: LogoMaterial;
  materials: LogoMaterial[];
  thumbs: Record<string, string>;
  reduced: boolean;
  editing: number | null;
  onEdit: (i: number) => void;
}) {
  const seq = settings.transmute;
  const byKey = (key: string) => materials.find((m) => m.key === key);
  const update = (next: Slot[]) => set({ transmute: next, transmuteOn: settings.transmuteOn && next.length >= 2 });
  const move = (i: number, d: -1 | 1) => {
    const next = [...seq];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    update(next);
  };

  return (
    <>
      <p className="text-[13px] leading-[1.5] text-white/65">
        Morph the coin from one material into the next. The change spreads out from the letterforms; the background never moves.
        Click a step to fine-tune its relief, light and filters.
      </p>

      <Row label="Sequence">
        <ol className="flex w-full flex-col gap-1.5">
          {/* Every step, then one open slot for the next. */}
          {Array.from({ length: seq.length + 1 }, (_, i) => {
            const slot = seq[i];
            if (!slot)
              return (
                <li key="next" className="flex h-14 items-center gap-3 rounded-xl border border-dashed border-white/10 px-2 text-[12px] text-white/35">
                  <span className="w-5 text-center tabular-nums">{i + 1}</span>
                  Next: pick a material in the library and add it
                </li>
              );
            const m = byKey(slot.key);
            if (!m) return null;
            return (
              <Fragment key={i}>
              <li className={`flex h-14 items-center gap-2 rounded-xl border px-2 transition-colors ${editing === i ? "border-white" : "border-white/10 hover:border-white/40"}`}>
                <button type="button" onClick={() => onEdit(i)} aria-label={`Fine-tune step ${i + 1}, ${m.label}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="w-5 shrink-0 text-center text-[12px] tabular-nums text-white/45">{i + 1}</span>
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black">
                    {thumbs[m.key] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbs[m.key]} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] text-white">{m.label}</span>
                    <span className="truncate text-[11px] text-white/45">{tweaks(slot)}</span>
                  </span>
                </button>
                <span className="flex shrink-0 items-center gap-0.5 text-white/45">
                  <button type="button" aria-label={`Move ${m.label} up`} disabled={i === 0} onClick={() => move(i, -1)} className="h-7 w-7 rounded-md hover:text-white disabled:opacity-30">
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${m.label} down`}
                    disabled={i === seq.length - 1}
                    onClick={() => move(i, 1)}
                    className="h-7 w-7 rounded-md hover:text-white disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button type="button" aria-label={`Remove ${m.label}`} onClick={() => update(seq.filter((_, k) => k !== i))} className="h-7 w-7 rounded-md hover:text-white">
                    ×
                  </button>
                </span>
              </li>
              {seq.length >= 2 && (
                // How this step gives way to the next (the last one loops back to the first).
                <li className="flex items-center gap-2 pl-8 text-[11px] text-white/45">
                  <span aria-hidden>{i === seq.length - 1 ? "↺" : "↓"}</span>
                  <select
                    aria-label={`Transition from step ${i + 1} to ${i === seq.length - 1 ? 1 : i + 2}`}
                    value={slot.transition}
                    onChange={(e) => update(seq.map((x, k) => (k === i ? { ...x, transition: e.target.value as TransitionKey } : x)))}
                    className="h-7 rounded-lg border border-white/10 bg-black px-1.5 text-[11px] text-white"
                  >
                    {TRANSITION_GROUPS.map((g) => (
                      <optgroup key={g} label={g}>
                        {TRANSITIONS.filter((t) => t.group === g).map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {i === seq.length - 1 && <span>back to 1</span>}
                </li>
              )}
              </Fragment>
            );
          })}
        </ol>
        <button type="button" onClick={() => update([...seq, slotFrom(settings)])} className={pill(false)}>
          + Add {material.label}
        </button>
        {seq.length > 0 && (
          <button type="button" onClick={() => set({ transmute: [], transmuteOn: false })} className="text-[12px] text-white/45 hover:text-white">
            Clear
          </button>
        )}
      </Row>

      <Row label="Timing">
        <div className="flex w-full items-center gap-2">
          <span className="w-14 text-[12px] text-white/65">Hold</span>
          <Slider label="Hold seconds" value={settings.hold} min={0.5} max={6} step={0.1} onChange={(hold) => set({ hold })} />
          <Value>{settings.hold.toFixed(1)}s</Value>
        </div>
        <div className="flex w-full items-center gap-2">
          <span className="w-14 text-[12px] text-white/65">Morph</span>
          <Slider label="Morph seconds" value={settings.morphTime} min={0.4} max={4} step={0.1} onChange={(morphTime) => set({ morphTime })} />
          <Value>{settings.morphTime.toFixed(1)}s</Value>
        </div>
      </Row>

      <button
        type="button"
        disabled={seq.length < 2 || reduced}
        onClick={() => set({ transmuteOn: !settings.transmuteOn })}
        className={`h-10 w-full rounded-full border text-[13px] transition-colors disabled:opacity-40 ${
          settings.transmuteOn ? "border-white/30 text-white hover:border-white" : "border-white bg-white text-black"
        }`}
      >
        {settings.transmuteOn ? "Stop morphing" : seq.length < 2 ? `Add ${2 - seq.length} more to morph` : `Morph ${seq.length} materials`}
      </button>
    </>
  );
}

/** One line on what a look is: its transmute sequence, or its material and touches. */
function describe(look: string, materials: LogoMaterial[]) {
  const d = decodeSettings(look);
  const name = (key?: string) => materials.find((m) => m.key === key)?.label ?? "";
  if (d.transmuteOn && d.transmute && d.transmute.length >= 2) return `Transmute · ${d.transmute.map((x) => name(x.key)).join(" → ")}`;
  const bits = [name(d.material)];
  for (const f of d.filters ?? []) if (f.key !== "none") bits.push(FILTERS.find((x) => x.key === f.key)?.label ?? "");
  if (d.motion) bits.push(MOTIONS.find((x) => x.key === d.motion)?.label ?? "");
  return bits.filter(Boolean).join(" · ");
}

function PresetRow({
  preset,
  current,
  status,
  materials,
  thumbs,
  onApply,
  onKeep,
  onDelete,
}: {
  preset: Preset;
  current: boolean;
  /** Set on the preset being edited. */
  status?: "editing" | "changed";
  materials: LogoMaterial[];
  thumbs: Record<string, string>;
  onApply: () => void;
  /** Make this browser-only preset permanent. */
  onKeep?: () => void;
  onDelete?: () => void;
}) {
  const d = decodeSettings(preset.look);
  const shown = d.transmuteOn && d.transmute?.length ? d.transmute.map((x) => x.key) : [d.material ?? ""];
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${preset.look}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: nothing to do.
    }
  };
  return (
    <li className={`flex items-center gap-3 rounded-xl border px-2 py-2 ${current || status ? "border-white" : "border-white/10"}`}>
      <button type="button" onClick={onApply} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Apply ${preset.name}`}>
        <span className="flex shrink-0 -space-x-3">
          {shown.slice(0, 4).map((key, i) => (
            <span key={`${key}-${i}`} className="h-8 w-8 overflow-hidden rounded-full border border-black bg-black">
              {thumbs[key] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[key]} alt="" className="h-full w-full object-cover" />
              )}
            </span>
          ))}
          {shown.length > 4 && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black bg-white text-[11px] text-black">+{shown.length - 4}</span>
          )}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[13px] text-white">{preset.name}</span>
            {status && <span className="shrink-0 text-[11px] text-white/45">{status === "changed" ? "Unsaved changes" : "Editing"}</span>}
          </span>
          <span className="truncate text-[11px] text-white/45">{describe(preset.look, materials)}</span>
        </span>
      </button>
      <span className="flex shrink-0 items-center gap-0.5 text-[12px] text-white/45">
        <button type="button" onClick={copy} className="rounded-md px-1.5 py-1 hover:text-white">
          {copied ? "Copied" : "Link"}
        </button>
        {onKeep && (
          <button type="button" onClick={onKeep} className="rounded-md px-1.5 py-1 hover:text-white">
            Make permanent
          </button>
        )}
        {onDelete && (
          <button type="button" aria-label={`Delete ${preset.name}`} onClick={onDelete} className="h-7 w-7 rounded-md hover:text-white">
            ×
          </button>
        )}
      </span>
    </li>
  );
}

/** Rename and overwrite the preset being edited, or branch it off as a new one. */
function EditPresetForm({
  preset,
  changed,
  onUpdate,
  onSaveAsNew,
  onRevert,
  onDone,
}: {
  preset: Preset;
  changed: boolean;
  onUpdate: (name: string) => void;
  onSaveAsNew: (name: string) => void;
  onRevert: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(preset.name);
  const finalName = name.trim() || preset.name;
  return (
    <form
      className="flex flex-col gap-2.5 rounded-xl border border-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onUpdate(finalName);
      }}
    >
      <p className="text-[12px] leading-[1.4] text-white/65">
        <span className="text-white">Editing “{preset.name}”.</span>{" "}
        {changed ? "The look has unsaved changes." : "Tweak it in Controls or Transmute, then update it here."}
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Preset name"
        maxLength={40}
        className="h-9 rounded-xl border border-white/10 bg-black px-3 text-[13px] text-white focus:border-white focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={!changed && finalName === preset.name} className={pill(true)}>
          Update
        </button>
        <button type="button" onClick={() => onSaveAsNew(finalName === preset.name ? `${preset.name} copy` : finalName)} className={pill(false)}>
          Save as new
        </button>
        {changed && (
          <button type="button" onClick={onRevert} className="text-[12px] text-white/45 hover:text-white">
            Revert
          </button>
        )}
        <button type="button" onClick={onDone} className="ml-auto text-[12px] text-white/45 hover:text-white">
          Done
        </button>
      </div>
    </form>
  );
}

function PresetsPanel({
  settings,
  material,
  materials,
  thumbs,
  onApply,
  editingId,
  onEditing,
}: {
  settings: Settings;
  material: LogoMaterial;
  materials: LogoMaterial[];
  thumbs: Record<string, string>;
  onApply: (look: string) => void;
  /** The preset being edited (kept while you switch tabs to tweak it). */
  editingId: string | null;
  onEditing: (id: string | null) => void;
}) {
  const [mine, setMine] = useState<Preset[]>([]);
  const [permanent, setPermanent] = useState<Preset[]>([]);
  const [name, setName] = useState("");
  const [saveError, setSaveError] = useState(false);
  // Permanent presets ship as a static file; the viewer's own live in their browser.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(loadPresets());
    let live = true;
    loadPermanent().then((list) => live && setPermanent(list));
    return () => {
      live = false;
    };
  }, []);
  const look = encodeSettings(settings);
  const all = [...permanent, ...mine];
  const fallback = settings.transmuteOn && settings.transmute.length >= 2 ? `Transmute ${all.length + 1}` : material.label;
  const editing = all.find((p) => p.id === editingId) ?? null;
  const editingPermanent = !!editing && permanent.some((p) => p.id === editing.id);
  const changed = !!editing && editing.look !== look;

  const updateMine = (next: Preset[]) => {
    setMine(next);
    savePresets(next);
  };
  const updatePermanent = (next: Preset[]) => {
    setPermanent(next);
    savePermanent(next).then((ok) => setSaveError(!ok));
  };
  // While developing the site new presets are permanent; visitors keep theirs in the browser.
  const add = (presetName: string, toPermanent = CAN_EDIT_PERMANENT) => {
    const preset = { id: Date.now().toString(36), name: presetName, look };
    if (toPermanent) updatePermanent([preset, ...permanent]);
    else updateMine([preset, ...mine]);
    return preset;
  };
  const replace = (id: string, patch: Partial<Preset>) => {
    if (permanent.some((p) => p.id === id)) updatePermanent(permanent.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    else updateMine(mine.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const row = (p: Preset, kind: "permanent" | "mine") => {
    const editable = kind === "mine" || CAN_EDIT_PERMANENT;
    return (
      <PresetRow
        key={p.id}
        preset={p}
        current={p.look === look}
        status={p.id === editingId ? (changed ? "changed" : "editing") : undefined}
        materials={materials}
        thumbs={thumbs}
        onApply={() => {
          onApply(p.look);
          onEditing(editable ? p.id : null);
        }}
        onKeep={
          kind === "mine" && CAN_EDIT_PERMANENT
            ? () => {
                updatePermanent([p, ...permanent]);
                updateMine(mine.filter((x) => x.id !== p.id));
              }
            : undefined
        }
        onDelete={
          editable
            ? () => {
                if (p.id === editingId) onEditing(null);
                if (kind === "permanent") updatePermanent(permanent.filter((x) => x.id !== p.id));
                else updateMine(mine.filter((x) => x.id !== p.id));
              }
            : undefined
        }
      />
    );
  };

  return (
    <>
      <p className="text-[13px] leading-[1.5] text-white/65">
        {CAN_EDIT_PERMANENT
          ? "Save the current look: material, motion, filters and any transmute sequence. Saved presets are permanent: they ship with the site for every visitor. Click one to load and edit it."
          : "Save the current look: material, motion, filters and any transmute sequence. Your presets stay in this browser; Link copies a shareable URL."}
      </p>
      {saveError && <p className="text-[12px] text-white">Couldn’t write public/logo-presets.json. Is the dev server running?</p>}
      {editing ? (
        <EditPresetForm
          key={editing.id}
          preset={editing}
          changed={changed}
          onUpdate={(n) => replace(editing.id, { name: n, look })}
          onSaveAsNew={(n) => onEditing(add(n, editingPermanent || CAN_EDIT_PERMANENT).id)}
          onRevert={() => onApply(editing.look)}
          onDone={() => onEditing(null)}
        />
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onEditing(add(name.trim() || fallback).id);
            setName("");
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={fallback}
            aria-label="Preset name"
            maxLength={40}
            className="h-9 min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-3 text-[13px] text-white placeholder:text-white/40 focus:border-white focus:outline-none"
          />
          <button type="submit" disabled={all.some((p) => p.look === look)} className={pill(true)}>
            Save
          </button>
        </form>
      )}

      {(permanent.length > 0 || CAN_EDIT_PERMANENT) && (
        <Row label={CAN_EDIT_PERMANENT ? "Permanent" : "Featured"}>
          {permanent.length ? (
            <ul className="flex w-full flex-col gap-1.5">{permanent.map((p) => row(p, "permanent"))}</ul>
          ) : (
            <span className="text-[12px] text-white/45">Nothing yet. Set up a look (try a transmute) and save it.</span>
          )}
        </Row>
      )}

      {(mine.length > 0 || !CAN_EDIT_PERMANENT) && (
        <Row label={CAN_EDIT_PERMANENT ? "In this browser only" : "Yours"}>
          {mine.length ? (
            <ul className="flex w-full flex-col gap-1.5">{mine.map((p) => row(p, "mine"))}</ul>
          ) : (
            <span className="text-[12px] text-white/45">Nothing saved yet. Set up a look (try a transmute) and save it.</span>
          )}
        </Row>
      )}
    </>
  );
}

/**
 * The panel beside the preview: Controls, Transmute and Presets tabs on top, then the
 * material and export actions, then the selected tab's settings.
 */
export default function Controls({
  settings,
  set,
  material,
  materials,
  thumbs,
  supports,
  reduced,
  recording,
  recordSeconds,
  onRecordSeconds,
  recordLeft,
  onSurprise,
  onPng,
  onRecord,
  onApply,
  editing,
  onEdit,
}: {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
  material: LogoMaterial;
  materials: LogoMaterial[];
  thumbs: Record<string, string>;
  /** Whether Relief and Light change this material; unknown (enabled) until probed. */
  supports?: { relief: boolean; light: boolean };
  reduced: boolean;
  recording: boolean;
  recordSeconds: (typeof RECORD_LENGTHS)[number];
  onRecordSeconds: (n: (typeof RECORD_LENGTHS)[number]) => void;
  recordLeft: number;
  onSurprise: () => void;
  onPng: () => void;
  onRecord: () => void;
  /** Replace the settings with a saved look. */
  onApply: (look: string) => void;
  /** The transmute step being fine-tuned, if any. */
  editing: number | null;
  onEdit: (i: number | null) => void;
}) {
  const [tab, setTab] = useState<Tab>("controls");
  const [presetEditing, setPresetEditing] = useState<string | null>(null);

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-black">
      <div
        role="tablist"
        aria-label="Panel"
        className="flex gap-6 border-b border-white/10 px-5"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const i = TABS.findIndex((t) => t.key === tab);
            const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].key;
            setTab(next);
            document.getElementById(`tab-${next}`)?.focus();
          }
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            tabIndex={tab === t.key ? 0 : -1}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-1.5 border-b py-3.5 text-[13px] transition-colors ${
              tab === t.key ? "border-white text-white" : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            {t.label}
            {t.key === "transmute" && settings.transmuteOn && <span className="h-1.5 w-1.5 rounded-full bg-white" aria-label="Morphing" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[16px] text-white">{material.label}</p>
            <p className="text-[13px] text-white/65">▶ {material.loop}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSurprise} className={pill(false)}>
              Surprise me
            </button>
            <button type="button" onClick={onPng} className={pill(false)}>
              Save PNG
            </button>
            <span className={`flex items-center rounded-full border ${recording ? "border-white" : "border-white/10"}`}>
              <button
                type="button"
                onClick={onRecord}
                aria-label={recording ? "Stop recording and save" : `Record ${recordSeconds} seconds`}
                className={`rounded-l-full py-1.5 pl-3 pr-2 text-[12px] tabular-nums transition-colors ${recording ? "bg-white text-black" : "text-white/65 hover:text-white"}`}
              >
                {recording ? `● Stop · ${recordLeft}s` : "Record"}
              </button>
              <select
                aria-label="Recording length"
                value={recordSeconds}
                disabled={recording}
                onChange={(e) => onRecordSeconds(Number(e.target.value) as (typeof RECORD_LENGTHS)[number])}
                className="h-full rounded-r-full border-l border-white/10 bg-black py-1.5 pl-2 pr-1 text-[12px] text-white disabled:opacity-40"
              >
                {RECORD_LENGTHS.map((n) => (
                  <option key={n} value={n}>
                    {n}s
                  </option>
                ))}
              </select>
            </span>
          </div>
        </div>

        {reduced && (
          <p className="rounded-xl bg-white/[0.06] px-3 py-2 text-[12px] text-white/65">
            Reduced motion is on, so the preview holds still. Loops, motion and morphing stay off.
          </p>
        )}

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="flex flex-col gap-4">
          {tab === "controls" && editing !== null && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white px-3 py-2.5">
              <p className="text-[12px] leading-[1.4] text-white/65">
                <span className="text-white">Step {editing + 1} of the transmute.</span> Changes here, and picks from the library, apply to
                this step. The morph is paused on it.
              </p>
              <button
                type="button"
                onClick={() => {
                  onEdit(null);
                  setTab("transmute");
                }}
                className={pill(true)}
              >
                Done
              </button>
            </div>
          )}
          {tab === "controls" && <ControlsPanel settings={settings} set={set} material={material} supports={supports} reduced={reduced} />}
          {tab === "transmute" && (
            <TransmutePanel
              settings={settings}
              set={(patch) => {
                // Changing the sequence itself ends any step edit first.
                if (patch.transmute) onEdit(null);
                set(patch);
              }}
              material={material}
              materials={materials}
              thumbs={thumbs}
              reduced={reduced}
              editing={editing}
              onEdit={(i) => {
                onEdit(i);
                setTab("controls");
              }}
            />
          )}
          {tab === "presets" && (
            <PresetsPanel
              settings={settings}
              material={material}
              materials={materials}
              thumbs={thumbs}
              onApply={onApply}
              editingId={presetEditing}
              onEditing={setPresetEditing}
            />
          )}
        </div>
      </div>
    </div>
  );
}
