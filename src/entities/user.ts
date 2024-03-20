// Schema:
import { User } from '../../generated/schema';
import { ZERO_BD } from '../utils/constants.template';

// Constants/Helper:
import { setSyncingIndex } from '../utils/helper';

export function getUser(address: string): User {
  let user = User.load(address);

  if (!user) {
    user = new User(address);
    user.totalSwappedVolumeUSD = ZERO_BD;
    setSyncingIndex('users', user);
    user.save();
  }

  return user;
}
