import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import CatalogPage from './pages/CatalogPage'
import CartPage from './pages/CartPage'
import AdminPage from './pages/AdminPage'
import InfoPage from './pages/InfoPage'
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/info" element={<InfoPage />} />
      </Routes>
    </>
  )
}

export default App
