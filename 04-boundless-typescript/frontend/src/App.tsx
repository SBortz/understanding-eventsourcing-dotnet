import { Routes, Route } from 'react-router-dom'
import CatalogPage from './pages/CatalogPage'
import CartPage from './pages/CartPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
