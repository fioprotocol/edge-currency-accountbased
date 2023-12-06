"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _biggystring = require('biggystring');
var _cleaners = require('cleaners');


/**
 * The `networkLocation` field is untyped,
 * but many currency plugins will put a contract address in there.
 */
 const asMaybeContractLocation = _cleaners.asMaybe.call(void 0, 
  _cleaners.asObject.call(void 0, {
    contractAddress: _cleaners.asString
  })
); exports.asMaybeContractLocation = asMaybeContractLocation

/**
 * Downgrades EdgeToken objects to the legacy EdgeMetaToken format.
 */
 function makeMetaTokens(tokens) {
  const out = []
  for (const tokenId of Object.keys(tokens)) {
    const { currencyCode, displayName, denominations, networkLocation } =
      tokens[tokenId]

    const cleanLocation = exports.asMaybeContractLocation.call(void 0, networkLocation)
    if (cleanLocation == null) continue
    out.push({
      currencyCode,
      currencyName: displayName,
      denominations,
      contractAddress: cleanLocation.contractAddress
    })
  }
  return out
} exports.makeMetaTokens = makeMetaTokens;

 const getTokenIdFromCurrencyCode = (
  currencyCode,
  allTokensMap
) => {
  for (const tokenId of Object.keys(allTokensMap)) {
    if (allTokensMap[tokenId].currencyCode === currencyCode) return tokenId
  }
}; exports.getTokenIdFromCurrencyCode = getTokenIdFromCurrencyCode

/**
 * Validates common things about a token, such as its currency code.
 * Throws an exception if the token is wrong.
 */
 const validateToken = (token) => {
  if (!isCurrencyCode(token.currencyCode)) {
    throw new Error(`Invalid currency code "${token.currencyCode}"`)
  }

  // We cannot validate the display name, since it's for humans.
  // Names like "AAVE Interest Bearing BAT" and "0x" would break
  // the old length heuristic we had.

  for (const denomination of token.denominations) {
    if (!isCurrencyCode(denomination.name)) {
      throw new Error(`Invalid denomination name "${denomination.name}"`)
    }

    if (
      _biggystring.lt.call(void 0, denomination.multiplier, '1') ||
      _biggystring.gt.call(void 0, denomination.multiplier, '100000000000000000000000000000000')
    ) {
      throw new Error('ErrorInvalidMultiplier')
    }
  }
}; exports.validateToken = validateToken

/**
 * Validates a currency code.
 * Some weird but valid examples include: T, BUSD.e, xBOO, 1INCH, BADGER
 */
const isCurrencyCode = (code) => {
  return /^[.a-zA-Z0-9]+$/.test(code)
}
