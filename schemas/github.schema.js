export const sharedReposSchema = {
  description:
    'Returns 5 repositories that share the most contributors with the target repository',
  tags: ['GitHub'],
  querystring: {
    type: 'object',
    required: ['repo'],
    properties: {
      repo: {
        type: 'string',
        minLength: 1,
        description:
          'Target repository in format owner/repo (e.g., fastify/fastify)',
      },
    },
  },
  response: {
    200: {
      description: 'Successful response',
      type: 'object',
      properties: {
        targetRepo: { type: 'string' },
        topSharedRepos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sharedCount: { type: 'integer' },
            },
          },
        },
      },
    },
  },
};
