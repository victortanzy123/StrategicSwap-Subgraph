import { Address, BigInt } from '@graphprotocol/graph-ts';
// Schemas:

import { ERC20 } from '../../generated/Factory/ERC20';

// Constants/Helper:
import {
  NATIVE,
  NATIVE_ALT,
  ERC20_INTERFACE_ID,
  ZERO_BI,
  DEFAULT_DECIMALS,
} from '../utils/constants.template';
import { Token } from '../../generated/schema';

/* ==================================================
                    Main Function
=====================================================*/
export function getToken(address: string): Token {
  let token = Token.load(address)!;
  return token;
}
/* ==================================================
            Helper/Intermediate Functions
=====================================================*/

export function getType(address: string): string {
  if (address == NATIVE || address == NATIVE_ALT) {
    return 'NATIVE';
  }

  return 'ERC20';

}

// Metadata helper functions:
export function getName(address: string): string {
  if (address == NATIVE || address == NATIVE_ALT) {
    return 'ETH';
  }
  let contract = ERC20.bind(Address.fromString(address));
  const result = contract.try_name();

  if (result.reverted) {
    return 'unknown';
  }
  return result.value;
}

export function getSymbol(address: string): string {
  if (address == NATIVE || address == NATIVE_ALT) {
    return 'ETH';
  }
  let contract = ERC20.bind(Address.fromString(address));
  const result = contract.try_symbol();

  if (result.reverted) {
    return 'unknown';
  }
  return result.value;
}

export function getDecimals(address: string): BigInt {
  if (address == NATIVE || address == NATIVE_ALT) {
    return DEFAULT_DECIMALS;
  }
  let contract = ERC20.bind(Address.fromString(address));
  const result = contract.try_decimals();

  if (result.reverted) {
    return DEFAULT_DECIMALS;
  }
  return DEFAULT_DECIMALS;
}
