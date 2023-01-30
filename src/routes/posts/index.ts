import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

enum ErrorMsg {
  post_not_found = 'Post not found'
};

enum ErrorCode {
  code_400 = 400,
  code_404 = 404
};

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const post = await fastify.db.posts.findOne({key: 'id', equals: request.params.id});
      if (post) {
        return post;
      }
      throw fastify.httpErrors.createError(ErrorCode.code_404, ErrorMsg.post_not_found);
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      return await fastify.db.posts.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const post = await fastify.db.posts.findOne({key: 'id', equals: request.params.id});
      if (post) {
        return await fastify.db.posts.delete(request.params.id);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.post_not_found);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const post = await fastify.db.posts.findOne({key: 'id', equals: request.params.id});
      if (post) {
        return await fastify.db.posts.change(request.params.id, request.body);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.post_not_found);
    }
  );
};

export default plugin;
