"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _createNamedExportFrom(obj, localName, importedName) { Object.defineProperty(exports, localName, {enumerable: true, configurable: true, get: () => obj[importedName]}); } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _eosio = require('@greymass/eosio');
var _biggystring = require('biggystring');
var _fiojs = require('@fioprotocol/fiojs');
var _bip39 = require('bip39');
var _hdkey = require('hdkey'); var _hdkey2 = _interopRequireDefault(_hdkey);
var _wif = require('wif'); var _wif2 = _interopRequireDefault(_wif);













var _uriHelpers = require('../common/uriHelpers');
var _utils = require('../common/utils');




var _fioTypes = require('./fioTypes');

const FIO_CURRENCY_CODE = 'FIO'
const FIO_TYPE = 'fio'

 function checkAddress(address) {
  const start = address.startsWith(FIO_CURRENCY_CODE)
  const length = address.length === 53
  return start && length
} exports.checkAddress = checkAddress;

 class FioTools  {
  
  
  
  

  

  constructor(env) {
    const { builtinTokens, currencyInfo, io, networkInfo } = env
    this.builtinTokens = builtinTokens
    this.currencyInfo = currencyInfo
    this.io = io
    this.networkInfo = networkInfo

    this.fetchCors = _utils.getFetchCors.call(void 0, env.io)
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

  async createPrivateKeyMnemonic(mnemonic) {
    const seedBytes = await _bip39.mnemonicToSeed.call(void 0, mnemonic)
    const seed = await seedBytes.toString('hex')
    const master = _hdkey2.default.fromMasterSeed(Buffer.from(seed, 'hex'))
    const node = master.derive('m/44\'/235\'/0\'/0/0')
    if (!node.privateKey) throw new Error('Failed to derive private key')
    const fioKey = _wif2.default.encode(128, node.privateKey, false)
    return { fioKey, mnemonic }
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
      const privKeys = this.createPrivateKeyMnemonic(userInput)
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
 
  async createFioPrivateKey(entropy)


 {
    const mnemonic = _bip39.entropyToMnemonic.call(void 0, entropy)
    return await this.createPrivateKeyMnemonic(mnemonic)
  }

  async createPrivateKey(
    walletType
  ) {
    const type = walletType.replace('wallet:', '')
    if (type === FIO_TYPE) {
      const buffer = Buffer.from(this.io.random(32))
      const out =
        await this.createFioPrivateKey(buffer)
      return out
    } else {
      throw new Error('InvalidWalletType')
    }
  }

  async derivePublicKey(walletInfo) {
    const type = walletInfo.type.replace('wallet:', '')
    if (type === FIO_TYPE) {
      const publicKey = _fiojs.Ecc.privateToPublic(walletInfo.keys.fioKey)
      return { publicKey }
    } else {
      throw new Error('InvalidWalletType')
    }
  }

  async parseUri(uri) {
    const { edgeParsedUri } = _uriHelpers.parseUriCommon.call(void 0, 
      this.currencyInfo,
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
        this.currencyInfo,
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
} exports.FioTools = FioTools;

 async function makeCurrencyTools(
  env
) {
  return new FioTools(env)
} exports.makeCurrencyTools = makeCurrencyTools;

var _FioEngine = require('./FioEngine'); _createNamedExportFrom(_FioEngine, 'makeCurrencyEngine', 'makeCurrencyEngine');
