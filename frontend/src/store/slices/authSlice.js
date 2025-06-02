import { createSlice } from '@reduxjs/toolkit'
import { jwtDecode } from 'jwt-decode'

const verifyToken = (token) => {
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    console.log('Decoded token:', decoded) // Temporary log to check token contents
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      return null
    }
    return decoded
  } catch (error) {
    localStorage.removeItem('token')
    return null
  }
}

const token = localStorage.getItem('token')
const decodedUser = token ? verifyToken(token) : null

const initialState = {
  user: decodedUser,
  token: decodedUser ? token : null,
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      const decoded = verifyToken(action.payload.token)
      console.log('Login success decoded:', decoded) // Temporary log
      if (decoded) {
        state.user = decoded
        state.token = action.payload.token
        localStorage.setItem('token', action.payload.token)
      } else {
        state.error = 'Invalid token'
      }
      state.isLoading = false
    },
    loginFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.error = null
      localStorage.removeItem('token')
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

// Export actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
} = authSlice.actions

// Export selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
export const selectAuthLoading = (state) => state.auth.isLoading
export const selectAuthError = (state) => state.auth.error

// Export reducer
export default authSlice.reducer 