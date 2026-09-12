"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, Pencil, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"
import { CategoryBadge } from "@/components/CategoryPills"

export default function MyListingsPage() {
    const router = useRouter()

    const [listings, setListings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function fetchMyListings() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setError("Please log in to view your listings.")
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from("listings")
                .select(`
          *,
          listing_images (
            image_url
          )
        `)
                .eq("seller_id", user.id)
                .order("created_at", { ascending: false })

            if (error) {
                console.error(error)
                setError("Unable to load your listings.")
            } else {
                setListings(data || [])
            }

            setLoading(false)
        }

        fetchMyListings()
    }, [])
    async function handleDelete(listingId: number) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this listing?"
        )

        if (!confirmed) {
            return
        }

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setError("Please log in to delete a listing.")
            return
        }

        const target = listings.find((l) => l.id === listingId)
        if (!target || target.seller_id !== user.id) {
            alert("You can only delete your own listings.")
            return
        }

        // Clean up images first so storage + child rows don't orphan
        const { data: imageRows } = await supabase
            .from("listing_images")
            .select("image_url")
            .eq("listing_id", listingId)

        if (imageRows && imageRows.length > 0) {
            const paths = imageRows
                .map((row: { image_url: string }) => {
                    // Stored public URL contains "/listing-images/<path>"
                    const marker = "/listing-images/"
                    const idx = row.image_url.indexOf(marker)
                    return idx >= 0
                        ? row.image_url.slice(idx + marker.length)
                        : null
                })
                .filter((p): p is string => !!p)

            if (paths.length > 0) {
                await supabase.storage.from("listing-images").remove(paths)
            }

            await supabase
                .from("listing_images")
                .delete()
                .eq("listing_id", listingId)
        }

        // Also clear wishlist saves for this listing (FK safety if no cascade)
        await supabase.from("favorites").delete().eq("listing_id", listingId)

        const { error } = await supabase
            .from("listings")
            .delete()
            .eq("id", listingId)
            .eq("seller_id", user.id)

        if (error) {
            console.error(error)
            alert("Could not delete the listing.")
            return
        }

        setListings((currentListings) =>
            currentListings.filter(
                (listing) => listing.id !== listingId
            )
        )
    }

    if (loading) {
        return (
            <main className="min-h-screen font-grotesk">
                <Navbar />
                <div className="mx-auto max-w-5xl px-4 py-10">
                    <div className="card-brutal bg-white p-12 text-center font-mono text-sm font-bold uppercase tracking-widest text-black/60">
                        Loading your listings...
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
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <span className="badge-brutal bg-brutal-blue text-white">
                                        {listings.length} posted
                                    </span>
                                    <h1 className="mt-3 font-display text-4xl uppercase tracking-tighter">
                                        My Listings
                                    </h1>
                                    <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                        Manage the items you&apos;ve posted.
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ y: -3, rotate: -1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => router.push("/sell")}
                                    className="btn-brutal flex items-center gap-2 bg-black px-5 py-3 text-sm text-white"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    Sell Something
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {listings.length === 0 ? (
                        <div className="card-brutal bg-white p-12 text-center">
                            <p className="font-display text-xl uppercase">
                                You haven&apos;t posted anything yet.
                            </p>
                            <p className="mt-2 font-mono text-xs font-bold uppercase tracking-widest text-black/60">
                                Sell something to students on campus.
                            </p>
                            <motion.button
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => router.push("/sell")}
                                className="btn-brutal mt-6 bg-brutal-yellow px-6 py-3 text-sm"
                            >
                                Create Your First Listing
                            </motion.button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {listings.map((listing, i) => (
                                <motion.div
                                    key={listing.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                                    className="card-brutal flex flex-col overflow-hidden bg-white"
                                >
                                    <div className="relative h-52 border-b-[4px] border-black">
                                        {listing.listing_images?.[0]?.image_url ? (
                                            <img src={listing.listing_images[0].image_url} alt={listing.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="halftone flex h-full w-full items-center justify-center font-mono text-xs font-bold uppercase text-black/60">
                                                No image
                                            </div>
                                        )}
                                        <div className="absolute left-3 top-3">
                                            <CategoryBadge category={listing.category} />
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-5">
                                        <h2 className="font-display text-base uppercase leading-tight">
                                            {listing.title}
                                        </h2>
                                        <p className="mt-2 inline-block w-fit border-[3px] border-black bg-black px-2 py-0.5 font-display text-lg text-white">
                                            ₹{listing.price}
                                        </p>
                                        <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                            {listing.condition} {"///"} {listing.status}
                                        </p>

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => router.push(`/listing/${listing.id}`)}
                                                className="btn-brutal flex flex-1 items-center justify-center gap-1 bg-white px-3 py-2 text-xs"
                                            >
                                                <Eye size={14} strokeWidth={3} />
                                                View
                                            </button>
                                            <button
                                                onClick={() => router.push(`/listing/${listing.id}/edit`)}
                                                className="btn-brutal flex flex-1 items-center justify-center gap-1 bg-brutal-yellow px-3 py-2 text-xs"
                                            >
                                                <Pencil size={14} strokeWidth={3} />
                                                Edit
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(listing.id)}
                                            className="btn-brutal mt-2 flex w-full items-center justify-center gap-1 bg-brutal-red px-3 py-2 text-xs text-white"
                                        >
                                            <Trash2 size={14} strokeWidth={3} />
                                            Delete Listing
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
                <Footer />
            </main>
        </AuthGuard>
    )
}
