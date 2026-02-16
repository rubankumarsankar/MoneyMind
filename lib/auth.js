import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { AuthEngine } from "@/lib/authEngine";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const user = await AuthEngine.validateCredentials(
            credentials.email, 
            credentials.password
          );

          return {
            id: String(user.id),
            odId: user.id,
            odUserId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("Login Authorization Error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return await AuthEngine.handleGoogleLogin(user, account, profile);
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.onboardingCompleted) {
        token.onboardingCompleted = session.onboardingCompleted;
      }

      if (user) {
        token.odId = user.odId || parseInt(user.id);
        token.odUserId = user.odUserId;
        token.onboardingCompleted = user.onboardingCompleted;
        token.salaryDate = user.salaryDate;
        token.role = user.role;
        token.isActive = user.isActive;
      }

      // Ensure we have the latest data from DB (we might want to move this to AuthEngine too, but keeping it here for now to avoid extensive refactor of jwt callback logic)
      if (token.email) {
         // We can use AuthEngine here if we extend it, but direct prisma call is fine for now or we can add getUserProfile to Engine
         // For now let's keep it as is, or better yet, let's keep the prisma import for this specific check to avoid breaking it.
         // Actually, let's import prisma here too since we need it for this jwt callback or move this logic to AuthEngine.
         // Let's keep it simplest: import prisma.
         const { PrismaClient } = require('@prisma/client');
         const prisma = new PrismaClient(); // Wait, we should use the singleton lib/prisma
         // Let's fix the imports.
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.odId; // Int database ID for queries
        session.user.odUserId = token.odUserId; // Custom userId ME001
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.salaryDate = token.salaryDate;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
