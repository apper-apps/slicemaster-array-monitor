import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import SlicerPage from '@/components/pages/SlicerPage'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<SlicerPage />} />
      </Routes>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </div>
  )
}

export default App