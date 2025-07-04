"use strict";Object.defineProperty(exports, "__esModule", {value: true});







var _CurrencyEngine = require('../common/CurrencyEngine');

var _utils = require('../common/utils');





var _fioTypes = require('./fioTypes');

const ADDRESS_POLL_MILLISECONDS = 10000
const BLOCKCHAIN_POLL_MILLISECONDS = 15000
const TRANSACTION_POLL_MILLISECONDS = 10000

 class FioEngine extends _CurrencyEngine.CurrencyEngine {
  
  
  

  localDataDirty() {
    this.walletLocalDataDirty = true
  }

  constructor(
    env,
    tools,
    walletInfo,
    opts
  ) {
    super(env, tools, walletInfo, opts)
    this.fetchCors = _utils.getFetchCors.call(void 0, env.io)
    this.networkInfo = env.networkInfo

    this.otherMethods = {}
  }

  setOtherData() {}

  // Poll on the blockheight
  async checkBlockchainInnerLoop() {}

  getBalance(options) {
    return super.getBalance(options)
  }

  doInitialBalanceCallback() {
    super.doInitialBalanceCallback()
  }

  // Check all account balance and other relevant info
  async checkAccountInnerLoop() {}

  async checkTransactionsInnerLoop() {}

  // ****************************************************************************
  // Public methods
  // ****************************************************************************

  // This routine is called once a wallet needs to start querying the network
  async startEngine() {
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

  async resyncBlockchain() {
    await this.killEngine()
    await this.clearBlockchainCache()
    await this.startEngine()
  }

  async getFreshAddress(options) {
    return { publicAddress: this.walletInfo.keys.publicKey }
  }
} exports.FioEngine = FioEngine;

 async function makeCurrencyEngine(
  env,
  tools,
  walletInfo,
  opts
) {
  const safeWalletInfo = _fioTypes.asSafeFioWalletInfo.call(void 0, walletInfo)
  const engine = new FioEngine(env, tools, safeWalletInfo, opts)
  await engine.loadEngine()

  return engine
} exports.makeCurrencyEngine = makeCurrencyEngine;
