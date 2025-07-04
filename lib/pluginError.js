"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } const pluginErrorCodes = [400, 403, 404]; exports.pluginErrorCodes = pluginErrorCodes
 const pluginErrorName = {
  XRP_ERROR: 'XrpError'
}; exports.pluginErrorName = pluginErrorName
 const pluginErrorLabels = {
  UNIQUE_IDENTIFIER_EXCEEDS_LENGTH: 'UNIQUE_IDENTIFIER_EXCEEDS_LENGTH',
  UNIQUE_IDENTIFIER_EXCEEDS_LIMIT: 'UNIQUE_IDENTIFIER_EXCEEDS_LIMIT',
  UNIQUE_IDENTIFIER_FORMAT: 'UNIQUE_IDENTIFIER_FORMAT'
}; exports.pluginErrorLabels = pluginErrorLabels

 class PluginError extends Error {
  // @ts-expect-error
  
  // @ts-expect-error
  
  // @ts-expect-error
  
  

  constructor(
    message,
    name,
    code,
    labelCode,
    json
  ) {
    super(message)

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PluginError)
    }

    this.name = _nullishCoalesce(name, () => ( 'PluginError'))
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (code) this.errorCode = code
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (labelCode) this.labelCode = labelCode
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (json) this.json = json
  }
} exports.PluginError = PluginError;
