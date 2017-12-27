import dynogels from 'dynogels-promisified';
import Joi from 'joi';

const devicesTableName = process.env.DEVICES_TABLE;
const usersTableName = process.env.USERS_TABLE;

dynogels.log = console;

export const Device = dynogels.define('Device', {
  hashKey: 'uuid',
  timestamps: true,
  tableName: devicesTableName,

  schema: {
    uuid: dynogels.types.uuid(),
    userUuid: Joi.string().required(),
    name: Joi.string(),
    type: Joi.number(),
    pushToken: Joi.string(),
    accessToken: Joi.string(),
    refreshToken: Joi.string(),
    tokenExpiresAt: Joi.date().timestamp(),
  },
});


export const User = dynogels.define('User', {
  hashKey: 'uuid',
  timestamps: true,
  tableName: usersTableName,

  schema: {
    uuid: dynogels.types.uuid(),
    email: Joi.string().email().required(),
    emailVerified: Joi.boolean(),
    premium: Joi.boolean(),
    name: Joi.string(),
    passwordHash: Joi.string().required(),
    passwordHint: Joi.string(),
    key: Joi.string(),
    privateKey: Joi.binary(),
    publicKey: Joi.binary(),
    totpSecret: Joi.string(),
    securityStamp: Joi.string(),
    culture: Joi.string(),
  },
});
