import { Container, Text, Navbar, Button, Link, Input } from '@nextui-org/react'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import config from '@/web3-api/config.json'
import abi from '@/web3-api/abis/CoinomiconFactory.json'

export default function Exchange() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | undefined>(
    undefined,
  )
  const [account, setAccount] = useState<ethers.JsonRpcSigner | undefined>(
    undefined,
  )
  const [coinomiconFactory, setCoinomiconFactory] = useState<
    ethers.Contract | undefined
  >(undefined)

  useEffect(() => {
    setProvider(new ethers.BrowserProvider((window as any).ethereum))
  }, [])

  const connectToMetamask = async () => {
    if (typeof (window as any).ethereum == 'undefined') {
      /* TODO: Modal to install Metamask */
      console.log('Metamask is not installed')
      return
    }
    if (account === undefined) {
      setAccount(await provider?.getSigner())
      ;(window as any).ethereum.on('accountsChanged', async () =>
        setAccount(await provider?.getSigner()),
      )
      ;(window as any).ethereum.on('chainChanged', () => {
        /* TODO: Modal to change chain to the correct */
        alert('Do not change you chain to avoid losses')
      })
      console.log('Connected to Metamask')
      const network = await provider?.getNetwork()
      const chainId = network?.chainId.toString()
      if (chainId != undefined) {
        const coinomiconFactory = new ethers.Contract(
          config[chainId as keyof typeof config].CoinomiconFactory
            .address as string,
          abi.abi,
          provider,
        )
        setCoinomiconFactory(coinomiconFactory)
        console.log(
          `Connecting to CoinomiconFactory contract. Current implementation address: ${await coinomiconFactory._getExchangeImplementation()}`,
        )
      }
    }
  }

  return (
    <Container>
      <Navbar isBordered isCompact variant="static">
        <Navbar.Brand>
          <Link href="/">
            <Text h4 b color="white">
              Coinomicon Exchange
            </Text>
          </Link>
        </Navbar.Brand>
        <Navbar.Content>
          <Navbar.Item
            css={{
              '@xsMax': {
                w: '100%',
                jc: 'center',
              },
            }}
          >
            <Input
              clearable
              contentLeftStyling={false}
              css={{
                w: '100%',
                '@xsMax': {
                  mw: '300px',
                },
                '& .nextui-input-content--left': {
                  h: '100%',
                  ml: '$4',
                  dflex: 'center',
                },
              }}
              placeholder="Search token..."
            />
          </Navbar.Item>
        </Navbar.Content>
        <Navbar.Content>
          <Button auto color="primary" bordered onPress={connectToMetamask}>
            {account
              ? account.address.substring(0, 6) +
                '....' +
                account.address.substring(38)
              : 'Connect wallet'}
          </Button>
        </Navbar.Content>
      </Navbar>
    </Container>
  )
}
