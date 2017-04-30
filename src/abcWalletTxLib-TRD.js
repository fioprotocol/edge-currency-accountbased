// abcWalletTxLib-btc.js
import random from 'random-js'

// const random = require('random-js')
import { txLibInfo } from './txLibInfo.js'

const GAP_LIMIT = 10
const DATA_STORE_FOLDER = 'txEngineFolder'
const ADDRESS_POLL_MILLISECONDS = 20000
const TRANSACTION_POLL_MILLISECONDS = 3000
const BLOCKHEIGHT_POLL_MILLISECONDS = 60000

export const TxLibBTC = {
  getInfo: () => {
    const currencyDetails = txLibInfo.getInfo

    return currencyDetails
  },

  createMasterKeys: (walletType) => {
    if (walletType === 'shitcoin') {
      const r = random()
      const masterPrivateKey = r.hex(16)
      const masterPublicKey = 'pub' + masterPrivateKey
      return { masterPrivateKey, masterPublicKey }
    } else {
      return null
    }
  },

  makeEngine: (abcTxLibAccess, options, callbacks) => {
    const abcTxLib = new ABCTxLibTRD(abcTxLibAccess, options, callbacks)

    return abcTxLib
  }
}

const baseUrl = 'http://localhost:8080/api/'

function fetchGet (cmd, params) {
  return window.fetch(baseUrl + cmd + '/' + params, {
    method: 'get'
  })
}
// function fetchPost (cmd, body) {
//   return window.fetch(baseUrl + cmd, {
//     method: 'post',
//     body: JSON.stringify(body)
//   })
// }

class WalletLocalData {
  constructor (jsonString) {
    this.blockHeight = 0
    this.totalBalance = 0

    // Map of gap limit addresses
    this.gapLimitAddresses = []

    // Array of ABCTransaction objects sorted by date from newest to oldest
    this.transactionsArray = []

    // Array of txids to fetch
    this.transactionsToFetch = []

    // Array of address objects, unsorted
    this.addressArray = []

    this.unusedAddressIndex = 0
    this.masterPublicKey = ''
    if (jsonString != null) {
      const data = JSON.parse(jsonString)
      for (const k in data) this[k] = data[k]
    }
  }
}

class ABCTxLibTRD {
  constructor (abcTxLibAccess, options, callbacks) {
    // dataStore.init(abcTxLibAccess, options, callbacks)
    this.engineOn = false
    this.transactionsDirty = true
    this.abcTxLibCallbacks = callbacks
    this.abcTxLibOptions = options
    this.walletLocalDataStore = abcTxLibAccess.walletLocalDataStore
  }

  // *************************************
  // Private methods
  // *************************************
  engineLoop () {
    this.engineOn = true
    this.blockHeightInnerLoop()
    this.checkAddressesInnerLoop()
    this.checkTransactionsInnerLoop()
  }

  // *************************************
  // Poll on the blockheight
  // *************************************
  blockHeightInnerLoop () {
    if (this.engineOn) {
      const p = new Promise ((resolve, reject) => {
        fetchGet('height', '').then(function (response) {
          return response.json()
        }).then((jsonObj) => {
          if (this.blockHeight != jsonObj.height) {
            this.blockHeight = jsonObj.height
            console.log('Block height changed: ' + this.blockHeight)
            this.abcTxLibCallbacks.blockHeightChanged(this.blockHeight)
          }
          resolve()
        }).catch(function (err) {
          console.log('Error fetching height: ' + err)
          resolve()
        })
      })
      p.then(() => {
        setTimeout(() => {
          this.blockHeightInnerLoop()
        }, BLOCKHEIGHT_POLL_MILLISECONDS)
      })
    }

  }

  checkTransactionsInnerLoop() {
    if (this.engineOn) {
      var promiseArray = []
      const numTransactions = this.walletLocalData.transactionsToFetch.length

      for (var n = 0; n < numTransactions; n++) {
        const txid = this.walletLocalData.transactionsToFetch[n]
        const p = this.processTransactionFromServer(txid)
        promiseArray.push(p)
        console.log('checkTransactionsInnerLoop: check ' + txid)
      }

      if (promiseArray.length > 0) {
        Promise.all(promiseArray).then(response => {
          setTimeout(() => {
            this.checkTransactionsInnerLoop()
          }, TRANSACTION_POLL_MILLISECONDS)
        }).catch(err => {
          console.log(new Error('Error: checkTransactionsInnerLoop: should not get here'))
          setTimeout(() => {
            this.checkTransactionsInnerLoop()
          }, TRANSACTION_POLL_MILLISECONDS)
        })
      } else {
        setTimeout(() => {
          this.checkTransactionsInnerLoop()
        }, TRANSACTION_POLL_MILLISECONDS)
      }
    }
  }

  processTransactionFromServer(txid) {
    return fetchGet('transaction', txid).then(function (response) {
      return response.json()
    }).then((jsonObj) => {
      console.log('processTransactionFromServer: response.json():')
      console.log(jsonObj)

      //
      // Calculate the amount sent from the wallet
      //

      // Iterate through all the inputs and see if any are in our wallet
      var spendAmount = 0
      var receiveAmount = 0

      const inputs = jsonObj.inputs
      for (var n in inputs) {
        const input = inputs[n]
        const addr = input.address
        const idx = this.walletLocalData.addressArray.indexOf(addr)
        if (idx != -1) {
          spendAmount += input.amount
        }
      }

      // Iterate through all the outputs and see if any are in our wallet
      const outputs = jsonObj.outputs
      for (var n in outputs) {
        const output = outputs[n]
        const addr = output.address
        const idx = this.walletLocalData.addressArray.indexOf(addr)
        if (idx != -1) {
          receiveAmount += output.amount
        }
      }

      const amountSatoshi = receiveAmount - spendAmount

      // Create a txlib ABCTransaction object which must contain
      // txid, date, blockHeight, amountSatoshi, networkFee, signedTx, and optionally otherParams
      var abcTransaction = {
        txid: jsonObj.txid,
        date: jsonObj.txDate,
        blockHeight: jsonObj.blockHeight,
        amountSatoshi,
        networkFee: jsonObj.networkFee,
        signedTx: "iwassignedyoucantrustme",
        otherParams: {
          inputs: jsonObj.inputs,
          outputs: jsonObj.outputs
        }
      }

      // Add transaction
      this.addTransaction(abcTransaction)

      // Remove txid from transactionsToFetch
      const idx = this.walletLocalData.transactionsToFetch.indexOf(jsonObj.txid)
      if (idx != -1) {
        this.walletLocalData.transactionsToFetch.splice(idx,1)
      }

      return 0
    }).catch(function (err) {
      console.log('Error fetching address: ' + address)
      return 0
    })
  }

  // **********************************************
  // Check all addresses for new transactions
  // **********************************************
  checkAddressesInnerLoop () {

    if (this.engineOn) {
      var promiseArray = []
      // var promiseArrayCount = 0
      for (var n = 0; n < this.walletLocalData.unusedAddressIndex + GAP_LIMIT; n++) {
        const address = this.addressFromIndex(n)
        const p = this.processAddressFromServer(address)
        promiseArray.push(p)

        if (this.walletLocalData.addressArray[n] == undefined) {
          this.walletLocalData.addressArray[n] = address
        } else {
          if (this.walletLocalData.addressArray[n] != address) {
            throw new Error('Derived address mismatch on index ' + n)
          }
        }

        console.log('checkAddressesInnerLoop: check ' + address)
      }

      if (promiseArray.length > 0) {
        Promise.all(promiseArray).then(response => {
          // Iterate over all the address balances and get a final balance
          console.log('checkAddressesInnerLoop: Completed responses: ' + response.length)

          var totalBalance = 0
          for (const n in response) {
            totalBalance += response[ n ]
            console.log('checkAddressesInnerLoop: response[' + n + ']: ' + response[ n ] + ' total:' + totalBalance)
          }
          this.walletLocalData.totalBalance = totalBalance
          setTimeout(() => {
            this.checkAddressesInnerLoop()
          }, ADDRESS_POLL_MILLISECONDS)
        }).catch(err => {
          console.log(new Error('Error: checkAddressesInnerLoop: should not get here'))
          setTimeout(() => {
            this.checkAddressesInnerLoop()
          }, ADDRESS_POLL_MILLISECONDS)
        })
      } else {
        setTimeout(() => {
          this.checkAddressesInnerLoop()
        }, ADDRESS_POLL_MILLISECONDS)
      }
    }
  }

  addressFromIndex (index) {
    let addr = '' + index + "-" + this.walletLocalData.masterPublicKey

    if (index === 0) {
      addr = addr + '__600000' // Preload first addresss with some funds
    }
    return addr
  }

  processAddressFromServer (address) {
    return fetchGet('address', address).then(function (response) {
      return response.json()
    }).then((jsonObj) => {
      console.log('processAddressFromServer: response.json():')
      console.log(jsonObj)
      const txids = jsonObj.txids
      // Iterate over txids in address
      for (var n in txids) {
        const txid = txids[n]
        console.log('processAddressFromServer: txid:' + txid)

        if (this.findTransaction(txid) == -1 &&
            this.walletLocalData.transactionsToFetch.indexOf(txid) == -1) {
          console.log('processAddressFromServer: txid not found. Adding:' + txid)
          this.walletLocalData.transactionsToFetch.push(txid)
          this.transactionsDirty = true
        }

        const idx = this.walletLocalData.addressArray.indexOf(jsonObj.address)
        if (idx === -1) {
          throw new Error('Queried address not found in addressArray:' + jsonObj.address)
        } else {
          if (idx >= this.walletLocalData.unusedAddressIndex) {
            this.walletLocalData.unusedAddressIndex = idx + 1
            console.log('processAddressFromServer: set unusedAddressIndex:' + this.walletLocalData.unusedAddressIndex)
          }
        }
      }
      return jsonObj.balance
    }).catch(function (err) {
      console.log('Error fetching address: ' + address)
      return 0
    })

  }

  findTransaction(txid) {
    return this.walletLocalData.transactionsArray.findIndex((element => {
      return element.txid == txid
    }))
  }

  sortTxByDate(a, b) {
    return b.date - a.date
  }

  addTransaction (abcTransaction) {
    // Add or update tx in transactionsArray
    const idx = this.findTransaction(abcTransaction.txid)

    if (idx == -1) {
      console.log('addTransaction: adding and sorting:' + abcTransaction.txid)
      this.walletLocalData.transactionsArray.push(abcTransaction)

      // Sort
      this.walletLocalData.transactionsArray.sort(this.sortTxByDate)
    } else {
      // Update the transaction
      this.walletLocalData.transactionsArray[idx] = abcTransaction
      console.log('addTransaction: updating:' + abcTransaction.txid)
    }
  }

  // *************************************
  // Public methods
  // *************************************

  startEngine () {
    const prom = new Promise((resolve, reject) => {

      this.walletLocalDataStore.readData(DATA_STORE_FOLDER, 'walletLocalData').then((result) => {
        this.walletLocalData = new WalletLocalData(result)
        this.walletLocalData.masterPublicKey = this.abcTxLibOptions.masterPublicKey
        this.engineLoop()
        resolve()
      }).catch((err) => {
        console.log(err)
        console.log('No walletLocalData setup yet: Failure is ok')
        this.walletLocalData = new WalletLocalData(null)
        this.walletLocalData.masterPublicKey = this.abcTxLibOptions.masterPublicKey
        this.walletLocalDataStore.writeData(DATA_STORE_FOLDER, 'walletLocalData', JSON.stringify(this.walletLocalData)).then((result) => {
          this.engineLoop()
          resolve()
        }).catch((err) => {
          console.log('Error writing to localDataStore:' + err)
          resolve()
        })
      })
    })

    return prom
  }

  killEngine () {
    // disconnect network connections
    // clear caches

    this.engineOn = false

    return true
  }

  // synchronous
  getBlockHeight () {
    return this.walletLocalData.blockHeight
  }

  // asynchronous
  enableTokens (tokens = {}) {
    // return Promise.resolve(dataStore.enableTokens(tokens))
  }

  // synchronous
  getTokenStatus () {
    // return dataStore.getTokensStatus()
  }

  // synchronous
  getBalance (options = {}) {
    return this.walletLocalData.totalBalance
  }

  // synchronous
  getNumTransactions (options = {}) {
    return this.walletLocalData.transactionsArray.size
  }

  // asynchronous
  getTransactions (options = {}) {
    // return Promise.resolve(dataStore.getTransactions(options = {}))
  }

  // synchronous
  getFreshAddress (options = {}) {
    // Algorithm to derive master pub key from master private key
    //  master public key = "pub[masterPrivateKey]". ie. "pub294709fe7a0sb0c8f7398f"
    // Algorithm to drive an address from index is "[index]-[masterPublicKey]" ie. "102-pub294709fe7a0sb0c8f7398f"
    return this.addressFromIndex(this.walletLocalData.unusedAddressIndex)
  }

  // synchronous
  addGapLimitAddresses (addresses, options) {
    for (var i in addresses) {
      if (this.walletLocalData.gapLimitAddresses.indexOf(addresses[i]) == -1) {
        this.walletLocalData.gapLimitAddresses.push(addresses[i])
      }
    }
  }

  // synchronous
  isAddressUsed (address, options = {}) {
    const idx = this.walletLocalData.addressArray.indexOf(address)
    if (idx != -1) {
      const addrObj = this.walletLocalData.addressArray[ idx ]
      if (addrObj != undefined) {
        if (addrObj.txids.length > 0) {
          return true
        }
      }
    }
    return false
  }

  // synchronous
  makeSpend (abcSpendInfo) { // returns an ABCTransaction data structure, and checks for valid info
    // return Promise.resolve(dataStore.makeSpend(abcSpendInfo))
  }

  // asynchronous
  signTx (abcTransaction) {
    // return Promise.resolve(dataStore.signTx(abcTransaction))
  }

  // asynchronous
  broadcastTx (abcTransaction) {
    return Promise.resolve(true)
  }

  // asynchronous
  saveTx (abcTransaction) {
    return Promise.resolve(true)
  }
}
