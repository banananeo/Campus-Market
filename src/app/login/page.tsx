"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import { supabase } from "@/lib/supabase"

function getNextPath(): string {
    if (typeof window === "undefined") return "/"
    const next = new URLSearchParams(window.location.search).get("next")
    return next && next.startsWith("/") ? next : "/"
}

export default function LoginPage() {
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        setError("")
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        router.push(getNextPath())
        router.refresh()
    }

    const inputCls = "input-brutal w-full py-3"
    const labelCls = "mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-black/60"

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-10 font-grotesk">
            <motion.div
                initial={{ opacity: 0, y: 24, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                className="card-brutal w-full max-w-md overflow-hidden"
            >
                <div className="border-b-[4px] border-black bg-brutal-yellow p-6 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center border-[3px] border-black bg-black text-brutal-yellow shadow-brutal-xs">
                        <ShoppingBag size={22} strokeWidth={3} />
                    </span>
                    <h1 className="mt-3 font-display text-2xl uppercase tracking-tighter">
                        Campus Market
                    </h1>
                    <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                        Buy and sell within your campus
                    </p>
                </div>

                <div className="bg-white p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelCls}>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className={inputCls} />
                        </div>

                        {error && (
                            <div className="border-[3px] border-black bg-brutal-red px-4 py-3 font-mono text-xs font-bold uppercase text-white">
                                {error}
                            </div>
                        )}

                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            disabled={loading}
                            className="btn-brutal w-full bg-black py-3 text-sm text-white disabled:opacity-50"
                        >
                            {loading ? "Please wait..." : "Login"}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center font-mono text-xs font-bold uppercase tracking-widest text-black/60">
                        Don&apos;t have an account?{" "}
                        <button onClick={() => router.push("/signup")} className="bg-brutal-yellow px-1 font-display text-black">
                            Sign Up
                        </button>
                    </div>
                </div>
            </motion.div>
        </main>
    )
}
