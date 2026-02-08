import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

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

        return {
          id: String(user.id), // NextAuth expects string, convert back in callbacks
          odId: user.id, // Original database ID (Int)
          odUserId: user.userId, // Custom userId like ME001
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        if (!profile?.email) {
          throw new Error("No profile");
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!existingUser) {
          // Generate custom userId
          const customUserId = await generateCustomUserId();
          
          // Create new user for Google Sign-in
          await prisma.user.create({
            data: {
              userId: customUserId,
              email: profile.email,
              name: profile.name,
              password: "",
            },
          });
        }
      }
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
      }

      // Ensure we have the latest data from DB
      if (token.email) {
         const dbUser = await prisma.user.findUnique({ 
            where: { email: token.email },
            select: { id: true, userId: true, onboardingCompleted: true, salaryDate: true }
         });
         if (dbUser) {
            token.odId = dbUser.id; // Int database ID
            token.odUserId = dbUser.userId; // Custom userId ME001
            token.onboardingCompleted = dbUser.onboardingCompleted;
            token.salaryDate = dbUser.salaryDate;
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
