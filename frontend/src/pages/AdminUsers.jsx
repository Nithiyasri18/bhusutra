import { useCallback, useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api'

const initialForm = { name: '', email: '', mobile_number: '', role: 'Officer' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    const response = await api.get('/users')
    setUsers(response.data)
  }, [])

  useEffect(() => {
    loadUsers().catch((requestError) => setError(requestError.response?.data?.detail || 'Could not load staff accounts.'))
  }, [loadUsers])

  async function createUser(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await api.post('/users', form)
      setForm(initialForm)
      setMessage('Staff account created. The staff member must use Forgot password to set their initial password.')
      await loadUsers()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not create this staff account.')
    } finally {
      setSaving(false)
    }
  }

  return <Layout title="Staff accounts">
    <section className="panel mb-5">
      <div className="panel-heading"><div><h3>Create a staff account</h3><p>Citizen role is assigned only through public citizen registration.</p></div></div>
      <form onSubmit={createUser} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="field-label">Full name<input required minLength={2} maxLength={160} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field-input" /></label>
        <label className="field-label">Email<input required type="email" maxLength={320} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="field-input" /></label>
        <label className="field-label">Mobile number<input required type="tel" minLength={7} maxLength={32} value={form.mobile_number} onChange={(event) => setForm({ ...form, mobile_number: event.target.value })} className="field-input" /></label>
        <label className="field-label">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="field-input"><option>Officer</option><option>Admin</option><option>Auditor</option></select></label>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 md:col-span-2" role="alert">{error}</p>}
        {message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800 md:col-span-2" role="status">{message}</p>}
        <button disabled={saving} type="submit" className="primary-button w-fit disabled:opacity-50">{saving ? 'Creating...' : 'Create staff account'}</button>
      </form>
    </section>
    <section className="panel">
      <div className="panel-heading"><div><h3>Registered users</h3><p>Identity records managed in PostgreSQL.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Created</th><th>Last login</th></tr></thead>
        <tbody>{users.map((user) => <tr key={user.id}>
          <td className="font-semibold text-[#183755]">{user.name}</td><td>{user.email}</td><td>{user.mobile_number || '—'}</td><td>{user.role}</td>
          <td>{new Date(user.created_at).toLocaleDateString()}</td><td>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
        </tr>)}{users.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No users found.</td></tr>}</tbody>
      </table></div>
    </section>
  </Layout>
}
