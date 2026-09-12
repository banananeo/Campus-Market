"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthGuard({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                router.replace("/login")
                return
            }

            setLoading(false)
        }

        checkUser()
    }, [router])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4 font-grotesk">
                <div className="card-brutal bg-white px-8 py-6 text-center font-mono text-xs font-bold uppercase tracking-widest text-black/60">
                    Checking login...
                </div>
            </div>
        )
    }

    return <>{children}</>
}