import { useState } from 'react'
import { Modal, Text, Input, Button } from '@nextui-org/react'
import { ethers } from 'ethers'

interface Props {
  visible: boolean
  setVisible: React.Dispatch<React.SetStateAction<boolean>>
  marketOrLimit: string
  signer: ethers.JsonRpcSigner | undefined
  exchange: ethers.Contract | undefined
  token: ethers.Contract | undefined
}

export default function SellModal(props: Props) {
  const { visible, setVisible, marketOrLimit } = props

  return (
    <Modal
      closeButton
      blur
      aria-labelledby="Sell"
      open={visible}
      onClose={() => setVisible(false)}
    >
      <Modal.Header>
        <Text id="buy-text" size={18} color="error">
          Sell
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
        />
        {marketOrLimit === 'limit' ? (
          <Input
            clearable
            bordered
            placeholder="0.000"
            label="Limit price"
            pattern="^[0-9]*[.,]?[0-9]*$"
            inputMode="decimal"
          />
        ) : undefined}
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat color="error" onPress={() => setVisible(false)}>
          Close
        </Button>
        {/* TODO: Add functionality */}
        <Button auto onPress={() => setVisible(false)}>
          Sell
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
