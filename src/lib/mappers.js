export function mapCipher(cipher) {
  // dynogels sets updated at only after update
  const date = cipher.get('updatedAt') || cipher.get('createdAt');

  return {
    Id: cipher.get('uuid'),
    Type: cipher.get('type'),
    RevisionDate: date.replace('Z', '.000000Z'), // Ugly, but hey
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
    TwoFactorEnabled: false,
    Key: user.get('key'),
    PrivateKey: null,
    SecurityStamp: user.get('securityStamp'),
    Organizations: [],
    Object: 'profile',
  };
}
