import prettyBytes from 'pretty-bytes';
import S3 from 'aws-sdk/clients/s3';
import { Attachment } from './models';

const s3 = new S3();

async function mapAttachment(attachment, cipher) {
  const params = {
    Bucket: process.env.ATTACHMENTS_BUCKET,
    Key: cipher.get('uuid') + '/' + attachment.get('uuid'),
    Expires: 604800, // 1 week
  };
  const url = await new Promise((resolve, reject) =>
    s3.getSignedUrl('getObject', params, (err, signedUrl) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(signedUrl);
    }));
  return {
    Id: attachment.get('uuid'),
    Url: url,
    FileName: attachment.get('filename'),
    Size: attachment.get('size'),
    SizeName: prettyBytes(attachment.get('size')),
    Object: 'attachment',
  };
}

export async function mapCipher(cipher) {
  const attachments = (await Attachment.query(cipher.get('uuid')).execAsync()).Items;
  return {
    Id: cipher.get('uuid'),
    Type: cipher.get('type'),
    RevisionDate: getRevisionDate(cipher),
    FolderId: cipher.get('folderUuid'),
    Favorite: cipher.get('favorite'),
    OrganizationId: cipher.get('organizationUuid'),
    Attachments: await Promise.all(attachments
      .map(attachment => mapAttachment(attachment, cipher))),
    OrganizationUseTotp: false,
    CollectionIds: [],
    Name: cipher.get('name'),
    Notes: cipher.get('notes'),
    Fields: cipher.get('fields'),
    Login: cipher.get('login'),
    Card: cipher.get('card'),
    Identity: cipher.get('identity'),
    SecureNote: cipher.get('securenote'),
    Object: 'cipher',
  };
}

export function mapUser(user) {
  return {
    Id: user.get('uuid'),
    Name: user.get('name'),
    Email: user.get('email'),
    EmailVerified: user.get('emailVerified'),
    Premium: user.get('premium'),
    MasterPasswordHint: user.get('passwordHint'),
    Culture: user.get('culture'),
    TwoFactorEnabled: !!user.get('totpSecret'),
    Key: user.get('key'),
    PrivateKey: (user.get('privateKey') || '').toString('utf8'),
    SecurityStamp: user.get('securityStamp'),
    Organizations: [],
    Object: 'profile',
  };
}

export function mapFolder(folder) {
  return {
    Id: folder.get('uuid'),
    Name: folder.get('name'),
    RevisionDate: getRevisionDate(folder),
    Object: 'folder',
  };
}

export function getRevisionDateAsMillis(object) {
  return (new Date(getRevisionDate(object))).getTime();
}

function getRevisionDate(object) {
  // dynogels sets updated at only after update
  return object.get('updatedAt') || object.get('createdAt');
}
