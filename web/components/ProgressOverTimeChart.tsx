'use client'

import { useMemo, useState, useEffect } from 'react'
import type { WorkoutLog, WeekChallenge, StrengthExercise, UserProgress } from '@/types'

interface ProgressOverTimeChartProps {
  logs: WorkoutLog[]
  challenge: WeekChallenge
  exercises: StrengthExercise[]
  weekStartDate: string
  weekEndDate: string
  progressList: UserProgress[]
}

interface DataPoint {
  date: string
  [userId: string]: string | number // userId -> progress percentage
}

export default function ProgressOverTimeChart({
  logs,
  challenge,
  exercises,
  weekStartDate,
  weekEndDate,
  progressList,
}: ProgressOverTimeChartProps) {
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; value: number; date: string } | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  
  // Animate lines drawing in on load
  useEffect(() => {
    const duration = 1500 // 1.5 seconds
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimationProgress(progress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }, [])
  // Generate time points - use hours if we have created_at timestamps, otherwise use days
  const timePoints = useMemo(() => {
    const hasHourData = logs.some(log => log.created_at && log.created_at.includes('T'))
    
    if (hasHourData) {
      // Use local timezone for hour generation
      const start = new Date(weekStartDate + 'T00:00:00')
      const end = new Date(weekEndDate + 'T23:59:59')
      
      // Include current hour if we're still in the week (using local time)
      const now = new Date()
      const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0)
      if (currentHour >= start && currentHour <= end) {
        end.setTime(currentHour.getTime())
      }
      
      const hourPoints: string[] = []
      const current = new Date(start)
      
      while (current <= end) {
        hourPoints.push(current.toISOString())
        current.setHours(current.getHours() + 1)
      }
      
      return hourPoints
    } else {
      // Fall back to daily granularity using local dates
      const start = new Date(weekStartDate + 'T00:00:00')
      const end = new Date(weekEndDate + 'T23:59:59')
      const dateArray: string[] = []
      const current = new Date(start)
      
      while (current <= end) {
        const year = current.getFullYear()
        const month = String(current.getMonth() + 1).padStart(2, '0')
        const day = String(current.getDate()).padStart(2, '0')
        dateArray.push(`${year}-${month}-${day}`)
        current.setDate(current.getDate() + 1)
      }
      return dateArray
    }
  }, [weekStartDate, weekEndDate, logs])

  // Calculate progress for each user at each point in time
  const chartData = useMemo(() => {
    const dataPoints: DataPoint[] = []
    const hasHourData = logs.some(log => log.created_at && log.created_at.includes('T'))
    
    // For each time point, calculate cumulative progress up to that point
    timePoints.forEach((timePoint) => {
      const point: DataPoint = { date: timePoint }
      
      // Initialize all users to 0
      progressList.forEach((progress) => {
        point[progress.user_id] = 0
      })
      
      // Get all logs up to and including this time point
      // Use logged_at (the date the user logged) for date comparison, not created_at
      const logsUpToTime = logs.filter((log) => {
        // Convert logged_at to local date string (YYYY-MM-DD)
        const logDate = new Date(log.logged_at)
        const logYear = logDate.getFullYear()
        const logMonth = String(logDate.getMonth() + 1).padStart(2, '0')
        const logDay = String(logDate.getDate()).padStart(2, '0')
        const logDateStr = `${logYear}-${logMonth}-${logDay}`
        
        if (hasHourData) {
          // For hourly data, compare by date first, then by hour if on same day
          const pointDate = new Date(timePoint)
          const pointDateStr = `${pointDate.getFullYear()}-${String(pointDate.getMonth() + 1).padStart(2, '0')}-${String(pointDate.getDate()).padStart(2, '0')}`
          
          // If log is before the point date, include it
          if (logDateStr < pointDateStr) return true
          // If log is after the point date, exclude it
          if (logDateStr > pointDateStr) return false
          
          // Same day - compare by hour if created_at has hour info
          if (log.created_at && log.created_at.includes('T')) {
            const logHour = new Date(log.created_at).getHours()
            const pointHour = pointDate.getHours()
            return logHour <= pointHour
          }
          // No hour info, include all logs from that day
          return true
        } else {
          // Daily comparison - just compare dates
          const pointDate = timePoint.split('T')[0]
          return logDateStr <= pointDate
        }
      })
      
      // Calculate progress for each user
      progressList.forEach((progress) => {
        const userLogs = logsUpToTime.filter((log) => log.user_id === progress.user_id)
        
        // Calculate cardio total
        const cardioTotal = userLogs
          .filter((log) => log.log_type === 'cardio')
          .reduce((sum, log) => sum + (log.cardio_amount || 0), 0)
        const cardioProgress = Math.min(cardioTotal / challenge.cardio_target, 1)
        
        // Calculate strength progress
        const exerciseTotals: Record<string, number> = {}
        exercises.forEach((ex) => {
          const total = userLogs
            .filter((log) => log.log_type === 'strength' && log.exercise_id === ex.id)
            .reduce((sum, log) => sum + (log.strength_reps || 0), 0)
          exerciseTotals[ex.id] = total
        })
        
        const strengthProgresses = exercises.map((ex) => {
          const total = exerciseTotals[ex.id] || 0
          return Math.min(total / ex.target_reps, 1)
        })
        
        const strengthOverallProgress =
          strengthProgresses.length > 0
            ? strengthProgresses.reduce((sum, p) => sum + p, 0) / strengthProgresses.length
            : 0
        
        // Total progress is average of cardio and strength
        const totalProgress = (cardioProgress + strengthOverallProgress) / 2
        point[progress.user_id] = Math.round(totalProgress * 100)
      })
      
      dataPoints.push(point)
    })
    
    return dataPoints
  }, [timePoints, logs, challenge, exercises, progressList])

  // Chart dimensions
  const width = 800
  const height = 400
  const padding = { top: 20, right: 20, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Generate colors for each user
  const colors = [
    '#8B4513', // Brown
    '#059669', // Green
    '#0284c7', // Blue
    '#7c3aed', // Purple
    '#dc2626', // Red
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#be185d', // Pink
  ]

  // Format time for display - always show just the date
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get x position for a time point
  const getX = (timeStr: string) => {
    const index = timePoints.indexOf(timeStr)
    return padding.left + (index / (timePoints.length - 1 || 1)) * chartWidth
  }

  // Get y position for a percentage
  const getY = (percentage: number) => {
    return padding.top + chartHeight - (percentage / 100) * chartHeight
  }

  // Generate area path (for gradient fill under line)
  const generateAreaPath = (userId: string) => {
    const points = chartData.map((point) => {
      const x = getX(point.date)
      const y = getY(point[userId] as number)
      return { x, y }
    })

    if (points.length === 0) return ''
    if (points.length === 1) {
      const bottomY = padding.top + chartHeight
      return `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y} Z`
    }
    
    // Create smooth area path using the same curve logic as generatePath
    let path = `M ${points[0].x} ${padding.top + chartHeight}`
    path += ` L ${points[0].x} ${points[0].y}`
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      
      const dx = next.x - current.x
      const dy = next.y - current.y
      const tension = 0.4
      
      let cp1x, cp1y, cp2x, cp2y
      
      if (i === 0) {
        cp1x = current.x + dx * tension
        cp1y = current.y + dy * tension
        cp2x = next.x - dx * tension
        cp2y = next.y - dy * tension
      } else if (i === points.length - 2) {
        const prev = points[i - 1]
        const prevDx = current.x - prev.x
        const prevDy = current.y - prev.y
        const avgDx = (prevDx + dx) * 0.5
        const avgDy = (prevDy + dy) * 0.5
        cp1x = current.x + avgDx * tension
        cp1y = current.y + avgDy * tension
        cp2x = next.x - dx * tension
        cp2y = next.y - dy * tension
      } else {
        const prev = points[i - 1]
        const nextNext = points[i + 2]
        const prevDx = current.x - prev.x
        const prevDy = current.y - prev.y
        const nextDx = nextNext.x - next.x
        const nextDy = nextNext.y - next.y
        const cp1Dx = (prevDx + dx) * 0.5
        const cp1Dy = (prevDy + dy) * 0.5
        const cp2Dx = (dx + nextDx) * 0.5
        const cp2Dy = (dy + nextDy) * 0.5
        cp1x = current.x + cp1Dx * tension
        cp1y = current.y + cp1Dy * tension
        cp2x = next.x - cp2Dx * tension
        cp2y = next.y - cp2Dy * tension
      }
      
      const minY = Math.min(current.y, next.y)
      const maxY = Math.max(current.y, next.y)
      cp1y = Math.max(minY, Math.min(maxY, cp1y))
      cp2y = Math.max(minY, Math.min(maxY, cp2y))
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
    }
    
    const lastPoint = points[points.length - 1]
    path += ` L ${lastPoint.x} ${padding.top + chartHeight} Z`
    
    return path
  }

  // Generate smooth curved path with larger radius curves, preventing overshoots
  const generatePath = (userId: string) => {
    const points = chartData.map((point) => {
      const x = getX(point.date)
      const y = getY(point[userId] as number)
      return { x, y }
    })

    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    
    // Use cubic bezier curves with control points that prevent overshoots
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      
      // Calculate distance and direction
      const dx = next.x - current.x
      const dy = next.y - current.y
      
      // Use tension for smooth curves, but clamp control points to prevent overshoots
      const tension = 0.4
      
      // Calculate control points that create smooth curves without overshooting
      let cp1x, cp1y, cp2x, cp2y
      
      if (i === 0) {
        // First segment: control points extend along the line direction
        cp1x = current.x + dx * tension
        cp1y = current.y + dy * tension
        cp2x = next.x - dx * tension
        cp2y = next.y - dy * tension
      } else if (i === points.length - 2) {
        // Last segment: use previous direction for smoothness
        const prev = points[i - 1]
        const prevDx = current.x - prev.x
        const prevDy = current.y - prev.y
        
        // Average direction for smooth transition
        const avgDx = (prevDx + dx) * 0.5
        const avgDy = (prevDy + dy) * 0.5
        
        cp1x = current.x + avgDx * tension
        cp1y = current.y + avgDy * tension
        cp2x = next.x - dx * tension
        cp2y = next.y - dy * tension
      } else {
        // Middle segments: use surrounding points for smooth transitions
        const prev = points[i - 1]
        const nextNext = points[i + 2]
        
        // Calculate direction vectors
        const prevDx = current.x - prev.x
        const prevDy = current.y - prev.y
        const nextDx = nextNext.x - next.x
        const nextDy = nextNext.y - next.y
        
        // Average directions for smooth curves
        const cp1Dx = (prevDx + dx) * 0.5
        const cp1Dy = (prevDy + dy) * 0.5
        const cp2Dx = (dx + nextDx) * 0.5
        const cp2Dy = (dy + nextDy) * 0.5
        
        cp1x = current.x + cp1Dx * tension
        cp1y = current.y + cp1Dy * tension
        cp2x = next.x - cp2Dx * tension
        cp2y = next.y - cp2Dy * tension
      }
      
      // Clamp control points to prevent overshoots - ensure they stay between current and next y values
      const minY = Math.min(current.y, next.y)
      const maxY = Math.max(current.y, next.y)
      cp1y = Math.max(minY, Math.min(maxY, cp1y))
      cp2y = Math.max(minY, Math.min(maxY, cp2y))
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
    }
    
    return path
  }

  return (
    <div className="glass-card rounded-2xl soft-shadow-lg p-4 sm:p-6 border border-red-100/30">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight mb-4">
        Progress Over The Week
      </h2>
      {progressList.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No progress data available</p>
      ) : (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* SVG Gradients */}
          <defs>
            {progressList.map((progress, index) => {
              const color = colors[index % colors.length]
              const gradientId = `gradient-${progress.user_id}`
              
              // Convert hex to rgba for gradient
              const hexToRgba = (hex: string, alpha: number) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                if (result) {
                  const r = parseInt(result[1], 16)
                  const g = parseInt(result[2], 16)
                  const b = parseInt(result[3], 16)
                  return `rgba(${r}, ${g}, ${b}, ${alpha})`
                }
                return `rgba(139, 69, 19, ${alpha})` // Default brown
              }
              
              return (
                <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={hexToRgba(color, 0.3)} />
                  <stop offset="100%" stopColor={hexToRgba(color, 0.05)} />
                </linearGradient>
              )
            })}
          </defs>
          
          {/* Grid lines - horizontal at 25% intervals */}
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = getY(percent)
            return (
              <g key={percent}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(229, 231, 235, 0.7)"
                  strokeWidth="1.5"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {percent}%
                </text>
              </g>
            )
          })}
          
          {/* Grid lines - vertical at each day */}
          {(() => {
            const hasHourData = logs.some(log => log.created_at && log.created_at.includes('T'))
            const shownDays = new Set<string>()
            const dayLines: React.ReactElement[] = []
            
            timePoints.forEach((timePoint) => {
              const dateStr = new Date(timePoint).toISOString().split('T')[0]
              
              // For hourly data, show line only once per day (at the start of each day)
              // For daily data, show all lines
              const isStartOfDay = hasHourData 
                ? new Date(timePoint).getHours() === 0
                : true
              
              if (isStartOfDay && !shownDays.has(dateStr)) {
                shownDays.add(dateStr)
                const x = getX(timePoint)
                dayLines.push(
                  <line
                    key={`grid-${timePoint}`}
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartHeight}
                    stroke="rgba(229, 231, 235, 0.7)"
                    strokeWidth="1.5"
                  />
                )
              }
            })
            
            return dayLines
          })()}

          {/* X-axis labels - show only unique days */}
          {(() => {
            const hasHourData = logs.some(log => log.created_at && log.created_at.includes('T'))
            const shownDays = new Set<string>()
            const labels: React.ReactElement[] = []
            
            timePoints.forEach((timePoint, index) => {
              const dateStr = new Date(timePoint).toISOString().split('T')[0]
              
              // For hourly data, show label only once per day (at the start of each day)
              // For daily data, show all labels
              const isStartOfDay = hasHourData 
                ? new Date(timePoint).getHours() === 0
                : true
              
              if (isStartOfDay && !shownDays.has(dateStr)) {
                shownDays.add(dateStr)
                const x = getX(timePoint)
                labels.push(
                  <g key={timePoint}>
                    <line
                      x1={x}
                      y1={padding.top + chartHeight}
                      x2={x}
                      y2={padding.top + chartHeight + 5}
                      stroke="rgba(107, 114, 128, 0.5)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={height - padding.bottom + 20}
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                      transform={`rotate(-45, ${x}, ${height - padding.bottom + 20})`}
                    >
                      {formatTime(timePoint)}
                    </text>
                  </g>
                )
              }
            })
            
            return labels
          })()}

          {/* Lines for each user */}
          {progressList.map((progress, index) => {
            const color = colors[index % colors.length]
            const path = generatePath(progress.user_id)
            const areaPath = generateAreaPath(progress.user_id)
            const gradientId = `gradient-${progress.user_id}`
            const isHovered = hoveredUserId === progress.user_id
            const lineOpacity = isHovered ? 1 : 0.9
            const otherOpacity = hoveredUserId && !isHovered ? 0.3 : 1
            
            // Estimate path length for animation (approximate based on chart dimensions)
            // For smooth curves, path is typically 1.2-1.5x the straight-line distance
            const estimatedPathLength = chartWidth * 1.3
            const dashArray = estimatedPathLength
            const dashOffset = estimatedPathLength * (1 - animationProgress)
            
            return (
              <g 
                key={progress.user_id}
                onMouseEnter={() => setHoveredUserId(progress.user_id)}
                onMouseLeave={() => setHoveredUserId(null)}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                opacity={otherOpacity}
              >
                {/* Gradient fill area */}
                <path
                  d={areaPath}
                  fill={`url(#${gradientId})`}
                  opacity={isHovered ? 0.4 : 0.2}
                  style={{ transition: 'opacity 0.2s' }}
                />
                
                {/* Main line with animation */}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={lineOpacity}
                  strokeDasharray={animationProgress < 1 ? `${dashArray}` : 'none'}
                  strokeDashoffset={animationProgress < 1 ? dashOffset : 0}
                  style={{ 
                    transition: animationProgress >= 1 ? 'opacity 0.2s, stroke-width 0.2s' : 'none',
                    strokeWidth: isHovered ? '7' : '6'
                  }}
                />
              </g>
            )
          })}

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="rgba(107, 114, 128, 0.5)"
            strokeWidth="2"
          />

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="rgba(107, 114, 128, 0.5)"
            strokeWidth="2"
          />
          
          {/* Invisible overlay for mouse tracking */}
          {chartData.length > 0 && (
            <rect
              x={padding.left}
              y={padding.top}
              width={chartWidth}
              height={chartHeight}
              fill="transparent"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const svg = e.currentTarget.ownerSVGElement
                if (!svg) return
                
                const point = svg.createSVGPoint()
                point.x = e.clientX
                point.y = e.clientY
                const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse())
                
                // Find closest time point
                let closestPoint = chartData[0]
                let minDistance = Infinity
                
                chartData.forEach((dataPoint) => {
                  const x = getX(dataPoint.date)
                  const distance = Math.abs(x - svgPoint.x)
                  if (distance < minDistance) {
                    minDistance = distance
                    closestPoint = dataPoint
                  }
                })
                
                // Find hovered user's value
                if (hoveredUserId) {
                  const value = closestPoint[hoveredUserId] as number
                  setHoverPosition({
                    x: svgPoint.x,
                    y: getY(value),
                    value,
                    date: closestPoint.date
                  })
                } else {
                  setHoverPosition(null)
                }
              }}
              onMouseLeave={() => setHoverPosition(null)}
            />
          )}
          
          {/* Tooltip */}
          {hoverPosition && hoveredUserId && (
            <g>
              {/* Vertical line at hover position */}
              <line
                x1={hoverPosition.x}
                y1={padding.top}
                x2={hoverPosition.x}
                y2={padding.top + chartHeight}
                stroke="rgba(107, 114, 128, 0.3)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              {/* Tooltip background */}
              <rect
                x={hoverPosition.x - 60}
                y={hoverPosition.y - 35}
                width="120"
                height="30"
                fill="rgba(0, 0, 0, 0.8)"
                rx="4"
              />
              {/* Tooltip text */}
              <text
                x={hoverPosition.x}
                y={hoverPosition.y - 15}
                textAnchor="middle"
                className="text-xs fill-white font-medium"
              >
                {hoverPosition.value}%
              </text>
              <text
                x={hoverPosition.x}
                y={hoverPosition.y - 2}
                textAnchor="middle"
                className="text-[10px] fill-gray-300"
              >
                {formatTime(hoverPosition.date)}
              </text>
            </g>
          )}
        </svg>
      </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 sm:gap-4">
        {progressList.map((progress, index) => {
          const color = colors[index % colors.length]
          const isHovered = hoveredUserId === progress.user_id
          return (
            <div 
              key={progress.user_id} 
              className="flex items-center gap-2 cursor-pointer transition-opacity"
              style={{ opacity: hoveredUserId && !isHovered ? 0.4 : 1 }}
              onMouseEnter={() => setHoveredUserId(progress.user_id)}
              onMouseLeave={() => setHoveredUserId(null)}
            >
              <div
                className="w-3 h-3 rounded-full transition-transform"
                style={{ 
                  backgroundColor: color,
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                }}
              />
              <span className={`text-xs sm:text-sm transition-all ${isHovered ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                {progress.display_name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
