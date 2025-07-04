import {
  EdgeCurrencyEngine,
  EdgeCurrencyEngineOptions,
  EdgeFetchFunction,
  EdgeFreshAddress,
  EdgeWalletInfo
} from 'edge-core-js/types'

import { CurrencyEngine } from '../common/CurrencyEngine'
import { PluginEnvironment } from '../common/innerPlugin'
import { getFetchCors } from '../common/utils'
import { FioTools } from './FioTools'
import {
  asSafeFioWalletInfo,
  FioNetworkInfo,
  SafeFioWalletInfo
} from './fioTypes'

const ADDRESS_POLL_MILLISECONDS = 10000
const BLOCKCHAIN_POLL_MILLISECONDS = 15000
const TRANSACTION_POLL_MILLISECONDS = 10000

export class FioEngine extends CurrencyEngine<FioTools, SafeFioWalletInfo> {
  fetchCors: EdgeFetchFunction
  otherMethods: Object
  networkInfo: FioNetworkInfo

  localDataDirty(): void {
    this.walletLocalDataDirty = true
  }

  constructor(
    env: PluginEnvironment<FioNetworkInfo>,
    tools: FioTools,
    walletInfo: SafeFioWalletInfo,
    opts: EdgeCurrencyEngineOptions
  ) {
    super(env, tools, walletInfo, opts)
    this.fetchCors = getFetchCors(env.io)
    this.networkInfo = env.networkInfo

    this.otherMethods = {}
  }

  setOtherData(): void {}

  // Poll on the blockheight
  async checkBlockchainInnerLoop(): Promise<void> {}

  getBalance(options: any): string {
    return super.getBalance(options)
  }

  doInitialBalanceCallback(): void {
    super.doInitialBalanceCallback()
  }

  // Check all account balance and other relevant info
  async checkAccountInnerLoop(): Promise<void> {}

  async checkTransactionsInnerLoop(): Promise<void> {}

  // ****************************************************************************
  // Public methods
  // ****************************************************************************

  // This routine is called once a wallet needs to start querying the network
  async startEngine(): Promise<void> {
    this.engineOn = true

    if (process.env.NODE_ENV === 'test') {
      this.addToLoop(
        'checkBlockchainInnerLoop',
        BLOCKCHAIN_POLL_MILLISECONDS
      ).catch(() => {})
      this.addToLoop('checkAccountInnerLoop', ADDRESS_POLL_MILLISECONDS).catch(
        () => {}
      )
    }

    this.addToLoop(
      'checkTransactionsInnerLoop',
      TRANSACTION_POLL_MILLISECONDS
    ).catch(() => {})
    await super.startEngine()
  }

  async resyncBlockchain(): Promise<void> {
    await this.killEngine()
    await this.clearBlockchainCache()
    await this.startEngine()
  }

  async getFreshAddress(options: any): Promise<EdgeFreshAddress> {
    return { publicAddress: this.walletInfo.keys.publicKey }
  }
}

export async function makeCurrencyEngine(
  env: PluginEnvironment<FioNetworkInfo>,
  tools: FioTools,
  walletInfo: EdgeWalletInfo,
  opts: EdgeCurrencyEngineOptions
): Promise<EdgeCurrencyEngine> {
  const safeWalletInfo = asSafeFioWalletInfo(walletInfo)
  const engine = new FioEngine(env, tools, safeWalletInfo, opts)
  await engine.loadEngine()

  return engine
}
