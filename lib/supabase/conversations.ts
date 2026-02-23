import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Message } from "./types";
import { encrypt, tryDecrypt, isEncryptionEnabled } from "@/lib/crypto/encryption";

// Use generic client to avoid strict Database Insert type issues
// (our types.ts Insert definitions resolve to `never` with @supabase/ssr)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

/**
 * Get or create a conversation for a user + coach pair.
 * If an active (non-archived) chat conversation exists, returns it.
 * Otherwise creates a new one.
 */
export async function getOrCreateConversation(
  supabase: Client,
  userId: string,
  coachId: string,
  type: Conversation["conversation_type"] = "chat"
): Promise<{ conversation: Conversation; isNew: boolean }> {
  // Look for an existing active conversation of this type
  const { data: existing, error: fetchError } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .eq("conversation_type", type)
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .single();

  if (existing && !fetchError) {
    return { conversation: existing as Conversation, isNew: false };
  }

  // Create a new conversation
  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      coach_id: coachId,
      conversation_type: type,
      title: null,
      last_message_at: new Date().toISOString(),
      message_count: 0,
      is_archived: false,
    })
    .select()
    .single();

  if (createError || !created) {
    throw new Error(`Failed to create conversation: ${createError?.message}`);
  }

  return { conversation: created as Conversation, isNew: true };
}

/**
 * Load messages for a conversation, ordered chronologically.
 * Automatically decrypts encrypted messages.
 * Returns the most recent `limit` messages.
 */
export async function loadMessages(
  supabase: Client,
  conversationId: string,
  limit = 100,
  userId?: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to load messages:", error);
    return [];
  }

  const messages = (data || []) as (Message & { encrypted?: boolean })[];

  // Decrypt encrypted messages
  if (userId) {
    return messages.map((m) => ({
      ...m,
      content: m.encrypted ? tryDecrypt(m.content, userId) : m.content,
    }));
  }

  return messages;
}

/**
 * Save a single message to a conversation and update the conversation metadata.
 */
export async function saveMessage(
  supabase: Client,
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<Message | null> {
  const shouldEncrypt = isEncryptionEnabled() && !!userId;
  const storedContent = shouldEncrypt ? encrypt(content, userId!) : content;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role,
      content: storedContent,
      metadata: metadata || null,
      encrypted: shouldEncrypt,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save message:", error);
    return null;
  }

  // Update conversation metadata
  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: await getMessageCount(supabase, conversationId),
    })
    .eq("id", conversationId);

  return data as Message;
}

/**
 * Save both user and assistant messages at once (after streaming completes).
 */
export async function saveMessagePair(
  supabase: Client,
  conversationId: string,
  userContent: string,
  assistantContent: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  const now = new Date().toISOString();
  const shouldEncrypt = isEncryptionEnabled() && !!userId;
  const storedUser = shouldEncrypt ? encrypt(userContent, userId!) : userContent;
  const storedAssistant = shouldEncrypt ? encrypt(assistantContent, userId!) : assistantContent;

  const { error } = await supabase.from("messages").insert([
    {
      conversation_id: conversationId,
      role: "user",
      content: storedUser,
      metadata: null,
      encrypted: shouldEncrypt,
      created_at: now,
    },
    {
      conversation_id: conversationId,
      role: "assistant",
      content: storedAssistant,
      metadata: metadata || null,
      encrypted: shouldEncrypt,
      created_at: new Date(Date.now() + 1).toISOString(), // +1ms to ensure ordering
    },
  ]);

  if (error) {
    console.error("Failed to save message pair:", error);
    return;
  }

  // Update conversation metadata
  const count = await getMessageCount(supabase, conversationId);
  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: count,
    })
    .eq("id", conversationId);
}

/** Get total message count for a conversation */
async function getMessageCount(supabase: Client, conversationId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId);

  if (error) return 0;
  return count || 0;
}

/**
 * List all conversations for a user, optionally filtered by coach.
 */
export async function listConversations(
  supabase: Client,
  userId: string,
  coachId?: string
): Promise<Conversation[]> {
  let query = supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false });

  if (coachId) {
    query = query.eq("coach_id", coachId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to list conversations:", error);
    return [];
  }

  return (data || []) as Conversation[];
}
