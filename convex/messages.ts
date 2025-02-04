// import { mutation } from "./_generated/server";
// import { v } from "convex/values";

// const createMessages = mutation({
//   args: { content: v.string() },
//   handler: async (ctx,args) => {
//     const isAuthenticated = await ctx.auth.getUserIdentity();
//     if(!isAuthenticated){
//         throw new Error("not Authenticated")
//     }

//     const message = ctx.db.insert("messages", {
//         Content: args.content,
//         chatId:
//     })
//   }
// });
