"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Camera } from "lucide-react"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"

function sanitizeFileName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-").slice(0, 80)
}

export default function SellPage() {
    const router = useRouter()

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [category, setCategory] = useState("")
    const [condition, setCondition] = useState("")
    const [location, setLocation] = useState("")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    useEffect(() => {
        return () => {
            imagePreviews.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [imagePreviews])

    function removeImage(index: number) {
        setImages((prev) => prev.filter((_, i) => i !== index))
        setImagePreviews((prev) => {
            URL.revokeObjectURL(prev[index])
            return prev.filter((_, i) => i !== index)
        })
    }
    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFiles = Array.from(e.target.files || [])

        if (selectedFiles.length > 4) {
            setError("You can upload a maximum of 4 images.")
            return
        }

        const invalidFile = selectedFiles.find(
            (file) => !file.type.startsWith("image/")
        )

        if (invalidFile) {
            setError("Please select only image files.")
            return
        }

        const tooLarge = selectedFiles.find(
            (file) => file.size > 5 * 1024 * 1024
        )

        if (tooLarge) {
            setError("Each image must be smaller than 5MB.")
            return
        }

        setError("")
        imagePreviews.forEach((url) => URL.revokeObjectURL(url))
        setImages(selectedFiles)

        const previews = selectedFiles.map((file) =>
            URL.createObjectURL(file)
        )

        setImagePreviews(previews)
        // Reset input so the same file can be picked again
        e.target.value = ""
    }
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        setLoading(true)
        setError("")

        const parsedPrice = Number(price)
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            setError("Please enter a valid price.")
            setLoading(false)
            return
        }

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setError("You must be logged in to sell an item.")
            setLoading(false)
            return
        }

        // Create listing first
        const { data: listing, error: listingError } = await supabase
            .from("listings")
            .insert({
                seller_id: user.id,
                title,
                description,
                price: parsedPrice,
                category,
                condition,
                location,
                status: "available",
            })
            .select()
            .single()

        if (listingError) {
            console.error(listingError)
            setError(listingError.message)
            setLoading(false)
            return
        }

        // Upload images (rollback listing + uploaded files on failure)
        const uploadedPaths: string[] = []
        for (const image of images) {
            const fileName = `${user.id}/${listing.id}/${crypto.randomUUID()}-${sanitizeFileName(image.name)}`

            const { error: uploadError } = await supabase.storage
                .from("listing-images")
                .upload(fileName, image)

            if (uploadError) {
                console.error(uploadError)
                await supabase.storage.from("listing-images").remove(uploadedPaths)
                await supabase.from("listings").delete().eq("id", listing.id)
                setError("Image upload failed. Listing was removed, please try again.")
                setLoading(false)
                return
            }

            uploadedPaths.push(fileName)

            // Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage
                .from("listing-images")
                .getPublicUrl(fileName)

            // Save image URL
            const { error: imageError } = await supabase
                .from("listing_images")
                .insert({
                    listing_id: listing.id,
                    image_url: publicUrl,
                })

            if (imageError) {
                console.error(imageError)
                await supabase.storage.from("listing-images").remove(uploadedPaths)
                await supabase.from("listing_images").delete().eq("listing_id", listing.id)
                await supabase.from("listings").delete().eq("id", listing.id)
                setError("Listing created, but an image could not be saved. Rolled back, please try again.")
                setLoading(false)
                return
            }
        }

        router.push("/")
        router.refresh()
    }

    const inputCls = "input-brutal w-full py-3"
    const labelCls = "mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest"

    return (
        <AuthGuard>
            <main className="min-h-screen font-grotesk text-black">
                <Navbar />
                <div className="mx-auto max-w-2xl px-4 pb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-brutal mt-6 overflow-hidden"
                    >
                        <div className="border-b-[4px] border-black bg-brutal-yellow p-5">
                            <h1 className="font-display text-3xl uppercase tracking-tighter">
                                Sell Something
                            </h1>
                            <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                List an item for other students on campus.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6">
                            <div>
                                <label className={labelCls}>Item name</label>
                                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scientific Calculator" className={inputCls} />
                            </div>

                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your item..." rows={4} className={`${inputCls} resize-none`} />
                            </div>

                            <div>
                                <label className={labelCls}>Photos</label>
                                <label className="flex cursor-pointer flex-col items-center justify-center border-[3px] border-dashed border-black bg-brutal-cream p-8 text-center transition hover:bg-brutal-yellow">
                                    <span className="grid h-12 w-12 place-items-center border-[3px] border-black bg-white shadow-brutal-xs">
                                        <Camera size={22} strokeWidth={3} />
                                    </span>
                                    <span className="mt-2 font-display text-sm uppercase">Add photos</span>
                                    <span className="mt-1 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                        Up to 4 images · Max 5MB each
                                    </span>
                                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                                </label>
                                {imagePreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={`${preview}-${index}`} className="relative aspect-square overflow-hidden border-[3px] border-black shadow-brutal-xs">
                                                <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute right-1 top-1 border-[3px] border-black bg-brutal-red px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white"
                                                >
                                                    X
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelCls}>Price (₹)</label>
                                <input type="number" required min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="650" className={inputCls} />
                            </div>

                            <div>
                                <label className={labelCls}>Category</label>
                                <select required value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
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
                                <select required value={condition} onChange={(e) => setCondition(e.target.value)} className={inputCls}>
                                    <option value="">Select condition</option>
                                    <option value="New">New</option>
                                    <option value="Like New">Like New</option>
                                    <option value="Good">Good</option>
                                    <option value="Used">Used</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelCls}>Campus location</label>
                                <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hostel Block C" className={inputCls} />
                            </div>

                            {error && (
                                <div className="border-[3px] border-black bg-brutal-red p-3 font-mono text-xs font-bold uppercase tracking-widest text-white">
                                    {error}
                                </div>
                            )}

                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                type="submit"
                                disabled={loading}
                                className="btn-brutal w-full bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
                            >
                                {loading ? "Publishing..." : "Publish Listing"}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
                <Footer />
            </main>
        </AuthGuard>
    )
}
