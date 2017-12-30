import * as utils from './lib/api_utils';
import { loadContextFromHeader } from './lib/bitwarden';
import { mapFolder } from './lib/mappers';
import { Folder } from './lib/models';

export const postHandler = async (event, context, callback) => {
  console.log('Folder create handler triggered', JSON.stringify(event, null, 2));

  if (!event.body) {
    callback(null, utils.validationError('Bad request'));
    return;
  }

  const body = utils.normalizeBody(JSON.parse(event.body));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('Cannot load user from access token: ' + e));
    return;
  }

  if (!body.name) {
    callback(null, utils.validationError('Missing folder name'));
    return;
  }

  try {
    const folder = await Folder.createAsync({
      name: body.name,
      userUuid: user.get('uuid'),
    });

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(mapFolder(folder)),
    });
  } catch (e) {
    callback(null, utils.serverError('Error saving folder', e));
  }
};

export const putHandler = async (event, context, callback) => {
  console.log('Folder edit handler triggered', JSON.stringify(event, null, 2));
  if (!event.body) {
    callback(null, utils.validationError('Bad request'));
    return;
  }

  const body = utils.normalizeBody(JSON.parse(event.body));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('Cannot load user from access token: ' + e));
    return;
  }

  if (!body.name) {
    callback(null, utils.validationError('Missing folder name'));
    return;
  }

  const folderUuid = event.pathParameters.uuid;
  if (!folderUuid) {
    callback(null, utils.validationError('Missing folder UUID'));
  }

  try {
    let folder = await Folder.getAsync(user.get('uuid'), folderUuid);

    if (!folder) {
      callback(null, utils.validationError('Unknown folder'));
      return;
    }

    folder.set({ name: body.name });

    folder = await folder.updateAsync();

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(mapFolder(folder)),
    });
  } catch (e) {
    callback(null, utils.serverError('Error saving folder', e));
  }
};

export const deleteHandler = async (event, context, callback) => {
  console.log('Folder delete handler triggered', JSON.stringify(event, null, 2));

  let user;
  try {
    ({ user } = await loadContextFromHeader(event.headers.Authorization));
  } catch (e) {
    callback(null, utils.validationError('Cannot load user from access token'));
  }

  const folderUuid = event.pathParameters.uuid;
  if (!folderUuid) {
    callback(null, utils.validationError('Missing folder UUID'));
  }

  try {
    await Folder.destroyAsync(user.get('uuid'), folderUuid);

    callback(null, {
      statusCode: 200,
      body: '',
    });
  } catch (e) {
    callback(null, utils.validationError(e.toString()));
  }
};
