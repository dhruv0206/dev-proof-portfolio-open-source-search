import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL is optional if auth server is on same domain
});

export const { signIn, signUp, signOut, useSession } = authClient;
