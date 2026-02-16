import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Generate custom userId like ME001, ME002, etc.
async function generateCustomUserId() {
  const lastUser = await prisma.user.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true }
  });
  const nextNum = (lastUser?.id || 0) + 1;
  return `ME${String(nextNum).padStart(3, '0')}`;
}

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Invalid credentials");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.password) {
             throw new Error("User not found");
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            throw new Error("Invalid password");
          }

          if (!user.isActive) {
            throw new Error("Account is inactive. Please contact admin.");
          }

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
      return true;
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

      // Ensure we have the latest data from DB
      if (token.email) {
         const dbUser = await prisma.user.findUnique({ 
            where: { email: token.email },
            select: { id: true, userId: true, onboardingCompleted: true, salaryDate: true, role: true, isActive: true }
         });
         if (dbUser) {
            token.odId = dbUser.id; // Int database ID
            token.odUserId = dbUser.userId; // Custom userId ME001
            token.onboardingCompleted = dbUser.onboardingCompleted;
            token.salaryDate = dbUser.salaryDate;
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
         }
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
