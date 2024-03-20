import { LiquidityPosition } from '../../generated/schema';
import { ZERO_BD } from '../utils/constants.template';
import { getLiquidityPositionId } from '../utils/helper';
import { getUser } from './user';

export function getLiquidityPosition(user: string, pair: string): LiquidityPosition {
  let userEntity = getUser(user);
  let positionId = getLiquidityPositionId(user, pair);
  let position = LiquidityPosition.load(positionId);
  if (!position) {
    position = new LiquidityPosition(positionId);
    position.user = userEntity.id;
    position.pair = pair;
    position.lpTokenBalance = ZERO_BD;

    position.save();
  }

  return position;
}
