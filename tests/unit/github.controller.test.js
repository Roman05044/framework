import { describe, it, expect, vi } from 'vitest';
import githubController from '../../controllers/github.controller.js';
import githubService from '../../services/github.service.js';

vi.mock('../../services/github.service.js');

describe('Github Controller Unit Tests', () => {
  it('should get shared repos v1', async () => {
    const req = { query: { repo: 'test/repo' } };
    githubService.getSharedReposV1.mockResolvedValue({ targetRepo: 'test/repo' });
    const res = await githubController.getSharedReposV1(req, {});
    expect(res.targetRepo).toBe('test/repo');
  });

  it('should get shared repos v2', async () => {
    process.env.GITHUB_TOKEN = 'test_token';
    const req = { query: { repo: 'test/repo' } };
    githubService.getSharedReposV2.mockResolvedValue({ targetRepo: 'test/repo' });
    const res = await githubController.getSharedReposV2(req, {});
    expect(res.targetRepo).toBe('test/repo');
  });

  it('v2 should throw if no token', async () => {
    delete process.env.GITHUB_TOKEN;
    const req = { query: { repo: 'test/repo' } };
    const reply = { badRequest: vi.fn().mockReturnValue(new Error()) };
    await expect(githubController.getSharedReposV2(req, reply)).rejects.toThrow();
  });
});
