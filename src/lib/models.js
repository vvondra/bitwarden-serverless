import dynogels from 'dynogels-promisified';
import Joi from 'joi';

const devicesTableName = process.env.DEVICES_TABLE;
const usersTableName = process.env.USERS_TABLE;
const cipherTableName = process.env.CIPHERS_TABLE;
const folderTableName = process.env.FOLDERS_TABLE;

// Bind internal dynogels logger to console, it supports warn/info/error as needed
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
    refreshToken: Joi.string(),
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
    securityStamp: dynogels.types.uuid(),
    culture: Joi.string(),
  },
});

export const Cipher = dynogels.define('Cipher', {
  hashKey: 'userUuid',
  rangeKey: 'uuid',
  timestamps: true,
  tableName: cipherTableName,

  schema: {
    userUuid: Joi.string().required(),
    uuid: dynogels.types.uuid(), // Auto-generated
    folderUuid: Joi.string(),
    organizationUuid: Joi.string(),
    type: Joi.number(),
    data: Joi.object(),
    favorite: Joi.boolean(),
    attachments: Joi.binary(),
  },
});

export const Folder = dynogels.define('Folder', {
  hashKey: 'userUuid',
  rangeKey: 'uuid',
  timestamps: true,
  tableName: folderTableName,

  schema: {
    userUuid: Joi.string().required(),
    uuid: dynogels.types.uuid(), // Auto-generated
    name: Joi.string().required(),
  },
});
