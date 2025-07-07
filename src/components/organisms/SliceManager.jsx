import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Label from "@/components/atoms/Label";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";

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

  useEffect(() => {
    if (activeSlice) {
      const slice = slices.find(s => s.id === activeSlice)
      if (slice) {
        setSelectedSlice(slice)
      }
    }
  }, [activeSlice, slices])

const handleSliceSelect = (slice) => {
    setSelectedSlice(slice)
    onSliceSelect(slice.id)
  }

const handleSliceChange = (field, value) => {
    const updatedValue = field === 'outputFormat' ? value : Math.max(0, parseInt(value) || 0)
    const updatedSlices = slices.map(slice => 
      slice.id === selectedSlice.id ? { ...slice, [field]: updatedValue } : slice
    )
    onSlicesChange(updatedSlices)
    setSelectedSlice(prev => ({ ...prev, [field]: updatedValue }))
  }

  const handleDeleteSlice = (sliceId) => {
    if (window.confirm('Are you sure you want to delete this slice?')) {
      const updatedSlices = slices.filter(slice => slice.id !== sliceId)
      onSlicesChange(updatedSlices)
if (selectedSlice?.id === sliceId) {
        setSelectedSlice(null)
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
    <div
        className="h-full bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">Slice Manager</h2>
            </div>
            {slices.length === 0 ? <div className="text-center py-8">
                <ApperIcon name="Scissors" size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No slices created yet</p>
                <p className="text-sm text-gray-400 mt-1">Draw rectangles on the canvas to create slices</p>
            </div> : <div className="space-y-4">
                {/* Slice List */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Slices ({slices.length})</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {slices.map(slice => <Card
                            key={slice.id}
                            className={`p-3 cursor-pointer transition-all ${selectedSlice?.id === slice.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-gray-50"}`}
                            onClick={() => handleSliceSelect(slice)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-6 h-6 bg-primary text-white text-xs rounded flex items-center justify-center">
                                        {slice.order}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Slice {slice.order}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {slice.width}× {slice.height}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleDuplicateSlice(slice);
                                        }}>
                                        <ApperIcon name="Copy" size={12} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleDeleteSlice(slice.id);
                                        }}>
                                        <ApperIcon name="Trash2" size={12} />
                                    </Button>
                                </div>
                            </div>
                        </Card>)}
                    </div>
                </div>
                {/* Slice Details */}
                {selectedSlice && <Card className="p-4">
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">Slice {selectedSlice.order}Details
                                                </h3>
                    </div>
                    <div className="space-y-4">
                        {/* Position */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-medium text-gray-600">X Position</Label>
                                <Input
                                    type="number"
                                    value={selectedSlice.x}
                                    onChange={e => handleSliceChange("x", e.target.value)}
                                    className="mt-1"
                                    min="0"
                                    max={uploadedFile?.width - selectedSlice.width} />
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-gray-600">Y Position</Label>
                                <Input
                                    type="number"
                                    value={selectedSlice.y}
                                    onChange={e => handleSliceChange("y", e.target.value)}
                                    className="mt-1"
                                    min="0"
                                    max={uploadedFile?.height - selectedSlice.height} />
                            </div>
                        </div>
                        {/* Dimensions */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-medium text-gray-600">Width</Label>
                                <Input
                                    type="number"
                                    value={selectedSlice.width}
                                    onChange={e => handleSliceChange("width", e.target.value)}
                                    className="mt-1"
                                    min="20"
                                    max={uploadedFile?.width - selectedSlice.x} />
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-gray-600">Height</Label>
                                <Input
                                    type="number"
                                    value={selectedSlice.height}
                                    onChange={e => handleSliceChange("height", e.target.value)}
                                    className="mt-1"
                                    min="20"
                                    max={uploadedFile?.height - selectedSlice.y} />
                            </div>
                        </div>
                        {/* Output Format */}
                        <div>
                            <Label className="text-xs font-medium text-gray-600">Output Format</Label>
                            <select
                                value={selectedSlice.outputFormat || "original"}
                                onChange={e => handleSliceChange("outputFormat", e.target.value)}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                {formatOptions.map(option => <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>)}
                            </select>
                            {(selectedSlice.outputFormat === "gif" || !selectedSlice.outputFormat && uploadedFile?.isGif) && <p className="text-xs text-secondary mt-1 flex items-center">
                                <ApperIcon name="Info" size={12} className="mr-1" />Preserves animation timing
                                                        </p>}
                        </div>
                        {/* File Name Preview */}
                        <div>
                            <Label className="text-xs font-medium text-gray-600">File Name</Label>
                            <div className="mt-1 px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700">slice-{selectedSlice.order}.{(() => {
                                    const format = selectedSlice.outputFormat;

                                    if (format === "original")
                                        return uploadedFile?.type.split("/")[1];

                                    if (format === "gif")
                                        return "gif";

                                    if (format === "png")
                                        return "png";

                                    if (format === "jpg")
                                        return "jpg";

                                    return uploadedFile?.type.split("/")[1];
                                })()}
                            </div>
                        </div>
                    </div>
                </Card>}
            </div>}
        </div>
    </div></AnimatePresence>
  )
}

export default SliceManager