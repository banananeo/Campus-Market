"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { CategoryBadge, EmptyImage, LocationMeta } from "./CategoryPills";

export type CardListing = {
  id: number;
  title: string;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  listing_images?: { image_url: string }[];
};

type ListingCardProps = {
  listing: CardListing;
  index?: number;
  onClick?: () => void;
};

export default function ListingCard({ listing, index = 0, onClick }: ListingCardProps) {
  const image = listing.listing_images?.[0]?.image_url;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), type: "spring", stiffness: 300, damping: 26 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="card-brutal flex cursor-pointer flex-col overflow-hidden"
    >
      <div className="relative h-52 w-full border-b-[4px] border-black bg-brutal-cream">
        {image ? (
          <img src={image} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <EmptyImage />
        )}
        <div className="absolute left-3 top-3">
          <CategoryBadge category={listing.category} />
        </div>
        <div className="absolute bottom-3 right-3 border-[3px] border-black bg-black px-2.5 py-1 font-display text-sm text-white shadow-brutal-xs">
          ₹{listing.price}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-display text-base uppercase leading-tight tracking-tight">
          {listing.title}
        </h4>
        <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
          {listing.condition}
        </p>
        <div className="mt-1">
          <LocationMeta location={listing.location} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t-[3px] border-black pt-3">
          <span className="badge-brutal bg-brutal-yellow">View deal</span>
          <span className="grid h-8 w-8 place-items-center border-[3px] border-black bg-white shadow-brutal-xs">
            <ArrowUpRight size={16} strokeWidth={3} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
