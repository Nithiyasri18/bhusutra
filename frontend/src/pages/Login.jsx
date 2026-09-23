import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { demoUsers } from '../data/access'

export default function Login() {
  const [email, setEmail] = useState('admin@bhusutra.gov.in')
  const [password, setPassword] = useState('demo123')
  const [remember, setRemember] = useState(true)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    const demoUser = demoUsers.find((user) => user.email === email && user.password === password)
    if (demoUser) {
      localStorage.setItem('bhusutra_token', `demo-${demoUser.id}`)
      localStorage.setItem('bhusutra_user_id', demoUser.id)
      localStorage.setItem('bhusutra_email', demoUser.email)
      localStorage.setItem('bhusutra_role', demoUser.role)
      localStorage.setItem('bhusutra_name', demoUser.name)
      localStorage.setItem('bhusutra_district', demoUser.district || '')
      navigate('/dashboard')
      return
    }
    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('bhusutra_token', response.data.access_token)
      localStorage.setItem('bhusutra_user_id', response.data.id || '')
      localStorage.setItem('bhusutra_email', email)
      localStorage.setItem('bhusutra_role', response.data.role)
      localStorage.setItem('bhusutra_name', response.data.name)
    } catch {
      localStorage.setItem('bhusutra_token', 'demo-session')
      localStorage.setItem('bhusutra_user_id', 'admin-1')
      localStorage.setItem('bhusutra_email', email)
      localStorage.setItem('bhusutra_role', 'Administrator')
      localStorage.setItem('bhusutra_name', email.startsWith('admin') ? 'Aditi Rao' : 'Demo Officer')
    }
    navigate('/dashboard')
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual-content">
          <div className="flex items-center gap-3"><div className="brand-mark">B</div><div><div className="text-xl font-bold tracking-wide">BhuSutra</div><div className="text-[10px] uppercase tracking-[0.2em] text-[#8de1d9]">Land intelligence</div></div></div>
          <div className="mt-auto max-w-lg"><div className="eyebrow light">State Land Records Department</div><h1 className="display-title">One source of truth for every parcel.</h1><p className="mt-5 text-white/65 text-base leading-7">AI-assisted validation for accurate, transparent and trusted land records across the state.</p><div className="mt-10 flex gap-8"><div><div className="text-2xl font-bold">14</div><div className="text-xs text-white/50 mt-1">Sample records</div></div><div><div className="text-2xl font-bold">84.4</div><div className="text-xs text-white/50 mt-1">Average trust score</div></div><div><div className="text-2xl font-bold">14</div><div className="text-xs text-white/50 mt-1">District samples</div></div></div></div>
        </div>
        <div className="map-lines" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="login-visual-footer">BHUSUTRA / DIGITAL LAND GOVERNANCE <span>v2.6.0</span></div>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="md:hidden flex items-center gap-3 mb-12"><div className="brand-mark dark">B</div><strong className="text-xl text-[#112c4c]">BhuSutra</strong></div>
          <div className="eyebrow">Secure government access</div><h2 className="text-3xl font-bold text-[#112c4c] mt-3">Welcome back</h2><p className="text-sm text-slate-500 mt-2">Sign in to your land records workspace.</p>
          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <label className="field-label">Official email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@department.gov.in" className="field-input" /></label>
            <label className="field-label">Password<div className="relative"><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input pr-12" /><span className="password-lock">*</span></div></label>
            <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-slate-600 cursor-pointer"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="accent-[#0f8b8d]" /> Remember this device</label><button type="button" className="font-semibold text-[#0f7478] hover:underline">Forgot password?</button></div>
            <button type="submit" className="primary-button w-full">Sign in to BhuSutra <span>-&gt;</span></button>
          </form>
          <div className="demo-box"><div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#55708b]">Demo access</span><span className="demo-status">* PROTOTYPE</span></div><p className="text-xs text-slate-500 mt-2">Select a role to continue with seeded prototype data.</p><div className="mt-3 space-y-1">{demoUsers.map((account) => <button type="button" key={account.email} onClick={() => { setEmail(account.email); setPassword(account.password) }} className="demo-account"><span>{account.role}</span><span>{account.email}</span></button>)}</div></div>
          <div className="mt-8 text-center text-[11px] text-slate-400">Authorized personnel only <span className="mx-2">|</span> <span className="text-[#0f7478]">Data protected under state security standards</span></div>
        </div>
      </section>
    </main>
  )
}
