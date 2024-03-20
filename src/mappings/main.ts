import { dataSource } from '@graphprotocol/graph-ts';

// Events from ABI:
import { Transaction, StrategicSwapFactory } from '../../generated/schema';
import {
  StrategicPoolPairERC4626 as StrategicPoolPair,
  DepositLiquidity,
  RemoveLiquidity,
  Swap,
  Transfer,
  Sync,
} from '../../generated/templates/StrategicPoolPairERC4626/StrategicPoolPairERC4626';
// Schemas:
import { getUser } from '../entities/user';
import { getToken } from '../entities/token';

// Constants/Helpers:
import { filterArray, toDecimal } from '../utils/helper';
import {
  BASE_BPS,
  DEFAULT_DECIMALS,
  DEFAULT_FEE_AMOUNT_BPS,
  FACTORY_ADDRESS,
  NATIVE,
  ONE_BI,
  ZERO_BD,
} from '../utils/constants.template';
import { getPair } from '../entities/pair';
import { getLiquidityPosition } from '../entities/liquidity-position';

export function handleDepositLiquidity(event: DepositLiquidity): void {
  let pairAddress = dataSource.address().toHexString();
  let depositorAddress = event.params.provider.toHexString();
  let user = getUser(depositorAddress);
  let pair = getPair(pairAddress);
  let token0 = getToken(pair.token0);
  let token1 = getToken(pair.token1);

  let token0Amount = toDecimal(event.params.token0Amount, token0.decimals);
  let token1Amount = toDecimal(event.params.token1Amount, token1.decimals);
  let lpTokenAmount = toDecimal(event.params.lpTokenAmount, DEFAULT_DECIMALS);

  // 1. Create Transaction
  let txHash = event.transaction.hash.toHexString();
  let transaction = new Transaction(txHash);
  transaction.type = 'MINT';
  transaction.timestamp = event.block.timestamp;
  transaction.pair = pair.id;
  transaction.from = user.id;
  transaction.to = NATIVE;
  transaction.amount0In = token0Amount;
  transaction.amount1In = token1Amount;
  transaction.amount0Out = ZERO_BD;
  transaction.amount1Out = ZERO_BD;

  transaction.amountUSD = token0Amount.plus(token1Amount);

  transaction.save();

  // 2. Update pair
  pair.totalSupply = pair.totalSupply.plus(lpTokenAmount);

  pair.save();

  // 4. Update Token Statistics
  token0.totalLiquidityDeposited = token0.totalLiquidityDeposited.plus(token0Amount);
  token1.totalLiquidityDeposited = token1.totalLiquidityDeposited.plus(token1Amount);

  token0.save();
  token1.save();

  // 5. Update Factory statistics
  let factory = StrategicSwapFactory.load(FACTORY_ADDRESS)!;

  factory.totalLiquidityUSD = factory.totalLiquidityUSD
    .plus(token0Amount)
    .plus(token1Amount);

  factory.save();
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let pairAddress = dataSource.address().toHexString();
  let depositorAddress = event.params.provider.toHexString();
  let user = getUser(depositorAddress);
  let pair = getPair(pairAddress);
  let token0 = getToken(pair.token0);
  let token1 = getToken(pair.token1);

  let token0Amount = toDecimal(event.params.token0Amount, token0.decimals);
  let token1Amount = toDecimal(event.params.token1Amount, token1.decimals);
  let lpTokenAmount = toDecimal(event.params.lpTokenAmount, DEFAULT_DECIMALS);

  // 1. Create Transaction
  let txHash = event.transaction.hash.toHexString();
  let transaction = new Transaction(txHash);
  transaction.type = 'BURN';
  transaction.timestamp = event.block.timestamp;
  transaction.pair = pairAddress;
  transaction.from = user.id;
  transaction.to = NATIVE;
  transaction.amount0In = ZERO_BD;
  transaction.amount1In = ZERO_BD;
  transaction.amount0Out = token0Amount;
  transaction.amount1Out = token1Amount;

  transaction.amountUSD = token0Amount.plus(token1Amount);

  transaction.save();

  // 2. Update pair
  pair.totalSupply = pair.totalSupply.minus(lpTokenAmount);

  pair.save();

  // 3. Create liquidity position
  let liquidityPosition = getLiquidityPosition(depositorAddress, pairAddress);
  liquidityPosition.lpTokenBalance =
    liquidityPosition.lpTokenBalance.minus(lpTokenAmount);

  liquidityPosition.save();

  // 4. Update Token Statistics
  token0.totalLiquidityDeposited = token0.totalLiquidityDeposited.minus(token0Amount);
  token1.totalLiquidityDeposited = token1.totalLiquidityDeposited.minus(token1Amount);

  token0.save();
  token1.save();

  // 5. Update Factory statistics
  let factory = StrategicSwapFactory.load(FACTORY_ADDRESS)!;

  factory.totalLiquidityUSD = factory.totalLiquidityUSD
    .minus(token0Amount)
    .minus(token1Amount);

  factory.save();
}

export function handleSwap(event: Swap): void {
  let pairAddress = dataSource.address().toHexString();
  let traderAddress = event.params.to.toHexString();
  let user = getUser(traderAddress);
  let pair = getPair(pairAddress);
  let token0 = getToken(pair.token0);
  let token1 = getToken(pair.token1);

  let token0AmountIn = toDecimal(event.params.amount0In, token0.decimals);
  let token0AmountOut = toDecimal(event.params.amount0Out, token0.decimals);
  let token1AmountIn = toDecimal(event.params.amount1In, token1.decimals);
  let token1AmountOut = toDecimal(event.params.amount1Out, token1.decimals);

  // 1. Create Transaction
  let txHash = event.transaction.hash.toHexString();
  let transaction = new Transaction(txHash);
  transaction.type = 'SWAP';
  transaction.timestamp = event.block.timestamp;
  transaction.pair = pairAddress;
  transaction.from = user.id;
  transaction.to = user.id;
  transaction.amount0In = token0AmountIn;
  transaction.amount1In = token1AmountIn;
  transaction.amount0Out = token0AmountOut;
  transaction.amount1Out = token1AmountOut;
  let token0Volume = token0AmountIn.plus(token0AmountOut);
  let token1Volume = token1AmountIn.plus(token1AmountOut);
  let transactionVolumeUSD = token0Volume.plus(token1Volume);
  transaction.amountUSD = transactionVolumeUSD;

  transaction.save();

  // 2. Update User Swap Volume
  user.totalSwappedVolumeUSD = user.totalSwappedVolumeUSD.plus(transactionVolumeUSD);

  user.save();

  let token0Fee = ZERO_BD;
  let token1Fee = ZERO_BD;
  if (token0AmountIn != ZERO_BD) {
    token0Fee = token0AmountIn
      .plus(token0AmountOut)
      .times(DEFAULT_FEE_AMOUNT_BPS)
      .div(BASE_BPS);
  } else {
    token1Fee = token1AmountIn
      .plus(token1AmountOut)
      .times(DEFAULT_FEE_AMOUNT_BPS)
      .div(BASE_BPS);
  }

  // 3. Update Pair
  let totalVolume = token0Volume.plus(token1Volume);
  let totalFee = token0Fee.plus(token1Fee);

  pair.volumeToken0 = pair.volumeToken0.plus(token0Volume);
  pair.volumeToken1 = pair.volumeToken1.plus(token1Volume);
  pair.totalFeeGenerated = pair.totalFeeGenerated.plus(totalFee);

  pair.save();

  // 4. Update Token Statistics
  token0.tradeVolume = token0.tradeVolume.plus(token0Volume);
  token0.swapTxCount = token0.swapTxCount.plus(ONE_BI);

  token1.tradeVolume = token1.tradeVolume.plus(token1Volume);
  token1.swapTxCount = token1.swapTxCount.plus(ONE_BI);

  token0.save();
  token1.save();

  // 5. Update Factory Statistics
  let factory = StrategicSwapFactory.load(FACTORY_ADDRESS)!;
  factory.totalVolumeUSD = factory.totalVolumeUSD.plus(totalVolume);
  factory.totalFeeUSD = factory.totalFeeUSD.plus(totalFee);

  factory.save();
}

export function handleTransfer(event: Transfer): void {
  let pairAddress = dataSource.address().toHexString();
  let fromAddress = event.params.from.toHexString();
  let toAddress = event.params.to.toHexString();

  let lpTokenAmount = toDecimal(event.params.value, DEFAULT_DECIMALS);

  let pair = getPair(pairAddress);
  let from = getUser(fromAddress);
  let to = getUser(toAddress);

  let existingPositions = pair.liquidityPositions;
  let newExistingPositions = pair.liquidityPositions;

  let fromLpPosition = getLiquidityPosition(from.id, pairAddress);
  let toLpPosition = getLiquidityPosition(to.id, pairAddress);

  // 1. Update `from` LP Position
  fromLpPosition.lpTokenBalance = fromLpPosition.lpTokenBalance.minus(lpTokenAmount);

  if (fromLpPosition.lpTokenBalance == ZERO_BD) {
    newExistingPositions = filterArray(fromLpPosition.id, existingPositions);
  } // Only remove if balance = 0;
  pair.liquidityPositions = newExistingPositions;
  // 2. Update `to` LP Position
  toLpPosition.lpTokenBalance = toLpPosition.lpTokenBalance.plus(lpTokenAmount);

  if (!newExistingPositions.includes(toLpPosition.id)) {
    newExistingPositions.push(toLpPosition.id);
  }

  // 3. Update `pair` liquidity positions
  pair.liquidityPositions = newExistingPositions;

  fromLpPosition.save();
  toLpPosition.save();
  pair.save();
}

/// @Notice: Sync event emits the update `reserve0` and `reserve1` for every action performed on the pool.
export function handleSync(event: Sync): void {
  let pairAddress = dataSource.address().toHexString();

  let pair = getPair(pairAddress);
  let token0 = getToken(pair.token0);
  let token1 = getToken(pair.token1);

  let newReserve0 = toDecimal(event.params.reserve0, token0.decimals);
  let newReserve1 = toDecimal(event.params.reserve1, token1.decimals);

  pair.reserve0 = newReserve0;
  pair.reserve1 = newReserve1;

  pair.save();
}
