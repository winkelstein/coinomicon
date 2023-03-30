import {
  Container,
  Navbar,
  Input,
  Button,
  Link,
  Text,
  Grid,
  Card,
  styled,
  Tooltip,
} from '@nextui-org/react'
import { Contract, ethers } from 'ethers'
import { useState, useEffect, SetStateAction } from 'react'
import TelegramIcon from '@/components/icons/TelegramIcon'
import GithubIcon from '@/components/icons/GithubIcon'
import AddIcon from '@/components/icons/AddIcon'
import SearchIcon from '@/components/icons/SearchIcon'
import TokenInfo from '@/components/TokenInfo'
import config from '@/web3-api/config.json'
import CreateExchangeModal from '@/components/CreateExchangeModal'
import factory_abi from '@/web3-api/abis/CoinomiconFactory.json'

declare global {
  interface Window {
    ethereum: any
  }
}

const routes = {
  app: '/exchange',
  docs: '/docs',
  contact: '/contacts',
}

type TokenData = {
  address: string
  name: string
  symbol: string
}

export default function ExchangeSearch() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | undefined>(
    undefined,
  )
  const [factory, setFactory] = useState<Contract>()
  const [tokenAddresses, setTokenAddresses] = useState<string[]>([])
  const [topList, setTopList] = useState<TokenData[]>([])

  const [searchInput, setSearchInput] = useState<string>('')
  const [createModalVisible, setCreateModalVisible] = useState(false)

  const parseConfig = (topList: TokenData[]): TokenData[] => {
    const _tokenAddresses = []
    for (let i = 0; topList[i] !== undefined; i++) {
      _tokenAddresses.push({
        address: topList[i].address,
        name: topList[i].name,
        symbol: topList[i].symbol,
      })
    }
    return _tokenAddresses
  }

  useEffect(() => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    provider?.getNetwork().then((network) => {
      const _topList = config[network.chainId.toString() as keyof typeof config]
        .tokens as unknown as Array<{
        address: string
        name: string
        symbol: string
      }>
      setTopList(parseConfig(_topList))
      setTokenAddresses(parseConfig(_topList).map((item) => item.address))
      provider
        .getSigner()
        .then((signer) =>
          setFactory(
            new Contract(
              config[
                network.chainId.toString() as keyof typeof config
              ].CoinomiconFactory.address,
              factory_abi.abi,
              signer,
            ),
          ),
        )
    })

    setProvider(provider)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchInput === '')
      setTokenAddresses(topList.map((item) => item.address))
    const _tokenAddresses: string[] = []

    if (!ethers.isAddress(searchInput)) {
      topList
        .filter(
          ({ address, name, symbol }) =>
            name.includes(searchInput) || symbol.includes(searchInput),
        )
        .forEach((item) => {
          _tokenAddresses.push(item.address)
        })
    } else {
      _tokenAddresses.push(searchInput)
    }

    setTokenAddresses(_tokenAddresses)
  }, [searchInput, topList])

  // TODO: implement logic
  return (
    <Container css={{ height: '100%' }}>
      <Navbar
        isBordered
        isCompact
        variant="static"
        css={{ marginBottom: '10px' }}
      >
        <Navbar.Brand as={Link} href="/">
          <Text h4 b color="white">
            Coinomicon Exchange
          </Text>
        </Navbar.Brand>
        <Navbar.Content>
          <Navbar.Link href={routes.docs}>Docs</Navbar.Link>
          <Navbar.Link href={routes.contact}>Contact Us</Navbar.Link>
        </Navbar.Content>
        <Navbar.Content>
          <Navbar.Link
            href="https://github.com/treug0lnik041/coinomicon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon />
          </Navbar.Link>
          <Navbar.Link
            href="https://t.me/treug0lnik"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon />
          </Navbar.Link>
        </Navbar.Content>
      </Navbar>

      <Container>
        {provider && factory ? (
          <CreateExchangeModal
            visible={createModalVisible}
            setVisible={setCreateModalVisible}
            provider={provider}
            address={searchInput}
            setAddress={setSearchInput}
            factory={factory}
          />
        ) : (
          <></>
        )}
        <Grid.Container justify="center">
          <Grid css={{ width: '30%' }}>
            <Card>
              <Card.Header>Search token</Card.Header>
              <Card.Body>
                <Input
                  clearable
                  contentLeft={<SearchIcon size={16} />}
                  contentLeftStyling={false}
                  css={{
                    '& .nextui-input-content--left': {
                      h: '100%',
                      ml: '$4',
                      dflex: 'center',
                    },
                  }}
                  contentRight={
                    <Tooltip content={'Create new exchange'}>
                      <button
                        style={{
                          border: 'none',
                          background: 'transparent',
                          width: '30px',
                        }}
                        onClick={() => setCreateModalVisible(true)}
                      >
                        <AddIcon />
                      </button>
                    </Tooltip>
                  }
                  contentRightStyling={false}
                  placeholder="Search token..."
                  aria-label="search token"
                  bordered
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </Card.Body>
              <Card.Divider />
              <Card.Body
                css={{ height: '70vh', overflowY: 'auto', display: 'block' }}
              >
                {provider ? (
                  tokenAddresses.length > 0 ? (
                    tokenAddresses.map((address, index) => (
                      <TokenInfo
                        address={address}
                        provider={provider}
                        key={index}
                      />
                    ))
                  ) : (
                    <Text h4>
                      Your search did not match any token name or symbol.
                    </Text>
                  )
                ) : (
                  <Text b h1>
                    Install Metamask
                  </Text>
                )}
              </Card.Body>
            </Card>
          </Grid>
        </Grid.Container>
      </Container>
    </Container>
  )
}
