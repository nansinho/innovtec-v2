"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Image from "next/image";
import {
  X,
  MessageSquare,
  Send,
  ArrowLeft,
  Search,
  Users,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  searchUsers,
} from "@/actions/messages";
import type { InternalMessage, Conversation } from "@/lib/types/database";
import type { Profile } from "@/lib/types/database";

interface MessageSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

type PickedProfile = Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">;

function UserAvatar({ user, size = "sm" }: { user: PickedProfile; size?: "sm" | "md" }) {
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  const s = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return user.avatar_url ? (
    <div className={`relative ${s} shrink-0 overflow-hidden rounded-full`}>
      <Image src={user.avatar_url} alt="" fill sizes="40px" className="object-cover" />
    </div>
  ) : (
    <div className={`flex ${s} shrink-0 items-center justify-center rounded-full bg-[var(--navy)]/10 ${textSize} font-medium text-[var(--navy)]`}>
      {initials}
    </div>
  );
}

export default function MessageSidebar({
  isOpen,
  onClose,
  currentUserId,
}: MessageSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<PickedProfile | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PickedProfile[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(() => {
    startTransition(async () => {
      const data = await getConversations();
      setConversations(data);
    });
  }, []);

  useEffect(() => {
    if (isOpen) loadConversations();
  }, [isOpen, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openConversation(user: PickedProfile) {
    setActiveConversation(user);
    setShowSearch(false);
    setSearchQuery("");
    startTransition(async () => {
      const msgs = await getConversationMessages(user.id);
      setMessages(msgs);
      await markConversationAsRead(user.id);
      loadConversations();
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleSend() {
    if (!newMessage.trim() || !activeConversation) return;
    const content = newMessage;
    setNewMessage("");
    startTransition(async () => {
      await sendMessage(activeConversation.id, content);
      const msgs = await getConversationMessages(activeConversation.id);
      setMessages(msgs);
      loadConversations();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchUsers(searchQuery);
        setSearchResults(results as PickedProfile[]);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed right-0 top-0 z-[201] flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-1)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            {activeConversation ? (
              <button
                onClick={() => setActiveConversation(null)}
                className="rounded-full p-1 text-[var(--text-secondary)] transition-colors hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <MessageSquare className="h-5 w-5 text-[var(--heading)]" />
            )}
            <h2 className="text-base font-semibold text-[var(--heading)]">
              {activeConversation
                ? `${activeConversation.first_name} ${activeConversation.last_name}`
                : "Messages"}
            </h2>
            {!activeConversation && totalUnread > 0 && (
              <span className="rounded-full bg-[var(--yellow)] px-2 py-0.5 text-[10px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!activeConversation && (
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="rounded-full p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-gray-100"
                title="Nouveau message"
              >
                <Users className="h-4.5 w-4.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search bar for new conversation */}
        {showSearch && !activeConversation && (
          <div className="border-b border-[var(--border-1)] px-5 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un collaborateur..."
                className="w-full rounded-full border border-[var(--border-1)] py-2 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)]"
                autoFocus
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-1)]">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => openConversation(user)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                  >
                    <UserAvatar user={user} />
                    <span className="text-sm font-medium text-[var(--heading)]">
                      {user.first_name} {user.last_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {activeConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="mb-3 h-10 w-10 text-[var(--border-1)]" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Aucun message. Commencez la conversation !
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.from_user_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isMine ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3.5 py-2",
                            isMine
                              ? "bg-[var(--yellow)] text-white"
                              : "bg-gray-100 text-[var(--heading)]"
                          )}
                        >
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-[9px]",
                              isMine
                                ? "text-white/70"
                                : "text-[var(--text-muted)]"
                            )}
                          >
                            {formatRelative(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[var(--border-1)] px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message..."
                  className="flex-1 rounded-full border border-[var(--border-1)] px-4 py-2 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)]"
                  disabled={isPending}
                />
                <button
                  onClick={handleSend}
                  disabled={isPending || !newMessage.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--yellow)] text-white transition-all hover:bg-[var(--yellow-hover)] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Conversation list */
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-[var(--border-1)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  Aucune conversation
                </p>
                <button
                  onClick={() => setShowSearch(true)}
                  className="mt-3 rounded-full bg-[var(--yellow)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
                >
                  Nouveau message
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-1)]">
                {conversations.map((conv) => (
                  <button
                    key={conv.user.id}
                    onClick={() => openConversation(conv.user)}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50/80",
                      conv.unreadCount > 0 && "bg-[var(--yellow-surface)]"
                    )}
                  >
                    <UserAvatar user={conv.user} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-[13px] truncate",
                            conv.unreadCount > 0
                              ? "font-semibold text-[var(--heading)]"
                              : "font-medium text-[var(--heading)]"
                          )}
                        >
                          {conv.user.first_name} {conv.user.last_name}
                        </p>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                          {formatRelative(conv.lastMessage.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11.5px] text-[var(--text-secondary)]">
                          {conv.lastMessage.from_user_id === currentUserId
                            ? `Vous : ${conv.lastMessage.content}`
                            : conv.lastMessage.content}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--yellow)] text-[9px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
