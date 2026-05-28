"use client";
// ================================================================
// BS16 Hub — Inbox Page
// app/inbox/page.tsx
// ================================================================
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/bs16/AppShell";
import { createClient } from "@/lib/supabase";
import { relativeTime } from "@/lib/utils";
import { MessageCircle, Send, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      await loadConversations(user.id);
      setLoading(false);

      // Check if opened from a listing
      const convId = searchParams.get("conversation");
      if (convId) {
        // Will be handled after conversations load
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*, sender:sender_id(display_name), receiver:receiver_id(display_name)")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!data) return;

    // Group by conversation_id
    const convMap = new Map<string, any>();
    for (const msg of data) {
      if (!convMap.has(msg.conversation_id)) {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const otherName = msg.sender_id === userId ? msg.receiver?.display_name : msg.sender?.display_name;
        convMap.set(msg.conversation_id, {
          id: msg.conversation_id,
          listing_id: msg.listing_id,
          listing_type: msg.listing_type,
          other_user_id: otherId,
          other_user_name: otherName || "Neighbour",
          last_message: msg.content,
          last_time: msg.created_at,
          unread: data.filter(m => m.conversation_id === msg.conversation_id && !m.is_read && m.receiver_id === userId).length,
        });
      }
    }
    setConversations(Array.from(convMap.values()));
  };

  const openConversation = async (conv: any) => {
    setActiveConv(conv);
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*, sender:sender_id(display_name)")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);

    // Mark as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conv.id)
      .eq("receiver_id", user.id);

    await loadConversations(user.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      receiver_id: activeConv.other_user_id,
      listing_id: activeConv.listing_id,
      listing_type: activeConv.listing_type,
      content: newMessage.trim(),
      is_read: false,
    });
    if (error) { toast.error("Failed to send message"); setSending(false); return; }
    setNewMessage("");
    await openConversation(activeConv);
    setSending(false);
  };

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        {!activeConv ? (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Inbox</h1>
            {conversations.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No messages yet</p>
                <p className="text-slate-400 text-sm mt-1">Start a conversation from a market listing or job post</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map(conv => (
                  <button key={conv.id} onClick={() => openConversation(conv)}
                    className="w-full bg-white rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                      {conv.other_user_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">{conv.other_user_name}</p>
                        <span className="text-[10px] text-slate-400">{relativeTime(conv.last_time)}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{conv.last_message}</p>
                      <span className="text-[10px] text-slate-400">{conv.listing_type === "market" ? "📦 Market" : "🔧 Job"}</span>
                    </div>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Chat header */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setActiveConv(null)} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                {activeConv.other_user_name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{activeConv.other_user_name}</p>
                <p className="text-[10px] text-slate-400">{activeConv.listing_type === "market" ? "📦 Market listing" : "🔧 Job post"}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {messages.map(msg => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-emerald-700 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm"}`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-200" : "text-slate-400"}`}>{relativeTime(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-3 border-t border-slate-200">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message…"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 disabled:opacity-50 transition-colors">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
