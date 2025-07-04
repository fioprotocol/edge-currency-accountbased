"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _validateMemos = require('./validateMemos');

/**
 * Upgrades the memo fields inside an EdgeSpendTarget,
 * since we need to be runtime-compatible with legacy core versions.
 */
 function upgradeMemos(
  spendInfo,
  currencyInfo
) {
  const { memoType } = currencyInfo

  const legacyMemos = []

  // If this chain supports legacy memos, grab those:
  if (memoType === 'hex' || memoType === 'number' || memoType === 'text') {
    for (const target of spendInfo.spendTargets) {
      if (target.memo != null) {
        legacyMemos.push({
          type: memoType,
          value: target.memo
        })
      } else if (target.uniqueIdentifier != null) {
        legacyMemos.push({
          type: memoType,
          value: target.uniqueIdentifier
        })
      } else if (typeof _optionalChain([target, 'access', _ => _.otherParams, 'optionalAccess', _2 => _2.uniqueIdentifier]) === 'string') {
        legacyMemos.push({
          type: memoType,
          value: target.otherParams.uniqueIdentifier
        })
      }
    }
  }

  // We need to support 0x prefixes for backwards compatibility:
  for (const memo of legacyMemos) {
    if (memo.type === 'hex') memo.value = memo.value.replace(/^0x/i, '')
  }

  // If we don't have modern memos, use the legacy ones:
  const out = {
    ...spendInfo,
    memos: _nullishCoalesce(spendInfo.memos, () => ( legacyMemos))
  }

  _validateMemos.validateMemos.call(void 0, out, currencyInfo)
  return out
} exports.upgradeMemos = upgradeMemos;
