interface Fixture {
  pluginId: string
  WALLET_TYPE: string
  'Test Currency code': string
  key: number[]
  xpub: string
  key_length: number
  'invalid key name': {
    type: string
    keys: {
      fioKeyz: string
      mnemonic: string
    }
  }
  'invalid wallet type': {
    type: string
    keys: {
      fiokey: string
    }
  }
  parseUri: {
    'address only': string[]
    'invalid address': string[]
    'uri address': string[]
    'uri address with amount': string[]
    'uri address with unique identifier': string[]
    'uri address with unique identifier and without network prefix': string[]
    'uri address with amount & label': string[]
    'uri address with amount, label & message': string[]
    'uri address with unsupported param': string[]
  }
  encodeUri: {
    'address only': [{ publicAddress: string }, string]
    'weird address': [{ publicAddress: string }, string]
    'invalid address': Array<{ publicAddress: string }>
    'address & amount': [
      { publicAddress: string; nativeAmount: string },
      string
    ]
    'address, amount, and label': [
      {
        publicAddress: string
        nativeAmount: string
        currencyCode: string
        label: string
      },
      string
    ]
    'address, amount, label, & message': [
      {
        publicAddress: string
        nativeAmount: string
        currencyCode: string
        label: string
        message: string
      },
      string
    ]
  }
}

const fixtures: Fixture[] = [
  {
    pluginId: 'fio',
    WALLET_TYPE: 'wallet:fio',
    'Test Currency code': 'FIO',
    key: [
      39, 190, 34, 129, 208, 32, 145, 88, 191, 217, 226, 98, 183, 16, 52, 150,
      52, 53, 31, 137, 164, 40, 236, 146, 128, 107, 129, 59, 192, 240, 40, 238
    ],
    xpub: 'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
    key_length: 51,
    'invalid key name': {
      type: 'wallet:fio',
      keys: {
        fioKeyz: '5KG4yxR4j1S1UFk4mGraAfGrWh7TS5uiJmhtkG4vPunFWg84wuP',
        mnemonic:
          'chicken valve parrot park animal proof youth detail glance review artwork cluster drive more charge lunar uncle neglect brain act rose job photo spot'
      }
    },
    'invalid wallet type': {
      type: 'wallet:fiox',
      keys: { fiokey: '5KG4yxR4j1S1UFk4mGraAfGrWh7TS5uiJmhtkG4vPunFWg84wuP' }
    },
    parseUri: {
      'address only': [
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
      ],
      'invalid address': [
        'FIOHWCM6NMEVYZKLPJBS45H5OFRVUO4KOIVBIGWZEPMZUOTHBGOL',
        'GDUHWCM6NMEVYZKLPJBS45H5OFRVUO4KOIVBIGWZEPMZUOTHBGOL5FAD',
        'GDUHWCM6NMEVYZKLPJBS45H5OFRVUO4KOIVBIGWZEPMZUOTHBGOL5'
      ],
      'uri address': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
      ],
      'uri address with amount': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=12345.6789',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        '12345678900000',
        'FIO'
      ],
      'uri address with unique identifier': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?memo=123456789&memo_type=MEMO_ID',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        'FIO'
      ],
      'uri address with unique identifier and without network prefix': [
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?memo=123456789&memo_type=MEMO_ID',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        'FIO'
      ],
      'uri address with amount & label': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=1234.56789&label=Johnny%20Ripple',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        '1234567890000',
        'FIO',
        'Johnny Ripple'
      ],
      'uri address with amount, label & message': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=1234.56789&label=Johnny%20Ripple&msg=Hello%20World,%20I%20miss%20you%20!',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        '1234567890000',
        'FIO',
        'Johnny Ripple',
        'Hello World, I miss you !'
      ],
      'uri address with unsupported param': [
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?unsupported=helloworld&amount=12345.6789',
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
        '12345678900000',
        'FIO'
      ]
    },
    encodeUri: {
      'address only': [
        {
          publicAddress: 'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
        },
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
      ],
      'weird address': [
        {
          publicAddress: 'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
        },
        'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z'
      ],
      'invalid address': [
        { publicAddress: 'rf1GeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn' },
        { publicAddress: 'sf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn' },
        { publicAddress: 'rf1BiGeXwwQol8Z2ueFYTEXSwuJYfV2Jpn' }
      ],
      'address & amount': [
        {
          publicAddress:
            'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
          nativeAmount: '1234567800000'
        },
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=1234.5678'
      ],
      'address, amount, and label': [
        {
          publicAddress:
            'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
          nativeAmount: '1230',
          currencyCode: 'FIO',
          label: 'Johnny Ripple'
        },
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=0.00000123&label=Johnny%20Ripple'
      ],
      'address, amount, label, & message': [
        {
          publicAddress:
            'FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z',
          nativeAmount: '1230',
          currencyCode: 'FIO',
          label: 'Johnny Ripple',
          message: 'Hello World, I miss you !'
        },
        'fio:FIO522SwA96CmFo2sZLuSUbhJmgHhb9reUheYCJd3JtrAnSsvGD5Z?amount=0.00000123&label=Johnny%20Ripple&message=Hello%20World,%20I%20miss%20you%20!'
      ]
    }
  }
]

export default fixtures
