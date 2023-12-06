"use strict";Object.defineProperty(exports, "__esModule", {value: true});












var _cleaners = require('cleaners');

var _types = require('../common/types');
var _fioConst = require('./fioConst');


 const fioOtherMethodNames = [
  'getConnectedPublicAddress',
  'isFioAddressValid',
  'validateAccount',
  'isDomainPublic',
  'doesAccountExist',
  'buyAddressRequest',
  'getDomains',
  'getStakeEstReturn'
] 

























; exports.fioOtherMethodNames = fioOtherMethodNames

 const asFioAction = _cleaners.asObject.call(void 0, {
  name: _cleaners.asString,
  params: _cleaners.asObject.call(void 0, _cleaners.asUnknown)
}); exports.asFioAction = asFioAction

 const asFioTxParams = _cleaners.asObject.call(void 0, {
  action: _cleaners.asString,
  account: _cleaners.asString,
  data: _cleaners.asObject.call(void 0, _cleaners.asUnknown)
}); exports.asFioTxParams = asFioTxParams



 const asFioSignedTx = _cleaners.asObject.call(void 0, {
  compression: _cleaners.asNumber,
  packed_context_free_data: _cleaners.asString,
  packed_trx: _cleaners.asString,
  signatures: _cleaners.asArray.call(void 0, _cleaners.asString)
}); exports.asFioSignedTx = asFioSignedTx

 const asFioFee = _cleaners.asObject.call(void 0, { fee: _cleaners.asNumber }); exports.asFioFee = asFioFee







 const asFioAddressParam = _cleaners.asObject.call(void 0, {
  fioAddress: _cleaners.asString
}); exports.asFioAddressParam = asFioAddressParam

 const asFioDomainParam = _cleaners.asObject.call(void 0, {
  fioDomain: _cleaners.asString
}); exports.asFioDomainParam = asFioDomainParam

 const asFioTransferDomainParams = _cleaners.asObject.call(void 0, {
  fioDomain: _cleaners.asString
}); exports.asFioTransferDomainParams = asFioTransferDomainParams

 const asFioConnectAddressesParams = _cleaners.asObject.call(void 0, {
  fioAddress: _cleaners.asString,
  publicAddresses: _cleaners.asArray.call(void 0, 
    _cleaners.asObject.call(void 0, {
      token_code: _cleaners.asString,
      chain_code: _cleaners.asString,
      public_address: _cleaners.asString
    })
  )
}); exports.asFioConnectAddressesParams = asFioConnectAddressesParams

 const asFioAddBundledTransactions = _cleaners.asObject.call(void 0, {
  fioAddress: _cleaners.asString,
  bundleSets: _cleaners.asNumber
}); exports.asFioAddBundledTransactions = asFioAddBundledTransactions

 const asSetFioDomainVisibility = _cleaners.asObject.call(void 0, {
  fioDomain: _cleaners.asString,
  isPublic: _cleaners.asBoolean
}); exports.asSetFioDomainVisibility = asSetFioDomainVisibility

 const asRejectFundsRequest = _cleaners.asObject.call(void 0, {
  payerFioAddress: _cleaners.asString,
  fioRequestId: _cleaners.asNumber
}); exports.asRejectFundsRequest = asRejectFundsRequest

 const asCancelFundsRequest = _cleaners.asObject.call(void 0, {
  fioAddress: _cleaners.asString,
  fioRequestId: _cleaners.asNumber
}); exports.asCancelFundsRequest = asCancelFundsRequest

 const asFioRecordObtData = _cleaners.asObject.call(void 0, {
  payerFioAddress: _cleaners.asString,
  payeeFioAddress: _cleaners.asString,
  payerPublicAddress: _cleaners.asString,
  payeePublicAddress: _cleaners.asString,
  amount: _cleaners.asString,
  tokenCode: _cleaners.asString,
  chainCode: _cleaners.asString,
  obtId: _cleaners.asString,
  memo: _cleaners.asString,
  status: _cleaners.asOptional.call(void 0, 
    _cleaners.asValue.call(void 0, 'cancelled', 'rejected', 'requested', 'sent_to_blockchain')
  ),
  fioRequestId: _cleaners.asOptional.call(void 0, _cleaners.asNumber)
}); exports.asFioRecordObtData = asFioRecordObtData

 const asFioRequestFundsParams = _cleaners.asObject.call(void 0, {
  payerFioAddress: _cleaners.asString,
  payerFioPublicKey: _cleaners.asString,
  payeeFioAddress: _cleaners.asString,
  payeeTokenPublicAddress: _cleaners.asString,
  amount: _cleaners.asString,
  chainCode: _cleaners.asString,
  tokenCode: _cleaners.asString,
  memo: _cleaners.asString
}); exports.asFioRequestFundsParams = asFioRequestFundsParams

 const asFioBroadcastResult = _cleaners.asObject.call(void 0, {
  block_num: _cleaners.asNumber,
  block_time: _cleaners.asString,
  transaction_id: _cleaners.asString
}).withRest; exports.asFioBroadcastResult = asFioBroadcastResult

 const asFioEmptyResponse = _cleaners.asObject.call(void 0, {
  message: _cleaners.asString
}); exports.asFioEmptyResponse = asFioEmptyResponse

 const asGetFioRequestsResponse = _cleaners.asObject.call(void 0, {
  requests: _cleaners.asArray.call(void 0, _fioConst.asEncryptedFioRequest),
  more: _cleaners.asNumber
}); exports.asGetFioRequestsResponse = asGetFioRequestsResponse

 const asObtData = _cleaners.asObject.call(void 0, {
  payer_fio_address: _cleaners.asString,
  payee_fio_address: _cleaners.asString,
  payer_fio_public_key: _cleaners.asString,
  payee_fio_public_key: _cleaners.asString,
  content: _cleaners.asString,
  fio_request_id: _cleaners.asNumber,
  status: _cleaners.asString,
  time_stamp: _cleaners.asString
}); exports.asObtData = asObtData



 const asGetObtDataResponse = _cleaners.asObject.call(void 0, {
  obt_data_records: _cleaners.asArray.call(void 0, exports.asObtData),
  more: _cleaners.asNumber
}); exports.asGetObtDataResponse = asGetObtDataResponse


 const asSafeFioWalletInfo = _types.asWalletInfo.call(void 0, 
  _cleaners.asObject.call(void 0, {
    publicKey: _cleaners.asString
  })
); exports.asSafeFioWalletInfo = asSafeFioWalletInfo


 const asFioPrivateKeys = _cleaners.asObject.call(void 0, {
  fioKey: _cleaners.asString
}); exports.asFioPrivateKeys = asFioPrivateKeys

 const comparisonFioNameString = (res) => {
  const nameArray = []
  res.fio_domains.forEach(domain => nameArray.push(domain.fio_domain))
  res.fio_addresses.forEach(address => nameArray.push(address.fio_address))
  return nameArray.sort((a, b) => (a < b ? -1 : 1)).join()
}; exports.comparisonFioNameString = comparisonFioNameString

 const comparisonFioBalanceString = (res) => {
  const balanceArray = []
  balanceArray.push(res.balance)
  balanceArray.push(res.available)
  balanceArray.push(res.staked)
  balanceArray.push(res.srps)
  balanceArray.push(res.roe)
  return balanceArray.join()
}; exports.comparisonFioBalanceString = comparisonFioBalanceString








 const asFioNothingResponse = (
  message
) =>
  _cleaners.asMaybe.call(void 0, 
    _cleaners.asObject.call(void 0, {
      data: _cleaners.asObject.call(void 0, {
        json: _cleaners.asObject.call(void 0, { message: _cleaners.asValue.call(void 0, message) })
      })
    })
  ); exports.asFioNothingResponse = asFioNothingResponse
