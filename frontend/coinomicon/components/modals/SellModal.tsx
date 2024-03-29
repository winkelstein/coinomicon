import { useEffect, useState, Dispatch, SetStateAction } from 'react'
import { Modal, Text, Input, Button, Loading } from '@nextui-org/react'
import {
  Contract,
  JsonRpcSigner,
  formatEther,
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

export default function SellModal(props: Props) {
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

  useEffect(() => {
    token?.decimals().then(setDecimals)
  }, [token])

  useEffect(() => {
    if (exchange && visible && amount.length > 0) {
      switch (marketOrLimit) {
        case 'market': {
          ;(async () => {
            const _amount = parseTokenAmount(amount)
            let [available, cost] = await exchange.cost(
              _amount,
              '0',
              false,
              false,
            )
            if (available == 0)
              cost = BigInt(await exchange.bestPrice()) * _amount
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
                setTotal('amount exceeds minumum or maximum')
              }
            })()
            break
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, price, exchange, marketOrLimit, visible])

  const parseTokenAmount = (value: string) => {
    return parseUnits(value, decimals)
  }

  const sellLimit = async () => {
    if (exchange && token) {
      const _amount = parseTokenAmount(amount)
      await token.approve(await exchange.getAddress(), _amount)
      await exchange?.submitLimitOrder(_amount, parseEther(price), false)
    }
  }

  const sellMarket = async () => {
    if (exchange && token) {
      const _amount = parseTokenAmount(amount)
      await token.approve(await exchange.getAddress(), _amount)
      await exchange.submitMarketOrder(_amount, false)
    }
  }

  const buyHandler = () => {
    setLoading(true)
    if (marketOrLimit == 'limit')
      sellLimit()
        .then(() => {
          setVisible(false)
          setAmount('0')
          setPrice('0')
          setTotal('0')
        })
        .catch((reason) => console.error(reason))
        .finally(() => setLoading(false))
    else
      sellMarket()
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
        <Text id="sell-text" size={18} color="error">
          Sell
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
            label="Limit price (ETH)"
            type="text"
            initialValue={price}
            onChange={(e) => setPrice(e.target.value)}
            maxLength={20}
          />
        ) : undefined}
        <Text>{`You'll get: ${total} ETH`}</Text>
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
            'Sell'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
