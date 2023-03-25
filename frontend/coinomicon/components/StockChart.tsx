import { useState, useEffect } from 'react'
import { Text } from '@nextui-org/react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ChartData,
  Point,
} from 'chart.js'
import { Contract } from 'ethers'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

/*const _data = {
  labels: [
    'March 22',
    'March 23',
    'March 24',
    'March 25',
    'March 26',
    'March 27',
    'March 28',
    'March 29',
    'March 30',
  ],
  datasets: [
    {
      data: [8, 7.8, 6, 3, 1, 2, 13, 8, 5],
      borderColor: '#ff0000',
    },
  ],
}*/

type DataType = {
  time: string
  price: number
}

interface ChartType {
  labels: string[]
  datasets: [
    {
      data: number[]
      borderColor: string
    },
  ]
}

interface Props {
  exchange: Contract
}

export default function StockChart(props: Props) {
  const { exchange } = props

  const [stocks, setStocks] = useState<DataType[]>([])

  const [data, setData] = useState<ChartType>({
    labels: [],
    datasets: [{ data: [], borderColor: '#ff0000' }],
  })
  const options = {}

  // JUST FOR TESTING
  useEffect(() => {
    setStocks([
      { time: '1', price: 7 },
      { time: '2', price: 17 },
      { time: '3', price: 26 },
      { time: '4', price: 91 },
      { time: '5', price: 5 },
    ])
  }, [])

  useEffect(() => {
    let _data: ChartType = {
      labels: [],
      datasets: [{ data: [], borderColor: '#ff0000' }],
    }
    stocks.map(({ time, price }) => {
      _data.labels.push(time)
      _data.datasets[0].data.push(price)
    })
    setData(_data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks])

  return <Line data={data} options={options}></Line>
}
