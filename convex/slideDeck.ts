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
            // Server-side check to prevent saving if the project is unchanged
            if (existing.project === args.project && existing.title === args.title) {
                return existing._id;
            }
            await ctx.db.patch(existing._id, {
                title: args.title,
                project: args.project,
                lastModified: Date.now(),
            });
            return existing._id;
        }

        const result = await ctx.db.insert('SlideDeckTable', {
            projectId: args.projectId,
            title: args.title,
            project: args.project,
            uid: args.uid,
            lastModified: Date.now(),
        });
        return result;
    }
})

export const GetDeckMeta = query({
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

        // Return only metadata, excluding the large 'project' field
        const { project, ...meta } = deck;
        return meta;
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
        // Return only metadata, excluding the large 'project' field
        return decks.map(d => ({
            _id: d._id,
            projectId: d.projectId,
            title: d.title,
            lastModified: d.lastModified,
            _creationTime: d._creationTime,
        })).sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
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
                lastModified: Date.now(),
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
            clerkId: 'test_user_clerk_id',
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

export const DeleteDeck = mutation({
    args: {
        deckId: v.id('SlideDeckTable'),
        uid: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        // Verify the deck belongs to the user before deleting
        const deck = await ctx.db.get(args.deckId);
        if (!deck || deck.uid !== args.uid) {
            throw new Error('Deck not found or unauthorized');
        }
        await ctx.db.delete(args.deckId);
        return { success: true };
    }
})

export const RenameDeck = mutation({
    args: {
        deckId: v.id('SlideDeckTable'),
        uid: v.id('UserTable'),
        newTitle: v.string(),
    },
    handler: async (ctx, args) => {
        // Verify the deck belongs to the user before renaming
        const deck = await ctx.db.get(args.deckId);
        if (!deck || deck.uid !== args.uid) {
            throw new Error('Deck not found or unauthorized');
        }
        await ctx.db.patch(args.deckId, {
            title: args.newTitle,
            lastModified: Date.now(),
        });
        return { success: true };
    }
})

export const DuplicateDeck = mutation({
    args: {
        deckId: v.id('SlideDeckTable'),
        uid: v.id('UserTable'),
        newTitle: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Get the original deck
        const originalDeck = await ctx.db.get(args.deckId);
        if (!originalDeck || originalDeck.uid !== args.uid) {
            throw new Error('Deck not found or unauthorized');
        }

        // Generate a new project ID for the duplicate
        const newProjectId = `project_${Math.random().toString(36).slice(2)}_${Date.now()}`;

        // Create the duplicate
        const duplicateId = await ctx.db.insert('SlideDeckTable', {
            projectId: newProjectId,
            title: args.newTitle || `${originalDeck.title || 'Untitled'} (Copy)`,
            project: originalDeck.project,
            uid: args.uid,
            lastModified: Date.now(),
        });

        return {
            success: true,
            newDeckId: duplicateId,
            newProjectId,
            title: args.newTitle || `${originalDeck.title || 'Untitled'} (Copy)`
        };
    }
})

export const BulkDeleteDecks = mutation({
    args: {
        deckIds: v.array(v.id('SlideDeckTable')),
        uid: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        let deletedCount = 0;
        const errors: string[] = [];

        for (const deckId of args.deckIds) {
            try {
                // Verify the deck belongs to the user before deleting
                const deck = await ctx.db.get(deckId);
                if (!deck) {
                    errors.push(`Deck ${deckId} not found`);
                    continue;
                }
                if (deck.uid !== args.uid) {
                    errors.push(`Unauthorized to delete deck ${deckId}`);
                    continue;
                }
                await ctx.db.delete(deckId);
                deletedCount++;
            } catch (error) {
                errors.push(`Failed to delete deck ${deckId}: ${error}`);
            }
        }

        return {
            success: true,
            deletedCount,
            totalRequested: args.deckIds.length,
            errors
        };
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


