"use strict";Object.defineProperty(exports, "__esModule", {value: true});






var _utils = require('./utils');
const INFO_SERVERS = ['https://info1.edge.app', 'https://info2.edge.app']

 async function fetchWaterfall(
  servers,
  path,
  options,
  timeout = 5000,
  doFetch = fetch
) {
  const funcs = servers.map(server => async () => {
    const result = await doFetch(server + '/' + path, options)
    if (typeof result !== 'object') {
      const msg = `Invalid return value ${path} in ${server}`
      console.log(msg)
      throw new Error(msg)
    }
    return result
  })
  return await _utils.asyncWaterfall.call(void 0, funcs, timeout)
} exports.fetchWaterfall = fetchWaterfall;

 async function cleanMultiFetch(
  cleaner,
  servers,
  path,
  options,
  timeout = 5000,
  doFetch
) {
  const response = await fetchWaterfall(
    _utils.shuffleArray.call(void 0, servers),
    path,
    options,
    timeout,
    doFetch
  )
  if (!response.ok) {
    const text = await response.text()
    console.error(text)
    throw new Error(`Error fetching ${path}: ${text}`)
  }
  const responseJson = await response.json()
  const out = cleaner(responseJson)
  return out
} exports.cleanMultiFetch = cleanMultiFetch;

async function multiFetch(
  servers,
  path,
  options,
  timeout = 5000,
  doFetch
) {
  return await fetchWaterfall(
    _utils.shuffleArray.call(void 0, servers),
    path,
    options,
    timeout,
    doFetch
  )
}

 const fetchInfo = async (
  path,
  options,
  timeout,
  doFetch
) => {
  return await multiFetch(INFO_SERVERS, path, options, timeout, doFetch)
}; exports.fetchInfo = fetchInfo





 const makeQueryParams = (params) => {
  return Object.keys(params)
    .map(key => {
      const value = params[key]
      return value == null ? key : `${key}=${encodeURIComponent(value)}`
    })
    .join('&')
}; exports.makeQueryParams = makeQueryParams
