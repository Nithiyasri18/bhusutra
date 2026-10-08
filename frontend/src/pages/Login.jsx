import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'

function saveSession(data, email) {
  localStorage.setItem('bhusutra_token', data.access_token)
  localStorage.setItem('bhusutra_user_id', data.id)
  localStorage.setItem('bhusutra_email', email)
  localStorage.setItem('bhusutra_role', data.role)
  localStorage.setItem('bhusutra_name', data.name)
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const resetToken = searchParams.get('reset_token')
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        const response = await api.post('/auth/login', { email, password })
        saveSession(response.data, email)
        navigate('/dashboard', { replace: true })
      } else if (mode === 'register') {
        const response = await api.post('/auth/register', { name, email, mobile_number: mobile, password })
        saveSession(response.data, email)
        navigate('/dashboard', { replace: true })
      } else if (mode === 'forgot') {
        const response = await api.post('/auth/forgot-password', { email })
        setMessage(response.data.detail)
      } else {
        const response = await api.post('/auth/reset-password', { token: resetToken, password })
        setMessage(response.data.detail)
        window.history.replaceState({}, '', '/login')
        setMode('login')
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'The request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const titles = {
    login: ['Welcome back', 'Sign in to your land records workspace.'],
    register: ['Create a citizen account', 'Register securely to submit and track land documents.'],
    forgot: ['Reset your password', 'Enter your account email to request a secure reset link.'],
    reset: ['Choose a new password', 'Reset links expire after 30 minutes and can only be used once.'],
  }
  const [title, subtitle] = titles[mode]

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual-content">
          <div className="flex items-center gap-3"><div className="brand-mark">B</div><div><div className="text-xl font-bold tracking-wide">BhuSutra</div><div className="text-[10px] uppercase tracking-[0.2em] text-[#8de1d9]">Land intelligence</div></div></div>
          <div className="mt-auto max-w-lg"><div className="eyebrow light">Secure digital land-record services</div><h1 className="display-title">One clear path to your land records.</h1><p className="mt-5 text-white/65 text-base leading-7">Upload documents, follow review progress, and get guidance on land-record processes.</p></div>
        </div>
        <div className="map-lines" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="login-visual-footer">BHUSUTRA / DIGITAL LAND RECORD SERVICES</div>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="md:hidden flex items-center gap-3 mb-12"><div className="brand-mark dark">B</div><strong className="text-xl text-[#112c4c]">BhuSutra</strong></div>
          <div className="eyebrow">{mode === 'register' ? 'Citizen registration' : 'Secure account access'}</div>
          <h2 className="text-3xl font-bold text-[#112c4c] mt-3">{title}</h2>
          <p className="text-sm text-slate-500 mt-2">{subtitle}</p>

          {mode !== 'forgot' && mode !== 'reset' && (
            <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage('') }} className={`rounded-md py-2 text-sm font-semibold ${mode === 'login' ? 'bg-white text-[#183755] shadow-sm' : 'text-slate-500'}`}>Sign in</button>
              <button type="button" onClick={() => { setMode('register'); setError(''); setMessage('') }} className={`rounded-md py-2 text-sm font-semibold ${mode === 'register' ? 'bg-white text-[#183755] shadow-sm' : 'text-slate-500'}`}>Create account</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {mode === 'register' && <>
              <label className="field-label">Full name<input required autoComplete="name" minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="field-input" /></label>
            </>}
            {mode !== 'reset' && <label className="field-label">Email address<input required type="email" autoComplete="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field-input" /></label>}
            {mode === 'register' && <label className="field-label">Mobile number<input required type="tel" autoComplete="tel" minLength={7} maxLength={32} value={mobile} onChange={(event) => setMobile(event.target.value)} className="field-input" /></label>}
            {(mode === 'login' || mode === 'register' || mode === 'reset') && <label className="field-label">{mode === 'reset' ? 'New password' : 'Password'}<input required type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" />{mode !== 'login' && <span className="mt-1 block text-[11px] text-slate-400">Use at least 12 characters.</span>}</label>}
            {mode === 'register' && <label className="field-label">Confirm password<input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="field-input" /></label>}
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            {message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800" role="status">{message}</p>}
            <button type="submit" disabled={loading} className="primary-button w-full disabled:cursor-wait disabled:opacity-60">{loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create citizen account' : mode === 'forgot' ? 'Send reset link' : 'Set new password'}</button>
          </form>

          {mode === 'login' && <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage('') }} className="mt-5 text-sm font-semibold text-[#0f7478] hover:underline">Forgot password?</button>}
          {(mode === 'forgot' || mode === 'reset') && <button type="button" onClick={() => { setMode('login'); setError(''); setMessage('') }} className="mt-5 text-sm font-semibold text-[#0f7478] hover:underline">Back to sign in</button>}
          <div className="mt-8 text-center text-[11px] text-slate-400">Passwords are protected with secure hashing. Citizen registration does not grant staff access.</div>
        </div>
      </section>
    </main>
  )
}
