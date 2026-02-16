import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Auth Engine v3 - Centralized Authentication Logic
 * @module AuthEngine
 */

/**
 * Validate credentials for email/password login
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} User object or throws error
 */
async function validateCredentials(email, password) {
  if (!email || !password) {
    throw new Error("Invalid credentials");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
     throw new Error("User not found");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new Error("Invalid password");
  }

  if (!user.isActive) {
    throw new Error("Account is inactive. Please contact admin.");
  }

  return user;
}

/**
 * Handle Google Login (Sign In or Sign Up)
 * @param {object} user - User object from Google provider
 * @param {object} account - Account object from Google provider
 * @param {object} profile - Profile object from Google provider
 * @returns {Promise<boolean>} True if allowed, False if error
 */
async function handleGoogleLogin(user, account, profile) {
  if (account.provider !== "google") return true;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existingUser) {
      // Get next custom User ID
      const lastUser = await prisma.user.findFirst({
        orderBy: { id: 'desc' },
      });
      let nextIdNumber = 1;
      if (lastUser && lastUser.userId.startsWith('ME')) {
        const currentNum = parseInt(lastUser.userId.replace('ME', ''));
        if (!isNaN(currentNum)) nextIdNumber = currentNum + 1;
      }
      const newUserId = `ME${String(nextIdNumber).padStart(3, '0')}`;

      // Create new user
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          userId: newUserId,
          image: user.image,
          password: null, // No password for OAuth users
          isActive: true,
          role: 'USER',
        },
      });
    }
    return true;
  } catch (error) {
    console.error("AuthEngine: Error creating user from Google:", error);
    return false;
  }
}

export const AuthEngine = {
  validateCredentials,
  handleGoogleLogin,
};
