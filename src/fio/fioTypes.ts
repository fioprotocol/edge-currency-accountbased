import { asObject, asString } from 'cleaners'

import { asWalletInfo } from '../common/types'

export interface FioNetworkInfo {
  chainId: string
}

export type SafeFioWalletInfo = ReturnType<typeof asSafeFioWalletInfo>
export const asSafeFioWalletInfo = asWalletInfo(
  asObject({
    publicKey: asString
  })
)

export type FioPrivateKeys = ReturnType<typeof asFioPrivateKeys>
export const asFioPrivateKeys = asObject({
  fioKey: asString
})
