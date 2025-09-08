import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const SaveDeck = mutation({
    args: {
        projectId: v.string(),
        uid: v.id('UserTable'),
        title: v.optional(v.string()),
        project: v.string(),
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

        if (!deck) return null;

        // Parse the JSON string back to object
        try {
            // Check if it's already an object (shouldn't happen but let's be safe)
            if (typeof deck.project === 'object') {
                return deck;
            }
            // Parse the JSON string
            return {
                ...deck,
                project: JSON.parse(deck.project)
            };
        } catch (error) {
            console.error('Failed to parse project JSON in GetDeck:', error);
            console.error('Project ID:', args.projectId);
            console.error('Raw project type:', typeof deck.project);
            // Return the deck as-is if parsing fails
            return deck;
        }
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

        if (!deck) return null;

        // Parse the JSON string back to object
        try {
            // Check if it's already an object (shouldn't happen but let's be safe)
            if (typeof deck.project === 'object') {
                return deck;
            }
            // Parse the JSON string
            return {
                ...deck,
                project: JSON.parse(deck.project)
            };
        } catch (error) {
            console.error('Failed to parse project JSON:', error);
            console.error('Project ID:', args.projectId);
            console.error('Raw project type:', typeof deck.project);
            console.error('Raw project sample:', deck.project?.substring?.(0, 100));
            // Return the deck as-is if parsing fails
            return deck;
        }
    }
})

export const SaveProject = mutation({
    args: {
        projectId: v.string(),
        project: v.string(),
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
        project: v.string(),
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
        let parsedProject = null;
        try {
            parsedProject = deck?.project ? JSON.parse(deck.project) : null;
        } catch (error) {
            console.error('Failed to parse project JSON in debug:', error);
        }

        return {
            found: !!deck,
            projectId: args.projectId,
            title: deck?.title,
            projectStructure: parsedProject ? JSON.stringify(parsedProject, null, 2) : null,
            projectKeys: parsedProject ? Object.keys(parsedProject) : null,
        };
    }
})


