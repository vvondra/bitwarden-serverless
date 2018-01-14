export function mapCipher(cipher) {
  return {
    Id: cipher.get('uuid'),
    Type: cipher.get('type'),
    RevisionDate: getRevisionDate(cipher),
    FolderId: cipher.get('folderUuid'),
    Favorite: cipher.get('favorite'),
    OrganizationId: cipher.get('organizationUuid'),
    Attachments: cipher.get('attachments'),
    OrganizationUseTotp: false,
    Data: cipher.get('data'),
    Object: 'cipher',
  };
}

export function mapUser(user) {
  return {
    Id: user.get('uuid'),
    Name: null,
    Email: user.get('email'),
    EmailVerified: user.get('emailVerified'),
    Premium: user.get('premium'),
    MasterPasswordHint: user.get('passwordHint'),
    Culture: user.get('culture'),
    TwoFactorEnabled: !!user.get('totpSecret'),
    Key: user.get('key'),
    PrivateKey: null,
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
