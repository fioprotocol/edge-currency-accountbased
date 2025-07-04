"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _biggystring = require('biggystring');
var _cleaners = require('cleaners');







var _types3 = require('./types');

/**
 * Validates the memos on an spend request.
 * Throws an error if any of the memos are wrong.
 */
 function validateMemos(
  spendInfo,
  currencyInfo
) {
  const { memos = [] } = spendInfo
  const {
    displayName,
    memoMaxLength,
    memoMaxValue,
    memoOptions = [],
    multipleMemos = false,
    memoType
  } = currencyInfo

  // Not all coins keep the legacy memo type in the modern list,
  // but we still need to validate the legacy type if present:
  const allOptions = [...memoOptions]
  if (memoType === 'text') {
    allOptions.push({ type: 'text', maxLength: memoMaxLength })
  }
  if (memoType === 'number') {
    allOptions.push({ type: 'number', maxValue: memoMaxValue })
  }
  if (memoType === 'hex') {
    allOptions.push({
      type: 'hex',
      maxBytes: memoMaxLength == null ? undefined : memoMaxLength / 2
    })
  }

  // What we should call a "memo" in our error messages:
  const { memoName = 'memo' } = _nullishCoalesce(memoOptions[0], () => ( {}))

  // Now validate our memos:
  for (const memo of memos) {
    const options = allOptions.filter(option => memo.type === option.type)
    if (options.length < 1) {
      throw new Error(`${displayName} ${memoName}: cannot be type ${memo.type}`)
    }
    const problem = options
      .map(option => getMemoError(memo, option))
      .find(problem => problem != null)
    if (problem != null) {
      throw new Error(`${displayName} ${memoName}: ${problem}`)
    }
  }

  // Validate the number of memos:
  if (!multipleMemos && memos.length > 1) {
    throw new Error(`${displayName} only supports one ${memoName}`)
  }
} exports.validateMemos = validateMemos;

/**
 * Checks a memo against a memo option.
 * Returns `undefined` if valid, or an error string if invalid.
 */
function getMemoError(
  memo,
  option
) {
  if (
    option.type === 'text' &&
    option.maxLength != null &&
    memo.value.length > option.maxLength
  ) {
    return `cannot be longer than ${option.maxLength}`
  }

  if (option.type === 'number') {
    const value = _cleaners.asMaybe.call(void 0, (0, _types3.asIntegerString))(memo.value)
    if (value == null) {
      return `is not a valid number`
    }
    if (option.maxValue != null && _biggystring.gt.call(void 0, value, option.maxValue)) {
      return `cannot be greater than ${option.maxValue}`
    }
  }

  if (option.type === 'hex') {
    const value = _cleaners.asMaybe.call(void 0, (0, _types3.asBase16))(memo.value)
    if (value == null) {
      return `is not valid hexadecimal`
    }
    if (option.maxBytes != null && value.length > option.maxBytes) {
      return `cannot be longer than ${option.maxBytes} bytes`
    }
    if (option.minBytes != null && value.length < option.minBytes) {
      return `cannot be shorter than ${option.minBytes} bytes`
    }
  }
}
