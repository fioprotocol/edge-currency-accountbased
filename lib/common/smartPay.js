"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _biggystring = require('biggystring');
var _cleaners = require('cleaners');


var _network = require('./network');
var _pixkey = require('./pixkey');
var _utils = require('./utils');

const MAX_TIMEOUT_S = 60 * 60 * 24 * 7

const asSmartPayQrDecode = _cleaners.asEither.call(void 0, 
  _cleaners.asObject.call(void 0, {
    status: _cleaners.asValue.call(void 0, 'ok'),
    msg: _cleaners.asString,
    data: _cleaners.asObject.call(void 0, {
      amount: _cleaners.asNumber,
      name: _cleaners.asString,
      key: _cleaners.asString,
      timeout: _cleaners.asNumber
    })
  }),
  _cleaners.asObject.call(void 0, {
    status: _cleaners.asValue.call(void 0, 'failed'),
    msg: _cleaners.asString
  })
)

const asSmartPaySwapQuote = _cleaners.asObject.call(void 0, {
  status: _cleaners.asValue.call(void 0, 'ok'),
  msg: _cleaners.asString,
  data: _cleaners.asObject.call(void 0, {
    amount_usd: _cleaners.asString, // '0.000020',
    price_brl: _cleaners.asString, // '0.1923',
    total_brl: _cleaners.asString, // '0.00',
    fee_brl: _cleaners.asString, // '0.00',
    send_brl: _cleaners.asString, // '0.0001',
    timeout: _cleaners.asNumber, // 491,
    amount_txusdt: _cleaners.asString, // '0.000020',
    price_txusdt: _cleaners.asNumber, // 1,
    value_usd: _cleaners.asString, // '0.000020',
    total_txusdt: _cleaners.asString // '0.000020'
  })
})

 const parsePixKey = async (
  io,
  tokens,
  code,
  smartPayPublicAddress,
  smartPayUserId
) => {
  const now = new Date()

  // Get USDT info
  const tokenId = Object.keys(tokens).find(
    id => tokens[id].currencyCode === 'USDT'
  )
  if (tokenId == null) return
  const token = tokens[tokenId]

  const minNativeAmount = _biggystring.mul.call(void 0, '0.5', token.denominations[0].multiplier)

  if (code.length > 36) {
    const crc = _pixkey.computeCRC.call(void 0, code.slice(0, -4))
    if (!code.endsWith(crc)) {
      return
    }
    try {
      const fetchCors = _utils.getFetchCors.call(void 0, io)
      const qrcode = encodeURIComponent(code)
      const decode = await _network.cleanMultiFetch.call(void 0, 
        asSmartPayQrDecode,
        ['https://connect.smartpay.com.vc'],
        `api/pix/qrdecode?qrcode=${qrcode}`,
        undefined,
        undefined,
        fetchCors
      )
      if (decode.status !== 'ok') {
        throw new Error(decode.msg)
      }
      const { data: decodeData } = decode
      const { amount, key, name, timeout: decodeTimeout } = decodeData
      if (decodeTimeout > 0 && decodeTimeout < 120) {
        throw new Error('ErrorPixExpired')
      }

      let nativeAmount
      let expireDate
      if (amount !== 0) {
        const paramsObj = {
          type: 'buy',
          profile: 'transfer',
          currency: 'brl',
          conv: 'txusdt',
          target: 'amount',
          user: smartPayUserId,
          amount: amount === 0 ? 100 : amount
        }
        const params = _network.makeQueryParams.call(void 0, paramsObj)

        // Get swap quote
        const quote = await _network.cleanMultiFetch.call(void 0, 
          asSmartPaySwapQuote,
          ['https://connect.smartpay.com.vc'],
          `api/swapix/swapquote?${params}`,
          undefined,
          undefined,
          fetchCors
        )

        const { data: quoteData } = quote
        const { amount_txusdt: amountTxusdt, timeout: quoteTimeout } = quoteData
        if (quoteTimeout > 0 && quoteTimeout < 120) {
          throw new Error('ErrorPixExpired')
        }

        nativeAmount = _biggystring.mul.call(void 0, amountTxusdt, token.denominations[0].multiplier)
        const timeout = Math.min(
          decodeTimeout > 0 ? decodeTimeout : MAX_TIMEOUT_S,
          quoteTimeout > 0 ? quoteTimeout : MAX_TIMEOUT_S
        )
        expireDate = new Date(now.getTime() + timeout * 1000)
      }

      const out = {
        currencyCode: 'USDT',
        metadata: {
          name,
          notes: `To PIX: ${key}`
        },
        expireDate,
        nativeAmount,
        minNativeAmount,
        publicAddress: smartPayPublicAddress,
        uniqueIdentifier: code
      }
      return out
    } catch (e) {
      console.log(`Could not query PIX address ${code}: ${e.message}`)
    }
  } else {
    const [isPix, pixKey] = _pixkey.formatPixKey.call(void 0, code)
    if (!isPix) return
    const out = {
      currencyCode: 'USDT',
      minNativeAmount,
      metadata: {
        name: `PIX: ${pixKey}`,
        notes: `To PIX: ${pixKey}`
      },
      publicAddress: 'TUmgPbM5J6om7Z2PJjzrbSEbXit84ZhVCj',
      uniqueIdentifier: pixKey
    }
    return out
  }
}; exports.parsePixKey = parsePixKey
