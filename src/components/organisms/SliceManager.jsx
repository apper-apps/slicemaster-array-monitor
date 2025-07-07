import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'
import Input from '@/components/atoms/Input'
import Label from '@/components/atoms/Label'

const SliceManager = ({ 
  slices, 
  onSlicesChange, 
  isOpen, 
  onClose, 
  activeSlice, 
  onSliceSelect,
  uploadedFile 
}) => {
  const [selectedSlice, setSelectedSlice] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [tempSlice, setTempSlice] = useState(null)

  useEffect(() => {
    if (activeSlice) {
      const slice = slices.find(s => s.id === activeSlice)
      if (slice) {
        setSelectedSlice(slice)
        setTempSlice({ ...slice })
      }
    }
  }, [activeSlice, slices])

  const handleSliceSelect = (slice) => {
    setSelectedSlice(slice)
    setTempSlice({ ...slice })
    setEditMode(false)
    onSliceSelect(slice.id)
  }

  const handleEditToggle = () => {
    if (editMode) {
      // Apply changes
      const updatedSlices = slices.map(slice => 
        slice.id === selectedSlice.id ? { ...tempSlice } : slice
      )
      onSlicesChange(updatedSlices)
      setSelectedSlice(tempSlice)
    } else {
      // Start editing
      setTempSlice({ ...selectedSlice })
    }
    setEditMode(!editMode)
  }

  const handleCancelEdit = () => {
    setTempSlice({ ...selectedSlice })
    setEditMode(false)
  }

  const handleSliceChange = (field, value) => {
    setTempSlice(prev => ({
      ...prev,
      [field]: field === 'outputFormat' ? value : Math.max(0, parseInt(value) || 0)
    }))
  }

  const handleDeleteSlice = (sliceId) => {
    if (window.confirm('Are you sure you want to delete this slice?')) {
      const updatedSlices = slices.filter(slice => slice.id !== sliceId)
      onSlicesChange(updatedSlices)
      if (selectedSlice?.id === sliceId) {
        setSelectedSlice(null)
        setTempSlice(null)
        setEditMode(false)
      }
    }
  }

  const handleDuplicateSlice = (slice) => {
    const newSlice = {
      ...slice,
      id: Date.now().toString(),
      order: slices.length + 1,
      x: Math.min(slice.x + 20, uploadedFile.width - slice.width),
      y: Math.min(slice.y + 20, uploadedFile.height - slice.height)
    }
    onSlicesChange([...slices, newSlice])
  }

  const formatOptions = [
    { value: 'original', label: 'Original Format' },
    { value: 'gif', label: 'GIF (Animated)' },
    { value: 'png', label: 'PNG (Lossless)' },
    { value: 'jpg', label: 'JPG (Compressed)' }
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3 }}
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Slice Manager</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <ApperIcon name="X" size={20} />
            </Button>
          </div>

          {slices.length === 0 ? (
            <div className="text-center py-8">
              <ApperIcon name="Scissors" size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No slices created yet</p>
              <p className="text-sm text-gray-400 mt-1">Draw rectangles on the canvas to create slices</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Slice List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Slices ({slices.length})</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {slices.map((slice) => (
                    <Card 
                      key={slice.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedSlice?.id === slice.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSliceSelect(slice)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary text-white text-xs rounded flex items-center justify-center">
                            {slice.order}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Slice {slice.order}
                            </p>
                            <p className="text-xs text-gray-500">
                              {slice.width} × {slice.height}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateSlice(slice)
                            }}
                          >
                            <ApperIcon name="Copy" size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSlice(slice.id)
                            }}
                          >
                            <ApperIcon name="Trash2" size={12} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Slice Details */}
              {selectedSlice && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Slice {selectedSlice.order} Details
                    </h3>
                    <div className="flex items-center space-x-2">
                      {editMode ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <ApperIcon name="X" size={14} />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleEditToggle}
                          >
                            <ApperIcon name="Check" size={14} />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditToggle}
                        >
                          <ApperIcon name="Edit" size={14} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Position */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">X Position</Label>
                        <Input
                          type="number"
                          value={editMode ? tempSlice.x : selectedSlice.x}
                          onChange={(e) => handleSliceChange('x', e.target.value)}
                          disabled={!editMode}
                          className="mt-1"
                          min="0"
                          max={uploadedFile?.width - (editMode ? tempSlice.width : selectedSlice.width)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Y Position</Label>
                        <Input
                          type="number"
                          value={editMode ? tempSlice.y : selectedSlice.y}
                          onChange={(e) => handleSliceChange('y', e.target.value)}
                          disabled={!editMode}
                          className="mt-1"
                          min="0"
                          max={uploadedFile?.height - (editMode ? tempSlice.height : selectedSlice.height)}
                        />
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Width</Label>
                        <Input
                          type="number"
                          value={editMode ? tempSlice.width : selectedSlice.width}
                          onChange={(e) => handleSliceChange('width', e.target.value)}
                          disabled={!editMode}
                          className="mt-1"
                          min="20"
                          max={uploadedFile?.width - (editMode ? tempSlice.x : selectedSlice.x)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Height</Label>
                        <Input
                          type="number"
                          value={editMode ? tempSlice.height : selectedSlice.height}
                          onChange={(e) => handleSliceChange('height', e.target.value)}
                          disabled={!editMode}
                          className="mt-1"
                          min="20"
                          max={uploadedFile?.height - (editMode ? tempSlice.y : selectedSlice.y)}
                        />
                      </div>
                    </div>

                    {/* Output Format */}
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Output Format</Label>
                      <select
                        value={editMode ? tempSlice.outputFormat || 'original' : selectedSlice.outputFormat || 'original'}
                        onChange={(e) => handleSliceChange('outputFormat', e.target.value)}
                        disabled={!editMode}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
                      >
                        {formatOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {((editMode ? tempSlice.outputFormat : selectedSlice.outputFormat) === 'gif' || 
                        (!(editMode ? tempSlice.outputFormat : selectedSlice.outputFormat) && uploadedFile?.isGif)) && (
                        <p className="text-xs text-secondary mt-1 flex items-center">
                          <ApperIcon name="Info" size={12} className="mr-1" />
                          Preserves animation timing
                        </p>
                      )}
                    </div>

                    {/* File Name Preview */}
                    <div>
                      <Label className="text-xs font-medium text-gray-600">File Name</Label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700">
                        slice-{selectedSlice.order}.{
                          (() => {
                            const format = editMode ? tempSlice.outputFormat : selectedSlice.outputFormat
                            if (format === 'original') return uploadedFile?.type.split('/')[1]
                            if (format === 'gif') return 'gif'
                            if (format === 'png') return 'png'
                            if (format === 'jpg') return 'jpg'
                            return uploadedFile?.type.split('/')[1]
                          })()
                        }
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SliceManager