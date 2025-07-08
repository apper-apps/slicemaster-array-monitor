import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'

const SlicePreview = ({ slice, onDownload }) => {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = slice.url
    link.download = slice.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    if (onDownload) {
      onDownload(slice)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-200">
        <div className="aspect-square relative bg-gray-50 flex items-center justify-center">
          <img
            src={slice.url}
            alt={slice.name}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="transform scale-90 group-hover:scale-100 transition-transform duration-200"
            >
              <ApperIcon name="Download" size={16} className="mr-2" />
              Download
            </Button>
          </div>
        </div>
        
<div className="p-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {slice.name}
            </h4>
            {slice.isAnimated && (
              <div className="flex items-center text-secondary">
                <ApperIcon name="Play" size={12} />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {slice.width} × {slice.height}
            {slice.outputFormat && slice.outputFormat !== 'original' && (
              <span className="ml-1 text-primary">• {slice.outputFormat.toUpperCase()}</span>
            )}
            {slice.isAnimated && slice.frames && (
              <span className="ml-1 text-secondary">• {slice.frames} frames</span>
            )}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}

export default SlicePreview