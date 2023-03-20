import { useEffect, useState } from 'react'
import { Modal, Text, Input, Button } from '@nextui-org/react'
import { ethers } from 'ethers'

interface Props {
  amount: string
  price: string
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
    price,
    visible,
    setVisible,
    marketOrLimit,
    signer,
    exchange,
    token,
  } = props
  const [total, setTotal] = useState<string>('0')

  useEffect(() => {
    if (exchange && visible && marketOrLimit == 'market' && amount.length > 0) {
      exchange
        .cost(amount, '0', false, true)
        .then(([available, cost]) => setTotal(cost))
    }
  }, [amount, exchange, marketOrLimit, visible])

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
          pattern="^[0-9]*[.,]?[0-9]*$"
          inputMode="decimal"
          initialValue={amount}
        />
        {marketOrLimit === 'limit' ? (
          <Input
            clearable
            bordered
            placeholder="0.000"
            label="Limit price"
            pattern="^[0-9]*[.,]?[0-9]*$"
            inputMode="decimal"
            initialValue={price}
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
        <Button auto onPress={() => setVisible(false)}>
          Buy
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
