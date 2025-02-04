import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createChats = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const isAuthenticated = await ctx.auth.getUserIdentity();
    if (!isAuthenticated) {
      throw new Error("user not authenticated");
    }

    const chat = ctx.db.insert("chats", {
      title: args.title,
      userId: isAuthenticated.subject,
      createdAt: Date.now(),
    });
    return chat;
  },
});

export const deleteChat = mutation({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    const isAuthenticated = await ctx.auth.getUserIdentity();
    if (!isAuthenticated) {
      throw new Error("user not authenticated");
    }

    const chat = await ctx.db.get(args.id);
    if (!chat || chat.userId !== isAuthenticated.subject) {
      throw new Error("Unauthorised");
    }

    // delete the messeges related to chatid

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chats", (q) => q.eq("chatId", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // delete the chat
    await ctx.db.delete(args.id);
  },
});

export const chatsLists = query({
  handler: async (ctx) => {
    const isAuthenticated = await ctx.auth.getUserIdentity();
    if (!isAuthenticated) {
      throw new Error("user not authenticated");
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", isAuthenticated.subject))
      .order("desc")
      .collect();

    return chats;
  },
});
