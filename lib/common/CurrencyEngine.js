"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _biggystring = require('biggystring');






















var _types = require('edge-core-js/types');


var _tokenHelpers = require('./tokenHelpers');








var _types3 = require('./types');






var _utils = require('./utils');

const SAVE_DATASTORE_MILLISECONDS = 10000
const MAX_TRANSACTIONS = 1000
const DROPPED_TX_TIME_GAP = 3600 * 24 // 1 Day











 class CurrencyEngine






{
  
  
  
  
  
  
   // Each currency code can be a 0-1 value
   // Each currency code can be a 0-1 value
  
  
  
  
  
   // Maps txid to index of tx in
   // Map of array of txids in chronological order
   // Transactions that have changed and need to be added
  
  
  
  
  
  
  
  
  

  // Tokens:
  __init() {this.allTokens = []}
  __init2() {this.allTokensMap = {}}
  __init3() {this.builtinTokens = {}}
  __init4() {this.customTokens = {}}
  __init5() {this.enabledTokenIds = []}
  __init6() {this.enabledTokens = []}

  constructor(
    env,
    tools,
    walletInfo,
    opts
  ) {;CurrencyEngine.prototype.__init.call(this);CurrencyEngine.prototype.__init2.call(this);CurrencyEngine.prototype.__init3.call(this);CurrencyEngine.prototype.__init4.call(this);CurrencyEngine.prototype.__init5.call(this);CurrencyEngine.prototype.__init6.call(this);
    const { builtinTokens, currencyInfo } = env
    const {
      callbacks,
      customTokens,
      enabledTokenIds,
      log,
      walletLocalDisklet
    } = opts

    this.tools = tools
    this.log = log
    this.warn = (message, e) => this.log.warn(message + _utils.safeErrorMessage.call(void 0, e))
    this.error = (message, e) => this.log.error(message + _utils.safeErrorMessage.call(void 0, e))
    this.engineOn = false
    this.addressesChecked = false
    this.tokenCheckBalanceStatus = {}
    this.tokenCheckTransactionsStatus = {}
    this.walletLocalDataDirty = false
    this.transactionsChangedArray = []
    this.transactionList = {}
    this.transactionListDirty = false
    this.transactionsLoaded = false
    this.txIdMap = {}
    this.txIdList = {}
    this.walletInfo = walletInfo
    this.walletId = walletInfo.id
    this.currencyInfo = currencyInfo
    this.timers = {}
    this.otherData = undefined
    this.minimumAddressBalance = '0'

    const { currencyCode } = currencyInfo
    this.transactionList[currencyCode] = []
    this.txIdMap[currencyCode] = {}
    this.txIdList[currencyCode] = []

    // Configure tokens:
    this.builtinTokens = builtinTokens
    this.changeCustomTokensSync(customTokens)
    this.changeEnabledTokenIdsSync(enabledTokenIds)

    if (opts.userSettings != null) {
      this.currentSettings = opts.userSettings
    } else {
      this.currentSettings = this.currencyInfo.defaultSettings
    }

    this.currencyEngineCallbacks = callbacks
    this.walletLocalDisklet = walletLocalDisklet

    if (typeof this.walletInfo.keys.publicKey !== 'string') {
      this.walletInfo.keys.publicKey = walletInfo.keys.publicKey
    }
    this.walletLocalData = {
      blockHeight: 0,
      lastAddressQueryHeight: 0,
      lastTransactionQueryHeight: {},
      lastTransactionDate: {},
      publicKey: '',
      totalBalances: {},
      lastCheckedTxsDropped: 0,
      numUnconfirmedSpendTxs: 0,
      numTransactions: {},
      unactivatedTokenIds: [],
      otherData: undefined
    }
    this.log(
      `Created Wallet Type ${this.walletInfo.type} for Currency Plugin ${this.currencyInfo.pluginId}`
    )
  }

   isSpendTx(edgeTransaction) {
    if (edgeTransaction.nativeAmount !== '') {
      if (edgeTransaction.nativeAmount.slice(0, 1) === '-') {
        return true
      }
      if (_biggystring.gt.call(void 0, edgeTransaction.nativeAmount, '0')) {
        return false
      }
    }
    let out = true
    if (edgeTransaction.ourReceiveAddresses.length > 0) {
      for (const addr of edgeTransaction.ourReceiveAddresses) {
        if (addr === this.walletLocalData.publicKey) {
          out = false
        }
      }
    }
    return out
  }

   setOtherData(raw) {
    throw new Error(`Unimplemented setOtherData for ${this.walletInfo.type}`)
  }

   async loadTransactions() {
    if (this.transactionsLoaded) {
      this.log('Transactions already loaded')
      return
    }
    this.transactionsLoaded = true

    const disklet = this.walletLocalDisklet

    let txIdList
    try {
      const result = await disklet.getText(_types3.TXID_LIST_FILE)
      txIdList = JSON.parse(result)
    } catch (e) {
      this.log('Could not load txidList file. Failure is ok on new device')
      await disklet.setText(_types3.TXID_LIST_FILE, JSON.stringify(this.txIdList))
    }

    let txIdMap
    try {
      const result = await disklet.getText(_types3.TXID_MAP_FILE)
      txIdMap = JSON.parse(result)
    } catch (e) {
      this.log('Could not load txidMap file. Failure is ok on new device')
      await disklet.setText(_types3.TXID_MAP_FILE, JSON.stringify(this.txIdMap))
    }

    let transactionList
    try {
      const result = await disklet.getText(_types3.TRANSACTION_STORE_FILE)
      transactionList = JSON.parse(result)
    } catch (e) {
      if (e.code === 'ENOENT') {
        this.log(
          'Could not load transactionList file. Failure is ok on new device'
        )
        await disklet.setText(
          _types3.TRANSACTION_STORE_FILE,
          JSON.stringify(this.transactionList)
        )
      } else {
        this.log.crash(e, this.walletLocalData)
      }
    }

    let isEmptyTransactions = true
    for (const cc of Object.keys(this.transactionList)) {
      if (
        this.transactionList[cc] != null &&
        this.transactionList[cc].length > 0
      ) {
        isEmptyTransactions = false
        break
      }
    }

    if (isEmptyTransactions) {
      // Easy, just copy everything over
      this.transactionList = _nullishCoalesce(transactionList, () => ( this.transactionList))
      this.txIdList = _nullishCoalesce(txIdList, () => ( this.txIdList))
      this.txIdMap = _nullishCoalesce(txIdMap, () => ( this.txIdMap))
    } else if (transactionList != null) {
      // Manually add transactions via addTransaction()
      for (const cc of Object.keys(transactionList)) {
        for (const edgeTransaction of transactionList[cc]) {
          this.addTransaction(cc, edgeTransaction)
        }
      }
    }
    for (const currencyCode in this.transactionList) {
      this.walletLocalData.numTransactions[currencyCode] =
        this.transactionList[currencyCode].length
    }
  }

  // Called by engine startup code
  async loadEngine() {
    const { walletInfo } = this
    const { currencyCode } = this.currencyInfo

    if (this.walletInfo.keys.publicKey == null) {
      this.walletInfo.keys.publicKey = walletInfo.keys.publicKey
    }

    const disklet = this.walletLocalDisklet
    try {
      const result = await disklet.getText(_types3.DATA_STORE_FILE)
      this.walletLocalData = _types3.asWalletLocalData.call(void 0, JSON.parse(result))
      this.walletLocalData.publicKey = this.walletInfo.keys.publicKey
    } catch (err) {
      try {
        this.log('No walletLocalData setup yet: Failure is ok')
        this.walletLocalData = _types3.asWalletLocalData.call(void 0, {})
        this.walletLocalData.publicKey = this.walletInfo.keys.publicKey
        await disklet.setText(
          _types3.DATA_STORE_FILE,
          JSON.stringify(this.walletLocalData)
        )
      } catch (e) {
        this.error('Error writing to localDataStore. Engine not started: ', e)
        throw e
      }
    }
    this.setOtherData(_nullishCoalesce(this.walletLocalData.otherData, () => ( {})))
    this.walletLocalDataDirty = !_utils.matchJson.call(void 0, 
      this.otherData,
      this.walletLocalData.otherData
    )

    // Add the native token currency
    this.tokenCheckBalanceStatus[currencyCode] = 0
    this.tokenCheckTransactionsStatus[currencyCode] = 0

    this.doInitialBalanceCallback()
    this.doInitialUnactivatedTokenIdsCallback()
  }

   findTransaction(currencyCode, txid) {
    if (this.txIdMap[currencyCode] != null) {
      const index = this.txIdMap[currencyCode][txid]
      if (typeof index === 'number') {
        return index
      }
    }
    return -1
  }

   sortTxByDate(a, b) {
    return b.date - a.date
  }

  // Add or update tx in transactionList
  // Called by EthereumNetwork
  addTransaction(
    currencyCode,
    edgeTransaction,
    lastSeenTime
  ) {
    this.log('executing addTransaction: ', edgeTransaction.txid)
    // set otherParams if not already set
    if (edgeTransaction.otherParams == null) {
      edgeTransaction.otherParams = {}
    }

    if (edgeTransaction.blockHeight < 1) {
      edgeTransaction.otherParams.lastSeenTime =
        _nullishCoalesce(lastSeenTime, () => ( Math.round(Date.now() / 1000)))
    }
    const txid = _utils.normalizeAddress.call(void 0, edgeTransaction.txid)
    const idx = this.findTransaction(currencyCode, txid)

    let needsReSort = false
    // if transaction doesn't exist in database
    if (idx === -1) {
      if (
        // if unconfirmed spend then increment # unconfirmed spend TX's
        this.isSpendTx(edgeTransaction) &&
        edgeTransaction.blockHeight === 0
      ) {
        this.walletLocalData.numUnconfirmedSpendTxs++
        this.walletLocalDataDirty = true
      }

      needsReSort = true
      // if currency's transactionList is uninitialized then initialize
      if (typeof this.transactionList[currencyCode] === 'undefined') {
        this.transactionList[currencyCode] = []
      } else if (
        this.transactionList[currencyCode].length >= MAX_TRANSACTIONS
      ) {
        return
      }
      // add transaction to list of tx's, and array of changed transactions
      this.transactionList[currencyCode].push(edgeTransaction)
      this.walletLocalData.numTransactions[currencyCode] =
        this.transactionList[currencyCode].length
      this.walletLocalDataDirty = true

      this.transactionListDirty = true
      this.transactionsChangedArray.push(edgeTransaction)
      this.warn(`addTransaction new tx: ${edgeTransaction.txid}`)
    } else {
      // Already have this tx in the database. See if anything changed
      const transactionsArray = this.transactionList[currencyCode]
      const edgeTx = transactionsArray[idx]

      const { otherParams: otherParamsOld = {} } = edgeTx
      const { otherParams: otherParamsNew = {} } = edgeTransaction
      if (
        // if something in the transaction has changed?
        edgeTx.blockHeight < edgeTransaction.blockHeight ||
        (edgeTx.blockHeight === 0 && edgeTransaction.blockHeight < 0) ||
        (edgeTx.blockHeight === edgeTransaction.blockHeight &&
          (edgeTx.networkFee !== edgeTransaction.networkFee ||
            edgeTx.nativeAmount !== edgeTransaction.nativeAmount ||
            otherParamsOld.lastSeenTime !== otherParamsNew.lastSeenTime ||
            edgeTx.date !== edgeTransaction.date))
      ) {
        // If a spend transaction goes from unconfirmed to dropped or confirmed,
        // decrement numUnconfirmedSpendTxs
        if (
          this.isSpendTx(edgeTransaction) &&
          edgeTransaction.blockHeight !== 0 &&
          edgeTx.blockHeight === 0
        ) {
          this.walletLocalData.numUnconfirmedSpendTxs--
        }
        if (edgeTx.date !== edgeTransaction.date) {
          needsReSort = true
        }
        this.warn(
          `addTransaction: update ${edgeTransaction.txid} height:${edgeTransaction.blockHeight}`
        )
        this.walletLocalDataDirty = true
        this.updateTransaction(currencyCode, edgeTransaction, idx)
      } else {
        // this.log(sprintf('Old transaction. No Update: %s', tx.hash))
      }
    }
    if (needsReSort) {
      this.sortTransactions(currencyCode)
    }
  }

   sortTransactions(currencyCode) {
    // Sort
    this.transactionList[currencyCode].sort(this.sortTxByDate)
    // Add to txidMap
    const txIdList = []
    let i = 0
    for (const tx of this.transactionList[currencyCode]) {
      if (this.txIdMap[currencyCode] == null) {
        this.txIdMap[currencyCode] = {}
      }
      this.txIdMap[currencyCode][_utils.normalizeAddress.call(void 0, tx.txid)] = i
      txIdList.push(_utils.normalizeAddress.call(void 0, tx.txid))
      i++
    }
    this.txIdList[currencyCode] = txIdList
  }

  // Called by EthereumNetwork
  checkDroppedTransactionsThrottled() {
    const now = Date.now() / 1000
    if (
      now - this.walletLocalData.lastCheckedTxsDropped >
      DROPPED_TX_TIME_GAP
    ) {
      this.checkDroppedTransactions(now)
      this.walletLocalData.lastCheckedTxsDropped = now
      this.walletLocalDataDirty = true
      if (this.transactionsChangedArray.length > 0) {
        this.currencyEngineCallbacks.onTransactionsChanged(
          this.transactionsChangedArray
        )
        this.transactionsChangedArray = []
      }
    }
  }

   checkDroppedTransactions(dateNow) {
    let numUnconfirmedSpendTxs = 0
    for (const currencyCode in this.transactionList) {
      // const droppedTxIndices: Array<number> = []
      for (let i = 0; i < this.transactionList[currencyCode].length; i++) {
        const tx = this.transactionList[currencyCode][i]
        if (tx.blockHeight === 0) {
          const { otherParams = {} } = tx
          const lastSeen = otherParams.lastSeenTime
          if (dateNow - lastSeen > DROPPED_TX_TIME_GAP) {
            // droppedTxIndices.push(i)
            tx.blockHeight = -1
            tx.nativeAmount = '0'
            this.transactionsChangedArray.push(tx)
            // delete this.txIdMap[currencyCode][tx.txid]
          } else if (this.isSpendTx(tx)) {
            // Still have a pending spend transaction in the tx list
            numUnconfirmedSpendTxs++
          }
        }
      }
      // Delete transactions in reverse order
      // for (let i = droppedTxIndices.length - 1; i >= 0; i--) {
      //   const droppedIndex = droppedTxIndices[i]
      //   this.transactionList[currencyCode].splice(droppedIndex, 1)
      // }
      // if (droppedTxIndices.length) {
      //   this.sortTransactions(currencyCode)
      // }
    }
    this.walletLocalData.numUnconfirmedSpendTxs = numUnconfirmedSpendTxs
    this.walletLocalDataDirty = true
  }

  // Called by EthereumNetwork
  updateBalance(tk, balance) {
    const currentBalance = this.walletLocalData.totalBalances[tk]
    if (this.walletLocalData.totalBalances[tk] == null) {
      this.walletLocalData.totalBalances[tk] = '0'
    }
    if (currentBalance == null || !_biggystring.eq.call(void 0, balance, currentBalance)) {
      this.walletLocalData.totalBalances[tk] = balance
      this.walletLocalDataDirty = true
      this.warn(`${tk}: token Address balance: ${balance}`)
      this.currencyEngineCallbacks.onBalanceChanged(tk, balance)
    }
    this.tokenCheckBalanceStatus[tk] = 1
    this.updateOnAddressesChecked()
  }

   updateTransaction(
    currencyCode,
    edgeTransaction,
    idx
  ) {
    // Update the transaction
    this.transactionList[currencyCode][idx] = edgeTransaction
    this.transactionListDirty = true
    this.transactionsChangedArray.push(edgeTransaction)
    this.warn(`updateTransaction: ${edgeTransaction.txid}`)
  }

  /**
   * Save the wallet data store.
   */
   async saveWalletLoop() {
    const disklet = this.walletLocalDisklet
    const promises = []
    if (this.transactionListDirty) {
      await this.loadTransactions()
      this.log('transactionListDirty. Saving...')
      let jsonString = JSON.stringify(this.transactionList)
      promises.push(
        disklet.setText(_types3.TRANSACTION_STORE_FILE, jsonString).catch(e => {
          this.error('Error saving transactionList ', e)
        })
      )
      jsonString = JSON.stringify(this.txIdList)
      promises.push(
        disklet.setText(_types3.TXID_LIST_FILE, jsonString).catch(e => {
          this.error('Error saving txIdList ', e)
        })
      )
      jsonString = JSON.stringify(this.txIdMap)
      promises.push(
        disklet.setText(_types3.TXID_MAP_FILE, jsonString).catch(e => {
          this.error('Error saving txIdMap ', e)
        })
      )
      await Promise.all(promises)
      this.transactionListDirty = false
    }
    if (this.walletLocalDataDirty) {
      this.log('walletLocalDataDirty. Saving...')
      this.walletLocalData.otherData = this.otherData
      const jsonString = JSON.stringify(this.walletLocalData)
      await disklet
        .setText(_types3.DATA_STORE_FILE, jsonString)
        .then(() => {
          this.walletLocalDataDirty = false
        })
        .catch(e => {
          this.error('Error saving walletLocalData ', e)
        })
    }
  }

   doInitialBalanceCallback() {
    for (const currencyCode of this.enabledTokens) {
      try {
        this.currencyEngineCallbacks.onBalanceChanged(
          currencyCode,
          _nullishCoalesce(this.walletLocalData.totalBalances[currencyCode], () => ( '0'))
        )
      } catch (e) {
        this.error(
          `doInitialBalanceCallback Error for currencyCode ${currencyCode}`,
          e
        )
      }
    }
  }

   doInitialUnactivatedTokenIdsCallback() {
    try {
      if (
        this.walletLocalData.unactivatedTokenIds != null &&
        this.walletLocalData.unactivatedTokenIds.length > 0
      ) {
        this.currencyEngineCallbacks.onUnactivatedTokenIdsChanged(
          this.walletLocalData.unactivatedTokenIds
        )
      }
    } catch (e) {
      this.error(`doInitialUnactivatedTokenIdsCallback Error`, e)
    }
  }

   async addToLoop(func, timer) {
    try {
      // @ts-expect-error
      await this[func]()
    } catch (e) {
      this.error(`Error in Loop: ${func} `, e)
    }
    if (this.engineOn) {
      this.timers[func] = setTimeout(() => {
        if (this.engineOn) {
          this.addToLoop(func, timer).catch(e => this.log(e.message))
        }
      }, timer)
    }
    return true
  }

  // Called by EthereumNetwork
  getTokenInfo(token) {
    return this.allTokens.find(element => {
      return element.currencyCode === token
    })
  }

  // Called by EthereumNetwork
  updateOnAddressesChecked() {
    if (this.addressesChecked) {
      return
    }

    const activeTokens = this.enabledTokens
    const perTokenSlice = 1 / activeTokens.length
    let totalStatus = 0
    let numComplete = 0
    for (const token of activeTokens) {
      const balanceStatus = _nullishCoalesce(this.tokenCheckBalanceStatus[token], () => ( 0))
      const txStatus = _nullishCoalesce(this.tokenCheckTransactionsStatus[token], () => ( 0))
      totalStatus += ((balanceStatus + txStatus) / 2) * perTokenSlice
      if (balanceStatus === 1 && txStatus === 1) {
        numComplete++
      }
    }
    if (numComplete === activeTokens.length) {
      totalStatus = 1
      this.addressesChecked = true
    }
    this.log(`${this.walletId} syncRatio of: ${totalStatus}`)
    // note that sometimes callback does not get triggered on Android debug
    this.currencyEngineCallbacks.onAddressesChecked(totalStatus)
  }

   async clearBlockchainCache() {
    this.walletLocalData = _types3.asWalletLocalData.call(void 0, {
      publicKey: this.walletLocalData.publicKey
    })
    this.walletLocalDataDirty = true
    this.addressesChecked = false
    this.tokenCheckBalanceStatus = {}
    this.tokenCheckTransactionsStatus = {}
    this.transactionList = {}
    this.txIdList = {}
    this.txIdMap = {}
    this.transactionListDirty = true
    this.setOtherData({})
    await this.saveWalletLoop()
  }

  // *************************************
  // Public methods
  // *************************************

  async startEngine() {
    this.addToLoop('saveWalletLoop', SAVE_DATASTORE_MILLISECONDS).catch(
      () => {}
    )
  }

  async killEngine() {
    // Set status flag to false
    this.engineOn = false
    // Clear Inner loops timers
    for (const timer in this.timers) {
      clearTimeout(this.timers[timer])
    }
    this.timers = {}
  }

  async changeUserSettings(userSettings) {
    this.currentSettings = userSettings
  }

  getBlockHeight() {
    return this.walletLocalData.blockHeight
  }

   changeCustomTokensSync(customTokens) {
    this.customTokens = {}
    for (const tokenId of Object.keys(customTokens)) {
      const token = customTokens[tokenId]
      try {
        _tokenHelpers.validateToken.call(void 0, token)
      } catch (e) {
        this.log.warn(
          `Dropping custom token "${token.currencyCode}" / ${tokenId}`
        )
        continue
      }
      this.customTokens[tokenId] = token
    }

    this.allTokensMap = { ...this.customTokens, ...this.builtinTokens }
    this.allTokens = _tokenHelpers.makeMetaTokens.call(void 0, this.allTokensMap)
  }

  async changeCustomTokens(tokens) {
    this.changeCustomTokensSync(tokens)
  }

   changeEnabledTokenIdsSync(tokenIds) {
    const { currencyCode } = this.currencyInfo

    const codes = new Set()
    const ids = new Set()
    for (const tokenId of tokenIds) {
      const token = this.allTokensMap[tokenId]
      if (token == null) continue

      codes.add(token.currencyCode)
      ids.add(tokenId)
    }

    this.enabledTokens = [...codes, currencyCode]
    this.enabledTokenIds = [...ids]
  }

  async changeEnabledTokenIds(tokenIds) {
    this.changeEnabledTokenIdsSync(tokenIds)
  }

  getBalance(options) {
    const { currencyCode = this.currencyInfo.currencyCode } = options

    const nativeBalance = this.walletLocalData.totalBalances[currencyCode]
    if (nativeBalance == null) {
      return '0'
    }
    return nativeBalance
  }

  getNumTransactions(options) {
    const { currencyCode = this.currencyInfo.currencyCode } = options

    if (this.walletLocalData.numTransactions[currencyCode] == null) {
      return 0
    } else {
      return this.walletLocalData.numTransactions[currencyCode]
    }
  }

  async getTransactions(
    options
  ) {
    const { currencyCode = this.currencyInfo.currencyCode } = options

    await this.loadTransactions()

    if (this.transactionList[currencyCode] == null) {
      return []
    }

    let startIndex = 0
    let startEntries = 0
    if (options === null) {
      return this.transactionList[currencyCode].slice(0)
    }
    if (options.startIndex != null && options.startIndex > 0) {
      startIndex = options.startIndex
      if (startIndex >= this.transactionList[currencyCode].length) {
        startIndex = this.transactionList[currencyCode].length - 1
      }
    }
    if (options.startEntries != null && options.startEntries > 0) {
      startEntries = options.startEntries
      if (
        startEntries + startIndex >
        this.transactionList[currencyCode].length
      ) {
        // Don't read past the end of the transactionList
        startEntries = this.transactionList[currencyCode].length - startIndex
      }
    }

    // Copy the appropriate entries from the arrayTransactions
    let returnArray = []

    if (startEntries !== 0) {
      returnArray = this.transactionList[currencyCode].slice(
        startIndex,
        startEntries + startIndex
      )
    } else {
      returnArray = this.transactionList[currencyCode].slice(startIndex)
    }
    return returnArray
  }

  async getFreshAddress(_options) {
    return { publicAddress: this.walletLocalData.publicKey }
  }

  async addGapLimitAddresses(_addresses) {}

  async isAddressUsed(_address) {
    return false
  }

  async dumpData() {
    const dataDump = {
      walletId: this.walletId.split(' - ')[0],
      walletType: this.walletInfo.type,
      data: {
        pluginType: { pluginId: this.currencyInfo.pluginId },
        walletLocalData: this.walletLocalData
      }
    }
    return dataDump
  }

  makeSpendCheck(edgeSpendInfo)





 {
    const { skipChecks = false } = edgeSpendInfo

    for (const st of edgeSpendInfo.spendTargets) {
      if (!skipChecks && st.publicAddress === this.walletLocalData.publicKey) {
        throw new (0, _types.SpendToSelfError)()
      }
    }

    let currencyCode = ''
    if (typeof edgeSpendInfo.currencyCode === 'string') {
      currencyCode = edgeSpendInfo.currencyCode
      if (currencyCode !== this.currencyInfo.currencyCode) {
        if (!this.enabledTokens.includes(currencyCode)) {
          throw new Error('Error: Token not supported or enabled')
        }
      }
    } else {
      currencyCode = this.currencyInfo.currencyCode
    }

    const nativeBalance =
      _nullishCoalesce(this.walletLocalData.totalBalances[currencyCode], () => ( '0'))

    // Bucket all spendTarget nativeAmounts by currencyCode
    const spendAmountMap = {}
    for (const spendTarget of edgeSpendInfo.spendTargets) {
      const { nativeAmount } = spendTarget
      if (nativeAmount == null) continue
      spendAmountMap[currencyCode] = _nullishCoalesce(spendAmountMap[currencyCode], () => ( '0'))
      spendAmountMap[currencyCode] = _biggystring.add.call(void 0, 
        spendAmountMap[currencyCode],
        nativeAmount
      )
    }

    // Check each spend amount against relevant balance
    for (const [currencyCode, nativeAmount] of Object.entries(spendAmountMap)) {
      const nativeBalance =
        _nullishCoalesce(this.walletLocalData.totalBalances[currencyCode], () => ( '0'))
      if (!skipChecks && _biggystring.lt.call(void 0, nativeBalance, nativeAmount)) {
        throw new (0, _types.InsufficientFundsError)()
      }
    }

    edgeSpendInfo.currencyCode = currencyCode
    const denom = _utils.getDenomination.call(void 0, 
      currencyCode,
      this.currencyInfo,
      this.allTokensMap
    )
    if (denom == null) {
      throw new Error('InternalErrorInvalidCurrencyCode')
    }

    return { edgeSpendInfo, nativeBalance, currencyCode, denom, skipChecks }
  }

  async checkRecipientMinimumBalance(
    getBalance,
    sendAmount,
    recipient
  ) {
    if (_biggystring.gte.call(void 0, sendAmount, this.minimumAddressBalance)) return

    const balance = await getBalance(recipient)
    if (_biggystring.lt.call(void 0, _biggystring.add.call(void 0, sendAmount, balance), this.minimumAddressBalance)) {
      const denom = this.currencyInfo.denominations.find(
        denom => denom.name === this.currencyInfo.currencyCode
      )
      if (denom == null) throw new Error('Unknown denom')

      const exchangeDenomString = _biggystring.div.call(void 0, 
        this.minimumAddressBalance,
        denom.multiplier
      )
      throw new Error(
        `Recipient address not activated. A minimum ${exchangeDenomString} ${this.currencyInfo.currencyCode} transfer is required to send funds to this address`
      )
    }
  }

  // called by GUI after sliding to confirm
  async saveTx(edgeTransaction) {
    // add the transaction to disk and fire off callback (alert in GUI)
    this.addTransaction(edgeTransaction.currencyCode, edgeTransaction)
    this.transactionsChangedArray.forEach(tx =>
      this.warn(
        `executing back in saveTx and this.transactionsChangedArray is: ${_utils.cleanTxLogs.call(void 0, 
          tx
        )}`
      )
    )

    if (this.transactionsChangedArray.length > 0) {
      this.currencyEngineCallbacks.onTransactionsChanged(
        this.transactionsChangedArray
      )
    }
  }

  //
  // Virtual functions to be override by extension:
  //

  async resyncBlockchain() {
    throw new Error('not implemented')
  }

  async makeSpend(
    edgeSpendInfoIn,
    opts
  ) {
    throw new Error('not implemented')
  }

  async signTx(
    edgeTransaction,
    privateKeys
  ) {
    throw new Error('not implemented')
  }

  async broadcastTx(
    edgeTransaction,
    opts
  ) {
    throw new Error('not implemented')
  }
} exports.CurrencyEngine = CurrencyEngine;
