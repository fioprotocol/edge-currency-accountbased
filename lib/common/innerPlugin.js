"use strict";Object.defineProperty(exports, "__esModule", {value: true});











/**
 * We pass a more complete plugin environment to the inner plugin,
 * so we can share the same instance between sibling networks.
 */





































 function makeOuterPlugin(
  template
) {
  return (env) => {
    const {
      builtinTokens = {},
      currencyInfo,
      networkInfo,
      otherMethodNames = [],
      checkEnvironment = () => {}
    } = template
    const innerEnv = { ...env, builtinTokens, currencyInfo, networkInfo }

    // Logic to load the inner plugin:
    let pluginPromise
    let toolsPromise
    async function loadInnerPlugin()


 {
      checkEnvironment()
      if (pluginPromise == null) {
        pluginPromise = template.getInnerPlugin()
      }
      const plugin = await pluginPromise
      if (toolsPromise == null) {
        toolsPromise = plugin.makeCurrencyTools(innerEnv)
      }
      const tools = await toolsPromise
      return { plugin, tools }
    }

    async function getBuiltinTokens() {
      return builtinTokens
    }

    async function makeCurrencyTools() {
      const { tools } = await loadInnerPlugin()
      return tools
    }

    async function makeCurrencyEngine(
      walletInfo,
      opts
    ) {
      const { tools, plugin } = await loadInnerPlugin()
      return await plugin.makeCurrencyEngine(innerEnv, tools, walletInfo, opts)
    }

    const otherMethods = makeOtherMethods(makeCurrencyTools, otherMethodNames)

    return {
      currencyInfo,
      getBuiltinTokens,
      makeCurrencyTools,
      makeCurrencyEngine,
      otherMethods
    }
  }
} exports.makeOuterPlugin = makeOuterPlugin;

/**
 * Builds an object with async proxy methods.
 * Calling any of these methods will load the currency tools,
 * and then call the corresponding method on the currency tools object.
 */
 function makeOtherMethods(
  getTools,
  otherMethodNames
) {
  // Shims for our other methods,
  // to load the plugin on-demand the first time somebody calls a method:
  const out = {}
  for (const name of otherMethodNames) {
    out[name] = async (...args) => {
      const tools = await getTools()
      const method = tools[name]
      if (typeof method !== 'function') {
        throw new Error(`Method ${name} is not implemented`)
      }
      return method.apply(tools, args)
    }
  }

  return out
} exports.makeOtherMethods = makeOtherMethods;
