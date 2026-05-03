import githubService from '#services/github.service';

export const getSharedReposV1 = async (request, reply) => {
  const { repo } = request.query;
  // eslint-disable-next-line no-process-env
  const token = process.env.GITHUB_TOKEN;

  try {
    const data = await githubService.getSharedReposV1(repo, token);
    return data;
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

  try {
    const data = await githubService.getSharedReposV2(repo, token);
    return data;
  } catch (error) {
    throw reply.internalServerError(error.message);
  }
};

export default {
  getSharedReposV1,
  getSharedReposV2,
};
