export const getSharedReposV1 = async (request, reply) => {
  const { repo } = request.query;
  if (!repo) throw reply.badRequest('Query parameter "repo" is required');

  try {
    const contRes = await fetch(
      `https://api.github.com/repos/${repo}/contributors?per_page=10`
    );
    if (!contRes.ok) throw new Error('GitHub API Error');
    const contributors = await contRes.json();

    const repoCounts = {};

    for (const contributor of contributors) {
      const userReposRes = await fetch(
        `https://api.github.com/users/${contributor.login}/repos?per_page=30`
      );
      if (userReposRes.ok) {
        const userRepos = await userReposRes.json();
        for (const r of userRepos) {
          if (r.full_name !== repo) {
            repoCounts[r.full_name] = (repoCounts[r.full_name] || 0) + 1;
          }
        }
      }
    }

    const topShared = Object.entries(repoCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sharedCount]) => ({ name, sharedCount }));

    return { targetRepo: repo, topSharedRepos: topShared };
  } catch (error) {
    throw reply.internalServerError(error.message);
  }
};

export const getSharedReposV2 = async () => {
  return {
    message:
      'V2 implementation would use GraphQL to batch requests and avoid multiple REST calls.',
    status: 'In Development',
  };
};
