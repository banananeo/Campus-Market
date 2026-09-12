"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Plus, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { label: "Marketplace", href: "/" },
  { label: "My Listings", href: "/my-listings" },
  { label: "Wishlist", href: "/wishlist" },
];

export default function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b-[4px] border-black bg-brutal-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 border-[4px] border-black bg-brutal-yellow px-3 py-1.5 shadow-brutal-sm transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-8 w-8 place-items-center border-[3px] border-black bg-black text-brutal-yellow">
            <ShoppingBag size={18} strokeWidth={3} />
          </span>
          <span className="font-display text-xl tracking-tighter">
            CAMPUS MARKET
          </span>
        </button>

        <nav className="flex flex-wrap items-center gap-2">
          {NAV_LINKS.map((link) => (
            <motion.button
              key={link.href}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => router.push(link.href)}
              className="btn-brutal bg-white px-3 py-1.5 text-xs"
            >
              {link.label}
            </motion.button>
          ))}
          <button
            onClick={() => router.push("/messages")}
            className="text-sm text-gray-600 hover:text-black"
          >
            Messages
          </button>
          <motion.button
            whileHover={{ y: -2, rotate: -1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/sell")}
            className="btn-brutal flex items-center gap-1 bg-black px-4 py-1.5 text-xs text-white"
          >
            <Plus size={14} strokeWidth={3} />
            Sell
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85, rotate: 90 }}
            onClick={handleLogout}
            title="Logout"
            className="btn-brutal bg-brutal-red p-2 text-white"
          >
            <LogOut size={16} strokeWidth={3} />
          </motion.button>
        </nav>
      </div>
    </header>
  );
}
