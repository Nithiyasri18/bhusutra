import { useState } from 'react'
import Layout from '../components/Layout'
import api from '../api'

const suggestedQuestions = [
  'What is the difference between a survey number and a khasra number?',
  'What details should I check on a land record?',
  'What should I do if a land record contains an error?',
]

export default function Copilot() {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function ask(event) {
    event.preventDefault()
    const content = question.trim()
    if (!content || loading) return

    const turns = [
      ...messages.slice(-10).map(({ role, content: turnContent }) => ({ role, content: turnContent })),
      { role: 'user', content },
    ]
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/copilot/ask', { turns })
      setMessages([
        ...messages,
        { role: 'user', content },
        { role: 'model', content: response.data.answer },
      ])
      setQuestion('')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to reach the Copilot. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function startNewConversation() {
    setMessages([])
    setQuestion('')
    setError('')
  }

  return <Layout title="Land-record AI Copilot">
    <div className="dashboard-intro">
      <div>
        <p className="text-sm text-slate-500">Ask general questions about land records and record-keeping.</p>
        <p className="text-xs text-slate-400 mt-1">The Copilot cannot access or verify your personal records.</p>
      </div>
      {messages.length > 0 && <button type="button" onClick={startNewConversation} className="secondary-button">New conversation</button>}
    </div>

    <section className="panel max-w-4xl mx-auto">
      <div className="panel-heading">
        <div><h3>How can I help?</h3><p>Responses are informational and may need to be confirmed with your local land-records office.</p></div>
      </div>

      {messages.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          {suggestedQuestions.map((item) => (
            <button key={item} type="button" onClick={() => setQuestion(item)} className="rounded-lg border border-slate-200 p-4 text-left text-sm text-[#183755] hover:border-teal-500 hover:bg-teal-50">
              {item}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-6" aria-live="polite">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`max-w-[90%] rounded-xl p-4 ${message.role === 'user' ? 'ml-auto bg-[#e8f4f3] text-[#183755]' : 'bg-slate-50 text-slate-700'}`}>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{message.role === 'user' ? 'You' : 'BhuSutra Copilot'}</div>
              <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
            </div>
          ))}
          {loading && <p className="text-sm text-slate-400" role="status">BhuSutra Copilot is thinking...</p>}
        </div>
      )}

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

      <form onSubmit={ask} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="copilot-question">Your land-record question</label>
        <textarea
          id="copilot-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={4000}
          rows={2}
          className="field-input min-h-12 flex-1 resize-y"
          placeholder="Ask a land-record question..."
          required
        />
        <button type="submit" className="primary-button self-end" disabled={loading || !question.trim()}>
          {loading ? 'Asking...' : 'Ask Copilot'}
        </button>
      </form>
      <p className="mt-3 text-[11px] text-slate-400">Avoid entering sensitive personal or financial information. AI responses can be inaccurate and are not legal advice.</p>
    </section>
  </Layout>
}
