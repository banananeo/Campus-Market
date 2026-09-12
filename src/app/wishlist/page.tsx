"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"
import ListingCard from "@/components/ListingCard"

export default function WishlistPage() {
    const router = useRouter()

    const [listings, setListings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function fetchWishlist() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setError("Please log in to view your wishlist.")
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from("favorites")
                .select(`
          listing_id,
          listings (
            *,
            listing_images (
              image_url
            )
          )
        `)
                .eq("user_id", user.id)

            if (error) {
                console.error(error)
                setError("Unable to load your wishlist.")
            } else {
                const wishlistListings = data
                    .map((item: any) => item.listings)
                    .filter(Boolean)

                setListings(wishlistListings)
            }

            setLoading(false)
        }

        fetchWishlist()
    }, [])

    if (loading) {
        return (
            <main className="min-h-screen font-grotesk">
                <Navbar />
                <div className="mx-auto max-w-5xl px-4 py-10">
                    <div className="card-brutal bg-white p-12 text-center font-mono text-sm font-bold uppercase tracking-widest text-black/60">
                        Loading wishlist...
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    if (error) {
        return (
            <main className="min-h-screen font-grotesk">
                <Navbar />
                <div className="mx-auto max-w-5xl px-4 py-10">
                    <div className="card-brutal bg-brutal-red p-8 text-center font-display text-sm uppercase text-white">
                        {error}
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    return (
        <AuthGuard>
            <main className="min-h-screen font-grotesk text-black">
                <Navbar />
                <div className="mx-auto max-w-5xl px-4 pb-24">
                    <div className="mb-8 mt-6">
                        <button
                            onClick={() => router.push("/")}
                            className="btn-brutal bg-white px-4 py-2 text-xs"
                        >
                            ← Back to Marketplace
                        </button>
                        <div className="card-brutal mt-4 bg-white p-6">
                            <span className="badge-brutal bg-brutal-pink text-white">Saved</span>
                            <h1 className="mt-3 font-display text-4xl uppercase tracking-tighter">
                                My Wishlist
                            </h1>
                            <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                {"Items you've saved for later /// "}{listings.length} total
                            </p>
                        </div>
                    </div>

                    {listings.length === 0 ? (
                        <div className="card-brutal bg-white p-12 text-center">
                            <p className="font-display text-xl uppercase">
                                Your wishlist is empty
                            </p>
                            <p className="mt-2 font-mono text-xs font-bold uppercase tracking-widest text-black/60">
                                Save items you&apos;re interested in and find them here.
                            </p>
                            <motion.button
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => router.push("/")}
                                className="btn-brutal mt-6 bg-brutal-yellow px-6 py-3 text-sm"
                            >
                                Browse Marketplace
                            </motion.button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {listings.map((listing, i) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    index={i}
                                    onClick={() => router.push(`/listing/${listing.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <Footer />
            </main>
        </AuthGuard>
    )
}
