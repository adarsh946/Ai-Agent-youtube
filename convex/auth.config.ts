export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_LINK,
      applicationID: "convex",
    },
  ],
};
