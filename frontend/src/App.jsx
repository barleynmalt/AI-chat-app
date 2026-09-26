import React, { useState, useEffect, useRef } from 'react'
import {
  AppBar,
  Toolbar as MuiToolbar,
  Typography,
  Box,
  Alert,
  LinearProgress,
  CssBaseline,
  Paper,
  TextField,
  IconButton,
  Button,
  Tooltip
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const API_BASE = 'http://localhost:8000'

/** Renders a fenced code block with syntax highlighting and a copy button. */
function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false)
  const code = String(children).trimEnd()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Box sx={{ position: 'relative', my: 1 }}>
      {/* language label + copy button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#2d2d2d',
          px: 2,
          py: 0.5,
          borderRadius: '6px 6px 0 0',
        }}
      >
        <Typography variant="caption" sx={{ color: '#aaa', fontFamily: 'monospace' }}>
          {language || 'text'}
        </Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{ color: copied ? 'success.light' : '#aaa' }}
          >
            {copied
              ? <CheckIcon sx={{ fontSize: 14 }} />
              : <ContentCopyIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: '0 0 6px 6px' }}
        showLineNumbers={!!language}
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  )
}

/** Custom renderers passed to react-markdown. */
const markdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const language = (className ?? '').replace('language-', '') || null
    if (inline) {
      return (
        <Box
          component="code"
          sx={{
            backgroundColor: 'grey.200',
            px: 0.5,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875em',
          }}
          {...props}
        >
          {children}
        </Box>
      )
    }
    return <CodeBlock language={language}>{children}</CodeBlock>
  },
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      const el = document.createElement('textarea')
      el.value = content
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
      }}
    >
      <Box sx={{ maxWidth: '85%', position: 'relative' }}>
        <Paper
          elevation={1}
          sx={{
            px: 2,
            py: 1.5,
            backgroundColor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: isUser
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
          }}
        >
          {isUser ? (
            <Typography
              variant="body1"
              component="pre"
              sx={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0 }}
            >
              {content}
            </Typography>
          ) : (
            <Box
              sx={{
                // Tighten default markdown margins so they fit the bubble
                '& p': { mt: 0, mb: 1, '&:last-child': { mb: 0 } },
                '& ul, & ol': { mt: 0, mb: 1, pl: 2.5 },
                '& li': { mb: 0.25 },
                '& h1, & h2, & h3, & h4': { mt: 1, mb: 0.5 },
                '& pre': { m: 0 },
              }}
            >
              <Markdown components={markdownComponents}>{content}</Markdown>
            </Box>
          )}
        </Paper>

        {!isUser && (
          <Tooltip title={copied ? 'Copied!' : 'Copy all'}>
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                color: copied ? 'success.main' : 'text.disabled',
                backgroundColor: 'background.paper',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'grey.200' },
                width: 24,
                height: 24,
              }}
            >
              {copied
                ? <CheckIcon sx={{ fontSize: 14 }} />
                : <ContentCopyIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

export default function App() {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', content: string }
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      let sid = localStorage.getItem('session_id')
      if (!sid) {
        try {
          const res = await fetch(`${API_BASE}/session`, { method: 'POST' })
          if (!res.ok) throw new Error('Failed to create session')
          const data = await res.json()
          sid = data.session_id
          localStorage.setItem('session_id', sid)
        } catch (err) {
          setError('Could not connect to backend: ' + err.message)
          return
        }
      }
      setSessionId(sid)
    }
    initSession()
  }, [])

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const text = input.trim()
    if (!sessionId || !text || loading) return

    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, prompt: text }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `Server error ${res.status}`)
      }
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError('Request failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    // Send on Enter; allow Shift+Enter for newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewSession = async () => {
    setError(null)
    try {
      if (sessionId) {
        await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' })
      }
      const res = await fetch(`${API_BASE}/session`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create session')
      const data = await res.json()
      localStorage.setItem('session_id', data.session_id)
      setSessionId(data.session_id)
      setMessages([])
      setInput('')
    } catch (err) {
      setError('Failed to start new session: ' + err.message)
    }
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Top AppBar */}
        <AppBar position="static">
          <MuiToolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6">Chat</Typography>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              onClick={handleNewSession}
            >
              New Chat
            </Button>
          </MuiToolbar>
        </AppBar>

        {loading && <LinearProgress />}

        {/* Message list */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 2, sm: 4, md: 8, lg: 16 },
            py: 2,
          }}
        >
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {messages.length === 0 && !loading && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.disabled',
              }}
            >
              <Typography variant="h6">How can I help you?</Typography>
            </Box>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} role={msg.role} content={msg.content} />
          ))}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
              <Paper
                elevation={1}
                sx={{
                  px: 2,
                  py: 1,
                  backgroundColor: 'grey.100',
                  borderRadius: '18px 18px 18px 4px',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Thinking…
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={bottomRef} />
        </Box>

        {/* Input area */}
        <Box
          component="form"
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          sx={{
            px: { xs: 2, sm: 4, md: 8, lg: 16 },
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
            backgroundColor: 'background.paper',
          }}
        >
          <TextField
            multiline
            maxRows={8}
            fullWidth
            placeholder="Message… (Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            size="small"
          />
          <Tooltip title="Send (Enter)">
            <span>
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </>
  )
}
