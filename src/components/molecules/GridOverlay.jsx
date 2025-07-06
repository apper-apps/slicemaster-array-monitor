const GridOverlay = ({ width, height, gridSize = 10, majorGridSize = 50, visible = true }) => {
  if (!visible) return null
  
  const verticalLines = []
  const horizontalLines = []
  
  // Generate vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    const isMajor = x % majorGridSize === 0
    verticalLines.push(
      <div
        key={`v-${x}`}
        className={`grid-line vertical ${isMajor ? 'major' : ''}`}
        style={{ left: x }}
      />
    )
  }
  
  // Generate horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    const isMajor = y % majorGridSize === 0
    horizontalLines.push(
      <div
        key={`h-${y}`}
        className={`grid-line horizontal ${isMajor ? 'major' : ''}`}
        style={{ top: y }}
      />
    )
  }
  
  return (
    <div className="grid-overlay">
      {verticalLines}
      {horizontalLines}
    </div>
  )
}

export default GridOverlay