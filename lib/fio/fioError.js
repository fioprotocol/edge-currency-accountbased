"use strict";Object.defineProperty(exports, "__esModule", {value: true}); const fioApiErrorCodes = [400, 404]; exports.fioApiErrorCodes = fioApiErrorCodes

 const fioRegApiErrorCodes = {
  INVALID_FIO_ADDRESS: 'INVALID_FIO_ADDRESS',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED',
  FIO_ADDRESS_IS_NOT_EXIST: 'FIO_ADDRESS_IS_NOT_EXIST',
  FIO_DOMAIN_IS_NOT_EXIST: 'FIO_DOMAIN_IS_NOT_EXIST',
  FIO_DOMAIN_IS_NOT_PUBLIC: 'FIO_DOMAIN_IS_NOT_PUBLIC',
  IS_DOMAIN_PUBLIC_ERROR: 'IS_DOMAIN_PUBLIC_ERROR',
  FIO_ADDRESS_IS_NOT_LINKED: 'FIO_ADDRESS_IS_NOT_LINKED',
  SERVER_ERROR: 'SERVER_ERROR',
  ALREADY_SENT_REGISTRATION_REQ_FOR_DOMAIN:
    'ALREADY_SENT_REGISTRATION_REQ_FOR_DOMAIN'
} ; exports.fioRegApiErrorCodes = fioRegApiErrorCodes

 class FioError extends Error {
  // @ts-expect-error
  
  // @ts-expect-error
  
  // @ts-expect-error
  
  

  constructor(message, code, labelCode, json) {
    super(message)

    if (Error.captureStackTrace != null) {
      Error.captureStackTrace(this, FioError)
    }

    this.name = 'FioError'
    if (code != null) this.errorCode = code
    if (labelCode != null) this.labelCode = labelCode
    if (json != null) this.json = json
  }
} exports.FioError = FioError;
