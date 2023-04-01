import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js'
import { Contract, formatEther } from 'ethers'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

type DataType = {
  time: string
  price: string
}

interface ChartType {
  labels: string[]
  datasets: [
    {
      data: string[]
      borderColor: string
    },
  ]
}

interface Props {
  exchange?: Contract
}

export default function StockChart(props: Props) {
  const { exchange } = props

  const [stocks, setStocks] = useState<DataType[]>([])

  const [data, setData] = useState<ChartType>({
    labels: [],
    datasets: [{ data: [], borderColor: '#ff0000' }],
  })

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

  useEffect(() => {
    if (exchange) {
      ;(async () => {
        let _stocks = stocks
        const orderCount = await exchange.getOrderCount()
        for (let i = 0n; i < orderCount; i++) {
          const order = await exchange.getOrder(i)
          if (order.active === false) {
            _stocks.push({
              time: parseTime(order.date),

              price: formatEther(order.price.toString()),
            })
          }
        }
        setStocks(_stocks)
        parseData()

        exchange.on(
          exchange.filters.LimitOrderClosed,
          async (
            orderId: string,
            _trader: string,
            _price: string,
            _buy: boolean,
          ) => {
            const order = await exchange.getOrder(orderId)
            setStocks([
              ...stocks,
              { time: parseTime(order.date), price: order.price },
            ])
          },
        )
      })()

      return () => {
        if (exchange) {
          exchange.off(exchange.filters.LimitOrderClosed)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchange])

  const parseData = () => {
    let _data: ChartType = {
      labels: [],
      datasets: [{ data: [], borderColor: '#ff0000' }],
    }
    stocks.forEach(({ time, price }) => {
      _data.labels.push(time)
      _data.datasets[0].data.push(price)
    })
    setData(_data)
  }

  const parseTime = (timestamp: bigint): string => {
    return new Date(
      parseInt((timestamp * 1000n).toString()),
    ).toLocaleTimeString()
  }

  return <Line data={data} options={options as any}></Line>
}
