import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    api.get('/users').then((res) => setUsers(res.data)).catch(() => {})
  }, [])

  return (
    <Layout title="User Management">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-semibold text-govnavy">System Users</div>
          <button className="bg-govnavy text-white px-4 py-2 rounded-md text-sm">Add User</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Name</th><th>Role</th><th>District</th><th>Last Login</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-2">{u.name}</td>
                <td><span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{u.role}</span></td>
                <td>{u.district || '—'}</td>
                <td className="text-xs text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                <td><span className="text-xs text-green-700">Active</span></td>
                <td className="text-xs">
                  <button className="text-govblue hover:underline mr-3">Edit Role</button>
                  <button className="text-red-600 hover:underline">Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
