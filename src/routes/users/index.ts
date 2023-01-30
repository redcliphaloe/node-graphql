import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

enum ErrorMsg {
  user_not_found = 'User not found',
  user_not_subscribed = 'User not subscribed'
};

enum ErrorCode {
  code_400 = 400,
  code_404 = 404
};

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({key: 'id', equals: request.params.id});
      if (user) {
        return user;
      }
      throw fastify.httpErrors.createError(ErrorCode.code_404, ErrorMsg.user_not_found);
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return await fastify.db.users.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({key: 'id', equals: request.params.id});
      if (user) {
        // remove posts
        const posts = await fastify.db.posts.findMany({key: 'userId', equals: user.id});
        for await (const post of posts) {
          await fastify.db.posts.delete(post.id);
        }
        // unsubscribe
        const users = await fastify.db.users.findMany();
        for await (const usr of users) {
          if (usr.subscribedToUserIds.find(item => item === user.id)) {
            usr.subscribedToUserIds = usr.subscribedToUserIds.filter(item => item !== user.id)
            await fastify.db.users.change(user.id, usr);
          }
        }
        // remove profile
        const profile = await fastify.db.profiles.findOne({key: 'userId', equals: user.id});
        if (profile) {
          await fastify.db.profiles.delete(profile.id);
        }
        // remove user
        return await fastify.db.users.delete(user.id);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.user_not_found);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const srcUser = await fastify.db.users.findOne({key: 'id', equals: request.body.userId});
      if (srcUser) {
        srcUser.subscribedToUserIds.push(request.params.id);
        return await fastify.db.users.change(request.body.userId, srcUser);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.user_not_found);
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const srcUser = await fastify.db.users.findOne({key: 'id', equals: request.body.userId});
      if (srcUser) {
        if (srcUser.subscribedToUserIds.find(item => item === request.params.id)) {
          srcUser.subscribedToUserIds = srcUser.subscribedToUserIds.filter(item => item !== request.params.id)
          return await fastify.db.users.change(request.body.userId, srcUser);
        }
        throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.user_not_subscribed);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.user_not_found);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({key: 'id', equals: request.params.id});
      if (user) {
        return await fastify.db.users.change(request.params.id, request.body);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.user_not_found);
    }
  );
};

export default plugin;
