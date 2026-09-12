"use client";

import { motion } from "framer-motion";
import { MapPin, Package } from "lucide-react";
import { categoryBg, categoryTextOn } from "@/lib/category";

type CategoryPillsProps = {
  categories: readonly string[];
  active: string;
  onChange: (category: string) => void;
};

export default function CategoryPills({ categories, active, onChange }: CategoryPillsProps) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 pt-1">
      {categories.map((cat) => {
        const bg = categoryBg(cat);
        const isActive = active === cat;
        return (
          <motion.button
            key={cat}
            whileHover={{ y: -3, rotate: -1 }}
            whileTap={{ scale: 0.9, rotate: 2 }}
            onClick={() => onChange(cat)}
            style={{ backgroundColor: bg, color: categoryTextOn(bg) }}
            className="btn-brutal relative shrink-0 px-4 py-2 text-xs"
          >
            {cat.toUpperCase()}
            {isActive && (
              <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-black bg-brutal-yellow text-[10px] text-black">
                ★
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export function ConditionPills({
  options,
  active,
  onChange,
}: {
  options: readonly string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`border-[3px] border-black px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest shadow-brutal-xs transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            active === opt ? "bg-black text-white" : "bg-white text-black hover:bg-brutal-yellow"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const bg = categoryBg(category);
  return (
    <span
      className="badge-brutal"
      style={{ backgroundColor: bg, color: categoryTextOn(bg) }}
    >
      {category}
    </span>
  );
}

export function EmptyImage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-brutal-cream halftone">
      <span className="grid h-12 w-12 place-items-center border-[3px] border-black bg-brutal-yellow shadow-brutal-xs">
        <Package size={22} strokeWidth={3} />
      </span>
      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
        No image
      </span>
    </div>
  );
}

export function LocationMeta({ location }: { location: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-black/60">
      <MapPin size={14} strokeWidth={3} />
      {location || "Campus"}
    </span>
  );
}
