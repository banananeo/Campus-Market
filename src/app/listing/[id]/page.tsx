"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MessageSquare, Pencil, Send, User } from "lucide-react"
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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isFavorite, setIsFavorite] = useState(false)
    const [favoriteLoading, setFavoriteLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [sendingMessage, setSendingMessage] = useState(false)
    const [contactError, setContactError] = useState("")
    const [contactSuccess, setContactSuccess] = useState("")
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        async function fetchListing() {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            setCurrentUserId(user?.id ?? null)

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
                setActiveIndex(0)

                // Hydrate wishlist state so toggle doesn't always insert
                if (user) {
                    const { data: fav } = await supabase
                        .from("favorites")
                        .select("listing_id")
                        .eq("user_id", user.id)
                        .eq("listing_id", data.id)
                        .maybeSingle()
                    setIsFavorite(!!fav)
                }
            }

            setLoading(false)
        }

        fetchListing()
    }, [id])
    async function contactSeller() {
        setContactError("")
        setContactSuccess("")

        if (!message.trim()) {
            setContactError("Please enter a message.")
            return
        }

        setSendingMessage(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setContactError("Please log in to contact the seller.")
            setSendingMessage(false)
            return
        }

        if (user.id === listing.seller_id) {
            setContactError("You cannot message yourself.")
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
            setContactError("Could not send your message.")
            setSendingMessage(false)
            return
        }

        setMessage("")
        setContactSuccess("Message sent! View it in Messages.")
        setSendingMessage(false)
        router.push("/messages")
    }
    async function toggleFavorite() {
        setFavoriteLoading(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setContactError("Please log in to use your wishlist.")
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
                setContactError("Could not update wishlist.")
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
                // Already saved (e.g. double-click) — treat as saved
                if (error.code === "23505") {
                    setIsFavorite(true)
                } else {
                    console.error(error)
                    setContactError("Could not add to wishlist.")
                }
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

    const images: string[] =
        listing.listing_images
            ?.map((img: { image_url: string }) => img.image_url)
            .filter(Boolean) ?? []
    const safeIndex =
        images.length > 0 ? Math.min(activeIndex, images.length - 1) : 0

    function showPrev() {
        setActiveIndex((prev) =>
            images.length === 0
                ? 0
                : (prev - 1 + images.length) % images.length
        )
    }

    function showNext() {
        setActiveIndex((prev) =>
            images.length === 0 ? 0 : (prev + 1) % images.length
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
                    {/* Image gallery */}
                    <div className="card-brutal overflow-hidden">
                        <div className="flex items-center justify-between border-b-[4px] border-black bg-brutal-yellow px-4 py-2">
                            <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                                Listing #{listing.id}
                            </span>
                            {images.length > 1 && (
                                <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                                    {safeIndex + 1} / {images.length}
                                </span>
                            )}
                        </div>
                        {images.length > 0 ? (
                            <>
                                <div className="relative bg-brutal-cream">
                                    <img
                                        src={images[safeIndex]}
                                        alt={`${listing.title} - photo ${safeIndex + 1}`}
                                        className="h-[380px] w-full object-contain"
                                    />
                                    {images.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={showPrev}
                                                aria-label="Previous photo"
                                                className="btn-brutal absolute left-3 top-1/2 -translate-y-1/2 bg-white p-2"
                                            >
                                                <ChevronLeft size={18} strokeWidth={3} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={showNext}
                                                aria-label="Next photo"
                                                className="btn-brutal absolute right-3 top-1/2 -translate-y-1/2 bg-white p-2"
                                            >
                                                <ChevronRight size={18} strokeWidth={3} />
                                            </button>
                                        </>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto border-t-[4px] border-black bg-white p-3">
                                        {images.map((url, index) => (
                                            <button
                                                key={`${url}-${index}`}
                                                type="button"
                                                onClick={() => setActiveIndex(index)}
                                                aria-label={`View photo ${index + 1}`}
                                                className={`h-16 w-16 shrink-0 overflow-hidden border-[3px] border-black transition ${
                                                    index === safeIndex
                                                        ? "bg-brutal-yellow opacity-100 shadow-brutal-xs"
                                                        : "bg-brutal-cream opacity-60 hover:opacity-100"
                                                }`}
                                            >
                                                <img
                                                    src={url}
                                                    alt=""
                                                    loading="lazy"
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
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

                        <div className="mt-4 flex flex-wrap gap-2">
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleFavorite}
                                disabled={favoriteLoading}
                                className={`btn-brutal flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50 ${isFavorite ? "bg-brutal-pink text-white" : "bg-white"}`}
                            >
                                <Heart size={14} strokeWidth={3} fill={isFavorite ? "currentColor" : "none"} />
                                {favoriteLoading ? "Saving..." : isFavorite ? "Saved" : "Wishlist"}
                            </motion.button>
                            {currentUserId && currentUserId === listing.seller_id && (
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => router.push(`/listing/${listing.id}/edit`)}
                                    className="btn-brutal flex items-center gap-2 bg-brutal-yellow px-4 py-2 text-xs"
                                >
                                    <Pencil size={14} strokeWidth={3} />
                                    Edit
                                </motion.button>
                            )}
                        </div>

                        <div className="mt-5 border-[3px] border-black bg-brutal-cream p-4 shadow-brutal-sm">
                            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
                                <span className="grid h-7 w-7 place-items-center border-[3px] border-black bg-brutal-yellow">
                                    <MessageSquare size={14} strokeWidth={3} />
                                </span>
                                Contact seller
                            </p>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hi, is this item still available?"
                                rows={4}
                                className="input-brutal mt-3 w-full resize-none"
                            />

                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={contactSeller}
                                disabled={sendingMessage}
                                className="btn-brutal mt-3 flex w-full items-center justify-center gap-2 bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
                            >
                                <Send size={15} strokeWidth={3} />
                                {sendingMessage ? "Sending..." : "Contact Seller"}
                            </motion.button>

                            {contactError && (
                                <p className="mt-3 border-[3px] border-black bg-brutal-red p-3 font-mono text-xs font-bold uppercase text-white">
                                    {contactError}
                                </p>
                            )}
                            {contactSuccess && (
                                <p className="mt-3 border-[3px] border-black bg-brutal-mint p-3 font-mono text-xs font-bold uppercase">
                                    {contactSuccess}
                                </p>
                            )}
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
