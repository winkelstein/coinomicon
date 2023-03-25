import { Card, Text } from '@nextui-org/react'
import { useState, useEffect } from 'react'
import { Contract, formatEther } from 'ethers'

interface Props {
  token?: Contract
  exchange?: Contract
}

export default function TokenInfoCard(props: Props) {
  const { token, exchange } = props
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [decimals, setDecimals] = useState('')
  const [bestPrice, setBestPrice] = useState('')
  const [lastPrice, setLastPrice] = useState("there's no any orders yet")

  useEffect(() => {
    if (token && exchange) {
      ;(async () => {
        setSymbol(await token.symbol())
        setName(await token.name())
        setDecimals((await token.decimals()).toString())
        setBestPrice(formatEther((await exchange.bestPrice()).toString()))

        // TODO: subscribe on events
        if ((await exchange.getOrderCount()) > 0n) {
          const lastId: bigint = (await exchange.getOrderCount()) - 1n
          const lastOrder = await exchange.getOrder(lastId)
          setLastPrice(formatEther(lastOrder.price.toString()))
        }
      })()
    }
  }, [token, exchange])

  return (
    <Card>
      <Card.Header>Info</Card.Header>
      <Card.Body>
        <Text>Symbol: {symbol}</Text>
        <Text>Name: {name}</Text>
        <Text>Decimals: {decimals}</Text>
        <Text>Best price (ETH): {bestPrice}</Text>
        <Text>Last price (ETH): {lastPrice}</Text>
      </Card.Body>
    </Card>
  )
}
