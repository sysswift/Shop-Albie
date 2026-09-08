import { useState } from "react";
import type { GalleryImage } from "@/lib/upload-product-image";

const inputCls =
  "w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors";

import {
  formatMeasurementSize,
  isMeasurementSize,
  type MeasurementUnit,
} from "@/lib/product-sizes";

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "One Size"];

/* ── Image Uploader ─────────────────────────────────────────────────────── */

type ProductImageUploaderProps = {
  label?: string;
  hint?: string;
  images: GalleryImage[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  primaryId?: string | null;
};

export function ProductImageUploader({
  label = "Product images",
  hint = "Upload one or more photos. The first image is used as the main shop photo.",
  images,
  onAdd,
  onRemove,
  onSetPrimary,
  primaryId,
}: ProductImageUploaderProps) {
  return (
    <section>
      <h2 className="text-[10px] uppercase font-bold tracking-widest mb-1">{label}</h2>
      <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">{hint}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
        {images.map((img, index) => {
          const isPrimary = primaryId ? img.id === primaryId : index === 0;
          return (
            <div key={img.id} className="relative aspect-[3/4] bg-surface border border-border overflow-hidden group">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />

              {/* Primary badge — only shown on the main image, small & unobtrusive */}
              {isPrimary && (
                <span className="absolute bottom-0 inset-x-0 text-center text-[8px] font-mono uppercase tracking-widest bg-foreground/80 text-background py-0.5">
                  ★ Main
                </span>
              )}

              {/* Controls — appear on hover/tap */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-center p-2">
                {onSetPrimary && !isPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(img.id)}
                    className="w-full text-[9px] uppercase tracking-widest bg-white text-black font-semibold py-1.5 rounded"
                  >
                    Set main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(img.id)}
                  className="w-full text-[9px] uppercase tracking-widest bg-white/20 text-white font-semibold py-1.5 rounded border border-white/40 hover:bg-white/30"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        <label className="aspect-[3/4] border-2 border-dashed border-border hover:border-foreground active:border-foreground transition-colors grid place-items-center cursor-pointer bg-surface">
          <div className="text-center px-2">
            <p className="text-3xl text-muted-foreground">+</p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
              Add photos
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onAdd(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </section>
  );
}

/* ── Sizes Toggle ───────────────────────────────────────────────────────── */

type ProductSizesFieldProps = {
  selected: string[];
  onChange: (sizes: string[]) => void;
};

export function ProductSizesField({ selected, onChange }: ProductSizesFieldProps) {
  const [measureValue, setMeasureValue] = useState("");
  const [measureUnit, setMeasureUnit] = useState<MeasurementUnit>("inches");

  const presetSelected = selected.filter((s) => !isMeasurementSize(s));
  const measurementSelected = selected.filter(isMeasurementSize);

  function togglePreset(size: string) {
    onChange(
      selected.includes(size) ? selected.filter((s) => s !== size) : [...selected, size]
    );
  }

  function addMeasurement() {
    const value = Number(measureValue.trim());
    if (!Number.isFinite(value) || value <= 0) return;

    const entry = formatMeasurementSize(value, measureUnit);
    if (selected.includes(entry)) return;

    onChange([...selected, entry]);
    setMeasureValue("");
  }

  function removeMeasurement(entry: string) {
    onChange(selected.filter((s) => s !== entry));
  }

  return (
    <section className="space-y-6">
      <div>
        <label className="text-[10px] uppercase font-bold tracking-widest mb-1 block">
          Standard sizes
        </label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          For dresses, bonnets, headbands, and scrunchies. Use Free Size or One Size when there is no S/M/L fit.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_SIZES.map((size) => {
            const on = presetSelected.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => togglePreset(size)}
                className={`px-4 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-colors min-w-[52px] ${
                  on
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <label className="text-[10px] uppercase font-bold tracking-widest mb-1 block">
          Measurement sizes
        </label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          For waist beads. Add each size customers can choose (e.g. 28 inches, 70 cm).
        </p>

        {measurementSelected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {measurementSelected.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => removeMeasurement(entry)}
                className="flex items-center gap-2 px-3 py-2 border border-border hover:border-destructive transition-colors text-[10px] uppercase tracking-widest"
                title="Tap to remove"
              >
                {entry} ✕
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            min="0"
            step="0.5"
            value={measureValue}
            onChange={(e) => setMeasureValue(e.target.value)}
            className={inputCls}
            placeholder="e.g. 28"
          />
          <select
            value={measureUnit}
            onChange={(e) => setMeasureUnit(e.target.value as MeasurementUnit)}
            className={inputCls}
          >
            <option value="inches">Inches</option>
            <option value="cm">Centimeters</option>
          </select>
          <button
            type="button"
            onClick={addMeasurement}
            className="w-full sm:w-auto px-6 py-3 text-[10px] uppercase tracking-widest font-bold border border-foreground hover:bg-foreground hover:text-background transition-colors whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </div>

      {selected.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          Saved for this product: {selected.join(", ")}
        </p>
      )}
    </section>
  );
}

/* ── Colors Field ───────────────────────────────────────────────────────── */

type ProductColorsFieldProps = {
  colors: { name: string; hex: string }[];
  onChange: (colors: { name: string; hex: string }[]) => void;
};

export function ProductColorsField({ colors, onChange }: ProductColorsFieldProps) {
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  return (
    <section>
      <label className="text-[10px] uppercase font-bold tracking-widest mb-1 block">
        Colors{" "}
        <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
      </label>
      <p className="text-[11px] text-muted-foreground mb-3">
        Skip this if the product comes in one colour only.
      </p>
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {colors.map((c, i) => (
            <button
              key={`${c.name}-${i}`}
              type="button"
              onClick={() => onChange(colors.filter((_, j) => j !== i))}
              className="flex items-center gap-2 px-3 py-2 border border-border hover:border-destructive transition-colors text-[10px] uppercase tracking-widest"
              title="Tap to remove"
            >
              <span className="inline-block size-3 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
              {c.name} ✕
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="color"
          value={newColorHex}
          onChange={(e) => setNewColorHex(e.target.value)}
          className="w-full sm:w-12 h-12 border border-border cursor-pointer"
        />
        <input
          value={newColorName}
          onChange={(e) => setNewColorName(e.target.value)}
          className={inputCls}
          placeholder="Colour name (e.g. Ivory)"
        />
        <button
          type="button"
          onClick={() => {
            if (!newColorName.trim()) return;
            onChange([...colors, { name: newColorName.trim(), hex: newColorHex }]);
            setNewColorName("");
            setNewColorHex("#000000");
          }}
          className="w-full sm:w-auto px-6 py-3 text-[10px] uppercase tracking-widest font-bold border border-foreground hover:bg-foreground hover:text-background transition-colors whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </section>
  );
}

/* ── Core Fields ────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-bold tracking-widest mb-2 block">{label}</label>
      {children}
    </div>
  );
}

export function ProductFormFields({
  categories,
  defaults,
}: {
  categories: { id: string; name: string }[];
  defaults?: {
    name?: string;
    price?: number;
    category_id?: string;
    inventory?: number;
  };
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <Field label="Product Name *">
        <input name="name" className={inputCls} placeholder="e.g. Pleated Silk Midi" defaultValue={defaults?.name} required />
      </Field>
      <Field label="Price (₵ GHS) *">
        <input name="price" type="number" step="0.01" min="0" className={inputCls} placeholder="e.g. 580" defaultValue={defaults?.price} required />
      </Field>
      <Field label="Category">
        <select name="category_id" className={inputCls} defaultValue={defaults?.category_id ?? ""}>
          <option value="">— Uncategorised —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Inventory (pieces in stock)">
        <input name="inventory" type="number" min="0" className={inputCls} placeholder="e.g. 10" defaultValue={defaults?.inventory ?? 0} />
      </Field>
    </section>
  );
}

export function ProductDescriptionField({ defaultValue }: { defaultValue?: string }) {
  return (
    <Field label="Description">
      <textarea
        name="description"
        rows={4}
        className={inputCls}
        placeholder="Describe the product…"
        defaultValue={defaultValue}
      />
    </Field>
  );
}

export function ProductFlagsField({ featured, isNew }: { featured?: boolean; isNew?: boolean }) {
  return (
    <section className="flex gap-6">
      <label className="flex items-center gap-2 text-sm uppercase tracking-widest cursor-pointer py-1">
        <input name="featured" type="checkbox" className="size-5" defaultChecked={featured} />
        Featured
      </label>
      <label className="flex items-center gap-2 text-sm uppercase tracking-widest cursor-pointer py-1">
        <input name="is_new" type="checkbox" className="size-5" defaultChecked={isNew} />
        New arrival
      </label>
    </section>
  );
}

/* ── Order images with primary first ───────────────────────────────────── */

export function orderGalleryImages(images: GalleryImage[], primaryId: string | null): GalleryImage[] {
  if (!primaryId || images.length === 0) return images;
  const primary = images.find((i) => i.id === primaryId);
  if (!primary) return images;
  return [primary, ...images.filter((i) => i.id !== primaryId)];
}
