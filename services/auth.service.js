import argon2 from 'argon2';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export function createAuthService({ db }) {
  return {
    async register(email, password) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existing.length > 0) {
        throw new Error('Email is already registered');
      }

      const hashedPassword = await argon2.hash(password);

      const [result] = await db.insert(users).values({
        email,
        password: hashedPassword,
      });

      return { id: result.insertId, email };
    },

    async login(email, password) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isValid = await argon2.verify(user.password, password);

      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      return { id: user.id, email: user.email };
    },
  };
}
