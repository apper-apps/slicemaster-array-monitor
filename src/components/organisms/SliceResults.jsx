import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import JSZip from 'jszip'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'
import SlicePreview from '@/components/molecules/SlicePreview'

const SliceResults = ({ slices, onSliceDownload }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  
const handleDownloadAll = async () => {
    if (slices.length === 0) return
    
    setIsDownloading(true)
    
    try {
      const zip = new JSZip()
      
      // Add each slice to the zip
      for (const slice of slices) {
        if (slice.isAnimated && slice.blob) {
          // For animated GIFs, use the blob directly
          zip.file(slice.name, slice.blob)
        } else if (slice.blob) {
          // For static images, use the blob directly
          zip.file(slice.name, slice.blob)
        } else {
          // Fallback to fetch from URL
          const response = await fetch(slice.url)
          const blob = await response.blob()
          zip.file(slice.name, blob)
        }
      }
      
      // Generate and download the zip
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `slices-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      const animatedCount = slices.filter(s => s.isAnimated).length
      const message = animatedCount > 0 
        ? `All slices downloaded successfully! (${animatedCount} animated GIF${animatedCount > 1 ? 's' : ''} included)`
        : 'All slices downloaded successfully!'
      
      toast.success(message)
    } catch (error) {
      console.error('Error downloading slices:', error)
      toast.error('Failed to download slices. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }
  
  if (slices.length === 0) return null
  
  return (
    <motion.div
      id="slice-results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Sliced Images
            </h2>
            <p className="text-gray-600 mt-1">
              {slices.length} slice{slices.length !== 1 ? 's' : ''} generated
            </p>
          </div>
          
          <Button
            variant="success"
            size="lg"
            onClick={handleDownloadAll}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <ApperIcon name="Loader2" size={20} className="mr-2 animate-spin" />
                Preparing ZIP...
              </>
            ) : (
              <>
                <ApperIcon name="Download" size={20} className="mr-2" />
                Download All as ZIP
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {slices.map((slice, index) => (
            <motion.div
              key={slice.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
<SlicePreview
                slice={slice}
                onDownload={onSliceDownload}
              />
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

export default SliceResults