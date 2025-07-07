import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { decompressFrames, parseGIF } from "gifuct-js";
import gifshot from "gifshot";
import ApperIcon from "@/components/ApperIcon";
import SliceManager from "@/components/organisms/SliceManager";
import SliceResults from "@/components/organisms/SliceResults";
import ImageCanvas from "@/components/organisms/ImageCanvas";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Empty from "@/components/ui/Empty";
import ErrorComponent from "@/components/ui/Error";
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
// Function to create slice image based on format with enhanced error handling
  async function createSliceImage(slice, uploadedFile) {
    const outputFormat = slice.outputFormat || 'original'
    const isGifOutput = outputFormat === 'gif'
    
    // Validate slice dimensions
    if (slice.width <= 0 || slice.height <= 0) {
      throw new Error('Invalid slice dimensions')
    }
    
    if (slice.x < 0 || slice.y < 0 || 
        slice.x + slice.width > uploadedFile.width || 
        slice.y + slice.height > uploadedFile.height) {
      throw new Error('Slice extends beyond image boundaries')
    }
    
    // For GIF output or if original file is GIF, try to create animated version
if (isGifOutput || uploadedFile.type === 'image/gif') {
      try {
        if (!gifFrames || !gifFrames.length) {
          throw new Error('GIF data not available')
        }
        
        // Check if GIF is too complex for processing
        if (frames.length > 500) {
          throw new Error('GIF has too many frames for processing')
        }
        
        const totalPixels = slice.width * slice.height * frames.length
        if (totalPixels > 100000000) { // 100M pixels limit
          throw new Error('GIF slice is too large for processing')
        }
        
return await createAnimatedGifSlice(slice, uploadedFile, gifFrames)
      } catch (error) {
        console.warn('GIF slicing failed, falling back to static:', error)
        
        // Provide specific fallback messages
        let fallbackMessage = 'GIF slicing failed, falling back to static format'
        if (error.message.includes('timeout')) {
          fallbackMessage = 'GIF processing timed out, using static format'
        } else if (error.message.includes('memory') || error.message.includes('large')) {
          fallbackMessage = 'GIF too large for animation, using static format'
        } else if (error.message.includes('frames')) {
          fallbackMessage = 'GIF too complex for animation, using static format'
        }
        
        toast.warning(fallbackMessage, { autoClose: 4000 })
        
        // Fall back to static image with appropriate format
        const fallbackFormat = outputFormat === 'gif' ? 'png' : outputFormat
        return await createStaticSlice(slice, uploadedFile, fallbackFormat)
      }
    }
    
    // For static formats
    return await createStaticSlice(slice, uploadedFile, outputFormat)
  }
  
// Helper function to create static slice with error handling
  async function createStaticSlice(slice, uploadedFile, outputFormat) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Validate context creation
      if (!ctx) {
        reject(new Error('Failed to create canvas context'))
        return
      }
      
      canvas.width = slice.width
      canvas.height = slice.height
      
      const img = new Image()
      img.onload = () => {
        try {
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
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }
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
        } catch (error) {
          reject(new Error(`Failed to process image: ${error.message}`))
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = uploadedFile.url
    })
  }

// Helper function to create animated GIF slice with enhanced error handling
  async function createAnimatedGifSlice(slice, uploadedFile, frames) {
    return new Promise((resolve, reject) => {
      let abortController = new AbortController()
      let progressiveTimeout = null
      let gifEncoder = null
      let processingStartTime = Date.now()
      
      try {
        // Check if frames are too numerous for processing
        const maxFrames = 200
        const processedFrames = frames.length > maxFrames ? 
          frames.filter((_, index) => index % Math.ceil(frames.length / maxFrames) === 0) : 
          frames
        
        if (processedFrames.length !== frames.length) {
          console.warn(`Reduced frames from ${frames.length} to ${processedFrames.length} for performance`)
        }
        
        const fullCanvas = document.createElement('canvas')
        const fullCtx = fullCanvas.getContext('2d')
        
        // Set canvas size to original image dimensions
        fullCanvas.width = uploadedFile.width
        fullCanvas.height = uploadedFile.height
        
// Set up progressive timeout (start with 15s, extend based on complexity)
        const baseTimeout = 15000
        const complexityFactor = Math.min(3, processedFrames.length / 50)
        const finalTimeout = baseTimeout * (1 + complexityFactor)
        
        progressiveTimeout = setTimeout(() => {
          cleanup()
          reject(new Error(`GIF processing timeout after ${Math.round(finalTimeout/1000)}s`))
        }, finalTimeout)
        
        // Cleanup function
        const cleanup = () => {
          if (progressiveTimeout) {
            clearTimeout(progressiveTimeout)
            progressiveTimeout = null
          }
          abortController.abort()
          
          // Clean up canvas contexts
          if (fullCtx) {
            fullCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height)
          }
        }
        
        let processedFrameCount = 0
        const frameImages = []
        
        // Process frames and create image data for gifshot
        for (let i = 0; i < processedFrames.length; i++) {
          if (abortController.signal.aborted) {
            cleanup()
            reject(new Error('GIF processing cancelled'))
            return
          }
          
          const frame = processedFrames[i]
          
          try {
            // Clear canvas and draw frame
            fullCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height)
            fullCtx.putImageData(frame.imageData, 0, 0)
            
            // Create slice canvas
            const sliceCanvas = document.createElement('canvas')
            const sliceCtx = sliceCanvas.getContext('2d')
            sliceCanvas.width = slice.width
            sliceCanvas.height = slice.height
            
            // Extract slice from full frame
            sliceCtx.drawImage(fullCanvas, slice.x, slice.y, slice.width, slice.height, 0, 0, slice.width, slice.height)
            
            // Get frame delay with bounds checking
            const delayMs = Math.max(50, Math.min(1000, frame.delay || 100))
            const delaySeconds = delayMs / 1000
            
            // Convert canvas to data URL for gifshot
            const dataUrl = sliceCanvas.toDataURL('image/png')
            frameImages.push({
              src: dataUrl,
              duration: delaySeconds
            })
            
            processedFrameCount++
            
            // Update progress with time estimation
            const progress = Math.round((i / processedFrames.length) * 50)
            const elapsed = Date.now() - processingStartTime
            const estimatedTotal = elapsed * (processedFrames.length / (i + 1))
            const remainingTime = Math.max(0, Math.round((estimatedTotal - elapsed) / 1000))
            
            // Clean up slice canvas
            sliceCtx.clearRect(0, 0, slice.width, slice.height)
            
          } catch (frameError) {
            console.warn(`Frame ${i} processing error:`, frameError)
            // Continue with next frame instead of failing completely
          }
        }
        
        // Validate that we have processed frames
        if (processedFrameCount === 0) {
          cleanup()
          reject(new Error('No frames were successfully processed'))
          return
        }
        
        // Create GIF using gifshot with better animation preservation
        const gifOptions = {
          images: frameImages,
          gifWidth: slice.width,
          gifHeight: slice.height,
          numWorkers: Math.min(2, navigator.hardwareConcurrency || 1),
          progressCallback: (captureProgress) => {
            const totalProgress = 50 + Math.round(captureProgress * 50)
            const elapsed = Date.now() - processingStartTime
            const estimatedTotal = elapsed / ((50 + captureProgress * 50) / 100)
            const remainingTime = Math.max(0, Math.round((estimatedTotal - elapsed) / 1000))
            
            // Note: processingToast would need to be passed as parameter or managed differently
            // For now, we'll skip the toast update to avoid undefined reference
          },
          completeCallback: (obj) => {
            cleanup()
            
            if (!obj.image) {
              reject(new Error('GIF generation failed'))
              return
            }
            
            // Convert data URL to blob
            fetch(obj.image)
              .then(res => res.blob())
              .then(blob => {
                // Validate blob size
                if (blob.size === 0) {
                  reject(new Error('Generated GIF is empty'))
                  return
                }
                
                if (blob.size > 50 * 1024 * 1024) { // 50MB limit
                  reject(new Error('Generated GIF is too large (>50MB)'))
                  return
                }
                
                const url = URL.createObjectURL(blob)
                const processingTime = Date.now() - processingStartTime
                console.log(`GIF processing completed in ${processingTime}ms, size: ${Math.round(blob.size/1024)}KB`)
                
                resolve({
                  id: slice.id,
                  name: `slice-${slice.order}.gif`,
                  blob: blob,
                  url: url,
                  width: slice.width,
                  height: slice.height,
                  outputFormat: 'gif'
                })
              })
              .catch(error => {
                cleanup()
                reject(new Error(`Failed to convert GIF to blob: ${error.message}`))
              })
          },
          errorCallback: (error) => {
            cleanup()
            console.error('Gifshot error:', error)
            reject(new Error(`GIF creation failed: ${error.message || 'Unknown error'}`))
          }
        }
        
        // Start GIF creation with error boundary
        try {
          gifshot.createGIF(gifOptions)
        } catch (error) {
          cleanup()
          reject(new Error(`GIF creation initiation failed: ${error.message}`))
        }
        
      } catch (error) {
        if (progressiveTimeout) clearTimeout(progressiveTimeout)
        console.error('GIF processing setup error:', error)
        reject(new Error(`GIF processing setup failed: ${error.message}`))
      }
    })
}
  
  // Main function to handle slice image creation with enhanced error handling
  async function handleSliceImage() {
    if (!uploadedFile || slices.length === 0) {
      toast.error('Please upload an image and create some slices first')
      return
    }
    
    const processingToast = toast.loading('Processing slices...')
    let processedCount = 0
    let successCount = 0
    
    try {
      const results = []
      
      // Sort slices by order for consistent processing
      const sortedSlices = [...slices].sort((a, b) => a.order - b.order)
      
      // Process slices with progress tracking
      for (const slice of sortedSlices) {
        processedCount++
        
        try {
          // Update progress
          toast.update(processingToast, {
            render: `Processing slice ${processedCount}/${sortedSlices.length}...`,
            progress: processedCount / sortedSlices.length
          })
          
          const sliceImage = await createSliceImage(slice, uploadedFile)
          results.push({
            slice,
            image: sliceImage,
            error: null
          })
          successCount++
          
        } catch (error) {
          console.error('Error creating slice:', error)
          
          // Provide specific error context
          let errorMessage = error.message
          if (error.message.includes('timeout')) {
            errorMessage = 'Processing timeout - try reducing slice size or using static format'
          } else if (error.message.includes('memory')) {
            errorMessage = 'Insufficient memory - try reducing image size'
          } else if (error.message.includes('GIF')) {
            errorMessage = 'GIF processing failed - falling back to static format'
          }
          
          results.push({
            slice,
            image: null,
            error: errorMessage
          })
          
          // Show individual slice error as warning
          toast.warning(`Slice ${processedCount} failed: ${errorMessage}`, {
            autoClose: 3000
          })
        }
}
      
      toast.dismiss(processingToast)
      
      // Show completion summary
      if (successCount === sortedSlices.length) {
        toast.success(`Successfully processed all ${successCount} slices!`)
      } else if (successCount > 0) {
        toast.warning(`Processed ${successCount}/${sortedSlices.length} slices successfully`)
      } else {
        toast.error('Failed to process any slices')
      }
      
// Set results and show them
      setSlicedImages(results)
      setShowResults(true)
      
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('slice-results')
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
      
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