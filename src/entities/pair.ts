import { Pair } from '../../generated/schema';
import { NATIVE, ZERO_BD, ZERO_BI } from '../utils/constants.template';
import { BigInt } from '@graphprotocol/graph-ts';

export function getPair(address: string): Pair {
  let pair = Pair.load(address);

  if (!pair) {
    pair = new Pair(address) as Pair;
    pair.isStable = false;
    pair.token0 = NATIVE;
    pair.token1 = NATIVE;
    pair.vault0 = NATIVE;
    pair.vault1 = NATIVE;

    pair.reserve0 = ZERO_BD;
    pair.reserve1 = ZERO_BD;
    pair.totalSupply = ZERO_BD;
    pair.token0Fee = BigInt.fromI32(300);
    pair.token1Fee = BigInt.fromI32(300);
    pair.token0FeePercent = ZERO_BD;
    pair.token1FeePercent = ZERO_BD;

    pair.volumeToken0 = ZERO_BD;
    pair.volumeToken1 = ZERO_BD;

    pair.createdAtTimestamp = ZERO_BI;
    pair.createdAtBlockNumber = ZERO_BI;
  }

  return pair;
}
