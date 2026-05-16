import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthService } from '../../services/auth.service.js';
import argon2 from 'argon2';

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('AuthService Unit Tests', () => {
  let mockDb;
  let service;
  let mockSelect;
  let mockFrom;
  let mockWhere;
  let mockInsert;
  let mockValues;

  beforeEach(() => {
    mockWhere = vi.fn();
    mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    mockValues = vi.fn();
    mockInsert = vi.fn().mockReturnValue({ values: mockValues });

    mockDb = {
      select: mockSelect,
      insert: mockInsert,
    };

    service = createAuthService({ db: mockDb });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockWhere.mockResolvedValue([]); // No existing user
      argon2.hash.mockResolvedValue('hashed_password');
      mockValues.mockResolvedValue([{ insertId: 1 }]);

      const result = await service.register('test@example.com', 'password123');

      expect(result).toEqual({ id: 1, email: 'test@example.com' });
      expect(argon2.hash).toHaveBeenCalledWith('password123');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw error if email is already registered', async () => {
      mockWhere.mockResolvedValue([{ id: 1, email: 'test@example.com' }]); // User exists

      await expect(service.register('test@example.com', 'password123')).rejects.toThrow('Email is already registered');
      expect(argon2.hash).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully with correct credentials', async () => {
      mockWhere.mockResolvedValue([{ id: 1, email: 'test@example.com', password: 'hashed_password' }]);
      argon2.verify.mockResolvedValue(true);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toEqual({ id: 1, email: 'test@example.com' });
      expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
    });

    it('should throw error if user not found', async () => {
      mockWhere.mockResolvedValue([]); // User not found

      await expect(service.login('test@example.com', 'password123')).rejects.toThrow('Invalid email or password');
      expect(argon2.verify).not.toHaveBeenCalled();
    });

    it('should throw error if password is wrong', async () => {
      mockWhere.mockResolvedValue([{ id: 1, email: 'test@example.com', password: 'hashed_password' }]);
      argon2.verify.mockResolvedValue(false); // Wrong password

      await expect(service.login('test@example.com', 'wrong_password')).rejects.toThrow('Invalid email or password');
    });
  });
});
