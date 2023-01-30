import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

enum ErrorMsg {
  member_type_not_found = 'Member type not found'
};

enum ErrorCode {
  code_400 = 400,
  code_404 = 404
};

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<MemberTypeEntity[]> {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: request.params.id});
      if (memberType) {
        return memberType;
      }
      throw fastify.httpErrors.createError(ErrorCode.code_404, ErrorMsg.member_type_not_found);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: request.params.id});
      if (memberType) {
        return await fastify.db.memberTypes.change(request.params.id, request.body);;
      }
      throw fastify.httpErrors.createError(ErrorCode.code_400, ErrorMsg.member_type_not_found);
    }
  );
};

export default plugin;
