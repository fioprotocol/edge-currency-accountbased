import { PrivateKey } from '@greymass/eosio'
import { div } from 'biggystring'
import { Ecc } from '@fioprotocol/fiojs'
import { validateMnemonic, mnemonicToSeed, entropyToMnemonic } from 'bip39'
import hdkey from 'hdkey'
import wif from 'wif'
import {
  EdgeCurrencyInfo,
  EdgeCurrencyTools,
  EdgeEncodeUri,
  EdgeFetchFunction,
  EdgeIo,
  EdgeMetaToken,
  EdgeParsedUri,
  EdgeTokenMap,
  EdgeWalletInfo
} from 'edge-core-js/types'

import { PluginEnvironment } from '../common/innerPlugin'
import { encodeUriCommon, parseUriCommon } from '../common/uriHelpers'
import { getFetchCors, getLegacyDenomination } from '../common/utils'
import {
  asFioPrivateKeys,
  asSafeFioWalletInfo,
  FioNetworkInfo
} from './fioTypes'

const FIO_CURRENCY_CODE = 'FIO'
const FIO_TYPE = 'fio'

export function checkAddress(address: string): boolean {
  const start = address.startsWith(FIO_CURRENCY_CODE)
  const length = address.length === 53
  return start && length
}

export class FioTools implements EdgeCurrencyTools {
  builtinTokens: EdgeTokenMap
  currencyInfo: EdgeCurrencyInfo
  io: EdgeIo
  networkInfo: FioNetworkInfo

  fetchCors: EdgeFetchFunction

  constructor(env: PluginEnvironment<FioNetworkInfo>) {
    const { builtinTokens, currencyInfo, io, networkInfo } = env
    this.builtinTokens = builtinTokens
    this.currencyInfo = currencyInfo
    this.io = io
    this.networkInfo = networkInfo

    this.fetchCors = getFetchCors(env.io)
  }

  async getDisplayPrivateKey(
    privateWalletInfo: EdgeWalletInfo
  ): Promise<string> {
    const keys = asFioPrivateKeys(privateWalletInfo.keys)
    return keys.fioKey
  }

  async getDisplayPublicKey(publicWalletInfo: EdgeWalletInfo): Promise<string> {
    const { keys } = asSafeFioWalletInfo(publicWalletInfo)
    return keys.publicKey
  }

  async createPrivateKeyMnemonic(mnemonic: string) {
    const seedBytes = await mnemonicToSeed(mnemonic)
    const seed = await seedBytes.toString('hex')
    const master = hdkey.fromMasterSeed(Buffer.from(seed, 'hex'))
    const node = master.derive('m/44\'/235\'/0\'/0/0')
    if (!node.privateKey) throw new Error('Failed to derive private key')
    const fioKey = wif.encode(128, node.privateKey, false)
    return { fioKey, mnemonic }
  }

  async importPrivateKey(userInput: string): Promise<Object> {
    const { pluginId } = this.currencyInfo
    const keys = {}
    if (/[0-9a-zA-Z]{51}$/.test(userInput)) {
      PrivateKey.fromString(userInput) // will throw if invalid

      // @ts-expect-error
      keys.fioKey = userInput
    } else {
      // it looks like a mnemonic, so validate that way:
      if (!validateMnemonic(userInput)) {
        // "input" instead of "mnemonic" in case private key
        // was just the wrong length
        throw new Error('Invalid input')
      }
      const privKeys = this.createPrivateKeyMnemonic(userInput)
      // @ts-expect-error
      keys.fioKey = privKeys.fioKey
      // @ts-expect-error
      keys.mnemonic = privKeys.mnemonic
    }

    // Validate the address derivation:
    const pubKeys = await this.derivePublicKey({
      type: `wallet:${pluginId}`,
      id: 'fake',
      keys
    })
    // @ts-expect-error
    keys.publicKey = pubKeys.publicKey

    return keys
  }
 
  async createFioPrivateKey(entropy: Buffer): Promise<{
    fioKey: string;
    mnemonic: string;
  }> {
    const mnemonic = entropyToMnemonic(entropy)
    return await this.createPrivateKeyMnemonic(mnemonic)
  }

  async createPrivateKey(
    walletType: string
  ): Promise<{ fioKey: string; mnemonic: string }> {
    const type = walletType.replace('wallet:', '')
    if (type === FIO_TYPE) {
      const buffer = Buffer.from(this.io.random(32))
      const out: { fioKey: string; mnemonic: string } =
        await this.createFioPrivateKey(buffer)
      return out
    } else {
      throw new Error('InvalidWalletType')
    }
  }

  async derivePublicKey(walletInfo: EdgeWalletInfo): Promise<Object> {
    const type = walletInfo.type.replace('wallet:', '')
    if (type === FIO_TYPE) {
      const publicKey: string = Ecc.privateToPublic(walletInfo.keys.fioKey)
      return { publicKey }
    } else {
      throw new Error('InvalidWalletType')
    }
  }

  async parseUri(uri: string): Promise<EdgeParsedUri> {
    const { edgeParsedUri } = parseUriCommon(
      this.currencyInfo,
      uri,
      {
        fio: true
      },
      FIO_CURRENCY_CODE
    )
    const valid = checkAddress(edgeParsedUri.publicAddress ?? '')
    if (!valid) {
      throw new Error('InvalidPublicAddressError')
    }

    return edgeParsedUri
  }

  async encodeUri(
    obj: EdgeEncodeUri,
    customTokens: EdgeMetaToken[] = []
  ): Promise<string> {
    const valid = checkAddress(obj.publicAddress)
    if (!valid) {
      throw new Error('InvalidPublicAddressError')
    }
    let amount
    if (typeof obj.nativeAmount === 'string') {
      const currencyCode: string = FIO_CURRENCY_CODE
      const nativeAmount: string = obj.nativeAmount
      const denom = getLegacyDenomination(
        currencyCode,
        this.currencyInfo,
        customTokens
      )
      if (denom == null) {
        throw new Error('InternalErrorInvalidCurrencyCode')
      }
      amount = div(nativeAmount, denom.multiplier, 16)
    }
    const encodedUri = encodeUriCommon(obj, FIO_TYPE, amount)
    return encodedUri
  }
}

export async function makeCurrencyTools(
  env: PluginEnvironment<FioNetworkInfo>
): Promise<FioTools> {
  return new FioTools(env)
}

export { makeCurrencyEngine } from './FioEngine'
