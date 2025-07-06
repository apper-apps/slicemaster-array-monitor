import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'

const Error = ({ 
  message = "Something went wrong", 
  description = "Please try again or contact support if the problem persists.",
  onRetry,
  fullScreen = false 
}) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    : "flex items-center justify-center p-8"

  return (
    <div className={containerClass}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-md mx-auto text-center p-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-error to-red-600 rounded-full mb-4"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ApperIcon name="AlertCircle" size={32} className="text-white" />
          </motion.div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {message}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button
                variant="primary"
                onClick={onRetry}
                size="md"
              >
                <ApperIcon name="RotateCcw" size={16} className="mr-2" />
                Try Again
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              size="md"
            >
              <ApperIcon name="RefreshCw" size={16} className="mr-2" />
              Refresh Page
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default Error