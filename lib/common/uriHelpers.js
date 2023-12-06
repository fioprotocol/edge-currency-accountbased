"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _biggystring = require('biggystring');






var _urijs = require('uri-js');
var _urlparse = require('url-parse'); var _urlparse2 = _interopRequireDefault(_urlparse);

var _utils = require('./utils');



 function parseUriCommon(
  currencyInfo,
  uri,
  networks,
  currencyCode,
  customTokens = []
) {
  const parsedUri = { ..._urlparse2.default.call(void 0, uri, {}, true) }

  // Add support for renproject Gateway URI type
  const isGateway = uri.startsWith(`${currencyInfo.pluginId}://`)

  // Remove ":" from protocol
  if (parsedUri.protocol != null) {
    parsedUri.protocol = parsedUri.protocol.replace(':', '')
  }

  // Wrong crypto or protocol is not supported
  if (
    parsedUri.protocol != null &&
    parsedUri.protocol !== '' &&
    !networks[parsedUri.protocol]
  ) {
    throw new Error(
      `Uri protocol '${parsedUri.protocol}' is not supported for ${currencyInfo.pluginId}.`
    )
  }

  // If no host and no path, then it's not a valid URI
  if (parsedUri.host === '' && parsedUri.pathname === '') {
    throw new Error('Path and host not found in uri.')
  }

  // Address uses the host if present to support URLs with double-slashes (//)
  const publicAddress =
    parsedUri.host !== '' ? parsedUri.host : parsedUri.pathname.split('/')[0]

  const edgeParsedUri = {
    publicAddress
  }

  // Metadata query parameters
  const label = parsedUri.query.label
  const message = parsedUri.query.message
  const category = parsedUri.query.category

  if (label != null || message != null || category != null || isGateway) {
    edgeParsedUri.metadata = {}
    edgeParsedUri.metadata.name = label
    edgeParsedUri.metadata.notes = message
    edgeParsedUri.metadata.category = category
    // @ts-expect-error
    edgeParsedUri.metadata.gateway = _nullishCoalesce(isGateway, () => ( false))
  }

  const amountStr = parsedUri.query.amount
  if (amountStr != null && typeof amountStr === 'string') {
    if (currencyCode == null) {
      currencyCode = currencyInfo.currencyCode
    }
    const denom = _utils.getLegacyDenomination.call(void 0, 
      _nullishCoalesce(currencyCode, () => ( '')),
      currencyInfo,
      customTokens
    )
    if (denom == null) {
      throw new Error('InternalErrorInvalidCurrencyCode')
    }
    let nativeAmount = _biggystring.mul.call(void 0, amountStr, denom.multiplier)
    nativeAmount = _biggystring.toFixed.call(void 0, nativeAmount, 0, 0)

    edgeParsedUri.nativeAmount = nativeAmount
    edgeParsedUri.currencyCode = currencyCode
  }

  return { edgeParsedUri, parsedUri }
} exports.parseUriCommon = parseUriCommon;

 function encodeUriCommon(
  obj,
  network,
  amount
) {
  if (obj.publicAddress == null) {
    throw new Error('InvalidPublicAddressError')
  }
  if (amount == null && obj.label == null && obj.message == null) {
    return obj.publicAddress
  } else {
    let queryString = ''
    if (amount != null) {
      queryString += 'amount=' + amount + '&'
    }
    if (obj.label != null || obj.message != null) {
      if (typeof obj.label === 'string') {
        queryString += 'label=' + obj.label + '&'
      }
      if (typeof obj.message === 'string') {
        queryString += 'message=' + obj.message + '&'
      }
    }
    queryString = queryString.substr(0, queryString.length - 1)

    const serializeObj = {
      scheme: network,
      path: obj.publicAddress,
      query: queryString
    }
    const url = _urijs.serialize.call(void 0, serializeObj)
    return url
  }
} exports.encodeUriCommon = encodeUriCommon;
