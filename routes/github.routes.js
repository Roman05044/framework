import {
  getSharedReposV1,
  getSharedReposV2,
} from '#controllers/github.controller';

export default async function (fastify) {
  fastify.get('/v1/github/shared-repos', getSharedReposV1);
  fastify.get('/v2/github/shared-repos', getSharedReposV2);
}
