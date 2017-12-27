import bufferEq from 'buffer-equal-constant-time';

export class User {
  construct(props) {
    this.props = props;
  }

  matchesPasswordHash(hash) {
    return this.props.passwordHash && bufferEq(Buffer.from(hash, this.props.passwordHash));
  }
}
