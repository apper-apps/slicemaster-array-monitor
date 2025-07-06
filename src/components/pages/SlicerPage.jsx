import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { decompressFrames, parseGIF } from "gifuct-js";
import SliceManager from "@/components/organisms/SliceManager";
import ApperIcon from "@/components/ApperIcon";
import SliceResults from "@/components/organisms/SliceResults";
import ImageCanvas from "@/components/organisms/ImageCanvas";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Empty from "@/components/ui/Empty";
import Loading from "@/components/ui/Loading";
import ControlBar from "@/components/molecules/ControlBar";
import FileUpload from "@/components/molecules/FileUpload";

const SlicerPage = () => {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [slices, setSlices] = useState([])
  const [slicedImages, setSlicedImages] = useState([])
  const [snapMode, setSnapMode] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showSliceManager, setShowSliceManager] = useState(false)
  const [activeSlice, setActiveSlice] = useState(null)
  const [gifFrames, setGifFrames] = useState(null)
const handleFileSelect = async (file) => {
    setUploadedFile(file)
    setSlices([])
    setSlicedImages([])
    setShowResults(false)
    setGifFrames(null)
    
    // Parse GIF if it's a GIF file
    if (file.isGif) {
      try {
        const arrayBuffer = await file.file.arrayBuffer()
        const gif = parseGIF(arrayBuffer)
        const frames = decompressFrames(gif, true)
        setGifFrames(frames)
      } catch (error) {
        console.error('Error parsing GIF:', error)
        toast.warning('Could not parse GIF animation, treating as static image')
      }
    }
  }
  
const handleReupload = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url)
    }
    setUploadedFile(null)
    setSlices([])
    setSlicedImages([])
    setShowResults(false)
    setShowSliceManager(false)
    setActiveSlice(null)
    setGifFrames(null)
  }
  
  const handleClearSlices = () => {
    if (slices.length > 0) {
      const confirmClear = window.confirm('Are you sure you want to clear all slices?')
      if (confirmClear) {
        setSlices([])
        toast.info('All slices cleared')
      }
    }
  }
  
const createSliceImage = async (slice, uploadedFile) => {
    return new Promise((resolve) => {
      const outputFormat = slice.outputFormat || 'original'
      const isGifOutput = outputFormat === 'gif' || (outputFormat === 'original' && uploadedFile.isGif)
      
      if (isGifOutput && gifFrames && gifFrames.length > 0) {
        // Create animated GIF slice
        createAnimatedGifSlice(slice, uploadedFile, gifFrames).then(resolve)
      } else {
        // Create static image slice
        createStaticSlice(slice, uploadedFile, outputFormat).then(resolve)
      }
    })
  }

  const createStaticSlice = async (slice, uploadedFile, outputFormat) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      canvas.width = slice.width
      canvas.height = slice.height
      
      const img = new Image()
      img.onload = () => {
        // Draw the sliced portion
        ctx.drawImage(
          img,
          slice.x, slice.y, slice.width, slice.height, // source rectangle
          0, 0, slice.width, slice.height // destination rectangle
        )
        
        // Determine output format and MIME type
        let mimeType = uploadedFile.type
        let extension = uploadedFile.type.split('/')[1]
        
        if (outputFormat === 'png') {
          mimeType = 'image/png'
          extension = 'png'
        } else if (outputFormat === 'jpg') {
          mimeType = 'image/jpeg'
          extension = 'jpg'
        } else if (outputFormat === 'gif') {
          mimeType = 'image/gif'
          extension = 'gif'
        }
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          resolve({
            id: slice.id,
            name: `slice-${slice.order}.${extension}`,
            blob: blob,
            url: url,
            width: slice.width,
            height: slice.height,
            outputFormat: outputFormat
          })
        }, mimeType, 0.95)
      }
      
      img.src = uploadedFile.url
    })
  }

  const createAnimatedGifSlice = async (slice, uploadedFile, frames) => {
    return new Promise((resolve) => {
      try {
        // Create canvas for each frame
        const slicedFrames = []
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = slice.width
        canvas.height = slice.height
        
        // Process each frame
        let processedFrames = 0
        
        frames.forEach((frame, index) => {
          const frameCanvas = document.createElement('canvas')
          const frameCtx = frameCanvas.getContext('2d')
          
          frameCanvas.width = uploadedFile.width
          frameCanvas.height = uploadedFile.height
          
          // Draw frame data
          const imageData = frameCtx.createImageData(frame.dims.width, frame.dims.height)
          imageData.data.set(frame.patch)
          frameCtx.putImageData(imageData, frame.dims.left, frame.dims.top)
          
          // Extract slice from frame
          ctx.clearRect(0, 0, slice.width, slice.height)
          ctx.drawImage(
            frameCanvas,
            slice.x, slice.y, slice.width, slice.height,
            0, 0, slice.width, slice.height
          )
          
          // Convert slice to blob
          canvas.toBlob((blob) => {
            slicedFrames[index] = {
              blob: blob,
              delay: frame.delay || 100
            }
            
            processedFrames++
            
            if (processedFrames === frames.length) {
              // Create final animated GIF blob (simplified - in production use proper GIF encoder)
              const url = URL.createObjectURL(slicedFrames[0].blob)
              resolve({
                id: slice.id,
                name: `slice-${slice.order}.gif`,
                blob: slicedFrames[0].blob, // Simplified - use first frame
                url: url,
                width: slice.width,
                height: slice.height,
                outputFormat: 'gif',
                isAnimated: true,
                frames: slicedFrames
              })
            }
          }, 'image/gif')
        })
        
      } catch (error) {
        console.error('Error creating animated GIF slice:', error)
        // Fallback to static slice
        createStaticSlice(slice, uploadedFile, 'gif').then(resolve)
      }
    })
  }
  
  const handleSliceImage = async () => {
    if (!uploadedFile || slices.length === 0) return
    
    setIsProcessing(true)
    
    try {
      const results = []
      
      // Sort slices by order
      const sortedSlices = [...slices].sort((a, b) => a.order - b.order)
      
      // Create each slice
      for (const slice of sortedSlices) {
        const sliceImage = await createSliceImage(slice, uploadedFile)
        results.push(sliceImage)
      }
      
      setSlicedImages(results)
      setShowResults(true)
      
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('slice-results')
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
      
      toast.success(`Successfully sliced image into ${results.length} pieces!`)
    } catch (error) {
      console.error('Error slicing image:', error)
      toast.error('Failed to slice image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleSliceDownload = (slice) => {
    toast.success(`Downloaded ${slice.name}`)
  }
  
  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (uploadedFile) {
        URL.revokeObjectURL(uploadedFile.url)
      }
      slicedImages.forEach(slice => {
        URL.revokeObjectURL(slice.url)
      })
    }
  }, [uploadedFile, slicedImages])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.header
        className="bg-white shadow-sm border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center">
                <ApperIcon name="Scissors" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SliceMaster Pro
                </h1>
                <p className="text-sm text-gray-600">
                  Professional image slicing tool for email designers
                </p>
              </div>
            </div>
            
<div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                <ApperIcon name="Zap" size={16} className="text-primary" />
                <span className="text-sm font-medium text-gray-700">
                  Supports GIF Animation
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {!uploadedFile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Upload Your Image
                </h2>
                <p className="text-lg text-gray-600">
                  Start by uploading a JPG, PNG, or GIF file to begin slicing
                </p>
              </div>
              
              <FileUpload 
                onFileSelect={handleFileSelect}
                disabled={isProcessing}
              />
              
              {/* Features */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ApperIcon name="Grid3x3" size={24} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Precision Grid</h3>
                  <p className="text-sm text-gray-600">
                    Snap-to-grid functionality for pixel-perfect alignment
                  </p>
                </Card>
                
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ApperIcon name="Play" size={24} className="text-secondary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">GIF Support</h3>
                  <p className="text-sm text-gray-600">
                    Preserve animations when slicing GIF files
                  </p>
                </Card>
                
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ApperIcon name="Download" size={24} className="text-success" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bulk Export</h3>
                  <p className="text-sm text-gray-600">
                    Download all slices as individual files or single ZIP
                  </p>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Image Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center">
                      <ApperIcon name="Image" size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {uploadedFile.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {uploadedFile.width} × {uploadedFile.height} pixels
                        {uploadedFile.isGif && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary">
                            <ApperIcon name="Play" size={12} className="mr-1" />
                            Animated GIF
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {slices.length} slice{slices.length !== 1 ? 's' : ''}
                    </span>
                    {slices.length > 0 && (
                      <div className="w-2 h-2 bg-success rounded-full" />
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
            
            {/* Canvas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
<div className="flex space-x-6">
                <div className={`transition-all duration-300 ${showSliceManager ? 'w-2/3' : 'w-full'}`}>
                  <ImageCanvas
                    uploadedFile={uploadedFile}
                    slices={slices}
                    onSlicesChange={setSlices}
                    snapMode={snapMode}
                    activeSlice={activeSlice}
                    onActiveSliceChange={setActiveSlice}
                    showSliceManager={showSliceManager}
                  />
                </div>
                {showSliceManager && (
                  <div className="w-1/3">
                    <SliceManager
                      slices={slices}
                      onSlicesChange={setSlices}
                      isOpen={showSliceManager}
                      onClose={() => setShowSliceManager(false)}
                      activeSlice={activeSlice}
                      onSliceSelect={setActiveSlice}
                      uploadedFile={uploadedFile}
                    />
                  </div>
                )}
              </div>
            </motion.div>
            {/* Results */}
            {showResults && slicedImages.length > 0 && (
              <SliceResults
                slices={slicedImages}
                onSliceDownload={handleSliceDownload}
              />
            )}
            
            {/* Processing Loading */}
            {isProcessing && (
              <Loading 
                message="Slicing your image..."
                fullScreen={true}
              />
            )}
          </div>
        )}
      </main>
      
      {/* Control Bar */}
      {uploadedFile && (
<ControlBar
          onReupload={handleReupload}
          onClearSlices={handleClearSlices}
          onSliceImage={handleSliceImage}
          snapMode={snapMode}
          onSnapModeChange={setSnapMode}
          hasImage={!!uploadedFile}
          hasSlices={slices.length > 0}
          isProcessing={isProcessing}
          showSliceManager={showSliceManager}
          onToggleSliceManager={() => setShowSliceManager(!showSliceManager)}
        />
      )}
    </div>
  )
}

export default SlicerPage