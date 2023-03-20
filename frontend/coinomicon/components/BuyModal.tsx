import { useEffect, useState } from 'react'
import { Modal, Text, Input, Button, Loading } from '@nextui-org/react'
import { ethers } from 'ethers'

interface Props {
  amount: string
  setAmount: React.Dispatch<React.SetStateAction<string>>
  price: string
  setPrice: React.Dispatch<React.SetStateAction<string>>
  visible: boolean
  setVisible: React.Dispatch<React.SetStateAction<boolean>>
  marketOrLimit: string
  signer: ethers.JsonRpcSigner | undefined
  exchange: ethers.Contract | undefined
  token: ethers.Contract | undefined
}

// TODO: parse token units

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
  const [total, setTotal] = useState<string>('0')
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    if (exchange && visible && marketOrLimit == 'market' && amount.length > 0) {
      ;(async () => {
        let [available, cost] = await exchange.cost(amount, '0', false, true)
        if (available == 0) cost = (await exchange.bestPrice()) * BigInt(amount)
        setTotal(ethers.formatEther(cost))
      })()
    }
  }, [amount, exchange, marketOrLimit, visible])

  const buyLimit = async () => {
    const cost = BigInt(amount) * BigInt(price)
    await exchange?.submitLimitOrder(amount, price, true, { value: cost })
  }

  const buyMarket = async () => {
    if (exchange) {
      let [available, cost] = await exchange.cost(amount, '0', false, true)
      if (available == 0) cost = (await exchange.bestPrice()) * BigInt(amount)
      await exchange?.submitMarketOrder(amount, true, { value: cost })
    }
  }

  const buyHandler = () => {
    setLoading(true)
    if (marketOrLimit == 'limit')
      buyLimit().then(() => {
        setVisible(false)
        setLoading(false)
      })
    else
      buyLimit().then(() => {
        setVisible(false)
        setLoading(false)
      })
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
          type="number"
          initialValue={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {marketOrLimit === 'limit' ? (
          <Input
            clearable
            bordered
            placeholder="0.000"
            label="Limit price"
            type="number"
            initialValue={price}
            onChange={(e) =>
              setPrice(ethers.parseEther(e.target.value).toString())
            }
          />
        ) : (
          `Total cost: ${total} ETH`
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat color="error" onPress={() => setVisible(false)}>
          Close
        </Button>
        {/* TODO: Add functionality */}
        <Button
          auto
          disabled={
            signer && amount.length > 0
              ? marketOrLimit == 'limit'
                ? price.length == 0
                : false
              : true
          }
          onPress={() => buyHandler()}
        >
          {isLoading ? (
            <Loading type="spinner" color="currentColor" size="sm" />
          ) : (
            'Buy'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
