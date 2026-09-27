import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        imageUrl: v.string(),
        email: v.string(),
        clerkId: v.string(), // Add this field
        subscription: v.optional(v.string()),
    }),


    SlideDeckTable: defineTable({
        projectId: v.string(),
        title: v.optional(v.string()),
        project: v.string(), // Store as JSON string to avoid nesting limits
        uid: v.id('UserTable'),
        lastModified: v.optional(v.number()) // Unix timestamp for last modification
    }).index("by_uid", ["uid"]),

    TTSAudioTable: defineTable({
        projectId: v.string(),
        slideIndex: v.number(),
        elementIndex: v.number(), // order within slide
        ttsText: v.string(),
        audioFileId: v.id('_storage'), // Reference to Convex file storage
        duration: v.number(), // Audio duration in milliseconds
        createdAt: v.number(),
        ttsHash: v.optional(v.string()),
        voiceId: v.optional(v.string()),
    }).index('by_project', ['projectId']).index('by_project_slide', ['projectId', 'slideIndex']),

    // Kept so a push does not delete decks stored before SlideDeckTable.
    ProjectTable: defineTable({
        projectId: v.string(),
        title: v.optional(v.string()),
        slides: v.string(),
        uid: v.id('UserTable'),
        lastModified: v.optional(v.number()),
    }).index('by_uid', ['uid']),

    ProjectHistoryTable: defineTable({
        projectId: v.string(),
        title: v.optional(v.string()),
        slides: v.string(),
        slideCount: v.number(),
        label: v.optional(v.string()),
        uid: v.id('UserTable'),
        createdAt: v.number(),
    }).index('by_project_created_at', ['projectId', 'createdAt'])
        .index('by_uid_created_at', ['uid', 'createdAt']),

})
