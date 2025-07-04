import { EdgeCurrencyInfo } from 'edge-core-js/types'

import { makeOuterPlugin } from '../common/innerPlugin'
import type { FioTools } from './FioTools'
import { FioNetworkInfo } from './fioTypes'

const networkInfo: FioNetworkInfo = {
  chainId: '21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c'
}

const currencyInfo: EdgeCurrencyInfo = {
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

export const fio = makeOuterPlugin<FioNetworkInfo, FioTools>({
  currencyInfo,
  networkInfo,

  async getInnerPlugin() {
    return await import(
      /* webpackChunkName: "fio" */
      './FioTools'
    )
  }
})
