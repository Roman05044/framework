import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSharedReposV1, getSharedReposV2 } from '../../services/github.service.js';

describe('Github Service Unit Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should get shared repos v1', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ login: 'user1' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [], // page 2 empty
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ full_name: 'test/repo1' }, { full_name: 'shared/repo2' }],
      });

    const result = await getSharedReposV1('test/repo1', 'token');
    expect(result.targetRepo).toBe('test/repo1');
    expect(result.topSharedRepos).toHaveLength(1);
    expect(result.topSharedRepos[0].name).toBe('shared/repo2');
  });

  it('should get shared repos v2', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ login: 'user1' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [], // page 2 empty
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user0: {
              repositories: {
                nodes: [{ nameWithOwner: 'test/repo1' }, { nameWithOwner: 'shared/repo2' }],
              },
            },
          },
        }),
      });

    const result = await getSharedReposV2('test/repo1', 'token');
    expect(result.targetRepo).toBe('test/repo1');
    expect(result.topSharedRepos).toHaveLength(1);
    expect(result.topSharedRepos[0].name).toBe('shared/repo2');
  });
});
