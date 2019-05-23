import dynogels from 'dynogels-promisified';
import Joi from '@hapi/joi';

const devicesTableName = process.env.DEVICES_TABLE;
const usersTableName = process.env.USERS_TABLE;
const cipherTableName = process.env.CIPHERS_TABLE;
const folderTableName = process.env.FOLDERS_TABLE;

// Bind internal dynogels logger to console, it supports warn/info/error as needed
dynogels.log = console;

// The migration script runs updates on the models depending on each row's version
// This is the latest version available for each model, new entries have this version
export const CIPHER_MODEL_VERSION = 1;
export const USER_MODEL_VERSION = 2;

export const Device = dynogels.define('Device', {
  hashKey: 'uuid',
  timestamps: true,
  tableName: devicesTableName,

  schema: {
    uuid: dynogels.types.uuid(),
    userUuid: Joi.string().required(),
    name: Joi.string().allow(null),
    type: Joi.number(),
    pushToken: Joi.string().allow(null),
    refreshToken: Joi.string().allow(null),
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
    name: Joi.string().allow(null),
    passwordHash: Joi.string().required(),
    passwordHint: Joi.string().allow(null),
    key: Joi.string(),
    jwtSecret: Joi.string().required(),
    privateKey: Joi.binary(),
    publicKey: Joi.binary(),
    totpSecret: Joi.string().allow(null),
    totpSecretTemp: Joi.string().allow(null),
    securityStamp: dynogels.types.uuid(),
    culture: Joi.string(),
    kdfIterations: Joi.number().min(5000).max(1e6),
    version: Joi.number().allow(null),
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
    folderUuid: Joi.string().allow(null),
    organizationUuid: Joi.string().allow(null),
    type: Joi.number(),
    version: Joi.number().allow(null),
    data: Joi.object().allow(null),
    favorite: Joi.boolean(),
    attachments: Joi.any().allow(null),
    name: Joi.string().allow(null),
    notes: Joi.string().allow(null),
    fields: Joi.any().allow(null),
    login: Joi.object().allow(null),
    securenote: Joi.object().allow(null),
    identity: Joi.object().allow(null),
    card: Joi.object().allow(null),
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
