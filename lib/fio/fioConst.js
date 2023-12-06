"use strict";Object.defineProperty(exports, "__esModule", {value: true});









var _cleaners = require('cleaners');

var _types = require('../common/types');

 const FIO_REG_API_ENDPOINTS = {
  buyAddress: 'buy-address',
  getDomains: 'get-domains',
  isDomainPublic: 'is-domain-public'
}; exports.FIO_REG_API_ENDPOINTS = FIO_REG_API_ENDPOINTS
 const HISTORY_NODE_ACTIONS = {
  getActions: 'get_actions'
}; exports.HISTORY_NODE_ACTIONS = HISTORY_NODE_ACTIONS
 const HISTORY_NODE_PAGE_SIZE = 20; exports.HISTORY_NODE_PAGE_SIZE = HISTORY_NODE_PAGE_SIZE

 const ACTIONS = {
  transferTokens: 'transferTokens',
  addPublicAddress: 'addPublicAddress',
  addPublicAddresses: 'addPublicAddresses',
  removePublicAddresses: 'removePublicAddresses',
  setFioDomainPublic: 'setFioDomainVisibility',
  rejectFundsRequest: 'rejectFundsRequest',
  cancelFundsRequest: 'cancelFundsRequest',
  requestFunds: 'requestFunds',
  recordObtData: 'recordObtData',
  registerFioAddress: 'registerFioAddress',
  registerFioDomain: 'registerFioDomain',
  renewFioDomain: 'renewFioDomain',
  transferFioAddress: 'transferFioAddress',
  transferFioDomain: 'transferFioDomain',
  pushTransaction: 'pushTransaction',
  addBundledTransactions: 'addBundledTransactions',
  stakeFioTokens: 'stakeFioTokens',
  unStakeFioTokens: 'unStakeFioTokens'
}; exports.ACTIONS = ACTIONS

 const BROADCAST_ACTIONS = {
  [exports.ACTIONS.recordObtData]: true,
  [exports.ACTIONS.requestFunds]: true,
  [exports.ACTIONS.rejectFundsRequest]: true,
  [exports.ACTIONS.cancelFundsRequest]: true,
  [exports.ACTIONS.registerFioAddress]: true,
  [exports.ACTIONS.registerFioDomain]: true,
  [exports.ACTIONS.renewFioDomain]: true,
  [exports.ACTIONS.transferTokens]: true,
  [exports.ACTIONS.addPublicAddresses]: true,
  [exports.ACTIONS.removePublicAddresses]: true,
  [exports.ACTIONS.transferFioAddress]: true,
  [exports.ACTIONS.transferFioDomain]: true,
  [exports.ACTIONS.addBundledTransactions]: true,
  [exports.ACTIONS.setFioDomainPublic]: true,
  [exports.ACTIONS.stakeFioTokens]: true,
  [exports.ACTIONS.unStakeFioTokens]: true
}; exports.BROADCAST_ACTIONS = BROADCAST_ACTIONS

 const ACTIONS_TO_END_POINT_KEYS = {
  [exports.ACTIONS.requestFunds]: 'newFundsRequest',
  [exports.ACTIONS.registerFioAddress]: 'registerFioAddress',
  [exports.ACTIONS.registerFioDomain]: 'registerFioDomain',
  [exports.ACTIONS.renewFioDomain]: 'renewFioDomain',
  [exports.ACTIONS.addPublicAddresses]: 'addPubAddress',
  [exports.ACTIONS.removePublicAddresses]: 'removePubAddress',
  [exports.ACTIONS.setFioDomainPublic]: 'setFioDomainPublic',
  [exports.ACTIONS.rejectFundsRequest]: 'rejectFundsRequest',
  [exports.ACTIONS.cancelFundsRequest]: 'cancelFundsRequest',
  [exports.ACTIONS.recordObtData]: 'recordObtData',
  [exports.ACTIONS.transferTokens]: 'transferTokens',
  [exports.ACTIONS.pushTransaction]: 'pushTransaction',
  [exports.ACTIONS.transferFioAddress]: 'transferFioAddress',
  [exports.ACTIONS.transferFioDomain]: 'transferFioDomain',
  [exports.ACTIONS.stakeFioTokens]: 'pushTransaction',
  [exports.ACTIONS.unStakeFioTokens]: 'pushTransaction',
  addBundledTransactions: 'addBundledTransactions'
} ; exports.ACTIONS_TO_END_POINT_KEYS = ACTIONS_TO_END_POINT_KEYS

 const ACTIONS_TO_TX_ACTION_NAME = {
  [exports.ACTIONS.transferTokens]: 'trnsfiopubky',
  [exports.ACTIONS.stakeFioTokens]: 'stakefio',
  [exports.ACTIONS.unStakeFioTokens]: 'unstakefio',
  transfer: 'transfer'
}; exports.ACTIONS_TO_TX_ACTION_NAME = ACTIONS_TO_TX_ACTION_NAME

 const DEFAULT_BUNDLED_TXS_AMOUNT = 100; exports.DEFAULT_BUNDLED_TXS_AMOUNT = DEFAULT_BUNDLED_TXS_AMOUNT
 const DEFAULT_APR = 450; exports.DEFAULT_APR = DEFAULT_APR
 const STAKING_REWARD_MEMO = 'Paying Staking Rewards'; exports.STAKING_REWARD_MEMO = STAKING_REWARD_MEMO
 const STAKING_LOCK_PERIOD = 1000 * 60 * 60 * 24 * 7; exports.STAKING_LOCK_PERIOD = STAKING_LOCK_PERIOD // 7 days
 const DAY_INTERVAL = 1000 * 60 * 60 * 24; exports.DAY_INTERVAL = DAY_INTERVAL

 const asFioRequest = _cleaners.asObject.call(void 0, {
  fio_request_id: _cleaners.asString,
  payer_fio_address: _cleaners.asString,
  payee_fio_address: _cleaners.asString,
  payee_fio_public_key: _cleaners.asString,
  payer_fio_public_key: _cleaners.asString,
  amount: _cleaners.asString,
  token_code: _cleaners.asString,
  metadata: _cleaners.asString,
  time_stamp: _cleaners.asString,
  content: _cleaners.asString
}); exports.asFioRequest = asFioRequest



 const asEncryptedFioRequest = _cleaners.asObject.call(void 0, {
  fio_request_id: _cleaners.asNumber,
  payer_fio_address: _cleaners.asString,
  payee_fio_address: _cleaners.asString,
  payer_fio_public_key: _cleaners.asString,
  payee_fio_public_key: _cleaners.asString,
  content: _cleaners.asString,
  time_stamp: _cleaners.asString,
  status: _cleaners.asOptional.call(void 0, 
    _cleaners.asValue.call(void 0, 'cancelled', 'rejected', 'requested', 'sent_to_blockchain')
  )
}); exports.asEncryptedFioRequest = asEncryptedFioRequest



 const asFioAddress = _cleaners.asObject.call(void 0, {
  name: _cleaners.asString,
  bundledTxs: _cleaners.asOptional.call(void 0, _cleaners.asNumber)
}); exports.asFioAddress = asFioAddress



 const asFioDomain = _cleaners.asObject.call(void 0, {
  name: _cleaners.asString,
  expiration: _cleaners.asString,
  isPublic: _cleaners.asBoolean
}); exports.asFioDomain = asFioDomain
























 const asEdgeStakingStatus = _cleaners.asObject.call(void 0, {
  stakedAmounts: _cleaners.asArray.call(void 0, 
    _cleaners.asObject.call(void 0, {
      nativeAmount: _cleaners.asString,
      unlockDate: _cleaners.asOptional.call(void 0, _cleaners.asDate),
      otherParams: _cleaners.asOptional.call(void 0, _types.asAny)
    })
  )
}); exports.asEdgeStakingStatus = asEdgeStakingStatus

 const asFioWalletOtherData = _cleaners.asObject.call(void 0, {
  highestTxHeight: _cleaners.asMaybe.call(void 0, _cleaners.asNumber, 0),
  fioAddresses: _cleaners.asMaybe.call(void 0, _cleaners.asArray.call(void 0, exports.asFioAddress), () => []),
  fioDomains: _cleaners.asMaybe.call(void 0, _cleaners.asArray.call(void 0, exports.asFioDomain), () => []),
  fioRequests: _cleaners.asMaybe.call(void 0, 
    _cleaners.asObject.call(void 0, {
      PENDING: _cleaners.asArray.call(void 0, exports.asFioRequest),
      SENT: _cleaners.asArray.call(void 0, exports.asFioRequest)
    }),
    () => ({
      SENT: [],
      PENDING: []
    })
  ),
  srps: _cleaners.asMaybe.call(void 0, _cleaners.asNumber, 0),
  stakingRoe: _cleaners.asMaybe.call(void 0, _cleaners.asString, ''),
  stakingStatus: _cleaners.asMaybe.call(void 0, exports.asEdgeStakingStatus, () => ({
    stakedAmounts: []
  }))
}); exports.asFioWalletOtherData = asFioWalletOtherData



 const NO_FIO_NAMES = 'No FIO names'; exports.NO_FIO_NAMES = NO_FIO_NAMES
 const PUBLIC_KEY_NOT_FOUND = 'Public key not found'; exports.PUBLIC_KEY_NOT_FOUND = PUBLIC_KEY_NOT_FOUND
