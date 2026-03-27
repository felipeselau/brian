import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";

// Middleware auth config - JWT only, no Prisma adapter
// This avoids importing Prisma which doesn't work in Edge runtime
export const {
  handlers,
  auth: middlewareAuth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  providers: [
    // Dummy credentials provider for middleware - actual auth happens in API routes
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // This is only used by the middleware to validate JWT tokens
        // Actual authentication is done in the sign-in API route
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
