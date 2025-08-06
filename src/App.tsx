import { useEffect, useState } from 'react'
import api from './lib/axios'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: string
}

function App() {
  const [message, setMessage] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [name, setName] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')

  const appName = import.meta.env.VITE_APP_NAME || 'App'

  // Fetch welcome message on load
  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await api.get('/welcome') // http://localhost:5000/api/welcome
        setMessage(res.data)
      } catch (err) {
        console.error('Error fetching welcome message:', err)
      }
    }

    fetchMessage()
  }, [])

  // Fetch products (initial + when filters change)
  const fetchProducts = async (filters = {}) => {
    setLoading(true)
    try {
      const res = await api.post('/products/get-all', filters)
      setProducts(res.data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchProducts()
  }, [])

  // Debounced filtering
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts({
        name,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      })
    }, 500)

    return () => clearTimeout(debounce)
  }, [name, minPrice, maxPrice])

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-100 p-4 overflow-hidden">
      <Card className="w-full h-full max-w-6xl max-h-[95vh] shadow-xl overflow-hidden">
        <CardContent className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={import.meta.env.VITE_APP_LOGO_URL}
              alt="Logo"
              width={120}
              height="auto"
              loading="lazy"
            />
            <h1 className="text-[20px] font-bold text-gray-800 mb-2">Welcome to {appName}!</h1>
            <p className="text-gray-600 text-center">{message}</p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Input
              type="text"
              placeholder="Search Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {/* Scrollable Table Section */}
          <div className="overflow-auto rounded border border-gray-200 flex-grow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SL</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      <Loader2 className="animate-spin inline-block mr-2" />
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      No product found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow key={`${product.id}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
