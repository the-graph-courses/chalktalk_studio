import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        imageUrl: v.string(),
        email: v.string(),
        subscription: v.optional(v.string()),
    }),


    SlideDeckTable: defineTable({
        projectId: v.string(),
        title: v.optional(v.string()),
        project: v.string(), // Store as JSON string to avoid nesting limits
        uid: v.id('UserTable'),
        lastModified: v.optional(v.number()) // Unix timestamp for last modification
    }),

    ChatTable: defineTable({
        uid: v.id('UserTable'),
        title: v.optional(v.string()),
        messages: v.array(v.any()), // Can store any JSON serializable UIMessage
    }).index('by_uid', ['uid'])
})