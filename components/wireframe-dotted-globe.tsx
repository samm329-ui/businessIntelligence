"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

interface Marker {
  lng: number
  lat: number
  label: string
  color?: string
}

interface RotatingEarthProps {
  width?: number
  height?: number
  className?: string
  markers?: Marker[]
}

export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
  markers = []
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    // Set up responsive dimensions
    const containerWidth = Math.min(width, window.innerWidth - 40)
    const containerHeight = Math.min(height, window.innerHeight - 100)
    const radius = Math.min(containerWidth, containerHeight) / 2.5

    const dpr = window.devicePixelRatio || 1
    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    context.scale(dpr, dpr)

    // Create projection and path generator for Canvas
    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection).context(context)

    const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
      const [x, y] = point
      let inside = false

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }

      return inside
    }

    const pointInFeature = (point: [number, number], feature: any): boolean => {
      const geometry = feature.geometry

      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates
        if (!pointInPolygon(point, coordinates[0])) return false
        for (let i = 1; i < coordinates.length; i++) {
          if (pointInPolygon(point, coordinates[i])) return false
        }
        return true
      } else if (geometry.type === "MultiPolygon") {
        for (const polygon of geometry.coordinates) {
          if (pointInPolygon(point, polygon[0])) {
            let inHole = false
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true
                break
              }
            }
            if (!inHole) return true
          }
        }
        return false
      }
      return false
    }

    // Simplified dot cache
    const dotsCache = new Map<string, [number, number][]>()

    const generateDotsInPolygon = (feature: any, dotSpacing = 20) => {
      const featKey = JSON.stringify(feature.geometry.coordinates[0][0])
      if (dotsCache.has(featKey)) return dotsCache.get(featKey)!

      const dots: [number, number][] = []
      const bounds = d3.geoBounds(feature)
      const [[minLng, minLat], [maxLng, maxLat]] = bounds
      const stepSize = dotSpacing * 0.1

      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          if (pointInFeature([lng, lat], feature)) dots.push([lng, lat])
        }
      }
      dotsCache.set(featKey, dots)
      return dots
    }

    interface DotData { lng: number; lat: number }
    let allDots: DotData[] = []
    let landFeatures: any

    const render = () => {
      if (!context) return
      context.clearRect(0, 0, containerWidth, containerHeight)
      const currentScale = projection.scale()
      const scaleFactor = currentScale / radius

      // Glossy background
      const grad = context.createRadialGradient(
        containerWidth / 2, containerHeight / 2, currentScale * 0.5,
        containerWidth / 2, containerHeight / 2, currentScale
      )
      grad.addColorStop(0, "#0F172A"); grad.addColorStop(1, "#020617")

      context.beginPath()
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI)
      context.fillStyle = grad; context.fill()
      context.strokeStyle = "rgba(255, 255, 255, 0.12)"
      context.lineWidth = 1 * scaleFactor; context.stroke()

      if (landFeatures) {
        context.fillStyle = "rgba(255, 255, 255, 0.25)"
        allDots.forEach((dot) => {
          const p = projection([dot.lng, dot.lat])
          if (p) {
            context.beginPath()
            context.arc(p[0], p[1], 0.7 * scaleFactor, 0, 2 * Math.PI)
            context.fill()
          }
        })

        if (markers?.length) {
          markers.forEach(m => {
            const p = projection([m.lng, m.lat])
            const rotate = projection.rotate()
            const dist = d3.geoDistance([-rotate[0], -rotate[1]], [m.lng, m.lat])

            if (dist < Math.PI / 2 && p) {
              context.beginPath()
              context.arc(p[0], p[1], 4 * scaleFactor, 0, 2 * Math.PI)
              context.fillStyle = m.color || "#10B981"; context.fill()
              context.strokeStyle = "#fff"; context.lineWidth = 1 * scaleFactor; context.stroke()

              const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.3
              context.beginPath()
              context.arc(p[0], p[1], 8 * scaleFactor * pulse, 0, 2 * Math.PI)
              context.strokeStyle = m.color || "#10B981"
              context.globalAlpha = 0.3 * (2 - pulse); context.stroke(); context.globalAlpha = 1

              const text = m.label.toUpperCase()
              context.fillStyle = "rgba(0,0,0,0.6)"
              context.fillRect(p[0] + 10 * scaleFactor, p[1] - 8 * scaleFactor, context.measureText(text).width + 8, 14)
              context.fillStyle = "#fff"; context.font = `bold ${9 * scaleFactor}px Inter`; context.fillText(text, p[0] + 14 * scaleFactor, p[1] + 2 * scaleFactor)
            }
          })
        }
      }
    }

    const loadWorldData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
        )
        if (!response.ok) throw new Error("Failed to load land data")
        landFeatures = await response.json()
        landFeatures.features.forEach((feature: any) => {
          const dots = generateDotsInPolygon(feature, 16)
          dots.forEach(([lng, lat]) => {
            allDots.push({ lng, lat })
          })
        })
        render()
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load map data")
        setIsLoading(false)
      }
    }

    const rotation = [0, 0]
    let autoRotate = true
    const rotationSpeed = 0.3

    const rotate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate([rotation[0], rotation[1]])
        render()
      }
    }

    const rotationTimer = d3.timer(rotate)

    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false
      const startX = event.clientX
      const startY = event.clientY
      const [startLon, startLat] = projection.rotate()

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        const sensitivity = 0.25
        rotation[0] = startLon + dx * sensitivity
        rotation[1] = startLat - dy * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))
        projection.rotate([rotation[0], rotation[1]])
        render()
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        setTimeout(() => { autoRotate = true }, 1000)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
      const newRadius = Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * scaleFactor))
      projection.scale(newRadius)
      render()
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("wheel", handleWheel)
    loadWorldData()

    return () => {
      rotationTimer.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [width, height, markers])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-2xl p-8 ${className}`}>
        <p className="text-destructive font-semibold">{error}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-auto cursor-grab active:cursor-grabbing" />
      {!isLoading && (
        <div className="absolute bottom-4 left-4 text-[9px] text-gray-500 uppercase tracking-widest px-2 py-1 rounded bg-black/40 backdrop-blur-sm border border-white/5">
          Drag to rotate • Scroll to zoom
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
