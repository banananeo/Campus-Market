"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Camera, Lock, Mail, Save, Trash2, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"

export default function ProfilePage() {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    const [name, setName] = useState("")
    const [department, setDepartment] = useState("")
    const [year, setYear] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [currentEmail, setCurrentEmail] = useState("")

    const [basicError, setBasicError] = useState("")
    const [basicSuccess, setBasicSuccess] = useState("")
    const [savingBasic, setSavingBasic] = useState(false)

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarError, setAvatarError] = useState("")
    const [avatarSuccess, setAvatarSuccess] = useState("")
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [removingAvatar, setRemovingAvatar] = useState(false)

    const [newEmail, setNewEmail] = useState("")
    const [emailError, setEmailError] = useState("")
    const [emailSuccess, setEmailSuccess] = useState("")
    const [savingEmail, setSavingEmail] = useState(false)

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [pwError, setPwError] = useState("")
    const [pwSuccess, setPwSuccess] = useState("")
    const [savingPw, setSavingPw] = useState(false)

    useEffect(() => {
        async function load() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            setUserId(user.id)
            setCurrentEmail(user.email || "")

            const { data: profile } = await supabase
                .from("profiles")
                .select("name, department, year, avatar_url")
                .eq("id", user.id)
                .maybeSingle()

            if (profile) {
                setName(profile.name || "")
                setDepartment(profile.department || "")
                setYear(profile.year ? String(profile.year) : "")
                setAvatarUrl(
                    (profile as { avatar_url?: string | null }).avatar_url ||
                        null
                )
            } else {
                // Fall back to auth metadata for pre-trigger accounts
                const meta = user.user_metadata || {}
                setName(meta.name || "")
                setDepartment(meta.department || "")
                setYear(meta.year ? String(meta.year) : "")
            }

            setLoading(false)
        }

        load()
    }, [])

    useEffect(() => {
        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview)
        }
    }, [avatarPreview])

    async function handleSaveBasic(e: React.FormEvent) {
        e.preventDefault()
        setBasicError("")
        setBasicSuccess("")

        const trimmedName = name.trim()
        const trimmedDept = department.trim()
        const parsedYear = Number(year)

        if (!trimmedName) {
            setBasicError("Please enter your name.")
            return
        }
        if (!trimmedDept) {
            setBasicError("Please enter your department.")
            return
        }
        if (!Number.isInteger(parsedYear) || parsedYear < 1 || parsedYear > 4) {
            setBasicError("Please select a valid year (1-4).")
            return
        }

        setSavingBasic(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setBasicError("Please log in to update your profile.")
            setSavingBasic(false)
            return
        }

        const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
                {
                    id: user.id,
                    name: trimmedName,
                    department: trimmedDept,
                    year: parsedYear,
                },
                { onConflict: "id" }
            )

        if (profileError) {
            console.error(profileError)
            setBasicError(profileError.message)
            setSavingBasic(false)
            return
        }

        const { error: metaError } = await supabase.auth.updateUser({
            data: {
                name: trimmedName,
                department: trimmedDept,
                year: parsedYear,
            },
        })

        if (metaError) {
            console.error(metaError)
            setBasicError(
                "Profile saved, but account metadata could not be synced."
            )
            setSavingBasic(false)
            return
        }

        setBasicSuccess("Profile updated.")
        setSavingBasic(false)
        router.refresh()
    }

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        setAvatarError("")
        setAvatarSuccess("")
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setAvatarError("Please select only image files.")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setAvatarError("Avatar must be smaller than 5MB.")
            return
        }

        if (avatarPreview) URL.revokeObjectURL(avatarPreview)
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
        e.target.value = ""
    }

    async function handleAvatarUpload() {
        setAvatarError("")
        setAvatarSuccess("")
        if (!avatarFile) {
            setAvatarError("Choose a photo first.")
            return
        }

        setUploadingAvatar(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setAvatarError("Please log in to upload an avatar.")
            setUploadingAvatar(false)
            return
        }

        const path = `${user.id}/avatar`
        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, avatarFile, {
                upsert: true,
                contentType: avatarFile.type,
            })

        if (uploadError) {
            console.error(uploadError)
            setAvatarError(
                "Upload failed. Run supabase/profile-update.sql to create the avatars bucket."
            )
            setUploadingAvatar(false)
            return
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path)
        const stampedUrl = `${publicUrl}?t=${Date.now()}`

        const { error: saveError } = await supabase
            .from("profiles")
            .upsert(
                { id: user.id, avatar_url: stampedUrl },
                { onConflict: "id" }
            )

        if (saveError) {
            console.error(saveError)
            setAvatarError(
                "Uploaded, but could not save to profile. Run supabase/profile-update.sql to add avatar_url."
            )
            setUploadingAvatar(false)
            return
        }

        await supabase.auth.updateUser({ data: { avatar_url: stampedUrl } })

        setAvatarUrl(stampedUrl)
        setAvatarFile(null)
        if (avatarPreview) URL.revokeObjectURL(avatarPreview)
        setAvatarPreview(null)
        setAvatarSuccess("Avatar updated.")
        setUploadingAvatar(false)
        router.refresh()
    }

    async function handleAvatarRemove() {
        setAvatarError("")
        setAvatarSuccess("")
        setRemovingAvatar(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setAvatarError("Please log in to remove your avatar.")
            setRemovingAvatar(false)
            return
        }

        await supabase.storage.from("avatars").remove([`${user.id}/avatar`])

        const { error } = await supabase
            .from("profiles")
            .update({ avatar_url: null })
            .eq("id", user.id)

        if (error) {
            console.error(error)
            setAvatarError(error.message)
            setRemovingAvatar(false)
            return
        }

        await supabase.auth.updateUser({ data: { avatar_url: null } })

        setAvatarUrl(null)
        setAvatarFile(null)
        if (avatarPreview) URL.revokeObjectURL(avatarPreview)
        setAvatarPreview(null)
        setAvatarSuccess("Avatar removed.")
        setRemovingAvatar(false)
        router.refresh()
    }

    async function handleEmailChange(e: React.FormEvent) {
        e.preventDefault()
        setEmailError("")
        setEmailSuccess("")

        const trimmed = newEmail.trim()
        if (!trimmed || !trimmed.includes("@")) {
            setEmailError("Please enter a valid email.")
            return
        }
        if (trimmed === currentEmail) {
            setEmailError("This is already your email.")
            return
        }

        setSavingEmail(true)
        const { error } = await supabase.auth.updateUser({ email: trimmed })

        if (error) {
            setEmailError(error.message)
            setSavingEmail(false)
            return
        }

        setEmailSuccess("Check your inbox to confirm the new email.")
        setNewEmail("")
        setSavingEmail(false)
    }

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault()
        setPwError("")
        setPwSuccess("")

        if (newPassword.length < 6) {
            setPwError("Password must be at least 6 characters.")
            return
        }
        if (newPassword !== confirmPassword) {
            setPwError("Passwords do not match.")
            return
        }

        setSavingPw(true)
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        })

        if (error) {
            setPwError(error.message)
            setSavingPw(false)
            return
        }

        setPwSuccess("Password updated.")
        setNewPassword("")
        setConfirmPassword("")
        setSavingPw(false)
    }

    const inputCls = "input-brutal w-full py-3"
    const labelCls =
        "mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest"

    if (loading) {
        return (
            <AuthGuard>
                <main className="min-h-screen font-grotesk">
                    <Navbar />
                    <div className="mx-auto max-w-2xl px-4 py-10">
                        <div className="card-brutal bg-white p-12 text-center font-mono text-sm font-bold uppercase tracking-widest text-black/60">
                            Loading profile...
                        </div>
                    </div>
                    <Footer />
                </main>
            </AuthGuard>
        )
    }

    const displayAvatar = avatarPreview || avatarUrl

    return (
        <AuthGuard>
            <main className="min-h-screen font-grotesk text-black">
                <Navbar />
                <div className="mx-auto max-w-2xl px-4 pb-24">
                    <button
                        onClick={() => router.push("/")}
                        className="btn-brutal mt-6 bg-white px-4 py-2 text-xs"
                    >
                        <span className="inline-flex items-center gap-2">
                            <ArrowLeft size={14} strokeWidth={3} />
                            Back to Marketplace
                        </span>
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-brutal mt-4 overflow-hidden"
                    >
                        <div className="border-b-[4px] border-black bg-brutal-yellow p-5">
                            <span className="badge-brutal bg-black text-white">
                                {userId ? `ID ${userId.slice(0, 8)}` : "Account"}
                            </span>
                            <h1 className="mt-3 font-display text-3xl uppercase tracking-tighter">
                                Edit Profile
                            </h1>
                            <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                Update your info even after signup ///{" "}
                                {currentEmail}
                            </p>
                        </div>

                        <div className="space-y-6 bg-white p-6">
                            {/* Basic info */}
                            <form
                                onSubmit={handleSaveBasic}
                                className="border-[3px] border-black bg-brutal-cream p-4 shadow-brutal-sm"
                            >
                                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
                                    <span className="grid h-7 w-7 place-items-center border-[3px] border-black bg-white">
                                        <User size={14} strokeWidth={3} />
                                    </span>
                                    Basic info
                                </p>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className={labelCls}>Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Department</label>
                                        <input
                                            type="text"
                                            required
                                            value={department}
                                            onChange={(e) =>
                                                setDepartment(e.target.value)
                                            }
                                            placeholder="e.g. CSE"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Year</label>
                                        <select
                                            required
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                            className={inputCls}
                                        >
                                            <option value="">Select year</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>
                                </div>
                                {basicError && (
                                    <p className="mt-3 border-[3px] border-black bg-brutal-red p-3 font-mono text-xs font-bold uppercase text-white">
                                        {basicError}
                                    </p>
                                )}
                                {basicSuccess && (
                                    <p className="mt-3 border-[3px] border-black bg-brutal-mint p-3 font-mono text-xs font-bold uppercase">
                                        {basicSuccess}
                                    </p>
                                )}
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="submit"
                                    disabled={savingBasic}
                                    className="btn-brutal mt-4 flex w-full items-center justify-center gap-2 bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
                                >
                                    <Save size={15} strokeWidth={3} />
                                    {savingBasic ? "Saving..." : "Save Info"}
                                </motion.button>
                            </form>

                            {/* Avatar */}
                            <div className="border-[3px] border-black bg-white p-4 shadow-brutal-sm">
                                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
                                    <span className="grid h-7 w-7 place-items-center border-[3px] border-black bg-brutal-yellow">
                                        <Camera size={14} strokeWidth={3} />
                                    </span>
                                    Avatar
                                </p>
                                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                                    <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden border-[3px] border-black bg-brutal-cream shadow-brutal-xs">
                                        {displayAvatar ? (
                                            <img
                                                src={displayAvatar}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User size={28} strokeWidth={3} />
                                        )}
                                    </span>
                                    <div className="w-full flex-1">
                                        <label className="flex cursor-pointer flex-col items-center justify-center border-[3px] border-dashed border-black bg-brutal-cream p-4 text-center transition hover:bg-brutal-yellow">
                                            <span className="font-display text-xs uppercase">
                                                {avatarFile ? avatarFile.name : "Choose photo"}
                                            </span>
                                            <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-black/60">
                                                Image only · Max 5MB
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                        </label>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.97 }}
                                                type="button"
                                                onClick={handleAvatarUpload}
                                                disabled={uploadingAvatar || !avatarFile}
                                                className="btn-brutal bg-black px-4 py-2 text-xs text-white disabled:opacity-50"
                                            >
                                                {uploadingAvatar ? "Uploading..." : "Upload"}
                                            </motion.button>
                                            {(avatarUrl || avatarPreview) && (
                                                <motion.button
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    type="button"
                                                    onClick={handleAvatarRemove}
                                                    disabled={removingAvatar}
                                                    className="btn-brutal flex items-center gap-1 bg-brutal-red px-4 py-2 text-xs text-white disabled:opacity-50"
                                                >
                                                    <Trash2 size={13} strokeWidth={3} />
                                                    {removingAvatar ? "Removing..." : "Remove"}
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {avatarError && (
                                    <p className="mt-3 border-[3px] border-black bg-brutal-red p-3 font-mono text-xs font-bold uppercase text-white">
                                        {avatarError}
                                    </p>
                                )}
                                {avatarSuccess && (
                                    <p className="mt-3 border-[3px] border-black bg-brutal-mint p-3 font-mono text-xs font-bold uppercase">
                                        {avatarSuccess}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <form
                                onSubmit={handleEmailChange}
                                className="border-[3px] border-black bg-white p-4 shadow-brutal-sm"
                            >
                                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
                                    <span className="grid h-7 w-7 place-items-center border-[3px] border-black bg-brutal-blue text-white">
                                        <Mail size={14} strokeWidth={3} />
                                    </span>
                                    Email /// {currentEmail || "unknown"}
                                </p>
                                <div className="mt-4">
                                    <label className={labelCls}>New email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="new@example.com"
                                        className={inputCls}
                                    />
                                </div>
                                {emailError && (
                                    <p className="mt-3 border-[3px] border-black bg-brutal-red p-3 font-mono text-xs font-bold uppercase text-white">
                                        {emailError}
                                    </p>
                                )}
                                {emailSuccess && (
                                    <p className="mt-3 border-[3px] border-black bg-brutal-mint p-3 font-mono text-xs font-bold uppercase">
                                        {emailSuccess}
                                    </p>
                                )}
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="submit"
                                    disabled={savingEmail}
                                    className="btn-brutal mt-4 w-full bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
                                >
                                    {savingEmail ? "Updating..." : "Change Email"}
                                </motion.button>
                            </form>

                            {/* Password */}
                            <form
                                onSubmit={handlePasswordChange}
                                className="border-[3px] border-black bg-white p-4 shadow-brutal-sm"
                            >
                                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
                                    <span className="grid h-7 w-7 place-items-center border-[3px] border-black bg-black text-brutal-yellow">
                                        <Lock size={14} strokeWidth={3} />
                                    </span>
                                    Password
                                </p>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className={labelCls}>New password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(e.target.value)
                                            }
                                            placeholder="At least 6 characters"
                                            minLength={6}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Confirm password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(e.target.value)
                                            }
                                            placeholder="Repeat new password"
                                            minLength={6}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                                {pwError && (
                                    <p className="mt-3 border-[3px] border-black bg-brutal-red p-3 font-mono text-xs font-bold uppercase text-white">
                                        {pwError}
                                    </p>
                                )}
                                {pwSuccess && (
                                    <p className="mt-3 border-[3px] border-black bg-brutal-mint p-3 font-mono text-xs font-bold uppercase">
                                        {pwSuccess}
                                    </p>
                                )}
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="submit"
                                    disabled={savingPw}
                                    className="btn-brutal mt-4 w-full bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
                                >
                                    {savingPw ? "Updating..." : "Change Password"}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </div>
                <Footer />
            </main>
        </AuthGuard>
    )
}
