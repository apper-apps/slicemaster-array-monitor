import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'

const FileUpload = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  const handleFileSelect = (file) => {
    if (!file) return
    
    // Validate file type
    if (!supportedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, or GIF)')
      return
    }
    
    // Validate file size
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }
    
    // Create image URL
    const url = URL.createObjectURL(file)
    
    // Get image dimensions
    const img = new Image()
    img.onload = () => {
      const fileData = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        url: url,
        width: img.width,
        height: img.height,
        isGif: file.type === 'image/gif',
        file: file
      }
      
      onFileSelect(fileData)
      toast.success('Image uploaded successfully!')
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      toast.error('Failed to load image. Please try another file.')
    }
    
    img.src = url
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }
  
  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }
  
  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }
  
  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }
  
  return (
    <Card className="p-8">
      <motion.div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/5 drag-active' 
            : 'border-gray-300 hover:border-primary/50 hover:bg-primary/2'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDragging ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            }`}
            animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
          >
            <ApperIcon name="Upload" size={32} />
          </motion.div>
          
          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${isDragging ? 'text-primary drag-text' : 'text-gray-900'}`}>
              {isDragging ? 'Drop your image here' : 'Upload Image'}
            </h3>
            <p className="text-sm text-gray-600">
              Drag and drop your image or click to browse
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                <ApperIcon name="Image" size={12} className="mr-1" />
                JPG
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                <ApperIcon name="Image" size={12} className="mr-1" />
                PNG
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                <ApperIcon name="Play" size={12} className="mr-1" />
                GIF
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: 10MB
            </p>
          </div>
          
          <Button variant="outline" size="sm" disabled={disabled}>
            Choose File
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      </motion.div>
    </Card>
  )
}

export default FileUpload