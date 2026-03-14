import { useState, useCallback, useEffect } from 'react'
import { usePage } from '@inertiajs/react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  category: string
}

export interface Cart {
  items: CartItem[]
  total: number
}

export function useCart() {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const { props } = usePage<any>()
  const user = props?.auth?.user ?? null

  // Cargar carrito del localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch (e) {
          console.error('Error loading cart:', e)
        }
      }
    } finally {
      setIsLoading(false)
    }

    // Si el usuario está autenticado, sincronizar con el carrito persistido en el backend
    if (user) {
      fetch('/api/cart', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then((res) => {
          if (!res.ok) return null
          return res.json()
        })
        .then((data) => {
          if (!data || data.ok !== true || !Array.isArray(data.items)) return

          const serverItems: CartItem[] = data.items
            .map((it: any) => ({
              id: String(it.product_id),
              name: String(it.name ?? ''),
              price: Number(it.price_usd ?? 0),
              quantity: Number(it.quantity ?? 0),
              image: '',
              category: '',
            }))
            .filter((it: CartItem) => it.quantity > 0)

          if (serverItems.length === 0) return

          const total = serverItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          )
          const syncedCart: Cart = { items: serverItems, total }
          setCart(syncedCart)
          try {
            localStorage.setItem('cart', JSON.stringify(syncedCart))
          } catch (e) {
            console.error('Error saving synced cart:', e)
          }
        })
        .catch(() => {
          // Si falla la sincronización simplemente seguimos usando el carrito local
        })
    }
  }, [user])

  // Guardar carrito en localStorage
  const saveCart = useCallback((newCart: Cart) => {
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    try {
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: newCart }))
    } catch (e) {
      // noop
    }
  }, [])

  // Calcular total
  const calculateTotal = useCallback((items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [])

  // Agregar producto al carrito
  const addToCart = useCallback(
    (product: Omit<CartItem, 'quantity'>) => {
      console.log('[v0] useCart - addToCart llamado con:', product)
      setCart((prevCart) => {
        const existingItem = prevCart.items.find((item) => item.id === product.id)
        let newItems: CartItem[]

        if (existingItem) {
          console.log('[v0] Producto ya existe, incrementando cantidad')
          newItems = prevCart.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        } else {
          console.log('[v0] Nuevo producto, agregando al carrito')
          newItems = [...prevCart.items, { ...product, quantity: 1 }]
        }

        const newCart = { items: newItems, total: calculateTotal(newItems) }
        console.log('[v0] Carrito actualizado:', newCart)
        saveCart(newCart)
        return newCart
      })
    },
    [calculateTotal, saveCart]
  )

  // Eliminar producto del carrito
  const removeFromCart = useCallback(
    (productId: string) => {
      setCart((prevCart) => {
        const newItems = prevCart.items.filter((item) => item.id !== productId)
        const newCart = { items: newItems, total: calculateTotal(newItems) }
        saveCart(newCart)
        return newCart
      })
    },
    [calculateTotal, saveCart]
  )

  // Actualizar cantidad
  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      setCart((prevCart) => {
        if (quantity <= 0) {
          return prevCart // No actualizar si es 0 o negativo
        }

        // Si el item tiene stock registrado, evitar superar stock
        const newItems = prevCart.items.map((item) => {
          if (item.id !== productId) return item
          const desired = quantity
          const stock = (item as any).stock ?? null
          const finalQty = stock !== null ? Math.min(desired, stock) : desired
          return { ...item, quantity: finalQty }
        })
        const newCart = { items: newItems, total: calculateTotal(newItems) }
        saveCart(newCart)
        return newCart
      })
    },
    [calculateTotal, saveCart]
  )

  const updatePrice = useCallback(
    (productId: string, price: number) => {
      setCart((prevCart) => {
        const newItems = prevCart.items.map((item) =>
          item.id === productId ? { ...item, price } : item
        )
        const newCart = { items: newItems, total: calculateTotal(newItems) }
        saveCart(newCart)
        return newCart
      })
    },
    [calculateTotal, saveCart]
  )

  // Vaciar carrito
  const clearCart = useCallback(() => {
    const emptyCart: Cart = { items: [], total: 0 }
    saveCart(emptyCart)
  }, [saveCart])

  // Suscribirse a eventos de actualización del carrito para sincronizar entre componentes
  useEffect(() => {
    const onCartUpdated = (e: Event) => {
      const anyEvent = e as CustomEvent
      const detail = anyEvent.detail as Cart | undefined
      if (detail) {
        setCart(detail)
      }
    }
    const onStorage = () => {
      try {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }
      } catch {}
    }
    window.addEventListener('cart:updated', onCartUpdated as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('cart:updated', onCartUpdated as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    clearCart,
    itemCount: cart.items.length,
    total: cart.total,
  }
}
