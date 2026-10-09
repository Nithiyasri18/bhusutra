export function getApiErrorMessage(error) {
  const responseData = error?.response?.data
  const detail = responseData?.detail

  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item
        const message = item?.msg || 'Invalid value'
        const field = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== 'body').join('.')
          : ''
        return field ? `${field}: ${message}` : message
      })
      .join('; ')
  }
  if (typeof responseData === 'string' && /<!doctype html|<html/i.test(responseData)) {
    return 'The request reached the web app instead of the backend. Check VITE_API_URL in Vercel and redeploy.'
  }
  if (!error?.response && error?.message && error.message !== 'Network Error') {
    return error.message
  }
  if (!error?.response) {
    return 'Unable to reach the backend. Check VITE_API_URL and the backend service.'
  }
  return `The request failed (${error.response.status}). Please try again.`
}
