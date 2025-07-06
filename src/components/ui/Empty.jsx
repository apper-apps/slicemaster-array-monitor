import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'

const Empty = ({ 
  title = "No data available",
  description = "Get started by adding some content.",
  icon = "FileImage",
  actionLabel = "Get Started",
  onAction,
  fullScreen = false 
}) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    : "flex items-center justify-center p-8"

  return (
    <div className={containerClass}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md mx-auto text-center p-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary/10 to-blue-100 rounded-full mb-6"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <ApperIcon name={icon} size={40} className="text-primary" />
          </motion.div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {title}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {description}
          </p>
          
          {onAction && (
            <Button
              variant="primary"
              onClick={onAction}
              size="lg"
              className="shadow-lg hover:shadow-xl"
            >
              <ApperIcon name="Plus" size={20} className="mr-2" />
              {actionLabel}
            </Button>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

export default Empty