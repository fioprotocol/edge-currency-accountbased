"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _createNamedExportFrom(obj, localName, importedName) { Object.defineProperty(exports, localName, {enumerable: true, configurable: true, get: () => obj[importedName]}); } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _fiosdk = require('@fioprotocol/fiosdk');

var _eosio = require('@greymass/eosio');
var _biggystring = require('biggystring');
var _bip39 = require('bip39');













var _uriHelpers = require('../common/uriHelpers');






var _utils = require('../common/utils');
var _fioConst = require('./fioConst');
var _fioError = require('./fioError');
var _fioInfo = require('./fioInfo');




var _fioTypes = require('./fioTypes');

const FIO_CURRENCY_CODE = 'FIO'
const FIO_TYPE = 'fio'
const FIO_REG_SITE_API_KEY = ''






 function checkAddress(address) {
  const start = address.startsWith(FIO_CURRENCY_CODE)
  const length = address.length === 53
  return start && length
} exports.checkAddress = checkAddress;

 class FioTools  {
  
  
  
  

  
  
  

  constructor(env) {
    const { builtinTokens, currencyInfo, initOptions, io, networkInfo } = env
    this.builtinTokens = builtinTokens
    this.currencyInfo = currencyInfo
    this.io = io
    this.networkInfo = networkInfo

    const { tpid = 'finance@edge', fioRegApiToken = FIO_REG_SITE_API_KEY } =
      initOptions

    this.fetchCors = _utils.getFetchCors.call(void 0, env.io)
    this.fioRegApiToken = fioRegApiToken
    this.tpid = tpid

    // The sdk constructor will fetch and store abi definitions for future instances
    for (const baseUrl of this.networkInfo.apiUrls) {
      // eslint-disable-next-line
      new (0, _fiosdk.FIOSDK)('', '', baseUrl, this.fetchCors, undefined, tpid)
    }
  }

  async getDisplayPrivateKey(
    privateWalletInfo
  ) {
    const keys = _fioTypes.asFioPrivateKeys.call(void 0, privateWalletInfo.keys)
    return keys.fioKey
  }

  async getDisplayPublicKey(publicWalletInfo) {
    const { keys } = _fioTypes.asSafeFioWalletInfo.call(void 0, publicWalletInfo)
    return keys.publicKey
  }

  async importPrivateKey(userInput) {
    const { pluginId } = this.currencyInfo
    const keys = {}
    if (/[0-9a-zA-Z]{51}$/.test(userInput)) {
      _eosio.PrivateKey.fromString(userInput) // will throw if invalid

      // @ts-expect-error
      keys.fioKey = userInput
    } else {
      // it looks like a mnemonic, so validate that way:
      if (!_bip39.validateMnemonic.call(void 0, userInput)) {
        // "input" instead of "mnemonic" in case private key
        // was just the wrong length
        throw new Error('Invalid input')
      }
      const privKeys = await _fiosdk.FIOSDK.createPrivateKeyMnemonic(userInput)
      // @ts-expect-error
      keys.fioKey = privKeys.fioKey
      // @ts-expect-error
      keys.mnemonic = privKeys.mnemonic
    }

    // Validate the address derivation:
    const pubKeys = await this.derivePublicKey({
      type: `wallet:${pluginId}`,
      id: 'fake',
      keys
    })
    // @ts-expect-error
    keys.publicKey = pubKeys.publicKey

    return keys
  }

  async createPrivateKey(
    walletType
  ) {
    const type = walletType.replace('wallet:', '')
    if (type === FIO_TYPE) {
      const buffer = Buffer.from(this.io.random(32))
      const out =
        await _fiosdk.FIOSDK.createPrivateKey(buffer)
      return out
    } else {
      throw new Error('InvalidWalletType')
    }
  }

  async derivePublicKey(walletInfo) {
    const type = walletInfo.type.replace('wallet:', '')
    if (type === FIO_TYPE) {
      return _fiosdk.FIOSDK.derivedPublicKey(walletInfo.keys.fioKey)
    } else {
      throw new Error('InvalidWalletType')
    }
  }

  async parseUri(uri) {
    const { edgeParsedUri } = _uriHelpers.parseUriCommon.call(void 0, 
      _fioInfo.currencyInfo,
      uri,
      {
        fio: true
      },
      FIO_CURRENCY_CODE
    )
    const valid = checkAddress(_nullishCoalesce(edgeParsedUri.publicAddress, () => ( '')))
    if (!valid) {
      throw new Error('InvalidPublicAddressError')
    }

    return edgeParsedUri
  }

  async encodeUri(
    obj,
    customTokens = []
  ) {
    const valid = checkAddress(obj.publicAddress)
    if (!valid) {
      throw new Error('InvalidPublicAddressError')
    }
    let amount
    if (typeof obj.nativeAmount === 'string') {
      const currencyCode = FIO_CURRENCY_CODE
      const nativeAmount = obj.nativeAmount
      const denom = _utils.getLegacyDenomination.call(void 0, 
        currencyCode,
        _fioInfo.currencyInfo,
        customTokens
      )
      if (denom == null) {
        throw new Error('InternalErrorInvalidCurrencyCode')
      }
      amount = _biggystring.div.call(void 0, nativeAmount, denom.multiplier, 16)
    }
    const encodedUri = _uriHelpers.encodeUriCommon.call(void 0, obj, FIO_TYPE, amount)
    return encodedUri
  }

  //
  // otherMethods
  //

  async getConnectedPublicAddress(
    fioAddress,
    chainCode,
    tokenCode
  ) {
    try {
      _fiosdk.FIOSDK.isFioAddressValid(fioAddress)
    } catch (e) {
      throw new (0, _fioError.FioError)(
        '',
        400,
        this.networkInfo.errorCodes.INVALID_FIO_ADDRESS
      )
    }
    try {
      const isAvailableRes = await this.multicastServers(
        'isAvailable',
        {
          fioName: fioAddress
        }
      )
      if (isAvailableRes.is_registered === 0) {
        throw new (0, _fioError.FioError)(
          '',
          404,
          this.networkInfo.errorCodes.FIO_ADDRESS_IS_NOT_EXIST
        )
      }
    } catch (e) {
      if (
        e.name === 'FioError' &&
        _optionalChain([e, 'access', _ => _.json, 'optionalAccess', _2 => _2.fields]) != null &&
        e.errorCode === 400
      ) {
        e.labelCode = this.networkInfo.errorCodes.INVALID_FIO_ADDRESS
      }

      throw e
    }
    try {
      const result = await this.multicastServers('getPublicAddress', {
        fioAddress,
        chainCode,
        tokenCode
      })
      if (result.public_address == null || result.public_address === '0') {
        throw new (0, _fioError.FioError)(
          '',
          404,
          this.networkInfo.errorCodes.FIO_ADDRESS_IS_NOT_LINKED
        )
      }
      return result
    } catch (e) {
      if (
        (e.name === 'FioError' &&
          e.labelCode ===
            this.networkInfo.errorCodes.FIO_ADDRESS_IS_NOT_LINKED) ||
        e.errorCode === 404
      ) {
        throw new (0, _fioError.FioError)(
          '',
          404,
          this.networkInfo.errorCodes.FIO_ADDRESS_IS_NOT_LINKED
        )
      }
      throw e
    }
  }

  async isFioAddressValid(fioAddress) {
    try {
      return _fiosdk.FIOSDK.isFioAddressValid(fioAddress)
    } catch (e) {
      return false
    }
  }

  async validateAccount(
    fioName,
    isDomain = false
  ) {
    try {
      if (isDomain) {
        if (!_fiosdk.FIOSDK.isFioDomainValid(fioName)) return false
      } else {
        if (!_fiosdk.FIOSDK.isFioAddressValid(fioName)) return false
      }
    } catch (e) {
      throw new (0, _fioError.FioError)(
        '',
        400,
        this.networkInfo.errorCodes.INVALID_FIO_ADDRESS
      )
    }
    try {
      const isAvailableRes = await this.multicastServers(
        'isAvailable',
        {
          fioName
        }
      )

      return isAvailableRes.is_registered === 0
    } catch (e) {
      if (
        e.name === 'FioError' &&
        _optionalChain([e, 'access', _3 => _3.json, 'optionalAccess', _4 => _4.fields]) != null &&
        e.errorCode === 400
      ) {
        e.labelCode = this.networkInfo.errorCodes.INVALID_FIO_ADDRESS
      }

      throw e
    }
  }

  async isDomainPublic(domain) {
    const isAvailableRes = await this.multicastServers(
      'isAvailable',
      {
        fioName: domain
      }
    )
    if (isAvailableRes.is_registered === 0)
      throw new (0, _fioError.FioError)(
        '',
        400,
        this.networkInfo.errorCodes.FIO_DOMAIN_IS_NOT_EXIST
      )
    const result = await this.fetchCors(
      `${this.networkInfo.fioRegApiUrl}${_fioConst.FIO_REG_API_ENDPOINTS.isDomainPublic}/${domain}`,
      {
        method: 'GET'
      }
    )
    if (!result.ok) {
      const data = await result.json()
      throw new (0, _fioError.FioError)(
        '',
        result.status,
        this.networkInfo.errorCodes.IS_DOMAIN_PUBLIC_ERROR,
        data
      )
    }
    const { isPublic } = await result.json()
    return isPublic
  }

  async doesAccountExist(fioName) {
    try {
      if (!_fiosdk.FIOSDK.isFioAddressValid(fioName)) return false
    } catch (e) {
      return false
    }
    try {
      const isAvailableRes = await this.multicastServers(
        'isAvailable',
        {
          fioName
        }
      )

      return isAvailableRes.is_registered === 1
    } catch (e) {
      // @ts-expect-error
      this.error('doesAccountExist error: ', e)
      return false
    }
  }

  async buyAddressRequest(
    options




,
    isFree = false
  ) {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (isFree) {
      options.apiToken = this.fioRegApiToken
    }
    try {
      const result = await this.fetchCors(
        `${this.networkInfo.fioRegApiUrl}${_fioConst.FIO_REG_API_ENDPOINTS.buyAddress}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(options)
        }
      )
      if (!result.ok) {
        const data = await result.json()
        // @ts-expect-error
        if (this.networkInfo.errorCodes[data.errorCode] != null) {
          throw new (0, _fioError.FioError)(
            data.error,
            result.status,
            // @ts-expect-error
            this.networkInfo.errorCodes[data.errorCode],
            data
          )
        }

        if (data.error === 'Already registered') {
          throw new (0, _fioError.FioError)(
            data.error,
            result.status,
            this.networkInfo.errorCodes.ALREADY_REGISTERED,
            data
          )
        }

        throw new Error(data.error)
      }
      return await result.json()
    } catch (e) {
      if (e.labelCode != null) throw e
      throw new (0, _fioError.FioError)(
        _utils.safeErrorMessage.call(void 0, e),
        500,
        this.networkInfo.errorCodes.SERVER_ERROR
      )
    }
  }

  async getDomains(ref = '') {
    if (ref == null) ref = this.networkInfo.defaultRef
    try {
      const result = await this.fetchCors(
        `${this.networkInfo.fioRegApiUrl}${_fioConst.FIO_REG_API_ENDPOINTS.getDomains}/${ref}`,
        {
          method: 'GET'
        }
      )
      const json = await result.json()
      if (!result.ok) {
        // @ts-expect-error
        if (this.networkInfo.errorCodes[json.errorCode] != null) {
          throw new (0, _fioError.FioError)(
            json.error,
            result.status,
            // @ts-expect-error
            this.networkInfo.errorCodes[json.errorCode],
            json
          )
        }

        throw new Error(json.error)
      }
      return json.domains
    } catch (e) {
      if (e.labelCode != null) throw e
      throw new (0, _fioError.FioError)(
        _utils.safeErrorMessage.call(void 0, e),
        500,
        this.networkInfo.errorCodes.SERVER_ERROR
      )
    }
  }

  async getStakeEstReturn() {
    try {
      const result = await this.fetchCors(
        `${this.networkInfo.fioStakingApyUrl}`,
        {
          method: 'GET'
        }
      )
      const json












 = await result.json()
      if (!result.ok) {
        throw new Error(this.networkInfo.errorCodes.SERVER_ERROR)
      }
      const apr = json.historical_apr['7day']
      return (apr != null && apr > _fioConst.DEFAULT_APR) || apr == null
        ? _fioConst.DEFAULT_APR
        : apr
    } catch (e) {
      if (e.labelCode != null) throw e
      throw new (0, _fioError.FioError)(
        e.message,
        500,
        this.networkInfo.errorCodes.SERVER_ERROR
      )
    }
  }

  //
  // Helpers
  //

   async multicastServers(
    actionName,
    params
  ) {
    const res = await _utils.asyncWaterfall.call(void 0, 
      _utils.shuffleArray.call(void 0, 
        this.networkInfo.apiUrls.map(apiUrl => async () => {
          let out

          const connection = new (0, _fiosdk.FIOSDK)(
            '',
            '',
            apiUrl,
            this.fetchCors,
            undefined,
            this.tpid
          )

          try {
            out = await connection.genericAction(actionName, params)
          } catch (e) {
            // handle FIO API error
            if (e.errorCode != null && _fioError.fioApiErrorCodes.includes(e.errorCode)) {
              out = {
                isError: true,
                data: {
                  code: e.errorCode,
                  message: _utils.safeErrorMessage.call(void 0, e),
                  json: e.json,
                  list: e.list
                }
              }
            } else {
              throw e
            }
          }

          return out
        })
      )
    )

    if (res.isError != null) {
      const error = new (0, _fioError.FioError)(res.errorMessage)
      error.json = res.data.json
      error.list = res.data.list
      error.errorCode = res.data.code

      throw error
    }

    return res
  }
} exports.FioTools = FioTools;

 async function makeCurrencyTools(
  env
) {
  return new FioTools(env)
} exports.makeCurrencyTools = makeCurrencyTools;

var _FioEngine = require('./FioEngine'); _createNamedExportFrom(_FioEngine, 'makeCurrencyEngine', 'makeCurrencyEngine');
