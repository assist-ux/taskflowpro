import React, { useRef, useEffect, useState, useCallback } from 'react'

interface Ripple {
  id: string
  x: number
  y: number
  timestamp: number
}

interface CursorTrail {
  id: string
  x: number
  y: number
  timestamp: number
  opacity: number
}

interface AnimatedWaterBackgroundProps {
  children: React.ReactNode
  className?: string
  isDarkMode?: boolean
}

const AnimatedWaterBackground: React.FC<AnimatedWaterBackgroundProps> = ({ 
  children, 
  className = '',
  isDarkMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [cursorTrail, setCursorTrail] = useState<CursorTrail[]>([]) // Track cursor movement

  // Optimized water animation parameters
  const waveSpeed = 0.015 // smooth but not too fast
  const waveAmplitude = 12 // reduced amplitude
  const waveFrequency = 0.01 // optimized frequency
  const rippleDuration = 2500 // shorter duration for better performance
  const maxRipples = 3 // limit concurrent ripples for performance
  const cursorTrailDuration = 1500 // longer cursor trail fade duration (1.5 seconds)
  const maxTrailPoints = 20 // more trail points for smoother effect

  // Initialize canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newSize = {
          width: Math.max(rect.width, window.innerWidth),
          height: Math.max(rect.height, window.innerHeight)
        }
        setCanvasSize(newSize)
      }
    }

    // Initial size
    setTimeout(updateCanvasSize, 100) // Small delay to ensure DOM is ready
    
    // Throttled resize listener for better performance
    let resizeTimeout: NodeJS.Timeout
    const throttledResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateCanvasSize, 100)
    }
    
    window.addEventListener('resize', throttledResize)
    return () => {
      window.removeEventListener('resize', throttledResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  // Handle mouse movement for hover effects and cursor trail
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      setMousePos({ x, y })
      
      // Only add trail point if mouse has moved enough (for smoother trail)
      setCursorTrail(prev => {
        const lastPoint = prev[prev.length - 1]
        const minDistance = 8 // Minimum distance between trail points
        
        if (!lastPoint || 
            Math.abs(x - lastPoint.x) > minDistance || 
            Math.abs(y - lastPoint.y) > minDistance) {
          
          const newTrailPoint: CursorTrail = {
            id: `trail-${Date.now()}-${Math.random()}`,
            x,
            y,
            timestamp: Date.now(),
            opacity: 1
          }
          
          // Limit trail points for performance
          const filtered = prev.slice(-maxTrailPoints + 1)
          return [...filtered, newTrailPoint]
        }
        
        return prev
      })
    }
  }, [maxTrailPoints])

  // Clean up old cursor trail points
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentTime = Date.now()
      setCursorTrail(prev => 
        prev.filter(point => currentTime - point.timestamp < cursorTrailDuration)
      )
    }, 100) // Clean up every 100ms
    
    return () => clearInterval(cleanupInterval)
  }, [cursorTrailDuration])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    // Clear cursor trail when leaving
    setCursorTrail([])
  }, [])
  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const newRipple: Ripple = {
        id: `ripple-${Date.now()}-${Math.random()}`,
        x,
        y,
        timestamp: Date.now()
      }

      setRipples(prev => {
        // Limit concurrent ripples for performance
        const filtered = prev.slice(-maxRipples + 1)
        return [...filtered, newRipple]
      })

      // Remove ripple after animation duration
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, rippleDuration)
    }
  }, [rippleDuration, maxRipples])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    let time = 0

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create realistic water base with theme-appropriate colors
      const waterGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      
      if (isDarkMode) {
        // Dark theme - deep water colors
        waterGradient.addColorStop(0, 'rgba(15, 23, 42, 0.1)') // very dark blue
        waterGradient.addColorStop(0.3, 'rgba(30, 41, 59, 0.08)') // slate-800
        waterGradient.addColorStop(0.7, 'rgba(51, 65, 85, 0.06)') // slate-700
        waterGradient.addColorStop(1, 'rgba(71, 85, 105, 0.04)') // slate-600
      } else {
        // Light theme - clear tropical water colors
        waterGradient.addColorStop(0, 'rgba(224, 242, 254, 0.3)') // sky-100
        waterGradient.addColorStop(0.3, 'rgba(186, 230, 253, 0.25)') // sky-200
        waterGradient.addColorStop(0.7, 'rgba(125, 211, 252, 0.2)') // sky-300
        waterGradient.addColorStop(1, 'rgba(56, 189, 248, 0.15)') // sky-400
      }
      
      ctx.fillStyle = waterGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Optimized water surface waves (removed expensive caustics)
      const waveColors = isDarkMode ? [
        'rgba(100, 116, 139, 0.08)', // subtle slate-500
        'rgba(148, 163, 184, 0.06)'  // subtle slate-400
      ] : [
        'rgba(14, 165, 233, 0.12)',  // subtle sky-500
        'rgba(56, 189, 248, 0.08)'   // subtle sky-400
      ]

      waveColors.forEach((color, layerIndex) => {
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.2 - layerIndex * 0.4
        
        // Optimized: larger step size for better performance
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = canvas.height * (0.4 + layerIndex * 0.15) + 
            Math.sin(x * waveFrequency + time + layerIndex * Math.PI / 2) * waveAmplitude +
            Math.sin(x * waveFrequency * 2 + time * 1.2) * (waveAmplitude * 0.4)
          
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      })

      // Draw ripples
      const currentTime = Date.now()
      ripples.forEach(ripple => {
        const age = currentTime - ripple.timestamp
        const progress = age / rippleDuration
        
        if (progress <= 1) {
          const radius = progress * 120 // Optimized ripple size
          const opacity = (1 - progress) * 0.6
          
          // Theme-appropriate ripple colors
          const rippleColor = isDarkMode 
            ? '148, 163, 184' // slate-400 for dark theme
            : '14, 165, 233'  // sky-500 for light theme
          
          // Simplified ripple rings for better performance
          for (let ring = 0; ring < 2; ring++) {
            const ringRadius = radius - ring * 20
            const ringOpacity = opacity * (1 - ring * 0.3)
            
            if (ringRadius > 0) {
              ctx.beginPath()
              ctx.arc(ripple.x, ripple.y, ringRadius, 0, Math.PI * 2)
              ctx.strokeStyle = `rgba(${rippleColor}, ${ringOpacity})`
              ctx.lineWidth = 2 - ring * 0.5
              ctx.stroke()
            }
          }
          
          // Simple center splash (removed droplets for performance)
          if (progress < 0.4) {
            const splashSize = 6 * (1 - progress * 2.5)
            ctx.beginPath()
            ctx.arc(ripple.x, ripple.y, splashSize, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${rippleColor}, ${opacity})`
            ctx.fill()
          }
        }
      })
      
      // Draw cursor trail effect with dramatic size expansion
      const trailTime = Date.now()
      cursorTrail.forEach((point, index) => {
        const age = trailTime - point.timestamp
        const progress = age / cursorTrailDuration
        
        if (progress <= 1) {
          // Dramatic expansion from very small to very large
          const baseOpacity = (1 - progress) * 0.5
          // Smooth expansion from tiny to very large
          const expansionCurve = 1 - Math.pow(1 - progress, 2) // Ease-out curve
          const size = 1 + (expansionCurve * 59) // Grows from 1px to 60px dramatically
          
          // Theme-appropriate cursor trail colors
          const trailColor = isDarkMode 
            ? '203, 213, 225' // slate-300 for dark theme
            : '56, 189, 248'  // sky-400 for light theme
          
          // Single narrow circle that grows dramatically in size
          ctx.beginPath()
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
          
          // Create gradient for smooth edge
          const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size)
          gradient.addColorStop(0, `rgba(${trailColor}, ${baseOpacity})`)
          gradient.addColorStop(0.7, `rgba(${trailColor}, ${baseOpacity * 0.4})`)
          gradient.addColorStop(1, `rgba(${trailColor}, 0)`)
          
          ctx.fillStyle = gradient
          ctx.fill()
          
          // Add bright center dot for very new points
          if (progress < 0.2) {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 1, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${trailColor}, ${baseOpacity * 3})`
            ctx.fill()
          }
        }
      })

      time += waveSpeed
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasSize, ripples, cursorTrail, waveSpeed, waveAmplitude, waveFrequency, rippleDuration, cursorTrailDuration, isDarkMode])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ 
        cursor: 'default', // Default cursor for background
        zIndex: 0, // Base layer
        position: 'relative'
      }}
    >
      {/* Animated water canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />
      
      {/* Content overlay */}
      <div className="relative z-20 pointer-events-auto">
        {children}
      </div>
    </div>
  )
}

export default AnimatedWaterBackground