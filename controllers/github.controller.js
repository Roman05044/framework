export const getSharedReposV1 = async (request, reply) => {
  const { repo } = request.query;
  // eslint-disable-next-line no-process-env
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    let contributors = [];
    let page = 1;
    
    while (contributors.length < 300) {
      const contRes = await fetch(
        `https://api.github.com/repos/${repo}/contributors?per_page=100&page=${page}`,
        { headers }
      );
      if (!contRes.ok) throw new Error(`GitHub API Error: ${contRes.statusText}`);
      const data = await contRes.json();
      if (data.length === 0) break;
      contributors = contributors.concat(data);
      page++;
    }

    const repoCounts = {};

    for (const contributor of contributors) {
      const userReposRes = await fetch(
        `https://api.github.com/users/${contributor.login}/repos?per_page=30&sort=pushed`,
        { headers }
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

export const getSharedReposV2 = async (request, reply) => {
  const { repo } = request.query;
  // eslint-disable-next-line no-process-env
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    let contributors = [];
    let page = 1;
    
    while (contributors.length < 300) {
      const contRes = await fetch(
        `https://api.github.com/repos/${repo}/contributors?per_page=100&page=${page}`,
        { headers }
      );
      if (!contRes.ok) throw new Error(`GitHub API Error: ${contRes.statusText}`);
      const data = await contRes.json();
      if (data.length === 0) break;
      contributors = contributors.concat(data);
      page++;
    }

    const repoCounts = {};

    const chunkSize = 15;
    for (let i = 0; i < contributors.length; i += chunkSize) {
      const chunk = contributors.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (contributor) => {
          const userReposRes = await fetch(
            `https://api.github.com/users/${contributor.login}/repos?per_page=30&sort=pushed`,
            { headers }
          );
          if (userReposRes.ok) {
            const userRepos = await userReposRes.json();
            for (const r of userRepos) {
              if (r.full_name !== repo) {
                repoCounts[r.full_name] = (repoCounts[r.full_name] || 0) + 1;
              }
            }
          }
        })
      );
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
