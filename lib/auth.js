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
      authorization: {
        params: {
          prompt: "consent select_account",
          response_type: "code"
        }
      }
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
        // CredentialsProvider returns object with 'odId' (the DB ID)
        if (user.odId) {
            token.odId = user.odId;
        } 
        // For OAuth (Google), user.id is the Provider ID (long string), NOT our DB ID.
        // We leave token.odId undefined/null here and let the DB lookup below populate it.
        
        token.odUserId = user.odUserId;
        token.onboardingCompleted = user.onboardingCompleted;
        token.salaryDate = user.salaryDate;
        token.role = user.role;
        token.isActive = user.isActive;
      }

      // Ensure we have the latest data from DB
      const emailToFetch = token.email || user?.email;
      if (emailToFetch) {
         const dbUser = await prisma.user.findUnique({ 
            where: { email: emailToFetch },
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
