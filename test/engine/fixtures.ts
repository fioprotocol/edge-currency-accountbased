interface Fixture {
  pluginId: string
  WALLET_TYPE: string
  'Test Currency code': string
  key: number[]
  messages?: {}
}

const fixture: Fixture[] = [
  {
    pluginId: 'fio',
    WALLET_TYPE: 'wallet:fio',
    'Test Currency code': 'FIO',
    key: [
      39, 190, 34, 129, 208, 32, 145, 88, 191, 217, 226, 98, 183, 16, 52, 150,
      52, 53, 31, 137, 164, 40, 236, 146, 128, 107, 129, 59, 192, 240, 40, 238
    ]
  }
]

export default fixture
