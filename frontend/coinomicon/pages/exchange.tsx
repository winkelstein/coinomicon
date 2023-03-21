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
  Table,
  Modal,
} from '@nextui-org/react'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import config from '@/web3-api/config.json'
import factory_abi from '@/web3-api/abis/CoinomiconFactory.json'
import exchange_abi from '@/web3-api/abis/CoinomiconExchangeImpl.json'
import erc20_abi from '@/web3-api/abis/ERC20.json'

import { SearchIcon } from '@/components/icons/SearchIcon'
import BuyModal from '@/components/BuyModal'
import SellModal from '@/components/SellModal'

/*const popularCoinAddresses = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  HEX: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
  MATIC: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  BNB: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
}*/

// TODO: modal to change network

export default function Exchange() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | undefined>(
    undefined,
  )
  const [currentAccount, setCurrentAccount] = useState<
    ethers.JsonRpcSigner | undefined
  >(undefined)
  const [coinomiconFactory, setCoinomiconFactory] = useState<
    ethers.Contract | undefined
  >(undefined)

  const [currentExchange, setCurrentExchange] = useState<
    ethers.Contract | undefined
  >(undefined)
  const [currentToken, setCurrentToken] = useState<ethers.Contract | undefined>(
    undefined,
  )

  const [currentSymbol, setCurrentSymbol] = useState<string>('')
  const [balance, setBalance] = useState<string | bigint>('')
  const [tokenBalance, setTokenBalance] = useState<string | bigint>('')
  const [marketOrLimit, setMarketOrLimit] = useState('market')

  const [modalBuyVisible, setModalBuyVisible] = useState(false)
  const [modalSellVisible, setModalSellVisible] = useState(false)

  const [amount, setAmount] = useState<string>('')
  const [price, setPrice] = useState<string>('')

  useEffect(() => {
    setProvider(new ethers.BrowserProvider((window as any).ethereum))
  }, [])

  useEffect(() => {
    if (currentAccount) {
      coinomiconFactory?.connect(currentAccount)
      currentExchange?.connect(currentAccount)
      currentToken?.connect(currentAccount)
      provider
        ?.getBalance(currentAccount.address)
        .then((value) => setBalance(ethers.formatEther(value.toString())))
      currentToken
        ?.balanceOf(currentAccount.address)
        .then(async (value) =>
          setTokenBalance(
            ethers.formatUnits(value.toString(), await currentToken.decimals()),
          ),
        )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount])

  const connectToMetamask = async () => {
    if (typeof (window as any).ethereum == 'undefined') {
      /* TODO: Modal to install Metamask */
      console.log('Metamask is not installed')
      return
    }
    if (currentAccount === undefined) {
      const account = await provider?.getSigner()
      setCurrentAccount(account)
      provider
        ?.getBalance((account as unknown as ethers.JsonRpcSigner).address)
        .then((value) => setBalance(ethers.formatEther(value.toString())))
      ;(window as any).ethereum.on('accountsChanged', async () => {
        setCurrentAccount(await provider?.getSigner())
      })
      ;(window as any).ethereum.on('chainChanged', async () => {
        /* TODO: Modal to change chain to the correct */
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7A69' }], // chainId must be in hexadecimal numbers
        })
      })
      console.log('Connected to Metamask')
      const network = await provider?.getNetwork()
      const chainId = network?.chainId.toString()
      if (chainId != undefined) {
        const coinomiconFactory = new ethers.Contract(
          config[chainId as keyof typeof config].CoinomiconFactory
            .address as string,
          factory_abi.abi,
          account,
        )
        const tokenContract = new ethers.Contract(
          config[chainId as keyof typeof config]['tokens'][0].address,
          erc20_abi,
          account,
        )
        tokenContract
          ?.balanceOf((account as unknown as ethers.JsonRpcSigner).address)
          .then(async (value) =>
            setTokenBalance(
              ethers.formatUnits(
                value.toString(),
                await tokenContract.decimals(),
              ),
            ),
          )
        tokenContract?.symbol().then(setCurrentSymbol)

        coinomiconFactory
          .getExchange(await tokenContract.getAddress())
          .then((address) =>
            setCurrentExchange(
              new ethers.Contract(address, exchange_abi.abi, account),
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
        <Navbar.Brand>
          <Link href="/">
            <Text h4 b color="white">
              Coinomicon Exchange
            </Text>
          </Link>
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
              aria-label="token"
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

      <Container>
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
          visible={modalSellVisible}
          setVisible={setModalSellVisible}
          marketOrLimit={marketOrLimit}
          signer={currentAccount}
          exchange={currentExchange}
          token={currentToken}
        />

        <Grid.Container>
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
                  <Text b h2>
                    Connect wallet
                  </Text>
                )}
              </Card.Header>
              <Card.Divider />
              <Card.Body>
                <Radio.Group
                  orientation="horizontal"
                  defaultValue="market"
                  size="md"
                  onChange={setMarketOrLimit}
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
                {marketOrLimit === 'limit' ? (
                  <Input
                    clearable
                    bordered
                    placeholder="0.000"
                    label="Limit price (ETH)"
                    type="text"
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={currentAccount ? false : true}
                    maxLength={20}
                  />
                ) : undefined}
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
              <Card.Divider />
              <Card.Body>
                <Table compact>
                  <Table.Header>
                    <Table.Column>Size</Table.Column>
                    <Table.Column>Price</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {/* TODO: Add functionality */}
                    <Table.Row key="1">
                      <Table.Cell>0.00</Table.Cell>
                      <Table.Cell>0.00</Table.Cell>
                    </Table.Row>
                    <Table.Row key="2">
                      <Table.Cell>0.00</Table.Cell>
                      <Table.Cell>0.00</Table.Cell>
                    </Table.Row>
                    <Table.Row key="3">
                      <Table.Cell>0.00</Table.Cell>
                      <Table.Cell>0.00</Table.Cell>
                    </Table.Row>
                    <Table.Row key="4">
                      <Table.Cell>0.00</Table.Cell>
                      <Table.Cell>0.00</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Card.Body>
            </Card>
          </Grid>
        </Grid.Container>
      </Container>
    </Container>
  )
}
