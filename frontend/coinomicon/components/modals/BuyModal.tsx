import { useEffect, useState, SetStateAction, Dispatch } from 'react'
import { Modal, Text, Input, Button, Loading } from '@nextui-org/react'
import {
  Contract,
  JsonRpcSigner,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers'

interface Props {
  amount: string
  setAmount: Dispatch<SetStateAction<string>>
  price: string
  setPrice: Dispatch<SetStateAction<string>>
  visible: boolean
  setVisible: Dispatch<SetStateAction<boolean>>
  marketOrLimit: 'market' | 'limit'
  signer?: JsonRpcSigner
  exchange?: Contract
  token?: Contract
}

export default function BuyModal(props: Props) {
  const {
    amount,
    setAmount,
    price,
    setPrice,
    visible,
    setVisible,
    marketOrLimit,
    signer,
    exchange,
    token,
  } = props
  const [decimals, setDecimals] = useState(18)
  const [total, setTotal] = useState<string>('0')
  const [isLoading, setLoading] = useState(false)
  const [available, setAvailable] = useState('0')

  useEffect(() => {
    token?.decimals().then(setDecimals)
  }, [token])

  useEffect(() => {
    if (exchange && visible && amount.length > 0) {
      switch (marketOrLimit) {
        case 'market': {
          ;(async () => {
            const _amount = parseTokenAmount(amount)
            let [_available, cost] = await exchange.cost(
              _amount,
              '0',
              false,
              true,
            )
            setAvailable(formatUnits(_available, decimals))
            if (_available == 0) {
              cost = BigInt(await exchange.bestPrice()) * _amount
              setAvailable('0')
            }
            setTotal(formatEther(cost))
          })()
          break
        }
        case 'limit': {
          if (price.length > 0) {
            ;(async () => {
              const _amount = parseTokenAmount(amount)
              try {
                const _total = formatEther(parseEther(price) * _amount)
                setTotal(_total)
              } catch (error) {
                setTotal('amount exceeds minimum or maximum')
              }
            })()
          }
          break
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, price, exchange, marketOrLimit, visible])

  const parseTokenAmount = (value: string) => {
    return parseUnits(value, decimals)
  }

  const buyLimit = async () => {
    const _amount = parseTokenAmount(amount)
    const cost = _amount * parseEther(price)
    await exchange?.submitLimitOrder(_amount, parseEther(price), true, {
      value: cost,
    })
  }

  const buyMarket = async () => {
    if (exchange) {
      const _amount = parseTokenAmount(amount)
      let [available, cost] = await exchange.cost(_amount, '0', false, true)
      if (available == 0) cost = (await exchange.bestPrice()) * _amount
      await exchange?.submitMarketOrder(_amount, true, { value: cost })
    }
  }

  const buyHandler = () => {
    setLoading(true)
    if (marketOrLimit == 'limit')
      buyLimit()
        .then(() => {
          setVisible(false)
          setAmount('0')
          setPrice('0')
          setTotal('0')
        })
        .catch((reason) => console.error(reason))
        .finally(() => setLoading(false))
    else
      buyMarket()
        .then(() => {
          setVisible(false)
          setAmount('0')
          setPrice('0')
          setTotal('0')
        })
        .catch((reason) => console.error(reason))
        .finally(() => setLoading(false))
  }

  return (
    <Modal
      closeButton
      blur
      aria-labelledby="Buy"
      open={visible}
      onClose={() => setVisible(false)}
    >
      <Modal.Header>
        <Text id="buy-text" size={18} color="success">
          Buy
        </Text>
      </Modal.Header>
      <Modal.Body>
        <Input
          clearable
          bordered
          placeholder="0.000"
          label="Amount"
          type="text"
          initialValue={amount}
          onChange={(e) => setAmount(e.target.value)}
          maxLength={20}
        />
        {marketOrLimit === 'limit' ? (
          <Input
            clearable
            bordered
            placeholder="0.000"
            label={`Limit price per 1 unit (${decimals} decimals)`}
            type="text"
            initialValue={price}
            onChange={(e) => setPrice(e.target.value)}
            maxLength={20}
          />
        ) : (
          <Text>Available: {available}</Text>
        )}
        <Text>Total cost: {total} ETH</Text>
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat color="error" onPress={() => setVisible(false)}>
          Close
        </Button>
        <Button
          auto
          disabled={
            signer && amount.length > 0 && total !== 'amount exceeds maximum'
              ? marketOrLimit == 'limit'
                ? price.length == 0
                : false
              : true
          }
          onPress={() => buyHandler()}
        >
          {isLoading ? (
            <Loading type="points" color="currentColor" size="sm" />
          ) : (
            'Buy'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
