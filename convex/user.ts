import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateNewUser = mutation({
    args: {
        name: v.string(),
        imageUrl: v.string(),
        email: v.string(),
        clerkId: v.string(), // Add this
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error("Not authenticated");
        }

        // Trust the Clerk subject from the Convex token, not the client argument.
        const clerkId = identity.subject;
        const user = await ctx.db.query('UserTable')
            .filter((q) => q.eq(q.field('clerkId'), clerkId))
            .collect();

        if (user?.length == 0) {
            const userData = {
                name: identity.name || args.name,
                email: identity.email || args.email,
                imageUrl: identity.pictureUrl || args.imageUrl,
                clerkId,
            }
            const result = await ctx.db.insert('UserTable', userData)
            return {
                _id: result,
                ...userData
            }
        }
        return user[0]
    }
})


export const getUserByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        // You'll need to store Clerk ID in your UserTable
        // Update your CreateNewUser mutation to also store clerkId
        const user = await ctx.db.query('UserTable')
            .filter((q) => q.eq(q.field('clerkId'), args.clerkId))
            .unique();
        return user;
    },
});