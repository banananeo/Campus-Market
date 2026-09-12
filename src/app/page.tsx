"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import Ticker from "@/components/Ticker"
import Footer from "@/components/Footer"
import ListingCard from "@/components/ListingCard"
import CategoryPills, { ConditionPills } from "@/components/CategoryPills"
import { CATEGORIES } from "@/lib/category"

type Listing = {
  id: number
  title: string
  description: string | null
  price: number
  category: string
  condition: string
  location: string | null
  image_url: string | null
  status: string
  listing_images?: {
    image_url: string
  }[]
}

const CONDITIONS = ["All", "New", "Like New", "Good", "Used"] as const

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const router = useRouter()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [conditionFilter, setConditionFilter] = useState("All")

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("listings")
        .select(`
        *,
        listing_images (
          image_url
        )
      `)
        .eq("status", "available")
        .order("created_at", { ascending: false })

      if (error) {
        console.error(error)
        setError("Unable to load listings.")
      } else {
        setListings(data || [])
      }

      setLoading(false)
    }

    load()
  }, [])

  const filteredListings = listings.filter((listing) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      listing.title.toLowerCase().includes(searchText) ||
      listing.description?.toLowerCase().includes(searchText) ||
      listing.category.toLowerCase().includes(searchText)

    const matchesCategory =
      categoryFilter === "All" || listing.category === categoryFilter

    const matchesCondition =
      conditionFilter === "All" || listing.condition === conditionFilter

    return matchesSearch && matchesCategory && matchesCondition
  })

  return (
    <main className="min-h-screen font-grotesk text-black">
      <Navbar />
      <Ticker items={listings.slice(0, 8).map((l) => `${l.title} — ₹${l.price}`)} />

      <div className="mx-auto max-w-5xl px-4 pb-24">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="card-brutal mt-6 bg-white p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-brutal bg-black text-white">Campus only</span>
            <span className="badge-brutal bg-brutal-mint">{listings.length} live</span>
          </div>

          <h2 className="mt-4 font-display text-4xl uppercase leading-[1.02] tracking-tighter sm:text-5xl">
            Buy &amp; sell <span className="bg-brutal-yellow px-2">within</span> your campus.
          </h2>

          <p className="mt-3 max-w-xl font-mono text-xs font-bold uppercase tracking-widest text-black/60">
            {"Books /// Electronics /// Furniture /// Cycles — from students around you."}
          </p>

          {/* Search */}
          <div className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                strokeWidth={3}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for books, calculators, cycles..."
                className="input-brutal w-full py-3 pl-11"
              />
            </div>
            <motion.button
              whileHover={{ y: -3, rotate: -1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/sell")}
              className="btn-brutal flex items-center justify-center gap-2 bg-black px-5 py-3 text-sm text-white"
            >
              <Plus size={16} strokeWidth={3} />
              Sell item
            </motion.button>
          </div>

          <div className="mt-6 space-y-4">
            <CategoryPills
              categories={CATEGORIES}
              active={categoryFilter}
              onChange={setCategoryFilter}
            />
            <ConditionPills
              options={CONDITIONS}
              active={conditionFilter}
              onChange={setConditionFilter}
            />
          </div>
        </motion.section>

        {/* Listings */}
        <section className="mt-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="badge-brutal bg-black text-sm text-white">Latest drops</h3>
            <span className="badge-brutal bg-brutal-yellow">{filteredListings.length} items</span>
          </div>

          {loading && (
            <div className="card-brutal bg-white p-12 text-center font-mono text-sm font-bold uppercase tracking-widest text-black/60">
              Loading listings...
            </div>
          )}

          {error && (
            <div className="card-brutal bg-brutal-red p-6 text-center font-display text-sm uppercase text-white">
              {error}
            </div>
          )}

          {!loading && !error && filteredListings.length === 0 && (
            <div className="card-brutal bg-white p-12 text-center">
              <h4 className="font-display text-xl uppercase">No listings yet</h4>
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-widest text-black/60">
                Be the first student to list something!
              </p>
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push("/sell")}
                className="btn-brutal mt-5 bg-brutal-yellow px-5 py-3 text-sm"
              >
                Create Listing
              </motion.button>
            </div>
          )}

          {!loading && !error && filteredListings.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  onClick={() => router.push(`/listing/${listing.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  )
}
