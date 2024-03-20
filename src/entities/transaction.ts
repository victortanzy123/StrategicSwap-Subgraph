import { BigInt, json } from '@graphprotocol/graph-ts';
import { Token, Transaction } from '../../generated/schema';

export type TransactionType = 'MINT' | 'BURN' | 'SWAP';

export function getTransaction(type: TransactionType) {}
