import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        imageUrl: v.string(),
        email: v.string(),
        subscription: v.optional(v.string()),
    }),

    TripDetailTable: defineTable({
        tripId: v.string(),
        tripDetail: v.any(),
        uid: v.id('UserTable')
    }),

    SlideDeckTable: defineTable({
        projectId: v.string(),
        title: v.optional(v.string()),
        project: v.any(),
        uid: v.id('UserTable')
    })
})