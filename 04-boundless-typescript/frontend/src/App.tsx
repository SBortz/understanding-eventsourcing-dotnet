import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import CatalogPage from './pages/CatalogPage'
import CartPage from './pages/CartPage'
import AdminPage from './pages/AdminPage'
import InfoPage from './pages/InfoPage'
import ExplorerPage from './pages/ExplorerPage'
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/cart/:cartId" element={<CartPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
      </Routes>
    </>
  )
}

export default App
