import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
  },
  reducers: {
    setCartItems: (state, action) => {
      state.items = action.payload
    },
    clearCart: (state) => {
      state.items = []
    },
  },
})

export const { setCartItems, clearCart } = cartSlice.actions

// Total number of individual units across all cart items
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)

export default cartSlice.reducer
