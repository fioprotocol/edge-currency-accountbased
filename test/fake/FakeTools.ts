import {
  EdgeCurrencyTools,
  EdgeEncodeUri,
  EdgeIo,
  EdgeMetaToken,
  EdgeParsedUri,
  EdgeWalletInfo,
  JsonObject
} from 'edge-core-js/types'

import { currencyInfo as fioInfo } from '../../src/fio/fioInfo'

const fakeIo: any = {}

export class FakeTools implements EdgeCurrencyTools {
  io: EdgeIo = fakeIo
  currencyInfo = { ...fioInfo, pluginId: 'fakePlugin' }

  async createPrivateKey(
    walletType: string,
    opts?: JsonObject | undefined
  ): Promise<JsonObject> {
    return {}
  }

  async derivePublicKey(walletInfo: EdgeWalletInfo): Promise<JsonObject> {
    return {}
  }

  async parseUri(
    uri: string,
    currencyCode?: string | undefined,
    customTokens?: EdgeMetaToken[] | undefined
  ): Promise<EdgeParsedUri> {
    return {}
  }

  async encodeUri(
    obj: EdgeEncodeUri,
    customTokens?: EdgeMetaToken[] | undefined
  ): Promise<string> {
    return ''
  }
}
