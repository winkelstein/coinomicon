import { ethers, Contract } from 'ethers'
import factory_abi from '@/web3-api/abis/CoinomiconFactory.json'
import exchange_abi from '@/web3-api/abis/CoinomiconExchangeImpl.json'

// TODO: change address when deploy
const GOERLI_FACTORY_ADDRESS = '0x0'
const MAINNET_FACTORY_ADDRESS = '0x0'

export const goerliProvider = new ethers.InfuraProvider('goerli')
export const mainnetProvider = new ethers.InfuraProvider('homestead')

export const goerliCoinomiconFactory = new Contract(
  GOERLI_FACTORY_ADDRESS,
  factory_abi.abi,
  goerliProvider,
)
export const mainnetCoinomiconFactory = new Contract(
  MAINNET_FACTORY_ADDRESS,
  factory_abi.abi,
  mainnetProvider,
)
export { factory_abi, exchange_abi }
