"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _innerPlugin = require('../common/innerPlugin');
var _fioError = require('./fioError');

var _fioTypes = require('./fioTypes');

const networkInfo = {
  apiUrls: [
    'https://fio.eu.eosamsterdam.net/v1/',
    'https://fio.eosdac.io/v1/',
    'https://fio.eosrio.io/v1/',
    // 'https://fio.acherontrading.com/v1/', running v3.2.0
    'https://fio.eos.barcelona/v1/',
    'https://api.fio.alohaeos.com/v1/',
    // 'https://fio.greymass.com/v1/', // offline
    'https://fio.eosargentina.io/v1/',
    'https://fio.cryptolions.io/v1/',
    'https://api.fio.currencyhub.io/v1/',
    'https://fio.eostribe.io/v1/',
    // 'https://api.fio.greeneosio.com/v1/', running v3.2.0
    'https://api.fio.services/v1/',
    'https://fio.eosusa.news/v1/',
    // 'https://fio-api.eosiomadrid.io/v1/', always returning 403
    'https://fio.eosphere.io/v1/'
  ],
  historyNodeUrls: [
    'https://fio.eosphere.io/v1/',
    'https://api.fio.detroitledger.tech/v1/',
    'https://api.fiosweden.org/v1/',
    'https://fio.blockpane.com/v1/',
    'https://fio.greymass.com/v1/'
  ],
  fioRegApiUrl: 'https://reg.fioprotocol.io/public-api/',
  fioDomainRegUrl: 'https://reg.fioprotocol.io/domain/',
  fioAddressRegUrl: 'https://reg.fioprotocol.io/address/',
  fioStakingApyUrl: 'https://fioprotocol.io/staking',
  defaultRef: 'edge',
  fallbackRef: 'edge',
  freeAddressRef: 'edgefree',
  errorCodes: _fioError.fioRegApiErrorCodes,
  balanceCurrencyCodes: {
    // TODO: Remove these currencyCodes in favor of adding a dedicated locked balances field to the API
    staked: 'FIO:STAKED',
    locked: 'FIO:LOCKED'
  },
  chainId: '21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c'
}

const currencyInfo = {
  currencyCode: 'FIO',
  displayName: 'FIO',
  pluginId: 'fio',
  unsafeSyncNetwork: true,
  walletType: 'wallet:fio',

  // Explorers:
  addressExplorer: 'https://fio.bloks.io/key/%s',
  transactionExplorer: 'https://fio.bloks.io/transaction/%s',

  denominations: [
    {
      name: 'FIO',
      multiplier: '1000000000',
      symbol: 'ᵮ'
    }
  ],

  // No memo support:
  memoOptions: [],

  // Deprecated:
  defaultSettings: { ...networkInfo },
  metaTokens: []
}

 const fio = _innerPlugin.makeOuterPlugin({
  currencyInfo,
  networkInfo,
  otherMethodNames: _fioTypes.fioOtherMethodNames,

  async getInnerPlugin() {
    return await Promise.resolve().then(() => _interopRequireWildcard(require(
      /* webpackChunkName: "fio" */
      './FioTools'
    )))
  }
}); exports.fio = fio
