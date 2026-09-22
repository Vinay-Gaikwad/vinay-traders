import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type Product = {
  id: number
  name: string
  sku: string | null
  price: number
  stock: number
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')

      if (error) {
        console.error(error)
        setMessage(`Error: ${error.message}`)
        return
      }

      setProducts(data ?? [])
      setMessage('Connected to Supabase successfully')
    }

    loadProducts()
  }, [])

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
   <h1>Vinay Traders - Development Test</h1>

      <p>{message}</p>

      <h2>Products</h2>

      {products.map((product) => (
        <div key={product.id}>
          <strong>{product.name}</strong>
          {' — '}
          ₹{product.price}
          {' — '}
          Stock: {product.stock}
        </div>
      ))}
    </div>
  )
}

export default App