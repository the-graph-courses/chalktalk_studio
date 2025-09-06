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

export const GetProject = query({
    args: {
        projectId: v.string(),
    },
    handler: async (ctx, args) => {
        const deck = await ctx.db
            .query('SlideDeckTable')
            .filter(q => q.eq(q.field('projectId'), args.projectId))
            .first();
        return deck ?? null;
    }
})

export const SaveProject = mutation({
    args: {
        projectId: v.string(),
        project: v.any(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('SlideDeckTable')
            .filter(q => q.eq(q.field('projectId'), args.projectId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                project: args.project,
            });
            return existing._id;
        }

        // If no existing project, we can't create one without uid
        throw new Error('Project not found and cannot create without user ID');
    }
})

export const CreateTestProject = mutation({
    args: {
        projectId: v.string(),
        project: v.any(),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // For testing purposes, we'll create a dummy user first
        const testUser = await ctx.db.insert('UserTable', {
            name: 'Test User',
            email: 'test@example.com',
            imageUrl: '',
        });

        const result = await ctx.db.insert('SlideDeckTable', {
            projectId: args.projectId,
            title: args.title || 'Test Project',
            project: args.project,
            uid: testUser,
        });

        return { projectId: args.projectId, deckId: result, userId: testUser };
    }
})

export const DebugProject = query({
    args: {
        projectId: v.string(),
    },
    handler: async (ctx, args) => {
        const deck = await ctx.db
            .query('SlideDeckTable')
            .filter(q => q.eq(q.field('projectId'), args.projectId))
            .first();

        // Return the full project structure for debugging
        return {
            found: !!deck,
            projectId: args.projectId,
            title: deck?.title,
            projectStructure: deck?.project ? JSON.stringify(deck.project, null, 2) : null,
            projectKeys: deck?.project ? Object.keys(deck.project) : null,
        };
    }
})


