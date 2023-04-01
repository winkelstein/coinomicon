import { useState, useEffect } from 'react'
import { Table } from '@nextui-org/react'
import { Contract } from 'ethers'

type TableCell = {
  size: number | string
  price: number | string
}

interface Props {
  exchange?: Contract
}

export default function NewOrders(props: Props) {
  const { exchange } = props
  const [cells, setCells] = useState<TableCell[]>([])

  useEffect(() => {
    if (exchange) {
      exchange.on(
        exchange.filters.LimitOrderSubmitted,
        (
          _orderId: string,
          _trader: string,
          amount: string,
          price: string,
          _buy: boolean,
        ) => {
          setCells([
            { size: amount.toString(), price: price.toString() },
            ...cells,
          ])
        },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchange])

  return (
    <Table compact>
      <Table.Header>
        <Table.Column>Size</Table.Column>
        <Table.Column>Price</Table.Column>
      </Table.Header>
      <Table.Body>
        {cells.map((cell, index) => (
          <Table.Row key={index}>
            <Table.Cell>{cell.size}</Table.Cell>
            <Table.Cell>{cell.price}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
