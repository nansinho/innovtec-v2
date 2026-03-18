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
  Smile,
  Paperclip,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatRelative } from "@/lib/utils";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  searchUsers,
} from "@/actions/messages";
import { createClient } from "@/lib/supabase/client";
import type { InternalMessage, Conversation } from "@/lib/types/database";
import type { Profile } from "@/lib/types/database";
import EmojiPicker from "./emoji-picker";
import {
  FilePreviewInline,
  FileUploadPreview,
  FileUploadLoading,
  getMessagePreview,
} from "./file-preview";

interface MessageSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

type PickedProfile = Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">;

interface StagedFile {
  file: File;
  url: string;
  name: string;
  type: string;
  size: number;
}

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [stagedFile, setStagedFile] = useState<StagedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeConversationRef = useRef<PickedProfile | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const loadConversations = useCallback(() => {
    startTransition(async () => {
      const data = await getConversations();
      setConversations(data);
    });
  }, []);

  useEffect(() => {
    if (isOpen) loadConversations();
  }, [isOpen, loadConversations]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Supabase Realtime subscription ────────────────────────────────
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`messages-realtime-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_messages",
          filter: `to_user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as InternalMessage;

          // If message is from the active conversation partner, add it to thread
          const active = activeConversationRef.current;
          if (active && newMsg.from_user_id === active.id) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Auto-mark as read
            markConversationAsRead(active.id);
          }

          // Refresh conversation list (for unread counts & previews)
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, currentUserId, loadConversations]);

  // ─── Conversation & message actions ────────────────────────────────

  function openConversation(user: PickedProfile) {
    setActiveConversation(user);
    setShowSearch(false);
    setSearchQuery("");
    setShowEmojiPicker(false);
    setStagedFile(null);
    startTransition(async () => {
      const msgs = await getConversationMessages(user.id);
      setMessages(msgs);
      await markConversationAsRead(user.id);
      loadConversations();
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleSend() {
    if ((!newMessage.trim() && !stagedFile) || !activeConversation) return;

    const content = newMessage;
    const file = stagedFile;
    setNewMessage("");
    setStagedFile(null);
    setShowEmojiPicker(false);

    // Optimistic: add message immediately
    const optimisticMsg: InternalMessage = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from_user_id: currentUserId,
      to_user_id: activeConversation.id,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      ...(file && {
        file_url: file.url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    startTransition(async () => {
      await sendMessage(
        activeConversation.id,
        content,
        file
          ? {
              file_url: file.url,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
            }
          : undefined
      );
      loadConversations();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ─── Emoji ─────────────────────────────────────────────────────────

  function handleEmojiSelect(emoji: string) {
    setNewMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  }

  // ─── File upload ───────────────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected
    e.target.value = "";

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "chat-attachments");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setStagedFile({
        file,
        url: data.url,
        name: data.fileName,
        type: data.fileType,
        size: data.fileSize,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("L'envoi du fichier a échoué. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  }

  // ─── User search (debounced) ───────────────────────────────────────

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
                onClick={() => {
                  setActiveConversation(null);
                  setShowEmojiPicker(false);
                  setStagedFile(null);
                }}
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
                          "flex animate-in fade-in slide-in-from-bottom-1 duration-200",
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
                          {/* File attachment */}
                          {msg.file_url && (
                            <FilePreviewInline message={msg} isMine={isMine} />
                          )}
                          {/* Text content */}
                          {msg.content && (
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
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

            {/* Staged file preview */}
            {isUploading && <FileUploadLoading />}
            {stagedFile && !isUploading && (
              <FileUploadPreview
                stagedFile={stagedFile}
                onRemove={() => setStagedFile(null)}
              />
            )}

            {/* Input area */}
            <div className="relative border-t border-[var(--border-1)] px-4 py-3">
              {/* Emoji picker */}
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}

              <div className="flex items-center gap-1.5">
                {/* Attachment button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-gray-100 hover:text-[var(--heading)] disabled:opacity-50"
                  title="Joindre un fichier"
                >
                  {isUploading ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Paperclip className="h-4.5 w-4.5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                />

                {/* Text input */}
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

                {/* Emoji button */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                    showEmojiPicker
                      ? "bg-[var(--yellow)]/15 text-[var(--yellow)]"
                      : "text-[var(--text-secondary)] hover:bg-gray-100 hover:text-[var(--heading)]"
                  )}
                  title="Emojis"
                >
                  <Smile className="h-4.5 w-4.5" />
                </button>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={isPending || (!newMessage.trim() && !stagedFile)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--yellow)] text-white transition-all hover:bg-[var(--yellow-hover)] disabled:opacity-50"
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
                {conversations.map((conv) => {
                  const previewText = getMessagePreview(
                    conv.lastMessage,
                    conv.lastMessage.from_user_id === currentUserId
                  );
                  return (
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
                          <p className="truncate text-xs text-[var(--text-secondary)]">
                            {previewText}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--yellow)] text-[9px] font-bold text-white">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
