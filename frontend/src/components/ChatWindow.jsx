import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, ChevronDown, ChevronUp, Bot, User as UserIcon } from 'lucide-react'
import { sendChat } from '../utils/api.js'
import DataCard from './DataCard.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

const SUGGESTIONS = [
  'Show crime hotspots in Karnataka',
  'Which district has highest murder rate?',
  'Trend of theft cases 2016–2022',
  'Predict crime in Bengaluru for 2026',
  'Show victim profile for rape cases',
  'Compare top 10 districts by total FIRs',
  'Monthly crime pattern for Mysuru',
  'ಕರ್ನಾಟಕದಲ್ಲಿ ಅಪರಾಧ ಪ್ರದೇಶಗಳನ್ನು ತೋರಿಸಿ',
  'How does poverty correlate with crime?',
  'Conviction rate by district',
]

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em>$1</em>')
    .replace(/`(.+?)`/g,     '<code>$1</code>')
    .replace(/^> (.+)$/gm,   '<blockquote>$1</blockquote>')
    .replace(/\n\n/g,        '<br/><br/>')
    .replace(/\n/g,          '<br/>')
}

function AuditPanel({ audit }) {
  const [open, setOpen] = useState(false)
  if (!audit) return null
  return (
    <div>
      <div className="xai-toggle" onClick={() => setOpen(v => !v)}>
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        XAI Audit Trail — {audit.nlp_engine}
      </div>
      {open && (
        <div className="xai-panel">
          {JSON.stringify({ intent: audit.intent, filters: { districts: audit.districts, crime_types: audit.crime_types, years: audit.years }, engine: audit.nlp_engine, metadata: audit.metadata }, null, 2)}
        </div>
      )}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const conf   = msg.confidence
  const confClass = conf >= 0.85 ? 'conf-hi' : 'conf-lo'
  const confLabel = conf >= 0.85 ? `${Math.round(conf*100)}% Gemini` : `${Math.round(conf*100)}% Rules`

  return (
    <div className={`chat-row ${isUser ? 'is-user' : ''}`}>
      <div className={`chat-ava ${isUser ? 'chat-ava-user' : 'chat-ava-ai'}`}>
        {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
      </div>
      <div className="chat-bbl">
        <div className="chat-bbl-inner">
          <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />

          {msg.viz_type && msg.viz_type !== 'none' && msg.viz_data && (
            <div className="chat-data-embed">
              <div className="chat-data-embed-header">
                Data Visualization
              </div>
              <div className="chat-data-embed-body">
                <DataCard
                  vizType={msg.viz_type}
                  data={msg.viz_data}
                  totalRows={msg.total_records}
                  summary={msg.summary}
                />
              </div>
            </div>
          )}

          {!isUser && msg.sources?.length > 0 && (
            <div className="sources-row">
              {msg.sources.map(s => <span key={s} className="source-chip">{s}</span>)}
            </div>
          )}

          {!isUser && <AuditPanel audit={msg.audit} />}
        </div>

        <div className="chat-meta" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</span>
          {!isUser && conf && (
            <span className={`conf-pill ${confClass}`}>{confLabel}</span>
          )}
          {!isUser && msg.total_records != null && (
            <span>{msg.total_records.toLocaleString()} records</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatWindow() {
  const { user } = useAuth()
  const [messages,  setMessages]  = useState([
    {
      id: 0, role: 'ai',
      content: `**Welcome, ${user?.name || 'Officer'}.**\n\nI'm your CrimeIntel assistant — connected to **1,674,735 Karnataka FIR records** and supplemental NCRB datasets.\n\nAsk me anything in **English or Kannada** — crime hotspots, trends, victim profiles, predictions, or network analysis.`,
      timestamp: new Date().toISOString(),
    }
  ])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [showSugg,  setShowSugg]  = useState(true)
  const [listening, setListening] = useState(false)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  
  // Context memory: keep track of last 10 messages for backend
  const chatContext = useRef([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.")
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    // Optional: 'kn-IN' for Kannada
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error)
      setListening(false)
    }
    recognition.onend = () => setListening(false)

    recognition.start()
  }

  const sendMessage = useCallback(async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setShowSugg(false)

    const userMsg = { id: Date.now(), role: 'user', content: msg, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    chatContext.current.push({ role: 'user', content: msg })

    try {
      const { data } = await sendChat(msg, chatContext.current.slice(-10))
      const aiMsg = {
        id:            Date.now() + 1,
        role:          'ai',
        content:       data.message,
        viz_type:      data.viz_type,
        viz_data:      data.viz_data,
        total_records: data.total_records,
        confidence:    data.confidence,
        sources:       data.sources,
        audit:         data.audit,
        timestamp:     data.timestamp,
      }
      setMessages(prev => [...prev, aiMsg])
      chatContext.current.push({ role: 'ai', content: data.message })
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'ai',
        content: `**Connection Error**: Could not reach the backend API. Make sure the server is running on \`localhost:8000\`.\n\nError: ${err.message}`,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading])

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="chat-shell">
      {/* Messages */}
      <div className="chat-messages" id="chat-messages">
        {messages.map(m => <Message key={m.id} msg={m} />)}

        {loading && (
          <div className="chat-row">
            <div className="chat-ava chat-ava-ai"><Bot size={14} /></div>
            <div className="chat-bbl">
              <div className="chat-bbl-inner">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4, fontFamily:'var(--font-mono)' }}>
                  Querying 1.67M FIR records…
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-zone">
        {showSugg && (
          <div className="suggestion-row">
            {SUGGESTIONS.slice(0, 6).map(s => (
              <button key={s} className="sugg-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="input-row">
          <div className="input-wrap">
            <textarea
              id="chat-input"
              ref={inputRef}
              className="chat-textarea"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask in English or Kannada — e.g. 'Show murder hotspots in North Karnataka 2020'"
              disabled={loading}
            />
            <button
              className={`voice-btn ${listening ? 'listening' : ''}`}
              onClick={startVoiceInput}
              title="Voice Input"
              type="button"
            >
              <Mic size={16} />
            </button>
          </div>
          <button
            id="send-btn"
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            {loading ? <div className="spinner spinner-sm" /> : <Send size={16} />}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button onClick={() => window.print()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
            Export Conversation as PDF
          </button>
        </div>

        <div className="input-hint">
          <span>↵ Send</span>
          <span className="hint-sep">|</span>
          <span>Shift+↵ New line</span>
          <span className="hint-sep">|</span>
          <span>Supports English + Kannada queries</span>
          <span className="hint-sep">|</span>
          <span className="mono">Data: SCRB Karnataka (live)</span>
        </div>
      </div>
    </div>
  )
}
