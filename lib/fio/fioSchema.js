"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _cleaners = require('cleaners');

 const asGetFioName = _cleaners.asObject.call(void 0, {
  fio_domains: _cleaners.asArray.call(void 0, 
    _cleaners.asObject.call(void 0, {
      fio_domain: _cleaners.asString,
      expiration: _cleaners.asString,
      is_public: _cleaners.asNumber
    })
  ),
  fio_addresses: _cleaners.asArray.call(void 0, 
    _cleaners.asObject.call(void 0, {
      fio_address: _cleaners.asString,
      remaining_bundled_tx: _cleaners.asNumber
    })
  )
}); exports.asGetFioName = asGetFioName

 const asFioHistoryNodeAction = _cleaners.asObject.call(void 0, {
  account_action_seq: _cleaners.asNumber,
  block_num: _cleaners.asNumber,
  block_time: _cleaners.asString,
  action_trace: _cleaners.asObject.call(void 0, {
    receiver: _cleaners.asString,
    act: _cleaners.asObject.call(void 0, {
      account: _cleaners.asString,
      name: _cleaners.asString,
      authorization: _cleaners.asArray.call(void 0, 
        _cleaners.asObject.call(void 0, {
          actor: _cleaners.asString,
          permission: _cleaners.asString
        })
      ),
      data: _cleaners.asObject.call(void 0, {
        payee_public_key: _cleaners.asOptional.call(void 0, _cleaners.asString),
        amount: _cleaners.asOptional.call(void 0, _cleaners.asNumber),
        max_fee: _cleaners.asOptional.call(void 0, _cleaners.asNumber),
        actor: _cleaners.asOptional.call(void 0, _cleaners.asString),
        tpid: _cleaners.asOptional.call(void 0, _cleaners.asString),
        quantity: _cleaners.asOptional.call(void 0, _cleaners.asString),
        memo: _cleaners.asOptional.call(void 0, _cleaners.asString),
        to: _cleaners.asOptional.call(void 0, _cleaners.asString),
        from: _cleaners.asOptional.call(void 0, _cleaners.asString)
      }),
      hex_data: _cleaners.asString
    }),
    trx_id: _cleaners.asString,
    block_num: _cleaners.asNumber,
    block_time: _cleaners.asString,
    producer_block_id: _cleaners.asString
  })
}); exports.asFioHistoryNodeAction = asFioHistoryNodeAction

 const asHistoryResponse = _cleaners.asObject.call(void 0, {
  actions: _cleaners.asArray.call(void 0, exports.asFioHistoryNodeAction)
}); exports.asHistoryResponse = asHistoryResponse

 const asGetFioBalanceResponse = _cleaners.asObject.call(void 0, {
  balance: _cleaners.asNumber,
  available: _cleaners.asNumber,
  staked: _cleaners.asNumber,
  srps: _cleaners.asNumber,
  roe: _cleaners.asString
}); exports.asGetFioBalanceResponse = asGetFioBalanceResponse


