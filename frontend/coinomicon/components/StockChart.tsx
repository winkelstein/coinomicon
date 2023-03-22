import { useState } from 'react'
import { Text } from '@nextui-org/react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

export default function StockChart() {
  const data = {
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
        data: [8, 7.8, 6, 3, 1, 2, 9, 8, 5],
        backgroundColor: '#ffffff',
        borderColor: '#ff0000',
      },
    ],
  }

  const options = {}

  return <Line data={data} options={options}></Line>
}
