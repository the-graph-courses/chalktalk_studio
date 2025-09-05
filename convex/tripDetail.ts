import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateTripDetail = mutation({
    args: {
        tripId: v.string(),
        uid: v.id('UserTable'),
        tripDetail: v.any()
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert('TripDetailTable', {
            tripDetail: args.tripDetail,
            tripId: args.tripId,
            uid: args.uid
        });
        return result;
    }
})

export const GetTripsByUser = query({
    args: {
        uid: v.optional(v.id('UserTable')),
    },
    handler: async (ctx, args) => {
        if (!args.uid) return [];
        const trips = await ctx.db
            .query('TripDetailTable')
            .filter((q) => q.eq(q.field('uid'), args.uid))
            .collect();
        return trips.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
    }
})
