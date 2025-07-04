"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _innerPlugin = require('../common/innerPlugin');



const networkInfo = {
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

  async getInnerPlugin() {
    return await Promise.resolve().then(() => _interopRequireWildcard(require(
      /* webpackChunkName: "fio" */
      './FioTools'
    )))
  }
}); exports.fio = fio
