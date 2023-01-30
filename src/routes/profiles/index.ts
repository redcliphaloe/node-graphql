import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

enum ErrorMsg {
  profile_not_found = 'Profile not found',
  profile_already_exist = 'Profile already exist',
  member_type_not_found = 'Member type not found'
};

enum ErrorCode {
  code_400 = 400,
  code_404 = 404
};

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({key: 'id', equals: request.params.id});
      if (profile) {
        return profile;
      }
      throw fastify.httpErrors.createError(ErrorCode.code_404, ErrorMsg.profile_not_found);
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: request.body.memberTypeId});
      if (memberType) {
        const profile = await fastify.db.profiles.findOne({key: 'userId', equals: request.body.userId});
        if (profile) {
          throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.profile_already_exist);
        }
        return await fastify.db.profiles.create(request.body);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.member_type_not_found);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({key: 'id', equals: request.params.id});
      if (profile) {
        return await fastify.db.profiles.delete(request.params.id);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.profile_not_found);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({key: 'id', equals: request.params.id});
      if (profile) {
        return await fastify.db.profiles.change(request.params.id, request.body);
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.profile_not_found);
    }
  );
};

export default plugin;
