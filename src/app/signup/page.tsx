"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"

export default function SignupPage() {
    const router = useRouter()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [department, setDepartment] = useState("")
    const [year, setYear] = useState("")

    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()

        setError("")
        setLoading(true)

        // Create authentication account
        const { data, error: signupError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (signupError) {
            setError(signupError.message)
            setLoading(false)
            return
        }

        // Create student profile
        if (data.user) {
            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: data.user.id,
                    name,
                    department,
                    year: Number(year),
                })

            if (profileError) {
                setError(profileError.message)
                setLoading(false)
                return
            }
        }

        router.push("/")
    }

    const inputCls = "input-brutal w-full py-3"
    const labelCls = "mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-black/60"

    return (
        <main className="flex min-h-screen items-center justify-center p-4 font-grotesk sm:p-6">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-brutal w-full max-w-md overflow-hidden"
            >
                <div className="border-b-[4px] border-black bg-brutal-mint p-6">
                    <span className="grid h-12 w-12 place-items-center border-[3px] border-black bg-black text-brutal-mint shadow-brutal-xs">
                        <ShoppingBag size={22} strokeWidth={3} />
                    </span>
                    <h1 className="mt-3 font-display text-2xl uppercase tracking-tighter">
                        Create Account
                    </h1>
                    <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                        Join your campus marketplace
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4 bg-white p-6">
                    <div>
                        <label className={labelCls}>Name</label>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className={labelCls}>Password</label>
                        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="At least 6 characters" />
                    </div>
                    <div>
                        <label className={labelCls}>Department</label>
                        <input type="text" required value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls} placeholder="Computer Science" />
                    </div>
                    <div>
                        <label className={labelCls}>Year</label>
                        <select required value={year} onChange={(e) => setYear(e.target.value)} className={inputCls}>
                            <option value="">Select year</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
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
                        disabled={loading}
                        className="btn-brutal w-full bg-black p-3 text-sm text-white disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </motion.button>
                </form>
            </motion.div>
        </main>
    )
}
