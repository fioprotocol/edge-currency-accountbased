"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } async function _asyncNullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return await rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _fiosdk = require('@fioprotocol/fiosdk');
var _EndPoint = require('@fioprotocol/fiosdk/lib/entities/EndPoint');






var _Transactions = require('@fioprotocol/fiosdk/lib/transactions/Transactions');
var _biggystring = require('biggystring');
var _cleaners = require('cleaners');













var _types = require('edge-core-js/types');

var _CurrencyEngine = require('../common/CurrencyEngine');

var _upgradeMemos = require('../common/upgradeMemos');











var _utils = require('../common/utils');




















var _fioConst = require('./fioConst');
var _fioError = require('./fioError');






var _fioSchema = require('./fioSchema');
































var _fioTypes = require('./fioTypes');

const ADDRESS_POLL_MILLISECONDS = 10000
const BLOCKCHAIN_POLL_MILLISECONDS = 15000
const TRANSACTION_POLL_MILLISECONDS = 10000
const PROCESS_TX_NAME_LIST = [
  _fioConst.ACTIONS_TO_TX_ACTION_NAME[_fioConst.ACTIONS.transferTokens],
  _fioConst.ACTIONS_TO_TX_ACTION_NAME[_fioConst.ACTIONS.unStakeFioTokens],
  'regaddress'
]
// const SYNC_NETWORK_INTERVAL = 10000








 class FioEngine extends _CurrencyEngine.CurrencyEngine {
  
  
  
  
  
  
  
  
  

  localDataDirty() {
    this.walletLocalDataDirty = true
  }

  constructor(
    env,
    tools,
    walletInfo,
    opts,
    tpid
  ) {
    super(env, tools, walletInfo, opts);FioEngine.prototype.__init.call(this);FioEngine.prototype.__init2.call(this);
    this.fetchCors = _utils.getFetchCors.call(void 0, env.io)
    this.tpid = tpid
    this.networkInfo = env.networkInfo
    this.refBlock = {
      expiration: '',
      ref_block_num: 0,
      ref_block_prefix: 0
    }
    this.fees = new Map()
    this.actor = _fiosdk.FIOSDK.accountHash(this.walletInfo.keys.publicKey).accountnm
    this.obtData = []

    this.otherMethods = {
      fioAction: async (actionName, params) => {
        return await this.multicastServers(actionName, params)
      },
      getFioAddresses: async () => {
        return this.otherData.fioAddresses
      },
      getFioAddressNames: async () => {
        return this.otherData.fioAddresses.map(fioAddress => fioAddress.name)
      },
      getFioDomains: async () => {
        return this.otherData.fioDomains
      },
      getFioRequests: async (
        type,
        page,
        itemsPerPage = 50
      ) => {
        const startIndex = itemsPerPage * (page - 1)
        const endIndex = itemsPerPage * page
        return this.otherData.fioRequests[type]
          .sort((a, b) => (a.time_stamp < b.time_stamp ? 1 : -1))
          .slice(startIndex, endIndex)
      },
      getObtData: async () => {
        return this.obtData
      }
    }
  }

  setOtherData(raw) {
    this.otherData = _fioConst.asFioWalletOtherData.call(void 0, raw)
  }

  // Normalize date if not exists "Z" parameter
  getUTCDate(dateString) {
    const date = new Date(dateString)

    return Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    )
  }

  /*
  Unstaked FIO is locked until 7 days after the start of the GMT day for when
  the transaction occurred (block-time).
  */
  getUnlockDate(txDate) {
    const blockTimeBeginingOfGmtDay =
      Math.floor(txDate.getTime() / _fioConst.DAY_INTERVAL) * _fioConst.DAY_INTERVAL
    return new Date(blockTimeBeginingOfGmtDay + _fioConst.STAKING_LOCK_PERIOD)
  }

  // Poll on the blockheight
  async checkBlockchainInnerLoop() {
    try {
      const info = await this.multicastServers('getChainInfo')
      const blockHeight = info.head_block_num
      if (this.walletLocalData.blockHeight !== blockHeight) {
        this.checkDroppedTransactionsThrottled()
        this.walletLocalData.blockHeight = blockHeight
        this.localDataDirty()
        this.currencyEngineCallbacks.onBlockHeightChanged(
          this.walletLocalData.blockHeight
        )
      }

      const block = await this.multicastServers('getBlock', info)
      const expiration = new Date(`${info.head_block_time}Z`)
      expiration.setSeconds(expiration.getSeconds() + 180)
      const expirationStr = expiration.toISOString()

      this.refBlock = {
        expiration: expirationStr.substring(0, expirationStr.length - 1),
        ref_block_num: block.block_num & 0xffff,
        ref_block_prefix: block.ref_block_prefix
      }
    } catch (e) {
      this.error(`checkBlockchainInnerLoop Error fetching height: `, e)
    }
  }

  getBalance(options) {
    return super.getBalance(options)
  }

  doInitialBalanceCallback() {
    super.doInitialBalanceCallback()

    const balanceCurrencyCodes = this.networkInfo.balanceCurrencyCodes
    for (const currencyCodeKey of Object.values(balanceCurrencyCodes)) {
      try {
        this.currencyEngineCallbacks.onBalanceChanged(
          currencyCodeKey,
          _nullishCoalesce(this.walletLocalData.totalBalances[currencyCodeKey], () => ( '0'))
        )
      } catch (e) {
        this.log.error(
          'doInitialBalanceCallback Error for currencyCode',
          currencyCodeKey,
          e
        )
      }
    }

    try {
      this.currencyEngineCallbacks.onStakingStatusChanged({
        ...this.otherData.stakingStatus
      })
    } catch (e) {
      this.error(`doInitialBalanceCallback onStakingStatusChanged`, e)
    }
  }

  checkUnStakeTx(otherParams) {
    return (
      otherParams.name ===
        _fioConst.ACTIONS_TO_TX_ACTION_NAME[_fioConst.ACTIONS.unStakeFioTokens] ||
      (otherParams.data != null &&
        otherParams.data.memo === _fioConst.STAKING_REWARD_MEMO)
    )
  }

  updateStakingStatus(
    nativeAmount,
    blockTime,
    txId,
    txName
  ) {
    const unlockDate = this.getUnlockDate(new Date(this.getUTCDate(blockTime)))

    /*
    Compare each stakedAmount's unlockDate with the transaction's unlockDate to
    find the correct stakedAmount object to place where the transaction.
    */
    const stakedAmountIndex =
      this.otherData.stakingStatus.stakedAmounts.findIndex(stakedAmount => {
        return _optionalChain([stakedAmount, 'access', _2 => _2.unlockDate, 'optionalAccess', _3 => _3.getTime, 'call', _4 => _4()]) === unlockDate.getTime()
      })

    /*
    If no stakedAmount object was found, then insert a new object into the
    stakedAmounts array. Insert into the array at the correct index maintaining
    a sorting by unlockDate in descending order.
    */
    if (stakedAmountIndex < 0) {
      // Search for the correct index to insert the new stakedAmount object
      const needleIndex = this.otherData.stakingStatus.stakedAmounts.findIndex(
        stakedAmount =>
          unlockDate.getTime() >= (_nullishCoalesce(_optionalChain([stakedAmount, 'access', _5 => _5.unlockDate, 'optionalAccess', _6 => _6.getTime, 'call', _7 => _7()]), () => ( 0)))
      )
      // If needleIndex is -1 (not found), then insert into the end of the array
      const index =
        needleIndex < 0
          ? this.otherData.stakingStatus.stakedAmounts.length
          : needleIndex
      // Insert the new stakedAmount object
      this.otherData.stakingStatus.stakedAmounts.splice(index, 0, {
        nativeAmount,
        unlockDate,
        otherParams: {
          date: new Date(blockTime),
          txs: [{ txId, nativeAmount, blockTime, txName }]
        }
      })
    } else {
      const stakedAmount = {
        ...this.otherData.stakingStatus.stakedAmounts[stakedAmountIndex],
        nativeAmount: '0'
      }
      const addedTxIndex = stakedAmount.otherParams.txs.findIndex(
        // @ts-expect-error
        ({ txId: itemTxId, txName: itemTxName }) =>
          itemTxId === txId && itemTxName === txName
      )

      if (addedTxIndex < 0) {
        stakedAmount.otherParams.txs.push({
          txId,
          nativeAmount,
          blockTime,
          txName
        })
      } else {
        stakedAmount.otherParams.txs[addedTxIndex] = {
          txId,
          nativeAmount,
          blockTime,
          txName
        }
      }

      for (const tx of stakedAmount.otherParams.txs) {
        stakedAmount.nativeAmount = _biggystring.add.call(void 0, 
          stakedAmount.nativeAmount,
          tx.nativeAmount
        )
      }

      this.otherData.stakingStatus.stakedAmounts[stakedAmountIndex] =
        stakedAmount
    }

    this.localDataDirty()
    try {
      this.currencyEngineCallbacks.onStakingStatusChanged({
        ...this.otherData.stakingStatus
      })
    } catch (e) {
      this.error('onStakingStatusChanged error')
    }
  }

  async getStakingStatus() {
    return { ...this.otherData.stakingStatus }
  }

  processTransaction(
    action,
    actor,
    currencyCode = this.currencyInfo.currencyCode
  ) {
    const {
      act: { name: trxName, data, account, authorization }
    } = action.action_trace
    let nativeAmount
    let actorSender
    let networkFee = '0'
    let otherParams = {
      account,
      name: trxName,
      authorization,
      data,
      meta: {}
    }
    const ourReceiveAddresses = []
    if (action.block_num <= this.otherData.highestTxHeight) {
      return action.block_num
    }

    // Transfer funds transaction
    if (PROCESS_TX_NAME_LIST.includes(trxName)) {
      nativeAmount = '0'

      if (trxName === 'regaddress') {
        // The action must have been authorized by the engine's actor in order
        // for use to consider this a spend transaction.
        // Otherwise, we should ignore regaddress actions which are received
        // address, until we have some metadata explaining the receive.
        if (
          action.action_trace.act.authorization.some(
            auth => auth.actor === this.actor
          )
        ) {
          networkFee = String(_nullishCoalesce(action.action_trace.act.data.max_fee, () => ( 0)))
          nativeAmount = `-${networkFee}`
        }
      }

      if (
        trxName === _fioConst.ACTIONS_TO_TX_ACTION_NAME[_fioConst.ACTIONS.transferTokens] &&
        data.amount != null
      ) {
        nativeAmount = data.amount.toString()
        actorSender = data.actor
        if (data.payee_public_key === this.walletInfo.keys.publicKey) {
          ourReceiveAddresses.push(this.walletInfo.keys.publicKey)
          if (actorSender === actor) {
            nativeAmount = '0'
          }
        } else {
          nativeAmount = `-${nativeAmount}`
        }
      }

      const index = this.findTransaction(
        currencyCode,
        action.action_trace.trx_id
      )
      // Check if fee transaction have already added
      if (index > -1) {
        const existingTrx = this.transactionList[currencyCode][index]
        otherParams = {
          ...existingTrx.otherParams,
          ...otherParams,
          data: {
            ...(_nullishCoalesce(_optionalChain([existingTrx, 'access', _8 => _8.otherParams, 'optionalAccess', _9 => _9.data]), () => ( {}))),
            ...otherParams.data
          },
          meta: {
            ...(_nullishCoalesce(_optionalChain([existingTrx, 'access', _10 => _10.otherParams, 'optionalAccess', _11 => _11.meta]), () => ( {}))),
            ...otherParams.meta
          }
        }

        if (otherParams.meta.isTransferProcessed != null) {
          return action.block_num
        }
        if (otherParams.meta.isFeeProcessed != null) {
          if (trxName === _fioConst.ACTIONS_TO_TX_ACTION_NAME[_fioConst.ACTIONS.transferTokens]) {
            nativeAmount = _biggystring.sub.call(void 0, nativeAmount, existingTrx.networkFee)
            networkFee = existingTrx.networkFee
          } else {
            nativeAmount = existingTrx.nativeAmount
            networkFee = '0'
          }
        } else {
          this.error(
            'processTransaction error - existing spend transaction should have isTransferProcessed or isFeeProcessed set'
          )
        }
      }

      if (this.checkUnStakeTx(otherParams)) {
        this.updateStakingStatus(
          data.amount != null ? data.amount.toString() : '0',
          action.block_time,
          action.action_trace.trx_id,
          trxName
        )
      }

      otherParams.meta.isTransferProcessed = true

      const edgeTransaction = {
        blockHeight: action.block_num > 0 ? action.block_num : 0,
        currencyCode,
        date: this.getUTCDate(action.block_time) / 1000,
        isSend: nativeAmount.startsWith('-'),
        memos: [],
        nativeAmount,
        networkFee,
        otherParams,
        ourReceiveAddresses,
        signedTx: '',
        txid: action.action_trace.trx_id,
        walletId: this.walletId
      }
      this.addTransaction(currencyCode, edgeTransaction)
    }

    // Fee / Reward transaction
    if (
      trxName === _fioConst.ACTIONS_TO_TX_ACTION_NAME.transfer &&
      data.quantity != null
    ) {
      const [amount] = data.quantity.split(' ')
      const exchangeAmount = amount.toString()
      const denom = _utils.getDenomination.call(void 0, 
        currencyCode,
        this.currencyInfo,
        this.allTokensMap
      )
      if (denom == null) {
        this.error(`Received unsupported currencyCode: ${currencyCode}`)
        return 0
      }

      const fioAmount = _biggystring.mul.call(void 0, exchangeAmount, denom.multiplier)
      if (data.to === actor) {
        nativeAmount = `${fioAmount}`
        networkFee = `-${fioAmount}`
      } else {
        nativeAmount = `-${fioAmount}`
        networkFee = fioAmount
      }

      const index = this.findTransaction(
        currencyCode,
        action.action_trace.trx_id
      )
      // Check if transfer transaction have already added
      if (index > -1) {
        const existingTrx = this.transactionList[currencyCode][index]
        otherParams = {
          ...otherParams,
          ...existingTrx.otherParams,
          data: {
            ...otherParams.data,
            ...(_nullishCoalesce(_optionalChain([existingTrx, 'access', _12 => _12.otherParams, 'optionalAccess', _13 => _13.data]), () => ( {})))
          },
          meta: {
            ...otherParams.meta,
            ...(_nullishCoalesce(_optionalChain([existingTrx, 'access', _14 => _14.otherParams, 'optionalAccess', _15 => _15.meta]), () => ( {})))
          }
        }
        if (otherParams.meta.isFeeProcessed != null) {
          return action.block_num
        }
        if (otherParams.meta.isTransferProcessed != null) {
          if (data.to !== actor) {
            nativeAmount = _biggystring.sub.call(void 0, existingTrx.nativeAmount, networkFee)
          } else {
            networkFee = '0'
          }
        } else {
          this.error(
            'processTransaction error - existing spend transaction should have isTransferProcessed or isFeeProcessed set'
          )
        }
      }

      if (this.checkUnStakeTx(otherParams)) {
        this.updateStakingStatus(
          fioAmount,
          action.block_time,
          action.action_trace.trx_id,
          trxName
        )
      }

      otherParams.meta.isFeeProcessed = true
      const edgeTransaction = {
        blockHeight: action.block_num > 0 ? action.block_num : 0,
        currencyCode,
        date: this.getUTCDate(action.block_time) / 1000,
        isSend: nativeAmount.startsWith('-'),
        memos: [],
        nativeAmount,
        networkFee,
        otherParams,
        ourReceiveAddresses: [],
        signedTx: '',
        txid: action.action_trace.trx_id,
        walletId: this.walletId
      }
      this.addTransaction(currencyCode, edgeTransaction)
    }

    return action.block_num
  }

  async getSortedHistoryNodesLastActionSeqNumbers()

 {
    const promises =
      this.networkInfo.historyNodeUrls.map(async (_, nodeIndex) => {
        try {
          const lastActionObject = await this.requestHistory(
            nodeIndex,
            {
              account_name: this.actor,
              pos: -1
            },
            _fioConst.HISTORY_NODE_ACTIONS.getActions
          )

          // I don't fully understand what this error check is for, but it's
          // carried over from a refactoring. I believe it's identical to saying
          // that the node has no actions for the account.
          if (_optionalChain([lastActionObject, 'optionalAccess', _16 => _16.error, 'optionalAccess', _17 => _17.noNodeForIndex]) != null) {
            // no more history nodes left; return no sequence number
            return { nodeIndex, seqNumber: -1 }
          }

          _fioSchema.asHistoryResponse.call(void 0, lastActionObject)
          if (lastActionObject.actions.length === 0) {
            // if no transactions at all
            return { nodeIndex, seqNumber: -1 }
          }

          // Return last action's sequence number
          return {
            nodeIndex,
            seqNumber:
              lastActionObject.actions[lastActionObject.actions.length - 1]
                .account_action_seq
          }
        } catch (error) {
          // Node failed, so it return's no sequence number
          return { nodeIndex, seqNumber: -1 }
        }
      })

    const historyNodesSeqNumbers = await Promise.all(promises)
    historyNodesSeqNumbers.sort((a, b) => b.seqNumber - a.seqNumber)
    return historyNodesSeqNumbers
  }

  async checkTransactions(
    historyNodesSeqNumbers



  ) {
    if (_optionalChain([historyNodesSeqNumbers, 'optionalAccess', _18 => _18.length]) === 0) {
      // We've checked all history nodes, so return a fail
      return false
    }

    historyNodesSeqNumbers =
      await _asyncNullishCoalesce(historyNodesSeqNumbers, async () => (
      (await this.getSortedHistoryNodesLastActionSeqNumbers())))

    if (
      historyNodesSeqNumbers.reduce((sum, node) => sum + node.seqNumber, 0) ===
      -historyNodesSeqNumbers.length
    ) {
      // All nodes agree there are no actions for the account
      return true
    }

    let newHighestTxHeight = this.otherData.highestTxHeight

    const lastActionSeqNumber = historyNodesSeqNumbers[0].seqNumber
    const historyNodeIndex = historyNodesSeqNumbers[0].nodeIndex

    let pos = Math.max(0, lastActionSeqNumber - _fioConst.HISTORY_NODE_PAGE_SIZE + 1)
    let finish = false

    while (!finish) {
      let actionsObject
      try {
        actionsObject = await this.requestHistory(
          historyNodeIndex,
          {
            account_name: this.actor,
            pos,
            offset: _fioConst.HISTORY_NODE_PAGE_SIZE - 1
          },
          _fioConst.HISTORY_NODE_ACTIONS.getActions
        )
        if (_optionalChain([actionsObject, 'access', _19 => _19.error, 'optionalAccess', _20 => _20.noNodeForIndex]) != null) {
          return false
        }

        let actions = []

        if (_optionalChain([actionsObject, 'access', _21 => _21.actions, 'optionalAccess', _22 => _22.length]) > 0) {
          actions = actionsObject.actions
        } else {
          break
        }

        for (let i = actions.length - 1; i > -1; i--) {
          const action = actions[i]
          _fioSchema.asFioHistoryNodeAction.call(void 0, action)
          const blockNum = this.processTransaction(action, this.actor)

          if (blockNum > newHighestTxHeight) {
            newHighestTxHeight = blockNum
          } else if (
            (blockNum === newHighestTxHeight &&
              i === _fioConst.HISTORY_NODE_PAGE_SIZE - 1) ||
            blockNum < this.otherData.highestTxHeight
          ) {
            finish = true
            break
          }
        }

        // If this was the last page, break out of the paging loop.
        // Otherwise, adjust the position and continue.
        if (pos === 0) {
          break
        } else {
          // We're paging backwards, so subtract the offset but prevent negative
          // overflow because that changes the query mode in the FIO History API
          pos = Math.max(0, pos - _fioConst.HISTORY_NODE_PAGE_SIZE)
          continue
        }
      } catch (e) {
        // Failing to page through all actions with the first node mean's we
        // should retry with the next node in the list.
        return await this.checkTransactions(historyNodesSeqNumbers.slice(1))
      }
    }
    if (newHighestTxHeight > this.otherData.highestTxHeight) {
      this.otherData.highestTxHeight = newHighestTxHeight
      this.localDataDirty()
    }
    return true
  }

  async checkTransactionsInnerLoop() {
    let transactions
    try {
      transactions = await this.checkTransactions()
    } catch (e) {
      this.error('checkTransactionsInnerLoop fetches failed with error: ', e)
      return
    }

    if (transactions) {
      this.tokenCheckTransactionsStatus.FIO = 1
      this.updateOnAddressesChecked()
    }
    if (this.transactionsChangedArray.length > 0) {
      this.currencyEngineCallbacks.onTransactionsChanged(
        this.transactionsChangedArray
      )
      this.transactionsChangedArray = []
    }
  }

  async requestHistory(
    nodeIndex,
    params



,
    uri
  ) {
    if (this.networkInfo.historyNodeUrls[nodeIndex] == null)
      return { error: { noNodeForIndex: true } }
    const apiUrl = this.networkInfo.historyNodeUrls[nodeIndex]
    const body = JSON.stringify(params)
    const result = await fetch(`${apiUrl}history/${uri}`, {
      method: 'POST',
      headers: {
        // Explicit content length is needed to make the FIO server return
        // the correct action's length for some reason.
        'Content-Length': (body.length * 2).toString(),
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body
    })
    return await result.json()
  }

  async fioApiRequest(
    apiUrl,
    actionName,
    params,
    returnPreparedTrx = false
  ) {
    const fioSdk = new (0, _fiosdk.FIOSDK)(
      '',
      this.walletInfo.keys.publicKey,
      apiUrl,
      this.fetchCors,
      undefined,
      this.tpid,
      returnPreparedTrx
    )

    let res

    try {
      switch (actionName) {
        case 'getChainInfo':
          res = await fioSdk.transactions.getChainInfo()
          break
        case 'getBlock':
          res = await fioSdk.transactions.getBlock(params)
          break
        case 'getObtData':
        case 'getPendingFioRequests':
        case 'getSentFioRequests': {
          const { endpoint, body } = params
          res = await fioSdk.transactions.executeCall(
            endpoint,
            JSON.stringify(body)
          )
          break
        }
        default:
          res = await fioSdk.genericAction(actionName, params)
      }
    } catch (e) {
      // handle FIO API error
      if (e.errorCode != null && _fioError.fioApiErrorCodes.includes(e.errorCode)) {
        if (_optionalChain([e, 'access', _23 => _23.json, 'optionalAccess', _24 => _24.fields, 'optionalAccess', _25 => _25[0], 'optionalAccess', _26 => _26.error]) != null) {
          e.message = e.json.fields[0].error
        }
        res = {
          isError: true,
          data: {
            code: e.errorCode,
            message: _nullishCoalesce(e.message, () => ( _utils.safeErrorMessage.call(void 0, e))),
            json: e.json,
            list: e.list
          }
        }
        if (e.errorCode !== 404)
          this.log(
            `fioApiRequest error. actionName: ${actionName} - apiUrl: ${apiUrl} - message: ${JSON.stringify(
              e.json
            )}`
          )
      } else {
        this.log(
          `fioApiRequest error. actionName: ${actionName} - apiUrl: ${apiUrl} - message: `,
          e
        )
        throw e
      }
    }

    return res
  }

  async executePreparedTrx(
    apiUrl,
    endpoint,
    preparedTrx
  ) {
    const fioSdk = new (0, _fiosdk.FIOSDK)(
      '',
      this.walletInfo.keys.publicKey,
      apiUrl,
      this.fetchCors,
      undefined,
      this.tpid,
      true
    )

    let res

    this.warn(
      `executePreparedTrx. preparedTrx: ${JSON.stringify(
        preparedTrx
      )} - apiUrl: ${apiUrl}`
    )
    try {
      res = await fioSdk.executePreparedTrx(endpoint, preparedTrx)
      this.warn(
        `executePreparedTrx. res: ${JSON.stringify(
          res
        )} - apiUrl: ${apiUrl} - endpoint: ${endpoint}`
      )
    } catch (e) {
      // handle FIO API error
      if (e.errorCode != null && _fioError.fioApiErrorCodes.includes(e.errorCode)) {
        this.log(
          `executePreparedTrx error. requestParams: ${JSON.stringify(
            preparedTrx
          )} - apiUrl: ${apiUrl} - endpoint: ${endpoint} - message: ${JSON.stringify(
            e.json
          )}`
        )
        if (_optionalChain([e, 'access', _27 => _27.json, 'optionalAccess', _28 => _28.fields, 'optionalAccess', _29 => _29[0], 'optionalAccess', _30 => _30.error]) != null) {
          e.message = e.json.fields[0].error
        }
        throw e
      } else {
        this.log(
          `executePreparedTrx error. requestParams: ${JSON.stringify(
            preparedTrx
          )} - apiUrl: ${apiUrl} - endpoint: ${endpoint} - message: `,
          e
        )
        throw e
      }
    }

    return res
  }

  async multicastServers(actionName, params) {
    let res
    if (_fioConst.BROADCAST_ACTIONS[actionName]) {
      const preparedTrx = _fioTypes.asFioSignedTx.call(void 0, params)
      this.warn(
        `multicastServers executePreparedTrx. actionName: ${actionName} - res: ${JSON.stringify(
          preparedTrx
        )}`
      )
      res = await _utils.promiseAny.call(void 0, 
        _utils.shuffleArray.call(void 0, 
          this.networkInfo.apiUrls.map(
            async apiUrl =>
              await _utils.timeout.call(void 0, 
                this.executePreparedTrx(
                  apiUrl,
                  _EndPoint.EndPoint[_fioConst.ACTIONS_TO_END_POINT_KEYS[actionName]],
                  preparedTrx
                ),
                10000
              )
          )
        )
      )
      this.warn(
        `multicastServers res. actionName: ${actionName} - res: ${JSON.stringify(
          res
        )}`
      )
      if (res == null) {
        throw new Error('Service is unavailable')
      }
    } else if (actionName === 'getFioNames') {
      res = await _utils.promiseNy.call(void 0, 
        this.networkInfo.apiUrls.map(
          async apiUrl =>
            await _utils.timeout.call(void 0, this.fioApiRequest(apiUrl, actionName, params), 10000)
        ),
        (result) => {
          const errorResponse = _fioTypes.asFioNothingResponse.call(void 0, (0, _fioConst.NO_FIO_NAMES))(result)
          if (errorResponse != null) return errorResponse.data.json.message
          return _fioTypes.comparisonFioNameString.call(void 0, result)
        },
        2
      )
      if (_optionalChain([res, 'optionalAccess', _31 => _31.data, 'optionalAccess', _32 => _32.json, 'optionalAccess', _33 => _33.message]) === _fioConst.NO_FIO_NAMES) {
        res = { fio_domains: [], fio_addresses: [] }
      }
    } else if (actionName === 'getFioBalance') {
      res = await _utils.promiseNy.call(void 0, 
        this.networkInfo.apiUrls.map(
          async apiUrl =>
            await _utils.timeout.call(void 0, this.fioApiRequest(apiUrl, actionName, params), 10000)
        ),
        (result) => {
          const errorResponse =
            _fioTypes.asFioNothingResponse.call(void 0, (0, _fioConst.PUBLIC_KEY_NOT_FOUND))(result)
          if (errorResponse != null) return errorResponse.data.json.message
          return _fioTypes.comparisonFioBalanceString.call(void 0, result)
        },
        2
      )
      if (_optionalChain([res, 'optionalAccess', _34 => _34.data, 'optionalAccess', _35 => _35.json, 'optionalAccess', _36 => _36.message]) === _fioConst.PUBLIC_KEY_NOT_FOUND) {
        res = { balance: 0, available: 0, staked: 0, srps: 0, roe: '' }
      }
    } else if (actionName === 'getFees') {
      res = await _utils.asyncWaterfall.call(void 0, 
        _utils.shuffleArray.call(void 0, 
          this.networkInfo.apiUrls.map(apiUrl => async () => {
            const fioSdk = new (0, _fiosdk.FIOSDK)(
              '',
              this.walletInfo.keys.publicKey,
              apiUrl,
              this.fetchCors,
              undefined,
              this.tpid
            )
            const { endpoint, param } = params

            const res = await fioSdk.getFee(endpoint, param)
            const fee = _fioTypes.asFioFee.call(void 0, res).fee

            return fee.toString()
          })
        )
      )
    } else {
      res = await _utils.asyncWaterfall.call(void 0, 
        _utils.shuffleArray.call(void 0, 
          this.networkInfo.apiUrls.map(
            apiUrl => async () =>
              await this.fioApiRequest(apiUrl, actionName, params)
          )
        )
      )
    }

    if (res.isError != null) {
      const error = new (0, _fioError.FioError)(_nullishCoalesce(res.errorMessage, () => ( res.data.message)))
      error.json = res.data.json
      error.list = res.data.list
      error.errorCode = res.data.code

      throw error
    }

    return res
  }

  // Check all account balance and other relevant info
  async checkAccountInnerLoop() {
    const currencyCode = this.currencyInfo.currencyCode
    const balanceCurrencyCodes = this.networkInfo.balanceCurrencyCodes

    // Initialize balance
    if (
      typeof this.walletLocalData.totalBalances[currencyCode] === 'undefined'
    ) {
      this.updateBalance(currencyCode, '0')
    }

    // Balance
    try {
      const balances = { staked: '0', locked: '0' }
      const { balance, available, staked, srps, roe } = _fioSchema.asGetFioBalanceResponse.call(void 0, 
        await this.multicastServers('getFioBalance')
      )
      const nativeAmount = String(balance)
      balances.staked = String(staked)
      balances.locked = _biggystring.sub.call(void 0, nativeAmount, String(available))

      this.otherData.srps = srps
      this.otherData.stakingRoe = roe

      this.updateBalance(currencyCode, nativeAmount)
      this.updateBalance(balanceCurrencyCodes.staked, balances.staked)
      this.updateBalance(balanceCurrencyCodes.locked, balances.locked)
    } catch (e) {
      this.log.warn('checkAccountInnerLoop getFioBalance error: ', e)
    }

    // Fio Addresses
    try {
      const result = _fioSchema.asGetFioName.call(void 0, 
        await this.multicastServers('getFioNames', {
          fioPublicKey: this.walletInfo.keys.publicKey
        })
      )

      let isChanged = false
      let areAddressesChanged = false
      let areDomainsChanged = false

      // check addresses
      if (result.fio_addresses.length !== this.otherData.fioAddresses.length) {
        areAddressesChanged = true
      } else {
        for (const fioAddress of result.fio_addresses) {
          const existedFioAddress = this.otherData.fioAddresses.find(
            existedFioAddress =>
              existedFioAddress.name === fioAddress.fio_address
          )
          if (existedFioAddress != null) {
            if (
              existedFioAddress.bundledTxs !== fioAddress.remaining_bundled_tx
            ) {
              areAddressesChanged = true
              break
            }
          } else {
            areAddressesChanged = true
            break
          }
        }

        // check for removed / transferred addresses
        if (!areAddressesChanged) {
          for (const fioAddress of this.otherData.fioAddresses) {
            if (
              result.fio_addresses.findIndex(
                item => item.fio_address === fioAddress.name
              ) < 0
            ) {
              areAddressesChanged = true
              break
            }
          }
        }
      }

      // check domains
      if (result.fio_domains.length !== this.otherData.fioDomains.length) {
        areDomainsChanged = true
      } else {
        for (const fioDomain of result.fio_domains) {
          const existedFioDomain = this.otherData.fioDomains.find(
            existedFioDomain => existedFioDomain.name === fioDomain.fio_domain
          )
          if (existedFioDomain != null) {
            if (existedFioDomain.expiration !== fioDomain.expiration) {
              areDomainsChanged = true
              break
            }
            if (existedFioDomain.isPublic !== (fioDomain.is_public === 1)) {
              areDomainsChanged = true
              break
            }
          } else {
            areDomainsChanged = true
            break
          }
        }

        // check for removed / transferred domains
        if (!areDomainsChanged) {
          for (const fioDomain of this.otherData.fioDomains) {
            if (
              result.fio_domains.findIndex(
                item => item.fio_domain === fioDomain.name
              ) < 0
            ) {
              areDomainsChanged = true
              break
            }
          }
        }
      }

      if (areAddressesChanged) {
        isChanged = true
        this.otherData.fioAddresses = result.fio_addresses.map(fioAddress => ({
          name: fioAddress.fio_address,
          bundledTxs: fioAddress.remaining_bundled_tx
        }))
      }

      if (areDomainsChanged) {
        isChanged = true
        this.otherData.fioDomains = result.fio_domains.map(fioDomain => ({
          name: fioDomain.fio_domain,
          expiration: fioDomain.expiration,
          isPublic: fioDomain.is_public === 1
        }))
      }

      if (isChanged) this.localDataDirty()
    } catch (e) {
      this.warn('checkAccountInnerLoop getFioNames error: ', e)
    }
  }

  async fetchEncryptedFioRequests(
    type,
    decoder
  ) {
    const ITEMS_PER_PAGE = 100
    const action =
      type === 'PENDING' ? 'getPendingFioRequests' : 'getSentFioRequests'

    let lastPageAmount = ITEMS_PER_PAGE
    let requestsLastPage = 1
    const encryptedFioRequests = []
    while (lastPageAmount === ITEMS_PER_PAGE) {
      try {
        const response = await this.multicastServers(action, {
          endpoint: decoder.getEndPoint(),
          body: {
            fio_public_key: this.walletInfo.keys.publicKey,
            limit: ITEMS_PER_PAGE,
            offset: (requestsLastPage - 1) * ITEMS_PER_PAGE
          }
        })
        const cleanResponse = _fioTypes.asGetFioRequestsResponse.call(void 0, response)

        const { requests, more } = cleanResponse
        encryptedFioRequests.push(...requests)
        if (more === 0) break

        requestsLastPage++
        lastPageAmount = requests.length
      } catch (e) {
        const errorJson = _cleaners.asMaybe.call(void 0, (0, _fioTypes.asFioEmptyResponse))(e.json)
        if (_optionalChain([errorJson, 'optionalAccess', _37 => _37.message]) !== 'No FIO Requests') {
          this.error('fetchEncryptedFioRequests error: ', e)
        }
        break
      }
    }

    return encryptedFioRequests
  }

  async fetchEncryptedObtData(
    type,
    decoder
  ) {
    const ITEMS_PER_PAGE = 100

    let lastPageAmount = ITEMS_PER_PAGE
    let requestsLastPage = 1
    const encryptedObtDataRecords = []
    while (lastPageAmount === ITEMS_PER_PAGE) {
      let response
      try {
        response = await this.multicastServers(type, {
          endpoint: decoder.getEndPoint(),
          body: {
            fio_public_key: this.walletInfo.keys.publicKey,
            limit: ITEMS_PER_PAGE,
            offset: (requestsLastPage - 1) * ITEMS_PER_PAGE
          }
        })
        const cleanResponse = _fioTypes.asGetObtDataResponse.call(void 0, response)

        const { obt_data_records: obtDataRecords, more } = cleanResponse
        encryptedObtDataRecords.push(...obtDataRecords)
        if (more === 0) break

        requestsLastPage++
        lastPageAmount = obtDataRecords.length
      } catch (e) {
        const errorJson = _cleaners.asMaybe.call(void 0, (0, _fioTypes.asFioEmptyResponse))(e.json)
        if (_optionalChain([errorJson, 'optionalAccess', _38 => _38.message]) !== 'No FIO Requests') {
          this.error('fetchEncryptedObtData error: ', e)
        }
        break
      }
    }

    return encryptedObtDataRecords
  }

  __init() {this.fioRequestsListChanged = (
    existingList,
    newList
  ) => {
    function compareArray(arrA, arrB) {
      for (const fioRequest of arrA) {
        if (
          arrB.findIndex(
            (newFioRequest) =>
              newFioRequest.fio_request_id === fioRequest.fio_request_id
          ) < 0
        ) {
          return true
        }
      }
      return false
    }
    if (
      compareArray(existingList, newList) ||
      compareArray(newList, existingList)
    ) {
      return true
    }

    return false
  }}

  __init2() {this.removeFioRequest = (
    fioRequestId,
    type
  ) => {
    const fioRequestIndex = this.otherData.fioRequests[type].findIndex(
      (fioRequest) =>
        fioRequest.fio_request_id === `${fioRequestId}`
    )

    if (fioRequestIndex > -1) {
      this.otherData.fioRequests[type].splice(fioRequestIndex, 1)
    }
  }}

  // Placeholder function for network activity that requires private keys
  // async syncNetwork(opts: EdgeEnginePrivateKeyOptions): Promise<number> {
  //   const fioPrivateKeys = asFioPrivateKeys(opts?.privateKeys)
  //   let isChanged = false

  //   const checkFioRequests = async (
  //     type: FioRequestTypes,
  //     decoder: Query<PendingFioRequests | SentFioRequests>
  //   ): Promise<void> => {
  //     const encryptedReqs = await this.fetchEncryptedFioRequests(type, decoder)
  //     decoder.privateKey = fioPrivateKeys.fioKey
  //     decoder.publicKey = this.walletInfo.keys.publicKey
  //     const decryptedReqs: { requests: FioRequest[] } = decoder.decrypt({
  //       requests: encryptedReqs
  //     }) ?? { requests: [] }

  //     if (
  //       this.fioRequestsListChanged(
  //         this.otherData.fioRequests[type],
  //         decryptedReqs.requests
  //       )
  //     ) {
  //       this.otherData.fioRequests[type] = [...decryptedReqs.requests]
  //       isChanged = true
  //     }
  //   }

  //   await checkFioRequests(
  //     'PENDING',
  //     new PendingFioRequests(this.walletInfo.keys.publicKey)
  //   )
  //   await checkFioRequests(
  //     'SENT',
  //     new SentFioRequests(this.walletInfo.keys.publicKey)
  //   )

  //   if (isChanged) this.localDataDirty()

  //   const obtDecoder = new GetObtData(this.walletInfo.keys.publicKey)
  //   const encryptedObtData = await this.fetchEncryptedObtData(
  //     'getObtData',
  //     obtDecoder
  //   )
  //   obtDecoder.privateKey = fioPrivateKeys.fioKey
  //   obtDecoder.publicKey = this.walletInfo.keys.publicKey
  //   const decryptedObtData: { obt_data_records: ObtData[] } =
  //     obtDecoder.decrypt({
  //       obt_data_records: encryptedObtData
  //     }) ?? { obt_data_records: [] }

  //   this.obtData = decryptedObtData.obt_data_records

  //   return SYNC_NETWORK_INTERVAL
  // }

  // https://developers.fioprotocol.io/docs/fio-protocol/fio-fees
  async getFee(endpoint, param) {
    let cachedFee = this.fees.get(endpoint)
    if (cachedFee == null || cachedFee.expiration + 30 * 1000 < Date.now()) {
      const fee = await this.multicastServers('getFees', { endpoint, param })
      const newFee = { fee: fee, expiration: Date.now() }

      this.fees.set(endpoint, newFee)
      cachedFee = newFee
    }
    return cachedFee.fee
  }

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

  async getMaxSpendable(spendInfo) {
    spendInfo = _upgradeMemos.upgradeMemos.call(void 0, spendInfo, this.currencyInfo)
    const balance = this.getBalance({
      currencyCode: spendInfo.currencyCode
    })

    const lockedAmount =
      _nullishCoalesce(this.walletLocalData.totalBalances[
        this.networkInfo.balanceCurrencyCodes.locked
      ], () => ( '0'))

    spendInfo.spendTargets[0].nativeAmount = '1'
    const edgeTx = await this.makeSpend(spendInfo)
    const spendableAmount = _biggystring.sub.call(void 0, _biggystring.sub.call(void 0, balance, edgeTx.networkFee), lockedAmount)

    if (_biggystring.lt.call(void 0, spendableAmount, '0')) {
      throw new (0, _types.InsufficientFundsError)({ networkFee: edgeTx.networkFee })
    }

    return spendableAmount
  }

  async makeSpend(edgeSpendInfoIn) {
    edgeSpendInfoIn = _upgradeMemos.upgradeMemos.call(void 0, edgeSpendInfoIn, this.currencyInfo)
    const { edgeSpendInfo, nativeBalance, currencyCode } =
      this.makeSpendCheck(edgeSpendInfoIn)
    const { memos = [] } = edgeSpendInfo

    const lockedBalance =
      _nullishCoalesce(this.walletLocalData.totalBalances[
        this.networkInfo.balanceCurrencyCodes.locked
      ], () => ( '0'))
    const availableBalance = _biggystring.sub.call(void 0, nativeBalance, lockedBalance)

    // Set common vars
    const spendTarget = edgeSpendInfo.spendTargets[0]
    const { publicAddress } = spendTarget
    const { nativeAmount: quantity } = spendTarget

    if (publicAddress == null)
      throw new Error('makeSpend Missing publicAddress')
    if (quantity == null) throw new (0, _types.NoAmountSpecifiedError)()

    let { otherParams } = edgeSpendInfo
    if (otherParams == null || Object.keys(otherParams).length === 0) {
      otherParams = {
        action: {
          name: _fioConst.ACTIONS.transferTokens,
          params: {
            payeeFioPublicKey: publicAddress,
            amount: quantity,
            maxFee: 0
          }
        }
      }
    }

    const { name, params } = _fioTypes.asFioAction.call(void 0, otherParams.action)

    let fee
    let txParams
    switch (name) {
      case _fioConst.ACTIONS.transferTokens: {
        fee = await this.getFee(_EndPoint.EndPoint.transferTokens)
        txParams = {
          account: 'fio.token',
          action: _fioConst.ACTIONS_TO_TX_ACTION_NAME[_fioConst.ACTIONS.transferTokens],
          data: {
            payee_public_key: publicAddress,
            amount: quantity,
            max_fee: fee
          }
        }
        break
      }
      case _fioConst.ACTIONS.stakeFioTokens: {
        const { fioAddress } = _fioTypes.asFioAddressParam.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.stakeFioTokens, fioAddress)
        txParams = {
          account: 'fio.staking',
          action: _fioConst.ACTIONS_TO_TX_ACTION_NAME[name],
          data: {
            amount: quantity,
            fio_address: fioAddress,
            actor: this.actor,
            max_fee: fee
          }
        }
        break
      }
      case _fioConst.ACTIONS.unStakeFioTokens: {
        const { fioAddress } = _fioTypes.asFioAddressParam.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.unStakeFioTokens, fioAddress)
        txParams = {
          account: 'fio.staking',
          action: _fioConst.ACTIONS_TO_TX_ACTION_NAME[name],
          data: {
            amount: quantity,
            fio_address: fioAddress,
            actor: this.actor,
            max_fee: fee
          }
        }

        const unlockDate = this.getUnlockDate(new Date())
        const stakedBalance =
          _nullishCoalesce(this.walletLocalData.totalBalances[
            this.networkInfo.balanceCurrencyCodes.staked
          ], () => ( '0'))
        if (_biggystring.gt.call(void 0, quantity, stakedBalance) || _biggystring.gt.call(void 0, `${fee}`, availableBalance)) {
          throw new (0, _types.InsufficientFundsError)()
        }

        const accrued = _biggystring.mul.call(void 0, 
          _biggystring.mul.call(void 0, _biggystring.div.call(void 0, quantity, stakedBalance, 18), `${this.otherData.srps}`),
          this.otherData.stakingRoe
        )
        const estReward = _biggystring.max.call(void 0, _biggystring.sub.call(void 0, accrued, quantity), '0')
        otherParams.ui = {
          accrued,
          estReward,
          unlockDate
        }
        break
      }
      case _fioConst.ACTIONS.transferFioAddress: {
        const { fioAddress } = _fioTypes.asFioAddressParam.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.transferFioAddress, fioAddress)
        txParams = {
          account: 'fio.address',
          action: 'xferaddress',
          data: {
            fio_address: fioAddress,
            new_owner_fio_public_key: publicAddress,
            actor: this.actor,
            max_fee: fee
          }
        }
        break
      }
      case _fioConst.ACTIONS.transferFioDomain: {
        const { fioDomain } = _fioTypes.asFioTransferDomainParams.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.transferFioDomain)
        txParams = {
          account: 'fio.address',
          action: 'xferdomain',
          data: {
            fio_domain: fioDomain,
            new_owner_fio_public_key: publicAddress,
            actor: this.actor,
            max_fee: fee
          }
        }
        break
      }
      case _fioConst.ACTIONS.addPublicAddresses: {
        const { fioAddress, publicAddresses } =
          _fioTypes.asFioConnectAddressesParams.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.addPubAddress, fioAddress)
        txParams = {
          account: 'fio.address',
          action: 'addaddress',
          data: {
            fio_address: fioAddress,
            public_addresses: publicAddresses,
            actor: this.actor,
            max_fee: fee
          }
        }
        break
      }
      case _fioConst.ACTIONS.removePublicAddresses: {
        const { fioAddress, publicAddresses } =
          _fioTypes.asFioConnectAddressesParams.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.removePubAddress, fioAddress)
        txParams = {
          account: 'fio.address',
          action: 'remaddress',
          data: {
            fio_address: fioAddress,
            public_addresses: publicAddresses,
            actor: this.actor,
            max_fee: fee
          }
        }
        break
      }
      case _fioConst.ACTIONS.registerFioAddress: {
        const { fioAddress } = _fioTypes.asFioAddressParam.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.registerFioAddress)
        txParams = {
          account: 'fio.address',
          action: 'regaddress',
          data: {
            fio_address: fioAddress,
            owner_fio_public_key: this.walletInfo.keys.publicKey,
            max_fee: fee,
            actor: this.actor
          }
        }
        break
      }
      case _fioConst.ACTIONS.registerFioDomain: {
        const { fioDomain } = _fioTypes.asFioDomainParam.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.registerFioDomain)
        txParams = {
          account: 'fio.address',
          action: 'regdomain',
          data: {
            fio_domain: fioDomain,
            owner_fio_public_key: this.walletInfo.keys.publicKey,
            max_fee: fee,
            actor: this.actor
          }
        }
        break
      }
      case _fioConst.ACTIONS.renewFioDomain: {
        const { fioDomain } = _fioTypes.asFioDomainParam.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.renewFioDomain)
        txParams = {
          account: 'fio.address',
          action: 'renewdomain',
          data: {
            fio_domain: fioDomain,
            max_fee: fee,
            actor: this.actor
          }
        }
        break
      }
      case _fioConst.ACTIONS.addBundledTransactions: {
        const { bundleSets, fioAddress } = _fioTypes.asFioAddBundledTransactions.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.addBundledTransactions, fioAddress)
        txParams = {
          account: 'fio.address',
          action: 'addbundles',
          data: {
            fio_address: fioAddress,
            bundle_sets: bundleSets,
            actor: this.actor,
            max_fee: fee
          }
        }
        break
      }
      case _fioConst.ACTIONS.setFioDomainPublic: {
        const { fioDomain, isPublic } = _fioTypes.asSetFioDomainVisibility.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.setFioDomainPublic)
        txParams = {
          account: 'fio.address',
          action: 'setdomainpub',
          data: {
            fio_domain: fioDomain,
            is_public: isPublic ? 1 : 0,
            max_fee: fee,
            actor: this.actor
          }
        }
        break
      }
      case _fioConst.ACTIONS.rejectFundsRequest: {
        const { fioRequestId, payerFioAddress } = _fioTypes.asRejectFundsRequest.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.rejectFundsRequest, payerFioAddress)
        txParams = {
          account: 'fio.reqobt',
          action: 'rejectfndreq',
          data: {
            fio_request_id: fioRequestId,
            max_fee: fee,
            actor: this.actor
          }
        }
        break
      }
      case _fioConst.ACTIONS.cancelFundsRequest: {
        const { fioAddress, fioRequestId } = _fioTypes.asCancelFundsRequest.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.cancelFundsRequest, fioAddress)
        txParams = {
          account: 'fio.reqobt',
          action: 'cancelfndreq',
          data: {
            fio_request_id: fioRequestId,
            max_fee: fee,
            actor: this.actor
          }
        }
        break
      }
      case _fioConst.ACTIONS.recordObtData: {
        const { payerFioAddress } = _fioTypes.asFioRecordObtData.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.recordObtData, payerFioAddress)
        // Need private key to craft transaction
        break
      }
      case _fioConst.ACTIONS.requestFunds: {
        const { payeeFioAddress } = _fioTypes.asFioRequestFundsParams.call(void 0, params)
        fee = await this.getFee(_EndPoint.EndPoint.newFundsRequest, payeeFioAddress)
        // Need private key to craft transaction
        break
      }
      default: {
        throw new Error('Unrecognized FIO action')
      }
    }

    const edgeTransaction = {
      blockHeight: 0,
      currencyCode,
      date: 0,
      isSend: true,
      memos,
      nativeAmount: _biggystring.sub.call(void 0, `-${quantity}`, `${fee}`),
      networkFee: `${fee}`,
      otherParams: {
        ...otherParams,
        txParams
      },
      ourReceiveAddresses: [],
      signedTx: '',
      txid: '',
      walletId: this.walletId
    }

    return edgeTransaction
  }

  async signTx(
    edgeTransaction,
    privateKeys
  ) {
    const fioPrivateKeys = _fioTypes.asFioPrivateKeys.call(void 0, privateKeys)
    const otherParams = _utils.getOtherParams.call(void 0, edgeTransaction)
    let txParams = _cleaners.asMaybe.call(void 0, (0, _fioTypes.asFioTxParams))(otherParams.txParams)
    const transactions = new (0, _Transactions.Transactions)()

    if (txParams == null) {
      const { name, params } = _fioTypes.asFioAction.call(void 0, otherParams.action)
      const { networkFee } = edgeTransaction

      // let txParams: FioTxParams | undefined
      switch (name) {
        case _fioConst.ACTIONS.recordObtData: {
          const {
            payerFioAddress,
            payeeFioAddress,
            payerPublicAddress,
            payeePublicAddress,
            amount,
            tokenCode,
            chainCode,
            obtId,
            memo,
            status,
            fioRequestId
          } = _fioTypes.asFioRecordObtData.call(void 0, params)
          const content = {
            payer_public_address: payerPublicAddress,
            payee_public_address: payeePublicAddress,
            amount,
            chain_code: chainCode,
            token_code: tokenCode,
            status,
            obt_id: obtId,
            memo,
            hash: undefined,
            offline_url: undefined
          }
          const cipherContent = transactions.getCipherContent(
            'record_obt_data_content',
            content,
            fioPrivateKeys.fioKey,
            payerPublicAddress
          )
          txParams = {
            account: 'fio.reqobt',
            action: 'recordobt',
            data: {
              payer_fio_address: payerFioAddress,
              payee_fio_address: payeeFioAddress,
              content: cipherContent,
              fio_request_id: fioRequestId,
              max_fee: networkFee,
              actor: this.actor
            }
          }
          break
        }
        case _fioConst.ACTIONS.requestFunds: {
          const {
            payerFioAddress,
            payerFioPublicKey,
            payeeFioAddress,
            payeeTokenPublicAddress,
            amount,
            chainCode,
            tokenCode,
            memo
          } = _fioTypes.asFioRequestFundsParams.call(void 0, params)
          const content = {
            payee_public_address: payeeTokenPublicAddress,
            amount,
            chain_code: chainCode,
            token_code: tokenCode,
            memo,
            hash: undefined,
            offline_url: undefined
          }
          const cipherContent = transactions.getCipherContent(
            'new_funds_content',
            content,
            fioPrivateKeys.fioKey,
            payerFioPublicKey
          )
          txParams = {
            account: 'fio.reqobt',
            action: 'newfundsreq',
            data: {
              payer_fio_address: payerFioAddress,
              payee_fio_address: payeeFioAddress,
              content: cipherContent,
              max_fee: networkFee,
              actor: this.actor
            }
          }
          break
        }
        default: {
          throw new Error('Unknown FIO action')
        }
      }
    }

    const rawTx = await transactions.createRawTransaction({
      action: txParams.action,
      account: txParams.account,
      data: { ...txParams.data, tpid: this.tpid },
      publicKey: this.walletInfo.keys.publicKey,
      chainData: this.refBlock
    })
    const { serializedContextFreeData, serializedTransaction } =
      await transactions.serialize({
        chainId: this.networkInfo.chainId,
        transaction: rawTx
      })
    const signedTx = await transactions.sign({
      chainId: this.networkInfo.chainId,
      privateKeys: [fioPrivateKeys.fioKey],
      transaction: rawTx,
      serializedTransaction,
      serializedContextFreeData
    })

    edgeTransaction.otherParams = { ...edgeTransaction.otherParams, signedTx }
    return edgeTransaction
  }

  async broadcastTx(
    edgeTransaction
  ) {
    const otherParams = _utils.getOtherParams.call(void 0, edgeTransaction)

    if (_optionalChain([otherParams, 'access', _39 => _39.action, 'optionalAccess', _40 => _40.name]) == null) {
      throw new Error(
        'Action is not set, "action" prop of otherParams is required for FIO actions'
      )
    }

    const signedTx = _fioTypes.asFioSignedTx.call(void 0, otherParams.signedTx)
    const trx = _fioTypes.asFioBroadcastResult.call(void 0, 
      await this.multicastServers(otherParams.action.name, signedTx)
    )

    edgeTransaction.metadata = {
      notes: trx.transaction_id
    }
    edgeTransaction.txid = trx.transaction_id
    edgeTransaction.date = Date.now() / 1000
    edgeTransaction.blockHeight = trx.block_num
    this.warn(`SUCCESS broadcastTx\n${_utils.cleanTxLogs.call(void 0, edgeTransaction)}`)

    // Save additional return values to otherParams
    // eslint-disable-next-line
    const { block_num, block_time, transaction_id, ...broadcastResult } = trx
    edgeTransaction.otherParams = { ...otherParams, broadcastResult }

    return edgeTransaction
  }

  async saveTx(edgeTransaction) {
    const otherParams = _utils.getOtherParams.call(void 0, edgeTransaction)
    const { broadcastResult = {}, action } = otherParams
    const { name, params } = _fioTypes.asFioAction.call(void 0, action)

    // Attempt post-broadcast actions
    try {
      switch (name) {
        case _fioConst.ACTIONS.transferFioDomain: {
          const transferredDomainIndex = this.otherData.fioDomains.findIndex(
            ({ name }) => name === params.fioDomain
          )
          if (transferredDomainIndex >= 0) {
            this.otherData.fioDomains.splice(transferredDomainIndex, 1)
            this.localDataDirty()
          }
          break
        }
        case _fioConst.ACTIONS.transferFioAddress: {
          const transferredAddressIndex = this.otherData.fioAddresses.findIndex(
            ({ name }) => name === params.fioAddress
          )
          if (transferredAddressIndex >= 0) {
            this.otherData.fioAddresses.splice(transferredAddressIndex, 1)
            this.localDataDirty()
          }
          break
        }
        case _fioConst.ACTIONS.registerFioAddress: {
          const { fioAddress } = _fioTypes.asFioAddressParam.call(void 0, params)
          const addressAlreadyAdded = this.otherData.fioAddresses.find(
            ({ name }) => name === fioAddress
          )
          if (addressAlreadyAdded == null) {
            this.otherData.fioAddresses.push({
              name: fioAddress,
              bundledTxs: undefined
            })
            this.localDataDirty()
          }
          break
        }
        case _fioConst.ACTIONS.registerFioDomain: {
          const { fioDomain } = _fioTypes.asFioDomainParam.call(void 0, params)
          if (broadcastResult.expiration == null)
            throw new Error('expiration not present')

          const renewedDomain = this.otherData.fioDomains.find(
            ({ name }) => name === fioDomain
          )
          if (renewedDomain != null) {
            renewedDomain.expiration = broadcastResult.expiration
            this.localDataDirty()
          }
          break
        }
        case _fioConst.ACTIONS.renewFioDomain: {
          const { fioDomain } = _fioTypes.asFioDomainParam.call(void 0, params)
          if (broadcastResult.expiration == null)
            throw new Error('expiration not present')

          const renewedDomain = this.otherData.fioDomains.find(
            ({ name }) => name === fioDomain
          )
          if (renewedDomain != null) {
            renewedDomain.expiration = broadcastResult.expiration
            this.localDataDirty()
          }
          break
        }
        case _fioConst.ACTIONS.addBundledTransactions: {
          const { fioAddress: fioAddressParam } =
            _fioTypes.asFioAddBundledTransactions.call(void 0, params)
          const fioAddress = this.otherData.fioAddresses.find(
            ({ name }) => name === fioAddressParam
          )

          if (fioAddress == null)
            throw new (0, _fioError.FioError)('Fio Address is not found in engine')

          fioAddress.bundledTxs =
            (_nullishCoalesce(fioAddress.bundledTxs, () => ( 0))) + _fioConst.DEFAULT_BUNDLED_TXS_AMOUNT

          this.localDataDirty()
          break
        }
        case _fioConst.ACTIONS.rejectFundsRequest: {
          const { fioRequestId } = _fioTypes.asRejectFundsRequest.call(void 0, params)
          if (typeof fioRequestId === 'string') {
            this.removeFioRequest(fioRequestId, 'PENDING')
            this.localDataDirty()
          }
          break
        }
        case _fioConst.ACTIONS.cancelFundsRequest: {
          const { fioRequestId } = _fioTypes.asCancelFundsRequest.call(void 0, params)
          if (typeof fioRequestId === 'string') {
            this.removeFioRequest(fioRequestId, 'SENT')
            this.localDataDirty()
          }
          break
        }
        case _fioConst.ACTIONS.recordObtData: {
          const { fioRequestId } = _fioTypes.asFioRecordObtData.call(void 0, params)
          if (
            fioRequestId != null &&
            broadcastResult.status === 'sent_to_blockchain'
          ) {
            this.removeFioRequest(fioRequestId, 'PENDING')
            this.localDataDirty()
          }
          break
        }
      }
    } catch (e) {
      this.log.warn(`Error attempting post-broadcast action ${name}:`, e)
    }

    await super.saveTx(edgeTransaction)
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
  const { tpid = 'finance@edge' } = env.initOptions
  const safeWalletInfo = _fioTypes.asSafeFioWalletInfo.call(void 0, walletInfo)
  const engine = new FioEngine(env, tools, safeWalletInfo, opts, tpid)
  await engine.loadEngine()

  return engine
} exports.makeCurrencyEngine = makeCurrencyEngine;
