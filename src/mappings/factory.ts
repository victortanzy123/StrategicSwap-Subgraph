import { PairCreated } from '../../generated/Factory/StrategicPoolFactory';
import { StrategicSwapFactory, Pair, Token } from '../../generated/schema';
import { StrategicPoolPairERC4626 as StrategicSwapPairTemplate } from '../../generated/templates';

import { BigInt } from '@graphprotocol/graph-ts/index';
import {
  ZERO_BD,
  ZERO_BI,
  FACTORY_ADDRESS,
  DEFAULT_FEE_AMOUNT_BPS,
} from '../utils/constants.template';
import { getDecimals, getName, getSymbol, getType } from '../entities/token';

export function handleNewPair(event: PairCreated): void {
  let factory = StrategicSwapFactory.load(FACTORY_ADDRESS);
  if (factory == null) {
    factory = new StrategicSwapFactory(FACTORY_ADDRESS);
    factory.pairCount = 0;
    factory.totalVolumeUSD = ZERO_BD;
    factory.totalFeeUSD = ZERO_BD;
    factory.totalLiquidityUSD = ZERO_BD;
  }

  factory.pairCount = factory.pairCount + 1;
  factory.save(); // Save factory details for once

  let token0Address = event.params.token0.toHexString();
  let vault0Address = event.params.vault0.toHexString();
  let token1Address = event.params.token1.toHexString();
  let vault1Address = event.params.vault1.toHexString();

  let token0 = Token.load(token0Address);
  let token1 = Token.load(token1Address);

  if (token0 == null) {
    token0 = new Token(token0Address);
    token0.type = getType(token0Address);
    token0.name = getName(token0Address);
    token0.symbol = getSymbol(token0Address);
    token0.decimals = getDecimals(token0Address);

    token0.tradeVolume = ZERO_BD;
    token0.swapTxCount = ZERO_BI;
    token0.totalLiquidityDeposited = ZERO_BD;
  }

  if (token1 == null) {
    token1 = new Token(token1Address);
    token1.type = getType(token1Address);
    token1.name = getName(token1Address);
    token1.symbol = getSymbol(token1Address);
    token1.decimals = getDecimals(token1Address);

    token1.tradeVolume = ZERO_BD;
    token1.swapTxCount = ZERO_BI;
    token1.totalLiquidityDeposited = ZERO_BD;
  }

  let pairAddress = event.params.pair.toHexString();
  let pair = new Pair(pairAddress) as Pair;
  pair.isStable = event.params.stableSwap;
  pair.token0 = token0.id;
  pair.token1 = token1.id;
  pair.vault0 = vault0Address;
  pair.vault1 = vault1Address;

  pair.reserve0 = ZERO_BD;
  pair.reserve1 = ZERO_BD;
  pair.totalSupply = ZERO_BD;
  pair.token0Fee = BigInt.fromI32(300);
  pair.token1Fee = BigInt.fromI32(300);
  pair.token0FeePercent = DEFAULT_FEE_AMOUNT_BPS;
  pair.token1FeePercent = DEFAULT_FEE_AMOUNT_BPS;

  pair.volumeToken0 = ZERO_BD;
  pair.volumeToken1 = ZERO_BD;

  pair.totalFeeGenerated = ZERO_BD;

  pair.createdAtTimestamp = event.block.timestamp;
  pair.createdAtBlockNumber = event.block.number;
  pair.liquidityPositions = [];

  StrategicSwapPairTemplate.create(event.params.pair); // Create pair template

  token0.save();
  token1.save();
  pair.save();
}
