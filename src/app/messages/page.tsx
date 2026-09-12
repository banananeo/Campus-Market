"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/navbar"
import { supabase } from "@/lib/supabase"

type Message = {
    id: number
    sender_id: string
    receiver_id: string
    listing_id: number
    message: string
    created_at: string

    listings: {
        title: string
    } | null

    sender: {
        name: string
        department: string | null
        year: number | null
    } | null

    receiver: {
        name: string
        department: string | null
        year: number | null
    } | null
}

export default function MessagesPage() {
    const router = useRouter()

    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedListingId, setSelectedListingId] =
        useState<number | null>(null)

    const [reply, setReply] = useState("")
    const [sendingReply, setSendingReply] = useState(false)

    // Get all messages for the current user
    async function fetchMessages() {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

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

        setMessages((data as Message[]) || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchMessages()
    }, [])

    // Send a reply
    async function sendReply() {
        if (!reply.trim() || !selectedListingId) {
            return
        }

        setSendingReply(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            alert("Please log in to send a message.")
            setSendingReply(false)
            return
        }

        const selectedMessage = messages.find(
            (item) => item.listing_id === selectedListingId
        )

        if (!selectedMessage) {
            alert("Conversation not found.")
            setSendingReply(false)
            return
        }

        // Find the other person
        const receiverId =
            selectedMessage.sender_id === user.id
                ? selectedMessage.receiver_id
                : selectedMessage.sender_id

        // Prevent messaging yourself
        if (receiverId === user.id) {
            alert("You cannot message yourself.")
            setSendingReply(false)
            return
        }

        const { error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                receiver_id: receiverId,
                listing_id: selectedListingId,
                message: reply.trim(),
            })

        if (error) {
            console.error("Error sending reply:", error)
            alert("Could not send your reply.")
            setSendingReply(false)
            return
        }

        setReply("")

        await fetchMessages()

        setSendingReply(false)
    }

    // Get messages for selected conversation
    const conversationMessages = messages
        .filter(
            (item) => item.listing_id === selectedListingId
        )
        .sort(
            (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
        )

    // Get the selected conversation
    const selectedConversation = messages.find(
        (item) => item.listing_id === selectedListingId
    )

    return (
        <AuthGuard>
            <div className="min-h-screen bg-[#fafafa]">
                <Navbar />

                <main className="mx-auto max-w-6xl px-6 py-10">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-black">
                            Messages
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Chat with buyers and sellers about listings.
                        </p>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-10 text-center">
                            <p className="text-gray-500">
                                Loading messages...
                            </p>
                        </div>
                    ) : messages.length === 0 ? (

                        /* No messages */
                        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-10 text-center">
                            <h2 className="text-xl font-semibold text-black">
                                No messages yet
                            </h2>

                            <p className="mt-2 text-gray-500">
                                Contact a seller from a listing to start a conversation.
                            </p>

                            <button
                                onClick={() => router.push("/")}
                                className="mt-6 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
                            >
                                Browse Marketplace
                            </button>
                        </div>

                    ) : (

                        /* Messages layout */
                        <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">

                            {/* Conversation list */}
                            <div className="space-y-3">

                                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                    Conversations
                                </h2>

                                {messages.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() =>
                                            setSelectedListingId(item.listing_id)
                                        }
                                        className={`w-full rounded-2xl border bg-white p-5 text-left transition ${selectedListingId === item.listing_id
                                                ? "border-black"
                                                : "border-[#e5e5e5] hover:border-gray-400"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">

                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold text-black">
                                                    {item.listings?.title || "Listing"}
                                                </h3>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    {item.sender?.name || "Student"}
                                                </p>
                                            </div>

                                            <span className="shrink-0 text-xs text-gray-400">
                                                {new Date(
                                                    item.created_at
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>

                                        <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                                            {item.message}
                                        </p>
                                    </button>
                                ))}

                            </div>

                            {/* Chat panel */}
                            <div className="flex min-h-[500px] flex-col rounded-2xl border border-[#e5e5e5] bg-white">

                                {!selectedListingId ? (

                                    /* Nothing selected */
                                    <div className="flex flex-1 items-center justify-center p-10 text-center">
                                        <div>
                                            <div className="mb-4 text-4xl">
                                                💬
                                            </div>

                                            <h2 className="font-semibold text-black">
                                                Select a conversation
                                            </h2>

                                            <p className="mt-2 text-sm text-gray-500">
                                                Choose a conversation from the left to start chatting.
                                            </p>
                                        </div>
                                    </div>

                                ) : (

                                    <>
                                        {/* Chat header */}
                                        <div className="border-b border-[#e5e5e5] p-5">

                                            <h2 className="font-semibold text-black">
                                                {selectedConversation?.listings?.title ||
                                                    "Conversation"}
                                            </h2>

                                            <p className="mt-1 text-sm text-gray-500">
                                                With{" "}
                                                {selectedConversation?.sender?.name ||
                                                    "Student"}
                                            </p>

                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/listing/${selectedListingId}`
                                                    )
                                                }
                                                className="mt-3 text-sm font-medium text-black underline"
                                            >
                                                View Listing
                                            </button>

                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 space-y-3 overflow-y-auto p-5">

                                            {conversationMessages.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`flex ${item.sender_id ===
                                                            selectedConversation?.receiver_id
                                                            ? "justify-start"
                                                            : "justify-end"
                                                        }`}
                                                >
                                                    <div className="max-w-[75%]">

                                                        <div
                                                            className={`rounded-2xl px-4 py-3 ${item.sender_id ===
                                                                    selectedConversation?.receiver_id
                                                                    ? "bg-gray-100 text-gray-800"
                                                                    : "bg-black text-white"
                                                                }`}
                                                        >
                                                            <p className="text-sm">
                                                                {item.message}
                                                            </p>
                                                        </div>

                                                        <p
                                                            className={`mt-1 text-xs text-gray-400 ${item.sender_id ===
                                                                    selectedConversation?.receiver_id
                                                                    ? "text-left"
                                                                    : "text-right"
                                                                }`}
                                                        >
                                                            {new Date(
                                                                item.created_at
                                                            ).toLocaleString()}
                                                        </p>

                                                    </div>
                                                </div>
                                            ))}

                                        </div>

                                        {/* Reply box */}
                                        <div className="border-t border-[#e5e5e5] p-5">

                                            <textarea
                                                value={reply}
                                                onChange={(e) =>
                                                    setReply(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" &&
                                                        !e.shiftKey
                                                    ) {
                                                        e.preventDefault()

                                                        if (
                                                            reply.trim() &&
                                                            !sendingReply
                                                        ) {
                                                            sendReply()
                                                        }
                                                    }
                                                }}
                                                placeholder="Write a reply..."
                                                rows={3}
                                                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                                            />

                                            <div className="mt-3 flex items-center justify-between">

                                                <p className="text-xs text-gray-400">
                                                    Press Enter to send
                                                </p>

                                                <button
                                                    onClick={sendReply}
                                                    disabled={
                                                        sendingReply ||
                                                        !reply.trim()
                                                    }
                                                    className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {sendingReply
                                                        ? "Sending..."
                                                        : "Send Reply"}
                                                </button>

                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AuthGuard>
    )
}