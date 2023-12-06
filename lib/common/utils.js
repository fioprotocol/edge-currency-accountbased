"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _biggystring = require('biggystring');
var _buffer = require('buffer');
var _cleaners = require('cleaners');











var _rfc4648 = require('rfc4648');

 function normalizeAddress(address) {
  return address.toLowerCase().replace('0x', '')
} exports.normalizeAddress = normalizeAddress;

 function shuffleArray(array) {
  let currentIndex = array.length
  let temporaryValue, randomIndex

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
} exports.shuffleArray = shuffleArray;

 function isEmpty(map) {
  return Object.keys(map).length !== 0
} exports.isEmpty = isEmpty;

 function isHex(h) {
  const out = /^[0-9A-F]+$/i.test(removeHexPrefix(h))
  return out
} exports.isHex = isHex;

 function toHex(num) {
  return _biggystring.add.call(void 0, num, '0', 16)
} exports.toHex = toHex;

 function hexToBuf(hex) {
  const noHexPrefix = hex.replace('0x', '')
  const buf = _buffer.Buffer.from(noHexPrefix, 'hex')
  return buf
} exports.hexToBuf = hexToBuf;

 function padHex(hex, bytes) {
  if (2 * bytes - hex.length > 0) {
    return hex.padStart(2 * bytes, '0')
  }
  return hex
} exports.padHex = padHex;

 function removeHexPrefix(value) {
  if (value.indexOf('0x') === 0) {
    return value.substring(2)
  } else {
    return value
  }
} exports.removeHexPrefix = removeHexPrefix;

 function hexToDecimal(num) {
  const safeNum = num.toLowerCase()
  const hexNum = safeNum.startsWith('0x') ? safeNum : `0x${safeNum}`
  return _biggystring.add.call(void 0, hexNum, '0', 10)
} exports.hexToDecimal = hexToDecimal;

 function decimalToHex(num) {
  return _biggystring.add.call(void 0, num, '0', 16)
} exports.decimalToHex = decimalToHex;

 function uint8ArrayToHex(bytes) {
  return '0x' + _rfc4648.base16.stringify(bytes).toLowerCase()
} exports.uint8ArrayToHex = uint8ArrayToHex;

 function bufToHex(buf) {
  const signedTxBuf = _buffer.Buffer.from(buf)
  const hex = '0x' + signedTxBuf.toString('hex')
  return hex
} exports.bufToHex = bufToHex;

 function getLegacyDenomination(
  name,
  currencyInfo,
  legacyTokens
) {
  // Look in the primary currency info:
  for (const denomination of currencyInfo.denominations) {
    if (denomination.name === name) return denomination
  }

  // Look in the custom tokens:
  for (const metaToken of legacyTokens) {
    for (const denomination of metaToken.denominations) {
      if (denomination.name === name) return denomination
    }
  }

  // Look in the builtin tokens:
  for (const metaToken of currencyInfo.metaTokens) {
    for (const denomination of metaToken.denominations) {
      if (denomination.name === name) return denomination
    }
  }
} exports.getLegacyDenomination = getLegacyDenomination;

 function getDenomination(
  name,
  currencyInfo,
  allTokens
) {
  // Look in the primary currency info:
  for (const denomination of currencyInfo.denominations) {
    if (denomination.name === name) return denomination
  }

  // Look in the merged tokens:
  for (const tokenId of Object.keys(allTokens)) {
    const token = allTokens[tokenId]
    for (const denomination of token.denominations) {
      if (denomination.name === name) return denomination
    }
  }
} exports.getDenomination = getDenomination;

 const snoozeReject = async (ms) =>
  await new Promise((resolve, reject) =>
    setTimeout(reject, ms)
  ); exports.snoozeReject = snoozeReject
 const snooze = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms)); exports.snooze = snooze

 async function promiseAny(promises) {
  return await new Promise((resolve, reject) => {
    let pending = promises.length
    for (const promise of promises) {
      promise.then(
        value => {
          resolve(value)
        },
        error => {
          if (--pending === 0) reject(error)
        }
      )
    }
  })
} exports.promiseAny = promiseAny;

/**
 * Waits for the promises to resolve and uses a provided checkResult function
 * to return a key to identify the result. The returned promise resolves when
 * n number of promises resolve to identical keys.
 */
 async function promiseNy(
  promises,
  checkResult,
  n = promises.length
) {
  const map = {}
  return await new Promise((resolve, reject) => {
    let resolved = 0
    let failed = 0
    let done = false
    for (const promise of promises) {
      promise.then(
        result => {
          const key = checkResult(result)
          if (key !== undefined) {
            resolved++
            if (map[key] !== undefined) {
              map[key]++
            } else {
              map[key] = 1
            }
            if (!done && map[key] >= n) {
              done = true
              resolve(result)
            }
          } else if (++failed + resolved === promises.length) {
            reject(Error(`Could not resolve ${n} promises`))
          }
        },
        error => {
          if (++failed + resolved === promises.length) {
            reject(error)
          }
        }
      )
    }
  })
} exports.promiseNy = promiseNy;

/**
 * If the promise doesn't resolve in the given time,
 * reject it with the provided error, or a generic error if none is provided.
 */
 async function timeout(
  promise,
  ms,
  error = new Error(`Timeout of ${ms}ms exceeded`)
) {
  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(error), ms)
    promise.then(
      ok => {
        resolve(ok)
        clearTimeout(timer)
      },
      error => {
        reject(error)
        clearTimeout(timer)
      }
    )
  })
} exports.timeout = timeout;



 async function asyncWaterfall(
  asyncFuncs,
  timeoutMs = 5000
) {
  let pending = asyncFuncs.length
  const promises = []
  for (const func of asyncFuncs) {
    const index = promises.length
    promises.push(
      func().catch(e => {
        e.index = index
        throw e
      })
    )
    if (pending > 1) {
      promises.push(
        new Promise(resolve => {
          exports.snooze.call(void 0, timeoutMs).then(() => {
            resolve('async_waterfall_timed_out')
          })
        })
      )
    }
    try {
      const result = await Promise.race(promises)
      if (result === 'async_waterfall_timed_out') {
        const p = promises.pop()
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        _optionalChain([p, 'optionalAccess', _ => _.then, 'call', _2 => _2(), 'access', _3 => _3.catch, 'call', _4 => _4()])
        --pending
      } else {
        return result
      }
    } catch (e) {
      const i = e.index
      promises.splice(i, 1)
      const p = promises.pop()
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      _optionalChain([p, 'optionalAccess', _5 => _5.then, 'call', _6 => _6(), 'access', _7 => _7.catch, 'call', _8 => _8()])
      --pending
      if (pending === 0) {
        throw e
      }
    }
  }
} exports.asyncWaterfall = asyncWaterfall;

 function pickRandom(list, count) {
  if (list.length <= count) return list

  // Algorithm from https://stackoverflow.com/a/48089/1836596
  const out = []
  for (let i = 0; i < list.length && out.length < count; ++i) {
    const probability = (count - out.length) / (list.length - i)
    if (Math.random() <= probability) out.push(list[i])
  }
  return out
} exports.pickRandom = pickRandom;

/**
 * Safely read `otherParams` from a transaction, throwing if it's missing.
 */
 function getOtherParams(tx) {
  const otherParams = tx.otherParams
  if (otherParams == null) {
    throw new TypeError('Transaction is missing otherParams')
  }
  return otherParams
} exports.getOtherParams = getOtherParams;


/**
 * Constructs a mutex.
 *
 * The mutex is a function that accepts & runs a callback,
 * ensuring that only one callback runs at a time. Use it like:
 *
 * const result = await mutex(() => {
 *   // Critical code that must not run more than one copy.
 *   return result
 * })
 */
 function makeMutex() {
  let busy = false
  const queue = []
  return async function lock(callback) {
    if (busy) await new Promise(resolve => queue.push(() => resolve(undefined)))
    try {
      busy = true
      return await callback()
    } finally {
      busy = false
      const resolve = queue.shift()
      if (resolve != null) resolve()
    }
  }
} exports.makeMutex = makeMutex;

const asCleanTxLogs = _cleaners.asObject.call(void 0, {
  txid: _cleaners.asString,
  spendTargets: _cleaners.asOptional.call(void 0, 
    _cleaners.asArray.call(void 0, 
      _cleaners.asObject.call(void 0, {
        currencyCode: _cleaners.asString,
        nativeAmount: _cleaners.asString,
        publicAddress: _cleaners.asString,
        uniqueIdentifier: _cleaners.asOptional.call(void 0, _cleaners.asString)
      })
    )
  ),
  signedTx: _cleaners.asString,
  otherParams: _cleaners.asOptional.call(void 0, 
    _cleaners.asObject.call(void 0, {
      gas: _cleaners.asOptional.call(void 0, _cleaners.asString),
      gasPrice: _cleaners.asOptional.call(void 0, _cleaners.asString),
      nonceUsed: _cleaners.asOptional.call(void 0, _cleaners.asString)
    })
  )
})

 function cleanTxLogs(tx) {
  return JSON.stringify(asCleanTxLogs(tx), null, 2)
} exports.cleanTxLogs = cleanTxLogs;

// Convert number strings in scientific notation to decimal notation using biggystring
 function biggyScience(num) {
  const [factor, exponent] = num.split('e')

  // exit early if the number is not in scientific notation
  if (exponent == null) return num

  return _biggystring.mul.call(void 0, factor, '1' + '0'.repeat(parseInt(exponent))).toString()
} exports.biggyScience = biggyScience;

/**
 * Emulates the browser Fetch API more accurately than fetch JSON.
 */
 function getFetchCors(io) {
  return _nullishCoalesce(io.fetchCors, () => ( io.fetch))
} exports.getFetchCors = getFetchCors;

 function safeErrorMessage(e) {
  let sāfError = ''
  if (e != null) {
    if (e.name != null) sāfError += `${e.name} `
    if (e.message != null) sāfError += e.message
  }
  return sāfError
} exports.safeErrorMessage = safeErrorMessage;

/**
 * Merges several Javascript objects deeply,
 * preferring the items from later objects.
 */
 function mergeDeeply(...objects) {
  const out = {}

  for (const o of objects) {
    if (o == null) continue

    for (const key of Object.keys(o)) {
      if (o[key] == null) continue

      out[key] =
        out[key] != null && typeof o[key] === 'object'
          ? mergeDeeply(out[key], o[key])
          : o[key]
    }
  }

  return out
} exports.mergeDeeply = mergeDeeply;

 function biggyRoundToNearestInt(float) {
  const [int, dec] = float.split('.')
  if (dec == null) return int
  if (parseInt(dec[0]) >= 5) return _biggystring.add.call(void 0, int, '1')
  return int
} exports.biggyRoundToNearestInt = biggyRoundToNearestInt;

 const prettyPrintObject = (obj) =>
  console.log(JSON.stringify(obj, null, 2)); exports.prettyPrintObject = prettyPrintObject

/**
 * Compares two JSON-like objects, returning false if they differ.
 */
 function matchJson(a, b) {
  // Use simple equality, unless a and b are proper objects:
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a == null ||
    b == null
  ) {
    return a === b
  }

  // These must either be both arrays or both objects:
  const aIsArray = Array.isArray(a)
  const bIsArray = Array.isArray(b)
  if (aIsArray !== bIsArray) return false

  // Compare arrays in order:
  if (aIsArray) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; ++i) {
      if (!matchJson(a[i], b[i])) return false
    }
    return true
  }

  // These are both regular objects, so grab the keys,
  // ignoring entries where the value is `undefined`:
  const aKeys = Object.getOwnPropertyNames(a).filter(
    key => a[key] !== undefined
  )
  const bKeys = Object.getOwnPropertyNames(b).filter(
    key => b[key] !== undefined
  )
  if (aKeys.length !== bKeys.length) return false

  // We know that both objects have the same number of properties,
  // so if every property in `a` has a matching property in `b`,
  // the objects must be identical, regardless of key order.
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!matchJson(a[key], b[key])) return false
  }
  return true
} exports.matchJson = matchJson;

// Checks that all keys in obj1 exist in obj2 and have the same values
 const objectCheckOneWay = (obj1, obj2) => {
  for (const key of Object.keys(obj1)) {
    if (typeof obj1[key] === 'object') {
      if (typeof obj2[key] !== 'object') {
        return false
      }
      const result = exports.objectCheckOneWay.call(void 0, obj1[key], obj2[key])
      if (!result) {
        return false
      }
      continue
    }
    if (obj1[key] !== obj2[key]) {
      return false
    }
  }
  return true
}; exports.objectCheckOneWay = objectCheckOneWay

/**
 * Calls `func` on ethers JsonRpcProviders initialized with configured
 * RPC servers. Randomizes order priority to distribute load.
 */
 const multicastEthProviders = async ( 


props


) => {
  const { func, providers } = props
  const funcs = providers.map(
    provider => async () => {
      return await func(provider)
    }
  )
  return await asyncWaterfall(shuffleArray(funcs))
}; exports.multicastEthProviders = multicastEthProviders
