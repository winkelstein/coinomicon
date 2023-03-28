import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
import { Contract, formatEther } from 'ethers'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

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
  exchange?: Contract
}

const options = {
  responsive: true,
  plugins: {
    legend: false,
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      maintainAspectRatio: true,
      min: 0,
    },
  },
}

export default function StockChart(props: Props) {
  const { exchange } = props

  //const [stocks, setStocks] = useState<DataType[]>([])
  const [data, setData] = useState<ChartType>({
    labels: [],
    datasets: [{ data: [], borderColor: '#ff0000' }],
  })

  const chartRef = useRef<ChartJS>()

  const parseData = (stocks: DataType[]) => {
    let _data: ChartType = data
    stocks.forEach(({ time, price }) => {
      _data.labels.push(time)
      _data.datasets[0].data.push(price)
    })
    setData(_data)
  }

  useEffect(() => {
    if (!exchange) return

    const subscribeToEvents = async () => {
      let _stocks = []
      const orderCount = await exchange.getOrderCount()
      for (let i = 0n; i < orderCount; i++) {
        const order = await exchange.getOrder(i)
        if (order.active === false) {
          _stocks.push({
            time: parseTime(order.date),
            price: parseFloat(formatEther(order.price.toString())),
          })
        }
      }
      //setStocks(_stocks)
      parseData(_stocks)

      exchange.on(
        exchange.filters.LimitOrderClosed,
        async (
          orderId: string,
          _trader: string,
          _price: string,
          _buy: boolean,
        ) => {
          const order = await exchange.getOrder(orderId)
          /*setStocks([
            ...stocks,
            { time: parseTime(order.date), price: order.price },
          ])*/
        },
      )
    }

    subscribeToEvents()

    return () => {
      if (exchange) {
        exchange.off(exchange.filters.LimitOrderClosed)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchange])

  const parseTime = (date: string): string => {
    const timestamp = parseInt(date) * 1000
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <>
      <Line data={data} options={options as any} ref={chartRef as any} />
    </>
  )
}
