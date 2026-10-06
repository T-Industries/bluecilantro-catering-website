import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout, { AdminLogin, AdminProvider } from './admin/AdminLayout.jsx'
import OrderDetail from './admin/OrderDetail.jsx'
import Orders from './admin/Orders.jsx'
import { RestaurantEditor, RestaurantList } from './admin/Restaurants.jsx'
import Users, { Account } from './admin/Users.jsx'
import Layout from './components/Layout.jsx'
import { CartProvider } from './context/CartContext.jsx'
import Checkout from './pages/Checkout.jsx'
import Home from './pages/Home.jsx'
import OrderStatus, { TrackForm } from './pages/OrderStatus.jsx'
import Restaurant from './pages/Restaurant.jsx'
import './index.css'

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Page not found</h1>
      <Link to="/" className="btn-primary mt-6">
        Back to restaurants
      </Link>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <AdminProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="restaurant/:slug" element={<Restaurant />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:orderNumber" element={<OrderStatus />} />
              <Route path="track" element={<TrackForm />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="restaurants" element={<RestaurantList />} />
              <Route path="restaurants/:id" element={<RestaurantEditor />} />
              <Route path="users" element={<Users />} />
              <Route path="account" element={<Account />} />
            </Route>
          </Routes>
        </AdminProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
