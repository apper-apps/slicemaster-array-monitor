import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Switch from '@/components/atoms/Switch'

const ControlBar = ({ 
  onReupload, 
  onClearSlices, 
  onSliceImage, 
  snapMode, 
  onSnapModeChange,
  hasImage,
  hasSlices,
  isProcessing,
  showSliceManager,
  onToggleSliceManager
}) => {
  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={snapMode}
              onChange={onSnapModeChange}
              disabled={!hasImage}
            />
            <span className="text-sm font-medium text-gray-700">
              Snap Mode
            </span>
            <div className={`w-2 h-2 rounded-full ${snapMode ? 'bg-success' : 'bg-gray-300'}`} />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="md"
            onClick={onReupload}
            disabled={!hasImage || isProcessing}
          >
            <ApperIcon name="Upload" size={16} className="mr-2" />
            Reupload Image
          </Button>
          
          <Button
            variant="ghost"
            size="md"
            onClick={onClearSlices}
            disabled={!hasSlices || isProcessing}
          >
            <ApperIcon name="Trash2" size={16} className="mr-2" />
            Clear All Slices
          </Button>
<Button
            variant="outline"
            size="md"
            onClick={onToggleSliceManager}
            disabled={!hasImage || isProcessing}
          >
            <ApperIcon name={showSliceManager ? "PanelRightClose" : "PanelRight"} size={16} className="mr-2" />
            {showSliceManager ? 'Hide' : 'Show'} Manager
          </Button>
          
          <Button
            variant="primary"
            size="md"
            onClick={onSliceImage}
            disabled={!hasSlices || isProcessing}
          >
            {isProcessing ? (
              <>
                <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ApperIcon name="Scissors" size={16} className="mr-2" />
                Slice It
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default ControlBar