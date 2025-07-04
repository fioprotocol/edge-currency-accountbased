"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _cleaners = require('cleaners');

var _types = require('../common/types');






 const asSafeFioWalletInfo = _types.asWalletInfo.call(void 0, 
  _cleaners.asObject.call(void 0, {
    publicKey: _cleaners.asString
  })
); exports.asSafeFioWalletInfo = asSafeFioWalletInfo


 const asFioPrivateKeys = _cleaners.asObject.call(void 0, {
  fioKey: _cleaners.asString
}); exports.asFioPrivateKeys = asFioPrivateKeys
