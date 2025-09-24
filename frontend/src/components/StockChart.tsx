'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface StockDataPoint {
  date: string
  price: number
  volume?: number
}

interface PredictionDataPoint {
  date: string
  predicted: number
  lower?: number
  upper?: number
}

interface StockChartProps {
  historicalData?: StockDataPoint[]
  predictionData?: PredictionDataPoint[]
  symbol: string
  height?: number
  showPredictions?: boolean
  showConfidenceInterval?: boolean
}

export default function StockChart({
  historicalData = [],
  predictionData = [],
  symbol,
  height = 400,
  showPredictions = false,
  showConfidenceInterval = false
}: StockChartProps) {
  
  // Combine historical and prediction dates for x-axis
  const allDates = [
    ...historicalData.map(d => d.date),
    ...predictionData.map(d => d.date)
  ].filter((date, index, array) => array.indexOf(date) === index).sort()

  // Create datasets
  const datasets = []

  // Historical price data
  if (historicalData.length > 0) {
    datasets.push({
      label: `${symbol} Price`,
      data: allDates.map(date => {
        const dataPoint = historicalData.find(d => d.date === date)
        return dataPoint ? dataPoint.price : null
      }),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      pointRadius: 1,
      pointHoverRadius: 4,
      fill: false,
      tension: 0.1,
    })
  }

  // Prediction data
  if (showPredictions && predictionData.length > 0) {
    datasets.push({
      label: 'Predicted Price',
      data: allDates.map(date => {
        const dataPoint = predictionData.find(d => d.date === date)
        return dataPoint ? dataPoint.predicted : null
      }),
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 4,
      fill: false,
      tension: 0.1,
      borderDash: [5, 5], // Dashed line for predictions
    })

    // Confidence interval
    if (showConfidenceInterval) {
      // Upper bound
      datasets.push({
        label: 'Confidence Upper',
        data: allDates.map(date => {
          const dataPoint = predictionData.find(d => d.date === date)
          return dataPoint?.upper ?? null
        }),
        borderColor: 'rgba(16, 185, 129, 0.3)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        pointRadius: 0,
        fill: '+1',
        tension: 0.1,
      })

      // Lower bound
      datasets.push({
        label: 'Confidence Lower',
        data: allDates.map(date => {
          const dataPoint = predictionData.find(d => d.date === date)
          return dataPoint?.lower ?? null
        }),
        borderColor: 'rgba(16, 185, 129, 0.3)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      })
    }
  }

  const chartData = {
    labels: allDates,
    datasets
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          filter: function(legendItem: any) {
            // Hide confidence bound labels
            return !legendItem.text.includes('Confidence')
          }
        }
      },
      title: {
        display: true,
        text: `${symbol} Stock Price ${showPredictions ? 'with Predictions' : 'History'}`,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            if (value !== null) {
              return `${label}: $${value.toFixed(2)}`
            }
            return ''
          }
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        },
        type: 'category' as const,
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price ($)'
        },
        beginAtZero: false,
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: 'white',
        hoverBorderWidth: 2,
      }
    }
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

// Helper component for volume chart
interface VolumeChartProps {
  data: StockDataPoint[]
  symbol: string
  height?: number
}

export function VolumeChart({ data, symbol, height = 200 }: VolumeChartProps) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Volume',
        data: data.map(d => d.volume || 0),
        backgroundColor: 'rgba(107, 114, 128, 0.5)',
        borderColor: 'rgb(107, 114, 128)',
        borderWidth: 1,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${symbol} Trading Volume`,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Volume'
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
