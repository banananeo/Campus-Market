"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"

export default function EditListing() {
    const params = useParams()
    const router = useRouter()

    const id = params.id as string

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [category, setCategory] = useState("")
    const [condition, setCondition] = useState("")
    const [location, setLocation] = useState("")

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadListing() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setError("Please log in to edit a listing.")
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from("listings")
                .select("*")
                .eq("id", id)
                .eq("seller_id", user.id)
                .single()

            if (error) {
                console.error(error)
                setError("You cannot edit this listing.")
                setLoading(false)
                return
            }

            setTitle(data.title)
            setDescription(data.description || "")
            setPrice(String(data.price))
            setCategory(data.category)
            setCondition(data.condition)
            setLocation(data.location || "")

            setLoading(false)
        }

        loadListing()
    }, [id])

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()

        setSaving(true)
        setError("")

        const { error } = await supabase
            .from("listings")
            .update({
                title,
                description,
                price: Number(price),
                category,
                condition,
                location,
            })
            .eq("id", id)

        if (error) {
            console.error(error)
            setError(error.message)
            setSaving(false)
            return
        }

        router.push(`/listing/${id}`)
    }

    const inputCls = "input-brutal w-full py-3"
    const labelCls = "mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest"

    if (loading) {
        return (
            <main className="min-h-screen font-grotesk">
                <Navbar />
                <div className="mx-auto max-w-2xl px-4 py-10">
                    <div className="card-brutal bg-white p-12 text-center font-mono text-sm font-bold uppercase tracking-widest text-black/60">
                        Loading listing...
                    </div>
                </div>
                <Footer />
            </main>
        )
    }

    if (error && !title) {
        return (
            <main className="min-h-screen font-grotesk">
                <Navbar />
                <div className="mx-auto max-w-2xl px-4 py-10">
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
                <div className="mx-auto max-w-2xl px-4 pb-24">
                    <button
                        onClick={() => router.push(`/listing/${id}`)}
                        className="btn-brutal mt-6 bg-white px-4 py-2 text-xs"
                    >
                        ← Back to Listing
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-brutal mt-4 overflow-hidden"
                    >
                        <div className="border-b-[4px] border-black bg-brutal-blue p-5">
                            <h1 className="font-display text-2xl uppercase tracking-tighter text-white">
                                Edit Listing
                            </h1>
                            <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white/80">
                                Update your listing information.
                            </p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6 bg-white p-6">
                            <div>
                                <label className={labelCls}>Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={`${inputCls} resize-none`} />
                            </div>
                            <div>
                                <label className={labelCls}>Price</label>
                                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Category</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} required className={inputCls}>
                                    <option value="">Select category</option>
                                    <option value="Books">Books</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Furniture">Furniture</option>
                                    <option value="Cycles">Cycles</option>
                                    <option value="Clothing">Clothing</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Condition</label>
                                <select value={condition} onChange={(e) => setCondition(e.target.value)} required className={inputCls}>
                                    <option value="">Select condition</option>
                                    <option value="New">New</option>
                                    <option value="Like New">Like New</option>
                                    <option value="Good">Good</option>
                                    <option value="Used">Used</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Location</label>
                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Example: Main Block" className={inputCls} />
                            </div>
                            {error && (
                                <p className="border-[3px] border-black bg-brutal-red p-3 font-mono text-xs font-bold uppercase text-white">
                                    {error}
                                </p>
                            )}
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                type="submit"
                                disabled={saving}
                                className="btn-brutal w-full bg-black py-3 text-sm text-white disabled:opacity-50"
                            >
                                {saving ? "Saving Changes..." : "Save Changes"}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
                <Footer />
            </main>
        </AuthGuard>
    )
}
