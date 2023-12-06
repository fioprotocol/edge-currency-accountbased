"use strict";Object.defineProperty(exports, "__esModule", {value: true});











var _cleaners = require('cleaners');







var _rfc4648 = require('rfc4648');

 const DATA_STORE_FILE = 'txEngineFolder/walletLocalData.json'; exports.DATA_STORE_FILE = DATA_STORE_FILE
 const TXID_MAP_FILE = 'txEngineFolder/txidMap.json'; exports.TXID_MAP_FILE = TXID_MAP_FILE
 const TXID_LIST_FILE = 'txEngineFolder/txidList.json'; exports.TXID_LIST_FILE = TXID_LIST_FILE
 const TRANSACTION_STORE_FILE = 'txEngineFolder/transactionList.json'; exports.TRANSACTION_STORE_FILE = TRANSACTION_STORE_FILE

// Same as asOptional but will not throw if cleaner fails but will
// return the fallback instead
 const asAny = (raw) => raw; exports.asAny = asAny

 const asErrorMessage = _cleaners.asObject.call(void 0, {
  message: _cleaners.asString
}); exports.asErrorMessage = asErrorMessage
















 const asWalletLocalData = _cleaners.asObject.call(void 0, {
  blockHeight: _cleaners.asMaybe.call(void 0, _cleaners.asNumber, 0),
  lastAddressQueryHeight: _cleaners.asMaybe.call(void 0, _cleaners.asNumber, 0),
  lastTransactionQueryHeight: _cleaners.asMaybe.call(void 0, _cleaners.asObject.call(void 0, _cleaners.asNumber), () => ({})),
  lastTransactionDate: _cleaners.asMaybe.call(void 0, _cleaners.asObject.call(void 0, _cleaners.asNumber), () => ({})),
  publicKey: _cleaners.asMaybe.call(void 0, _cleaners.asString, ''),
  totalBalances: _cleaners.asMaybe.call(void 0, _cleaners.asObject.call(void 0, _cleaners.asEither.call(void 0, _cleaners.asString, _cleaners.asUndefined)), () => ({})),
  lastCheckedTxsDropped: _cleaners.asMaybe.call(void 0, _cleaners.asNumber, 0),
  numUnconfirmedSpendTxs: _cleaners.asMaybe.call(void 0, _cleaners.asNumber, 0),
  numTransactions: _cleaners.asMaybe.call(void 0, _cleaners.asObject.call(void 0, _cleaners.asNumber), () => ({})),
  unactivatedTokenIds: _cleaners.asMaybe.call(void 0, _cleaners.asArray.call(void 0, _cleaners.asString), () => []),
  otherData: _cleaners.asOptional.call(void 0, _cleaners.asUnknown, () => ({}))
}); exports.asWalletLocalData = asWalletLocalData








 const asWalletInfo = (
  asKeys
) =>
  _cleaners.asObject.call(void 0, {
    id: _cleaners.asString,
    type: _cleaners.asString,
    keys: asKeys
  }); exports.asWalletInfo = asWalletInfo


 const asSafeCommonWalletInfo = exports.asWalletInfo.call(void 0, 
  _cleaners.asObject.call(void 0, { publicKey: _cleaners.asString })
); exports.asSafeCommonWalletInfo = asSafeCommonWalletInfo

/**
 * A string of hex-encoded binary data.
 */
 const asBase16 = _cleaners.asCodec.call(void 0, 
  raw => _rfc4648.base16.parse(_cleaners.asString.call(void 0, raw)),
  clean => _rfc4648.base16.stringify(clean).toLowerCase()
); exports.asBase16 = asBase16

 function asIntegerString(raw) {
  const clean = _cleaners.asString.call(void 0, raw)
  if (!/^\d+$/.test(clean)) {
    throw new Error('Expected an integer string')
  }
  return clean
} exports.asIntegerString = asIntegerString;







































