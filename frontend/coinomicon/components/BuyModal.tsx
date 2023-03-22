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

  useEffect(() => {
    token?.decimals().then(setDecimals)
  }, [token])

  useEffect(() => {
    if (exchange && visible && amount.length > 0) {
      if (marketOrLimit == 'market') {
        ;(async () => {
          const _amount = parseTokenAmount(amount)
          let [available, cost] = await exchange.cost(_amount, '0', false, true)
          if (available == 0)
            cost = BigInt(await exchange.bestPrice()) * _amount
          setTotal(ethers.formatEther(cost))
        })()
      } else if (marketOrLimit == 'limit' && price.length > 0) {
        ;(async () => {
          const _amount = (await parseTokenAmount(amount)) ?? 0n
          try {
            const _total = ethers.formatEther(
              ethers.parseEther(price) * _amount,
            )
            setTotal(_total)
          } catch (error) {
            setTotal('amount exceeds maximum')
          }
        })()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, price, exchange, marketOrLimit, visible])

  const parseTokenAmount = (value: string) => {
    return ethers.parseUnits(value, decimals)
  }

  const buyLimit = async () => {
    const _amount = parseTokenAmount(amount)
    const cost = _amount * ethers.parseEther(price)
    await exchange?.submitLimitOrder(_amount, ethers.parseEther(price), true, {
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
            label="Limit price (ETH)"
            type="text"
            initialValue={price}
            onChange={(e) => setPrice(e.target.value)}
            maxLength={20}
          />
        ) : undefined}
        <Text>{`Total cost: ${total} ETH`}</Text>
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
