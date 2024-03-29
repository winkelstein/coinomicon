import {
  Container,
  Text,
  Navbar,
  Button,
  Link,
  Input,
  Grid,
  Col,
  Card,
  Radio,
  Row,
} from '@nextui-org/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  formatEther,
  formatUnits,
  Contract,
  BrowserProvider,
  JsonRpcSigner,
} from 'ethers'
import config from '@/web3-api/config.json'
import factory_abi from '@/web3-api/abis/CoinomiconFactory.json'
import exchange_abi from '@/web3-api/abis/CoinomiconExchangeImpl.json'
import erc20_abi from '@/web3-api/abis/ERC20.json'

import SearchIcon from '@/components/icons/SearchIcon'
import BuyModal from '@/components/modals/BuyModal'
import SellModal from '@/components/modals/SellModal'
import StockChart from '@/components/StockChart'
import TokenInfoCard from '@/components/TokenInfoCard'
import NewOrders from '@/components/NewOrders'

// TODO: modal to change network
// TODO: subscribe on events to change balance

declare global {
  interface Window {
    ethereum: any
  }
}

export default function Exchange() {
  const router = useRouter()
  const { token_address } = router.query as { token_address: string }

  const [provider, setProvider] = useState<BrowserProvider>()
  const [currentAccount, setCurrentAccount] = useState<JsonRpcSigner>()
  const [coinomiconFactory, setCoinomiconFactory] = useState<Contract>()

  const [currentExchange, setCurrentExchange] = useState<Contract>()
  const [currentToken, setCurrentToken] = useState<Contract>()

  const [currentSymbol, setCurrentSymbol] = useState<string>('')
  const [balance, setBalance] = useState<string | bigint>('')
  const [tokenBalance, setTokenBalance] = useState<string | bigint>('')
  const [marketOrLimit, setMarketOrLimit] = useState<'market' | 'limit'>(
    'market',
  )

  const [modalBuyVisible, setModalBuyVisible] = useState(false)
  const [modalSellVisible, setModalSellVisible] = useState(false)

  const [amount, setAmount] = useState<string>('')
  const [price, setPrice] = useState<string>('')

  useEffect(() => {
    setProvider(new BrowserProvider(window.ethereum))
  }, [])

  useEffect(() => {
    if (currentAccount) {
      coinomiconFactory?.connect(currentAccount)
      currentExchange?.connect(currentAccount)
      currentToken?.connect(currentAccount)
      provider
        ?.getBalance(currentAccount.address)
        .then((value) => setBalance(formatEther(value.toString())))
      currentToken
        ?.balanceOf(currentAccount.address)
        .then(async (value) =>
          setTokenBalance(
            formatUnits(value.toString(), await currentToken.decimals()),
          ),
        )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount])

  const connectToMetamask = async () => {
    if (typeof window.ethereum == 'undefined') {
      alert('This app requires Metamask Ethereum wallet')
      return
    }
    if (currentAccount === undefined) {
      const account =
        (await provider?.getSigner().catch(() => {
          console.error('Metamask connection declined')
          return
        })) ?? undefined
      setCurrentAccount(account)
      provider
        ?.getBalance((account as unknown as JsonRpcSigner).address)
        .then((value) => setBalance(formatEther(value.toString())))
      window.ethereum.on('accountsChanged', async () => {
        setCurrentAccount(await provider?.getSigner())
      })
      window.ethereum.on('chainChanged', async () => {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x5' }], // goerli testnet
        })
        alert(
          'Coinomicon works only on Goerli testnet. Change chain to Goerli in Metamask and reload page.',
        )
      })
      console.log('Connected to Metamask')
      const network = await provider?.getNetwork()
      const chainId = network?.chainId.toString()
      if (chainId === '31337' || chainId === '5') {
        const coinomiconFactory = new Contract(
          config[chainId as keyof typeof config].CoinomiconFactory
            .address as string,
          factory_abi.abi,
          account,
        )
        const tokenContract = new Contract(token_address, erc20_abi, account)
        tokenContract
          ?.balanceOf((account as unknown as JsonRpcSigner).address)
          .then(async (value) =>
            setTokenBalance(
              formatUnits(value.toString(), await tokenContract.decimals()),
            ),
          )
        tokenContract?.symbol().then(setCurrentSymbol)

        coinomiconFactory
          .getExchange(await tokenContract.getAddress())
          .then((address) =>
            setCurrentExchange(
              new Contract(address, exchange_abi.abi, account),
            ),
          )
        setCurrentToken(tokenContract)
        setCoinomiconFactory(coinomiconFactory)
      }
    }
  }

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
        <Navbar.Content></Navbar.Content>
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
              contentLeft={<SearchIcon size={16} />}
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
              aria-label="search token"
              onClick={() => router.push('/exchange/search')}
            />
          </Navbar.Item>
          <Button auto color="primary" bordered onPress={connectToMetamask}>
            {currentAccount
              ? currentAccount.address.substring(0, 6) +
                '....' +
                currentAccount.address.substring(38)
              : 'Connect wallet'}
          </Button>
        </Navbar.Content>
      </Navbar>

      <Container css={{ height: '100%' }}>
        <BuyModal
          amount={amount}
          setAmount={setAmount}
          price={price}
          setPrice={setPrice}
          visible={modalBuyVisible}
          setVisible={setModalBuyVisible}
          marketOrLimit={marketOrLimit}
          signer={currentAccount}
          exchange={currentExchange}
          token={currentToken}
        />

        <SellModal
          amount={amount}
          setAmount={setAmount}
          price={price}
          setPrice={setPrice}
          visible={modalSellVisible}
          setVisible={setModalSellVisible}
          marketOrLimit={marketOrLimit}
          signer={currentAccount}
          exchange={currentExchange}
          token={currentToken}
        />

        <Grid.Container
          gap={1}
          justify="flex-start"
          css={{ height: '100%' }}
          direction="row"
        >
          <Row>
            <Col css={{ width: '40wh' }}>
              <Grid>
                <Card>
                  <Card.Header>
                    {currentAccount ? (
                      <Col>
                        <Text b h4>
                          ETH/{currentSymbol}
                        </Text>
                        <Text>Balance in ETH: {balance.toString()}</Text>
                        <Text>
                          Balance in {currentSymbol}: {tokenBalance.toString()}
                        </Text>
                      </Col>
                    ) : (
                      <Col>
                        <Text b h2>
                          Connect wallet
                        </Text>
                        <Text h5>to perform trades</Text>
                      </Col>
                    )}
                  </Card.Header>
                  <Card.Divider />
                  <Card.Body>
                    <Radio.Group
                      orientation="horizontal"
                      defaultValue="market"
                      size="md"
                      onChange={
                        setMarketOrLimit as React.Dispatch<
                          React.SetStateAction<string>
                        >
                      }
                    >
                      <Radio value="market">Market</Radio>
                      <Radio value="limit">Limit</Radio>
                    </Radio.Group>
                    <Input
                      clearable
                      bordered
                      placeholder="0.000"
                      label={'Amount (' + currentSymbol + ')'}
                      type="text"
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={currentAccount ? false : true}
                      maxLength={20}
                    />
                    <Input
                      clearable
                      bordered
                      placeholder={
                        marketOrLimit === 'limit'
                          ? '0.000'
                          : 'unavailable in market mode'
                      }
                      label="Limit price (ETH)"
                      type="text"
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={
                        currentAccount && marketOrLimit === 'limit'
                          ? false
                          : true
                      }
                      maxLength={20}
                    />
                  </Card.Body>
                  <Card.Footer>
                    <Button
                      color="success"
                      bordered
                      onPress={() => setModalBuyVisible(true)}
                      disabled={
                        currentAccount && amount.length > 0
                          ? marketOrLimit == 'limit'
                            ? price.length == 0
                            : false
                          : true
                      }
                      css={{ marginRight: '5px' }}
                    >
                      Buy
                    </Button>
                    <Button
                      color="error"
                      bordered
                      onPress={() => setModalSellVisible(true)}
                      disabled={
                        currentAccount && amount.length > 0
                          ? marketOrLimit == 'limit'
                            ? price.length == 0
                            : false
                          : true
                      }
                    >
                      Sell
                    </Button>
                  </Card.Footer>
                </Card>
                <Grid>
                  <Card css={{ height: '44vh' }}>
                    <Card.Header>
                      <Text b>New orders</Text>
                    </Card.Header>
                    <Card.Body>
                      <NewOrders exchange={currentExchange} />
                    </Card.Body>
                  </Card>
                </Grid>
              </Grid>
            </Col>
            <Col>
              <Grid>
                <Card
                  css={{
                    height: '60vh',
                    width: '100%',
                  }}
                >
                  <StockChart exchange={currentExchange} />
                </Card>
              </Grid>
              <Grid>
                <TokenInfoCard
                  token={currentToken}
                  exchange={currentExchange}
                />
              </Grid>
            </Col>
          </Row>
        </Grid.Container>
      </Container>
    </Container>
  )
}
