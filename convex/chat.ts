import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Helper function to get user by email
export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db.query('UserTable')
            .filter((q) => q.eq(q.field('email'), args.email))
            .unique();
        return user;
    },
});

// Get chat history for a user
export const getChatHistory = query({
    args: { uid: v.id('UserTable') },
    handler: async (ctx, args) => {
        const chats = await ctx.db.query('ChatTable')
            .filter((q) => q.eq(q.field('uid'), args.uid))
            .order('desc')
            .collect();

        return chats.map(chat => ({
            _id: chat._id,
            title: chat.title,
            _creationTime: chat._creationTime,
            messageCount: chat.messages?.length || 0,
            lastMessage: chat.messages?.length > 0
                ? chat.messages[chat.messages.length - 1]
                : null
        }));
    },
});

// Create a new chat session for a user
export const createChat = mutation({
    args: {
        uid: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const chatId = await ctx.db.insert("ChatTable", {
            uid: args.uid,
            messages: [],
            title: "New Chat"
        });

        return chatId;
    },
});


// Load messages for a specific chat
export const loadChat = query({
    args: {
        chatId: v.id("ChatTable"),
        uid: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.uid !== args.uid) {
            throw new Error("User not authorized to view this chat");
        }

        return chat.messages;
    },
});

// Save messages to a chat
export const saveChat = mutation({
    args: {
        chatId: v.id("ChatTable"),
        uid: v.id('UserTable'),
        messages: v.array(v.any()), // Assuming messages are in UIMessage format
    },
    handler: async (ctx, args) => {
        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.uid !== args.uid) {
            throw new Error("User not authorized to update this chat");
        }

        // Update the chat with the new messages
        await ctx.db.patch(args.chatId, { messages: args.messages });

        // Update title from the first user message if it's a new chat
        if (chat.title === "New Chat" && args.messages.length > 0) {
            const firstUserMessage = args.messages.find(m => m.role === 'user');
            if (firstUserMessage && firstUserMessage.parts && firstUserMessage.parts[0] && firstUserMessage.parts[0].type === 'text') {
                const newTitle = firstUserMessage.parts[0].text.substring(0, 50); // Truncate title
                await ctx.db.patch(args.chatId, { title: newTitle });
            }
        }
    },
});

// Delete a chat
export const deleteChat = mutation({
    args: {
        chatId: v.id("ChatTable"),
        uid: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.uid !== args.uid) {
            throw new Error("User not authorized to delete this chat");
        }

        await ctx.db.delete(args.chatId);
    },
});
