"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
    const router = useRouter()

    const [isSignup, setIsSignup] = useState(false)

    const [name, setName] = useState("")
    const [department, setDepartment] = useState("")
    const [year, setYear] = useState("")

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        setError("")
        setMessage("")
        setLoading(true)

        // LOGIN
        if (!isSignup) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                setLoading(false)
                return
            }

            router.push("/")
            return
        }

        // SIGNUP
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    department,
                    year: Number(year),
                },
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setMessage(
            "Account created successfully. Please check your email if verification is required."
        )

        setLoading(false)
    }

    function switchMode() {
        setIsSignup(!isSignup)
        setError("")
        setMessage("")
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
                        {isSignup
                            ? "Create your student account"
                            : "Buy and sell within your campus"}
                    </p>
                </div>

                <div className="bg-white p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignup && (
                            <>
                                <div>
                                    <label className={labelCls}>Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Department</label>
                                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. CSE" required className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Year</label>
                                    <select value={year} onChange={(e) => setYear(e.target.value)} required className={inputCls}>
                                        <option value="">Select year</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                            </>
                        )}

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

                        {message && (
                            <div className="border-[3px] border-black bg-brutal-mint px-4 py-3 font-mono text-xs font-bold uppercase">
                                {message}
                            </div>
                        )}

                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            disabled={loading}
                            className="btn-brutal w-full bg-black py-3 text-sm text-white disabled:opacity-50"
                        >
                            {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center font-mono text-xs font-bold uppercase tracking-widest text-black/60">
                        {isSignup ? (
                            <>
                                Already have an account?{" "}
                                <button onClick={switchMode} className="bg-brutal-yellow px-1 font-display text-black">
                                    Login
                                </button>
                            </>
                        ) : (
                            <>
                                Don&apos;t have an account?{" "}
                                <button onClick={switchMode} className="bg-brutal-yellow px-1 font-display text-black">
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </main>
    )
}
