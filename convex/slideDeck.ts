import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const SaveDeck = mutation({
    args: {
        projectId: v.string(),
        uid: v.id('UserTable'),
        title: v.optional(v.string()),
        project: v.any(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('SlideDeckTable')
            .filter(q => q.eq(q.field('projectId'), args.projectId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                title: args.title,
                project: args.project,
            });
            return existing._id;
        }

        const result = await ctx.db.insert('SlideDeckTable', {
            projectId: args.projectId,
            title: args.title,
            project: args.project,
            uid: args.uid,
        });
        return result;
    }
})

export const GetDeck = query({
    args: {
        projectId: v.string(),
        uid: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const deck = await ctx.db
            .query('SlideDeckTable')
            .filter(q => q.and(
                q.eq(q.field('projectId'), args.projectId),
                q.eq(q.field('uid'), args.uid),
            ))
            .first();
        return deck ?? null;
    }
})

export const ListDecksByUser = query({
    args: {
        uid: v.optional(v.id('UserTable')),
    },
    handler: async (ctx, args) => {
        if (!args.uid) return [];
        const decks = await ctx.db
            .query('SlideDeckTable')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .collect();
        return decks.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
    }
})


