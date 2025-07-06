import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import GridOverlay from '@/components/molecules/GridOverlay'
import Card from '@/components/atoms/Card'

const ImageCanvas = ({ 
  uploadedFile, 
  slices, 
  onSlicesChange, 
  snapMode, 
  gridSize = 10,
  activeSlice,
  onActiveSliceChange,
  showSliceManager
}) => {
const [localActiveSlice, setLocalActiveSlice] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [startPos, setStartPos] = useState(null)
  const [dragMode, setDragMode] = useState(null) // 'move' or 'resize'
  const [resizeHandle, setResizeHandle] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const scrollTimeoutRef = useRef(null)
  
  const snapToGrid = useCallback((value) => {
    if (!snapMode) return value
    return Math.round(value / gridSize) * gridSize
  }, [snapMode, gridSize])
  
  const getMousePos = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }, [])
  
  const handleEdgeScroll = useCallback((e) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const scrollThreshold = 50
    const scrollSpeed = 10
    
    const distanceFromTop = e.clientY - rect.top
    const distanceFromBottom = rect.bottom - e.clientY
    
    let shouldScroll = false
    
    if (distanceFromTop < scrollThreshold && distanceFromTop > 0) {
      // Scroll up
      containerRef.current.scrollTop -= scrollSpeed
      shouldScroll = true
    } else if (distanceFromBottom < scrollThreshold && distanceFromBottom > 0) {
      // Scroll down
      containerRef.current.scrollTop += scrollSpeed
      shouldScroll = true
    }
    
    if (shouldScroll) {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        handleEdgeScroll(e)
      }, 16) // ~60fps
    }
  }, [])
  
  const handleMouseDown = (e) => {
    if (!uploadedFile || e.button !== 0) return
    
    const pos = getMousePos(e)
    const existingSlice = slices.find(slice => 
      pos.x >= slice.x && pos.x <= slice.x + slice.width &&
      pos.y >= slice.y && pos.y <= slice.y + slice.height
    )
    
    if (existingSlice) {
      // Check if clicking on a resize handle
      const handle = getResizeHandle(existingSlice, pos)
      if (handle) {
        setDragMode('resize')
setResizeHandle(handle)
        setLocalActiveSlice(existingSlice.id)
        onActiveSliceChange?.(existingSlice.id)
      } else {
        // Move existing slice
setDragMode('move')
        setLocalActiveSlice(existingSlice.id)
        onActiveSliceChange?.(existingSlice.id)
        setDragOffset({
          x: pos.x - existingSlice.x,
          y: pos.y - existingSlice.y
        })
      }
    } else {
      // Create new slice
      setIsCreating(true)
setStartPos(pos)
      setLocalActiveSlice(null)
      onActiveSliceChange?.(null)
    }
    
    e.preventDefault()
  }
  
  const handleMouseMove = (e) => {
    if (!uploadedFile) return
    
    const pos = getMousePos(e)
    
    // Handle edge scrolling
    if (dragMode || isCreating) {
      handleEdgeScroll(e)
    }
    
    if (isCreating && startPos) {
      // Update preview rectangle while creating
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const preview = document.getElementById('slice-preview')
        if (preview) {
          const left = Math.min(startPos.x, pos.x)
          const top = Math.min(startPos.y, pos.y)
          const width = Math.abs(pos.x - startPos.x)
          const height = Math.abs(pos.y - startPos.y)
          
          preview.style.left = `${left}px`
          preview.style.top = `${top}px`
          preview.style.width = `${width}px`
          preview.style.height = `${height}px`
          preview.style.display = 'block'
        }
      }
} else if (dragMode === 'move' && localActiveSlice) {
      // Move slice
      const newSlices = slices.map(slice => {
if (slice.id === localActiveSlice) {
          return {
            ...slice,
            x: snapToGrid(Math.max(0, Math.min(uploadedFile.width - slice.width, pos.x - dragOffset.x))),
            y: snapToGrid(Math.max(0, Math.min(uploadedFile.height - slice.height, pos.y - dragOffset.y)))
          }
        }
        return slice
      })
      onSlicesChange(newSlices)
} else if (dragMode === 'resize' && localActiveSlice && resizeHandle) {
      // Resize slice
      const newSlices = slices.map(slice => {
if (slice.id === localActiveSlice) {
          return resizeSlice(slice, pos, resizeHandle)
        }
        return slice
      })
      onSlicesChange(newSlices)
    }
  }
  
  const handleMouseUp = () => {
    if (isCreating && startPos) {
      const pos = getMousePos(window.event)
      const left = Math.min(startPos.x, pos.x)
      const top = Math.min(startPos.y, pos.y)
      const width = Math.abs(pos.x - startPos.x)
      const height = Math.abs(pos.y - startPos.y)
      
      if (width > 10 && height > 10) { // Minimum size
const newSlice = {
          id: Date.now().toString(),
          x: snapToGrid(left),
          y: snapToGrid(top),
          width: snapToGrid(width),
          height: snapToGrid(height),
          order: slices.length + 1,
          outputFormat: 'original'
        }
        onSlicesChange([...slices, newSlice])
      }
      
      // Hide preview
      const preview = document.getElementById('slice-preview')
      if (preview) {
        preview.style.display = 'none'
      }
    }
    
    setIsCreating(false)
    setStartPos(null)
setDragMode(null)
    setResizeHandle(null)
    setLocalActiveSlice(null)
    onActiveSliceChange?.(null)
    setDragOffset({ x: 0, y: 0 })
    
    clearTimeout(scrollTimeoutRef.current)
  }
  
  const getResizeHandle = (slice, pos) => {
    const handleSize = 8
    const handles = [
      { name: 'nw', x: slice.x, y: slice.y },
      { name: 'n', x: slice.x + slice.width / 2, y: slice.y },
      { name: 'ne', x: slice.x + slice.width, y: slice.y },
      { name: 'e', x: slice.x + slice.width, y: slice.y + slice.height / 2 },
      { name: 'se', x: slice.x + slice.width, y: slice.y + slice.height },
      { name: 's', x: slice.x + slice.width / 2, y: slice.y + slice.height },
      { name: 'sw', x: slice.x, y: slice.y + slice.height },
      { name: 'w', x: slice.x, y: slice.y + slice.height / 2 }
    ]
    
    return handles.find(handle => 
      Math.abs(pos.x - handle.x) <= handleSize && 
      Math.abs(pos.y - handle.y) <= handleSize
    )?.name
  }
  
  const resizeSlice = (slice, pos, handle) => {
    let newSlice = { ...slice }
    
    switch (handle) {
      case 'nw':
        newSlice.width = Math.max(20, slice.x + slice.width - pos.x)
        newSlice.height = Math.max(20, slice.y + slice.height - pos.y)
        newSlice.x = Math.min(pos.x, slice.x + slice.width - 20)
        newSlice.y = Math.min(pos.y, slice.y + slice.height - 20)
        break
      case 'n':
        newSlice.height = Math.max(20, slice.y + slice.height - pos.y)
        newSlice.y = Math.min(pos.y, slice.y + slice.height - 20)
        break
      case 'ne':
        newSlice.width = Math.max(20, pos.x - slice.x)
        newSlice.height = Math.max(20, slice.y + slice.height - pos.y)
        newSlice.y = Math.min(pos.y, slice.y + slice.height - 20)
        break
      case 'e':
        newSlice.width = Math.max(20, pos.x - slice.x)
        break
      case 'se':
        newSlice.width = Math.max(20, pos.x - slice.x)
        newSlice.height = Math.max(20, pos.y - slice.y)
        break
      case 's':
        newSlice.height = Math.max(20, pos.y - slice.y)
        break
      case 'sw':
        newSlice.width = Math.max(20, slice.x + slice.width - pos.x)
        newSlice.height = Math.max(20, pos.y - slice.y)
        newSlice.x = Math.min(pos.x, slice.x + slice.width - 20)
        break
      case 'w':
        newSlice.width = Math.max(20, slice.x + slice.width - pos.x)
        newSlice.x = Math.min(pos.x, slice.x + slice.width - 20)
        break
    }
    
    // Apply snapping
    newSlice.x = snapToGrid(Math.max(0, Math.min(uploadedFile.width - newSlice.width, newSlice.x)))
    newSlice.y = snapToGrid(Math.max(0, Math.min(uploadedFile.height - newSlice.height, newSlice.y)))
    newSlice.width = snapToGrid(Math.min(uploadedFile.width - newSlice.x, newSlice.width))
    newSlice.height = snapToGrid(Math.min(uploadedFile.height - newSlice.y, newSlice.height))
    
    return newSlice
  }
  
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()
    
    if (isCreating || dragMode) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.cursor = dragMode === 'move' ? 'move' : 'crosshair'
    } else {
      document.body.style.cursor = 'default'
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.cursor = 'default'
    }
  }, [isCreating, dragMode, handleMouseMove])
  
  if (!uploadedFile) return null
  
  return (
<Card className={`overflow-hidden transition-all duration-300 ${showSliceManager ? 'mr-4' : ''}`}>
      <div 
        ref={containerRef}
        className="max-h-[70vh] overflow-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div
          ref={canvasRef}
          className="relative cursor-crosshair select-none"
          style={{ 
            width: uploadedFile.width, 
            height: uploadedFile.height,
            minWidth: uploadedFile.width,
            minHeight: uploadedFile.height
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Image */}
          <img
            src={uploadedFile.url}
            alt="Canvas"
            className="block w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
          
          {/* Grid overlay */}
          <GridOverlay 
            width={uploadedFile.width} 
            height={uploadedFile.height} 
            gridSize={gridSize} 
            visible={snapMode} 
          />
          
          {/* Selection rectangles */}
          {slices.map((slice) => (
            <div
              key={slice.id}
className={`selection-rectangle ${(localActiveSlice === slice.id || activeSlice === slice.id) ? 'active' : ''}`}
              style={{
                left: slice.x,
                top: slice.y,
                width: slice.width,
                height: slice.height
              }}
            >
              {/* Resize handles */}
              <div className="resize-handle nw" />
              <div className="resize-handle n" />
              <div className="resize-handle ne" />
              <div className="resize-handle e" />
              <div className="resize-handle se" />
              <div className="resize-handle s" />
              <div className="resize-handle sw" />
              <div className="resize-handle w" />
              
              {/* Slice number */}
              <div className="absolute -top-6 -left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                {slice.order}
              </div>
            </div>
          ))}
          
          {/* Preview rectangle while creating */}
          <div
            id="slice-preview"
            className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </Card>
  )
}

export default ImageCanvas