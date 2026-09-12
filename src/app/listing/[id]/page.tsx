"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Heart, MessageSquare, Pencil, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"
import { CategoryBadge } from "@/components/CategoryPills"

export default function ListingDetails() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [listing, setListing] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [isFavorite, setIsFavorite] = useState(false)
    const [favoriteLoading, setFavoriteLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [sendingMessage, setSendingMessage] = useState(false)

    useEffect(() => {
        async function fetchListing() {
            const { data, error } = await supabase
                .from("listings")
                .select(`
          *,
          listing_images (
            image_url
          ),
          profiles (
            name,
            department,
            year
          )
        `)
                .eq("id", id)
                .single()

            if (error) {
                console.error(error)
                setError("Unable to load this listing.")
            } else {
                setListing(data)
            }

            setLoading(false)
        }

        fetchListing()
    }, [id])
    async function contactSeller() {
        if (!message.trim()) {
            alert("Please enter a message.")
            return
        }

        setSendingMessage(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            alert("Please log in to contact the seller.")
            setSendingMessage(false)
            return
        }

        if (user.id === listing.profiles?.id) {
            alert("You cannot message yourself.")
            setSendingMessage(false)
            return
        }

        const { error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                receiver_id: listing.seller_id,
                listing_id: listing.id,
                message: message.trim(),
            })

        if (error) {
            console.error(error)
            alert("Could not send your message.")
            setSendingMessage(false)
            return
        }

        setMessage("")
        alert("Message sent to the seller!")
        setSendingMessage(false)
    }
    async function toggleFavorite() {
        setFavoriteLoading(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            alert("Please log in to add items to your wishlist.")
            setFavoriteLoading(false)
            return
        }

        if (isFavorite) {
            const { error } = await supabase
                .from("favorites")
                .delete()
                .eq("user_id", user.id)
                .eq("listing_id", listing.id)

            if (error) {
                console.error(error)
                alert("Could not remove from wishlist.")
            } else {
                setIsFavorite(false)
            }
        } else {
            const { error } = await supabase
                .from("favorites")
                .insert({
                    user_id: user.id,
                    listing_id: listing.id,
                })

            if (error) {
                console.error(error)
                alert("Could not add to wishlist.")
            } else {
                setIsFavorite(true)
            }
        }

        setFavoriteLoading(false)
    }

    if (loading) {
        return (
            <main className="min-h-screen font-grotesk">
                <Navbar />
                <div className="mx-auto max-w-5xl px-4 py-10">
                    <div className="card-brutal bg-white p-12 text-center font-mono text-sm font-bold uppercase tracking-widest text-black/60">
                        Loading listing...
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    if (error || !listing) {
        return (
            <main className="min-h-screen font-grotesk">
                <Navbar />
                <div className="mx-auto max-w-5xl px-4 py-10">
                    <div className="card-brutal bg-brutal-red p-8 text-center font-display text-sm uppercase text-white">
                        {error || "Listing not found."}
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    return (
        <main className="min-h-screen font-grotesk text-black">
            <Navbar />
            <div className="mx-auto max-w-5xl px-4 pb-24">
                <button
                    onClick={() => window.history.back()}
                    className="btn-brutal mt-6 bg-white px-4 py-2 text-xs"
                >
                    <span className="inline-flex items-center gap-2">
                        <ArrowLeft size={14} strokeWidth={3} />
                        Back
                    </span>
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="mt-4 grid gap-8 md:grid-cols-2"
                >
                    {/* Image */}
                    <div className="card-brutal overflow-hidden">
                        <div className="border-b-[4px] border-black bg-brutal-yellow px-4 py-2">
                            <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                                Listing #{listing.id}
                            </span>
                        </div>
                        {listing.listing_images?.[0]?.image_url ? (
                            <img
                                src={listing.listing_images[0].image_url}
                                alt={listing.title}
                                className="h-[380px] w-full object-cover"
                            />
                        ) : (
                            <div className="halftone flex h-[380px] w-full items-center justify-center font-mono text-xs font-bold uppercase tracking-widest text-black/60">
                                No image available
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="card-brutal bg-white p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <CategoryBadge category={listing.category} />
                            <span className="badge-brutal bg-white">{listing.condition}</span>
                        </div>

                        <h1 className="mt-3 font-display text-3xl uppercase leading-none tracking-tighter">
                            {listing.title}
                        </h1>

                        <div className="mt-4 inline-block border-[3px] border-black bg-black px-3 py-1.5 font-display text-2xl text-white shadow-brutal-sm">
                            ₹{listing.price}
                        </div>

                        <div className="space-y-3">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hi, is this item still available?"
                                rows={4}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                            />

                            <button
                                onClick={contactSeller}
                                disabled={sendingMessage}
                                className="w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                            >
                                {sendingMessage ? "Sending..." : "Contact Seller"}
                            </button>
                        </div>

                        <h2 className="mt-6 border-t-[3px] border-black pt-4 font-display text-sm uppercase tracking-widest">
                            Description
                        </h2>
                        <p className="mt-2 text-[15px] font-medium leading-relaxed">
                            {listing.description || "No description provided."}
                        </p>

                        {/* Seller */}
                        <div className="mt-6 border-[3px] border-black bg-brutal-cream p-4 shadow-brutal-sm">
                            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                Seller
                            </p>
                            <p className="mt-1 flex items-center gap-2 font-display text-base uppercase">
                                <span className="grid h-8 w-8 place-items-center border-[3px] border-black bg-black text-brutal-yellow">
                                    <User size={16} strokeWidth={3} />
                                </span>
                                {listing.profiles?.name || "Student"}
                            </p>
                            {listing.profiles && (
                                <p className="mt-1 font-mono text-xs font-bold uppercase text-black/60">
                                    {listing.profiles.department} • Year {listing.profiles.year}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </main>
    )
}
