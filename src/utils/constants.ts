import { BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts';

export const ZERO_BI = BigInt.fromString('0');
export const ONE_BI = BigInt.fromString('1');

export const BPS_BI = BigInt.fromString('10000');

export const ZERO_BD = BigDecimal.fromString('0');
export const ONE_BD = BigDecimal.fromString('1');

export const DEFAULT_DECIMALS = BigInt.fromString('18');

export const ERC20_INTERFACE_ID = Bytes.fromHexString('0x36372b07');

export const NATIVE = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
export const NATIVE_ALT = '0x0000000000000000000000000000000000000000';

export const FACTORY_ADDRESS = '';
export const DEFAULT_FEE_AMOUNT_BPS = BigDecimal.fromString('300');
export const BASE_BPS = BigDecimal.fromString('10000');
