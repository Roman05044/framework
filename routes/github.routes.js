import {
  getSharedReposV1,
  getSharedReposV2,
} from '#controllers/github.controller';
import { sharedReposSchema } from '#schemas/github.schema';

export default async function (fastify) {
  fastify.get(
    '/v1/github/shared-repos',
    { schema: sharedReposSchema },
    getSharedReposV1
  );
  fastify.get(
    '/v2/github/shared-repos',
    { schema: sharedReposSchema },
    getSharedReposV2
  );
}
