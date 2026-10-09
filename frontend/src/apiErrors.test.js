import assert from 'node:assert/strict'
import test from 'node:test'

import { getApiErrorMessage } from './apiErrors.js'

test('returns backend detail text', () => {
  assert.equal(
    getApiErrorMessage({ response: { status: 409, data: { detail: 'Email already exists' } } }),
    'Email already exists',
  )
})

test('formats FastAPI validation detail arrays without rendering objects', () => {
  assert.equal(
    getApiErrorMessage({
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['body', 'mobile_number'], msg: 'Field required' },
            { loc: ['body', 'password'], msg: 'String should have at least 12 characters' },
          ],
        },
      },
    }),
    'mobile_number: Field required; password: String should have at least 12 characters',
  )
})

test('explains when the SPA fallback was returned instead of the API', () => {
  assert.match(
    getApiErrorMessage({ response: { status: 200, data: '<!doctype html><html></html>' } }),
    /VITE_API_URL/,
  )
})

test('returns explicit backend configuration and reachability messages', () => {
  assert.match(
    getApiErrorMessage(new Error('Backend API URL is not configured. Set VITE_API_URL in Vercel and redeploy.')),
    /VITE_API_URL in Vercel/,
  )
  assert.match(getApiErrorMessage({ message: 'Network Error' }), /Unable to reach the backend/)
})
