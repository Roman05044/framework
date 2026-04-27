export const getSharedReposV1 = async (request, reply) => {
  const { repo } = request.query;
  // eslint-disable-next-line no-process-env
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    let contributors = [];
    let page = 1;

    while (true) {
      const contRes = await fetch(
        `https://api.github.com/repos/${repo}/contributors?per_page=100&page=${page}`,
        { headers }
      );
      if (!contRes.ok)
        throw new Error(`GitHub API Error: ${contRes.statusText}`);
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

  if (!token) {
    throw reply.badRequest(
      'GITHUB_TOKEN is required for v2 (GraphQL API needs authentication)'
    );
  }

  const restHeaders = { Authorization: `Bearer ${token}` };
  const graphqlUrl = 'https://api.github.com/graphql';

  try {
    let contributors = [];
    let page = 1;

    while (true) {
      const contRes = await fetch(
        `https://api.github.com/repos/${repo}/contributors?per_page=100&page=${page}`,
        { headers: restHeaders }
      );
      if (!contRes.ok)
        throw new Error(`GitHub API Error: ${contRes.statusText}`);
      const data = await contRes.json();
      if (data.length === 0) break;
      contributors = contributors.concat(data);
      page++;
    }

    const repoCounts = {};

    const batchSize = 20;

    for (let i = 0; i < contributors.length; i += batchSize) {
      const batch = contributors.slice(i, i + batchSize);

      // GraphQL запит з aliases для кожного юзера в батчі
      const queryParts = batch.map((contributor, index) => {
        const alias = `user${index}`;
        const login = contributor.login.replace(/[^a-zA-Z0-9_-]/g, '');
        return `${alias}: user(login: "${login}") {
          repositories(first: 30, orderBy: {field: PUSHED_AT, direction: DESC}, ownerAffiliations: OWNER) {
            nodes {
              nameWithOwner
            }
          }
        }`;
      });

      const query = `query { ${queryParts.join('\n')} }`;

      const graphqlRes = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!graphqlRes.ok) {
        throw new Error(`GraphQL API Error: ${graphqlRes.statusText}`);
      }

      const graphqlData = await graphqlRes.json();

      if (graphqlData.errors) {
        request.log.warn(
          { errors: graphqlData.errors },
          'GraphQL partial errors'
        );
      }

      if (graphqlData.data) {
        for (const key of Object.keys(graphqlData.data)) {
          const userData = graphqlData.data[key];
          if (userData && userData.repositories && userData.repositories.nodes) {
            for (const r of userData.repositories.nodes) {
              if (r.nameWithOwner !== repo) {
                repoCounts[r.nameWithOwner] =
                  (repoCounts[r.nameWithOwner] || 0) + 1;
              }
            }
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
