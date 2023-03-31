import { Modal, Text, Button, Loading, Input } from '@nextui-org/react'
import { useRouter } from 'next/router'
import { useEffect, useState, Dispatch, SetStateAction } from 'react'
import {
  BrowserProvider,
  Contract,
  ZeroAddress,
  isAddress,
  parseEther,
} from 'ethers'
import erc20_abi from '@/web3-api/abis/ERC20.json'

interface Props {
  visible: boolean
  setVisible: Dispatch<SetStateAction<boolean>>
  provider: BrowserProvider
  address: string
  setAddress: Dispatch<SetStateAction<string>>
  factory: Contract
}

export default function CreateExchangeModal(props: Props) {
  const { visible, setVisible, provider, address, setAddress, factory } = props
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [price, setPrice] = useState('')

  useEffect(() => {
    ;(async () => {
      if (!isAddress(address)) {
        setError(null)
        return
      } else if (address === ZeroAddress) {
        setError('Error: Zero address')
        return
      } else if ((await factory.getExchange(address)) !== ZeroAddress) {
        setError('Error: Exchange for this token already exists')
        return
      } else setError(null)
    })()
  }, [address, factory])

  const createExchange = async () => {
    setIsLoading(true)
    const token = new Contract(address, erc20_abi, await provider.getSigner())

    // Check for valid ERC20 contract
    let result = await token
      .name()
      .catch(() => setError('Error: Invalid ERC20 contract'))
    result = await token
      .symbol()
      .catch(() => setError('Error: Invalid ERC20 contract'))
    result = await token
      .decimals()
      .catch(() => setError('Error: Invalid ERC20 contract'))
    result = await token
      .totalSupply()
      .catch(() => setError('Error: Invalid ERC20 contract'))
    if (result) {
      factory
        .createExchange(address, parseEther(price))
        .catch((reason) => setError(`Error: ${reason}`))
        .then(() => {
          setIsLoading(false)
          setVisible(false)
          router.push(`/exchange/${address}`)
        })
    }
    setIsLoading(false)
  }

  return (
    <Modal
      closeButton
      blur
      aria-labelledby="Create new exchange"
      open={visible}
      onClose={() => {
        setAddress('')
        setVisible(false)
      }}
    >
      <Modal.Header>
        {error ? (
          <Text size={18} color="error">
            {error}
          </Text>
        ) : (
          <Text size={18}>Create new exchange</Text>
        )}
      </Modal.Header>
      <Modal.Body>
        <Input
          clearable
          bordered
          placeholder="0x0"
          label="ERC20 Token address"
          type="text"
          initialValue={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          clearable
          bordered
          placeholder="0.000"
          label="Starting price (ETH)"
          type="text"
          initialValue={price}
          onChange={(e) => setPrice(e.target.value)}
          maxLength={20}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          auto
          flat
          color="error"
          onPress={() => {
            setAddress('')
            setVisible(false)
          }}
        >
          Close
        </Button>
        <Button
          auto
          disabled={error !== null || price === '' || parseFloat(price) === 0}
          onPress={() => createExchange()}
        >
          {isLoading ? (
            <Loading type="points" color="currentColor" size="sm" />
          ) : (
            'Create'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
