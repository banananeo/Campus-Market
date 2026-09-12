"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, MessagesSquare, Send, User } from "lucide-react"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"
import { supabase } from "@/lib/supabase"

type Profile = {
    name: string
    department: string | null
    year: number | null
}

type Message = {
    id: number
    sender_id: string
    receiver_id: string
    listing_id: number
    message: string
    created_at: string
    listings: { title: string }[] | { title: string } | null
    sender: Profile[] | Profile | null
    receiver: Profile[] | Profile | null
}

function getTitle(item: Message): string {
    if (!item.listings) return "Listing"
    if (Array.isArray(item.listings)) return item.listings[0]?.title || "Listing"
    return item.listings.title || "Listing"
}

function getProfile(p: Profile[] | Profile | null): Profile | null {
    if (!p) return null
    return Array.isArray(p) ? p[0] || null : p
}

export default function MessagesPage() {
    const router = useRouter()

    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null)

    const [reply, setReply] = useState("")
    const [sendingReply, setSendingReply] = useState(false)
    const [replyError, setReplyError] = useState("")

    function threadKey(item: Message, me: string | null): string {
        const other = me
            ? item.sender_id === me
                ? item.receiver_id
                : item.sender_id
            : item.sender_id
        return `${item.listing_id}__${other}`
    }

    function otherParty(item: Message): Profile | null {
        if (!currentUserId) return getProfile(item.sender)
        return item.sender_id === currentUserId
            ? getProfile(item.receiver)
            : getProfile(item.sender)
    }

    async function fetchMessages() {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        setCurrentUserId(user.id)

        const { data, error } = await supabase
            .from("messages")
            .select(`
        id,
        sender_id,
        receiver_id,
        listing_id,
        message,
        created_at,
        listings (
          title
        ),
        sender:profiles!messages_sender_id_fkey (
          name,
          department,
          year
        ),
        receiver:profiles!messages_receiver_id_fkey (
          name,
          department,
          year
        )
      `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching messages:", error)
            setLoading(false)
            return
        }

        setMessages(((data as unknown) as Message[]) || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchMessages()
    }, [])

    async function sendReply() {
        setReplyError("")
        if (!reply.trim() || !selectedThreadKey) {
            return
        }

        setSendingReply(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setReplyError("Please log in to send a message.")
            setSendingReply(false)
            return
        }

        const selectedMessage = messages.find(
            (item) => threadKey(item, user.id) === selectedThreadKey
        )

        if (!selectedMessage) {
            setReplyError("Conversation not found.")
            setSendingReply(false)
            return
        }

        const receiverId =
            selectedMessage.sender_id === user.id
                ? selectedMessage.receiver_id
                : selectedMessage.sender_id

        if (receiverId === user.id) {
            setReplyError("You cannot message yourself.")
            setSendingReply(false)
            return
        }

        const { error } = await supabase.from("messages").insert({
            sender_id: user.id,
            receiver_id: receiverId,
            listing_id: selectedMessage.listing_id,
            message: reply.trim(),
        })

        if (error) {
            console.error("Error sending reply:", error)
            setReplyError("Could not send your reply.")
            setSendingReply(false)
            return
        }

        setReply("")
        await fetchMessages()
        setSendingReply(false)
    }

    // Unique threads by (listing + other user) — latest first
    const conversations = useMemo(() => {
        const map = new Map<string, Message>()
        for (const item of messages) {
            const key = threadKey(item, currentUserId)
            if (!map.has(key)) {
                map.set(key, item)
            }
        }
        return Array.from(map.entries()).map(([key, msg]) => ({ key, msg }))
    }, [messages, currentUserId])

    const selectedConversation = selectedThreadKey
        ? messages.find(
              (item) => threadKey(item, currentUserId) === selectedThreadKey
          ) || null
        : null

    const conversationMessages = selectedThreadKey
        ? messages
              .filter(
                  (item) => threadKey(item, currentUserId) === selectedThreadKey
              )
              .sort(
                  (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
              )
        : []

    if (loading) {
        return (
            <AuthGuard>
                <main className="min-h-screen font-grotesk text-black">
                    <Navbar />
                    <div className="mx-auto max-w-5xl px-4 py-10">
                        <div className="card-brutal bg-white p-12 text-center font-mono text-sm font-bold uppercase tracking-widest text-black/60">
                            Loading messages...
                        </div>
                    </div>
                    <Footer />
                </main>
            </AuthGuard>
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
                            <span className="inline-flex items-center gap-2">
                                <ArrowLeft size={14} strokeWidth={3} />
                                Back to Marketplace
                            </span>
                        </button>

                        <div className="card-brutal mt-4 bg-white p-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="badge-brutal bg-brutal-mint">
                                    Inbox
                                </span>
                                <span className="badge-brutal bg-black text-white">
                                    {conversations.length} chats
                                </span>
                            </div>
                            <h1 className="mt-3 font-display text-4xl uppercase tracking-tighter">
                                Messages
                            </h1>
                            <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                Chat with buyers and sellers about listings
                            </p>
                        </div>
                    </div>

                    {messages.length === 0 ? (
                        <div className="card-brutal bg-white p-12 text-center">
                            <span className="mx-auto grid h-14 w-14 place-items-center border-[3px] border-black bg-brutal-yellow shadow-brutal-sm">
                                <MessagesSquare size={26} strokeWidth={2.5} />
                            </span>
                            <p className="mt-4 font-display text-xl uppercase">
                                No messages yet
                            </p>
                            <p className="mt-2 font-mono text-xs font-bold uppercase tracking-widest text-black/60">
                                Contact a seller from a listing to start a
                                conversation.
                            </p>
                            <motion.button
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => router.push("/")}
                                className="btn-brutal mt-6 bg-brutal-yellow px-6 py-3 text-sm"
                            >
                                Browse Marketplace
                            </motion.button>
                        </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="badge-brutal bg-black text-white">
                                        Conversations
                                    </h2>
                                    <span className="badge-brutal bg-brutal-yellow">
                                        {conversations.length} total
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {conversations.map(({ key, msg: item }, i) => {
                                        const other = otherParty(item)
                                        const isActive = selectedThreadKey === key
                                        return (
                                            <motion.button
                                                key={key}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: Math.min(i * 0.05, 0.3),
                                                }}
                                                whileHover={{ y: -3 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedThreadKey(key)}
                                                className={`w-full border-[4px] border-black p-4 text-left transition-shadow ${
                                                    isActive
                                                        ? "bg-brutal-yellow shadow-brutal"
                                                        : "bg-white shadow-brutal-sm hover:shadow-brutal"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate font-display text-sm uppercase leading-tight tracking-tight">
                                                            {getTitle(item)}
                                                        </h3>
                                                        <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                                            <User size={12} strokeWidth={3} />
                                                            <span className="truncate">
                                                                {other?.name || "Student"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 border-[3px] border-black bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-black/60">
                                                        {new Date(
                                                            item.created_at
                                                        ).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="mt-3 line-clamp-2 border-t-[3px] border-black pt-3 text-sm font-medium leading-relaxed">
                                                    {item.message}
                                                </p>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="card-brutal flex min-h-[520px] flex-col overflow-hidden bg-white">
                                {!selectedThreadKey || !selectedConversation ? (
                                    <div className="halftone flex flex-1 flex-col items-center justify-center bg-brutal-cream p-10 text-center">
                                        <span className="grid h-14 w-14 place-items-center border-[3px] border-black bg-white shadow-brutal-sm">
                                            <MessagesSquare size={26} strokeWidth={2.5} />
                                        </span>
                                        <h2 className="mt-4 font-display text-lg uppercase">
                                            Select a conversation
                                        </h2>
                                        <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                            Choose a chat from the left to start talking
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="border-b-[4px] border-black bg-brutal-yellow p-5">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                                                        Listing #{selectedConversation.listing_id}
                                                    </p>
                                                    <h2 className="mt-1 font-display text-xl uppercase leading-none tracking-tighter">
                                                        {getTitle(selectedConversation)}
                                                    </h2>
                                                    <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest">
                                                        <span className="grid h-6 w-6 place-items-center border-[3px] border-black bg-black text-brutal-yellow">
                                                            <User size={12} strokeWidth={3} />
                                                        </span>
                                                        With {otherParty(selectedConversation)?.name || "Student"}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/listing/${selectedConversation.listing_id}`
                                                        )
                                                    }
                                                    className="btn-brutal bg-white px-3 py-1.5 text-[11px]"
                                                >
                                                    View Listing
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4 overflow-y-auto bg-brutal-paper p-5">
                                            {conversationMessages.map((item) => {
                                                const isMine = currentUserId
                                                    ? item.sender_id === currentUserId
                                                    : false
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div className="max-w-[78%]">
                                                            <div
                                                                className={`border-[3px] border-black px-4 py-2.5 shadow-brutal-xs ${
                                                                    isMine
                                                                        ? "bg-black text-white"
                                                                        : "bg-white text-black"
                                                                }`}
                                                            >
                                                                <p className="text-sm font-medium leading-relaxed">
                                                                    {item.message}
                                                                </p>
                                                            </div>
                                                            <p
                                                                className={`mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-black/50 ${
                                                                    isMine ? "text-right" : "text-left"
                                                                }`}
                                                            >
                                                                {new Date(item.created_at).toLocaleString([], {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="border-t-[4px] border-black bg-white p-4">
                                            <textarea
                                                value={reply}
                                                onChange={(e) => setReply(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault()
                                                        if (reply.trim() && !sendingReply) {
                                                            sendReply()
                                                        }
                                                    }
                                                }}
                                                placeholder="Write a reply..."
                                                rows={3}
                                                className="input-brutal w-full resize-none"
                                            />

                                            {replyError && (
                                                <p className="mt-2 border-[3px] border-black bg-brutal-red p-2 font-mono text-xs font-bold uppercase text-white">
                                                    {replyError}
                                                </p>
                                            )}

                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-black/50">
                                                    Enter to send /// Shift + Enter for new line
                                                </p>

                                                <motion.button
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={sendReply}
                                                    disabled={sendingReply || !reply.trim()}
                                                    className="btn-brutal flex items-center gap-2 bg-black px-5 py-2.5 text-xs text-white disabled:opacity-50"
                                                >
                                                    <Send size={14} strokeWidth={3} />
                                                    {sendingReply ? "Sending..." : "Send"}
                                                </motion.button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <Footer />
            </main>
        </AuthGuard>
    )
}
