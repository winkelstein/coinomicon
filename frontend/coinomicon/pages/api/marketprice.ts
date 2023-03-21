import { NextApiRequest, NextApiResponse } from 'next'
import { Contract } from 'ethers'
import erc20_abi from '@/web3-api/abis/ERC20.json'

import {
  goerliCoinomiconFactory,
  goerliProvider,
  mainnetCoinomiconFactory,
  mainnetProvider,
} from './provider'

type ResponseType =
  | {
      token: {
        address: string
        name: string
        symbol: string
      }
      exchange_address: string | undefined
      price: string | undefined
    }
  | { message: string }

type RequestType = {
  address: string
}

export default async function marketPriceApi(
  req: NextApiRequest,
  res: NextApiResponse<ResponseType>,
) {
  if (req.method == 'GET') {
    const { network, address } = req.query
    let token = new Contract(address as string, erc20_abi, goerliProvider)
    let factory = goerliCoinomiconFactory

    switch (network) {
      case 'goerli':
        token = new Contract(address as string, erc20_abi, goerliProvider)
        factory = goerliCoinomiconFactory
        break
      case 'mainnet':
        token = new Contract(address as string, erc20_abi, mainnetProvider)
        factory = mainnetCoinomiconFactory
        break
      default:
        res.status(400).json({ message: 'Invalid network' })
    }

    const response = {
      token: {
        address: address as string,
        name: await token.name(),
        symbol: await token.symbol(),
      },
      exchange_address: undefined,
      price: undefined,
    }
    res.status(200).json(response)
  }
}
