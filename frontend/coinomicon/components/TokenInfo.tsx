import { Card, Text, Row } from '@nextui-org/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import erc20_abi from '@/web3-api/abis/ERC20.json'

interface Props {
  address: string
  provider: BrowserProvider
}

export default function TokenInfo(props: Props) {
  const { address, provider } = props
  const [error, setError] = useState(false)
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')

  useEffect(() => {
    const contract = new Contract(address, erc20_abi, provider)
    contract
      .name()
      .catch(() => setError(true))
      .then(setName)
    contract
      .symbol()
      .catch(() => setError(true))
      .then(setSymbol)
  }, [address, provider])

  if (error) return <></>
  return (
    <Card css={{ marginBottom: '5px' }} as={Link} href={`/exchange/${address}`}>
      <Card.Body css={{ overflow: 'hidden' }}>
        <Row>
          <Text b>Name: {name}</Text>
        </Row>
        <Row>
          <Text b>Symbol: {symbol}</Text>
        </Row>
        <Row>
          <Text b>Address: {address}</Text>
        </Row>
      </Card.Body>
    </Card>
  )
}
