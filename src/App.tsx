import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'

const domains = ['Product research', 'Personal finance', 'Learning notes']
const THEME_KEY = 'second-brain-theme'
type Theme = 'light' | 'dark'

type ActivityEntry = {
  subject: string
  domain: string
  addedAt: string
  isNew: boolean
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [selectedDomain, setSelectedDomain] = useState(domains[0])
  const [isConnected, setIsConnected] = useState(false)
  const [folderPath, setFolderPath] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))

  const chooseFolder = async () => {
    if (window.desktop?.selectFolder) {
      const selectedFolder = await window.desktop.selectFolder()
      if (selectedFolder) setFolderPath(selectedFolder)
      return
    }

    folderInputRef.current?.setAttribute('webkitdirectory', '')
    folderInputRef.current?.click()
  }

  const handleBrowserFolder = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) setFolderPath(selectedFile.webkitRelativePath.split('/')[0])
  }

  const createDomain = () => {
    const domain = window.prompt('What should this collection be called?')?.trim()
    if (domain) setSelectedDomain(domain)
  }

  const importDomain = async () => {
    if (!folderPath) {
      setSyncMessage('Choose a folder first.')
      return
    }
    if (!window.desktop?.syncGmailDomain) {
      setSyncMessage(`Ready to import "${selectedDomain}" messages.`)
      return
    }

    setSyncMessage('Searching only for messages in this domain...')
    setIsSyncing(true)
    try {
      const result = await window.desktop.syncGmailDomain(selectedDomain, folderPath)
      const addedAt = new Date().toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
      const newEntries: ActivityEntry[] = result.items.map((item) => ({
        subject: item.subject,
        domain: selectedDomain,
        addedAt,
        isNew: item.isNew,
      }))
      setActivity((previous) => [...newEntries, ...previous])

      const parts: string[] = []
      if (result.imported) parts.push(`${result.imported} new message${result.imported === 1 ? '' : 's'} saved`)
      if (result.skipped) parts.push(`${result.skipped} already in your vault`)
      setSyncMessage(parts.length ? `${parts.join(', ')}.` : 'No matching messages found.')
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'The domain import failed.')
    } finally {
      setIsSyncing(false)
    }
  }

  const connectGmail = async () => {
    if (!window.desktop?.authenticateGmail) {
      setIsConnected(true)
      return
    }

    setAuthError('')
    setIsAuthenticating(true)
    try {
      const result = await window.desktop.authenticateGmail()
      setIsConnected(result.connected)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Gmail authentication failed.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const themeToggle = (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? '●' : '○'}
    </button>
  )

  if (!isConnected) {
    return (
      <main className="onboarding-shell">
        <div className="onboarding-brand">
          <span><span className="brand-mark">✦</span> Second Brain</span>
          {themeToggle}
        </div>
        <section className="onboarding-panel" aria-labelledby="onboarding-title">
          <div className="welcome-mark">✦</div>
          <p className="section-kicker">YOUR PRIVATE KNOWLEDGE SPACE</p>
          <h1 id="onboarding-title">Give your inbox a second brain.</h1>
          <p className="onboarding-copy">Bring the useful parts of Gmail into a local vault you control. Start with one connection. We’ll guide you from there.</p>
          <button className="primary-button onboarding-button" type="button" onClick={connectGmail} disabled={isAuthenticating}>{isAuthenticating ? 'Waiting for Google...' : 'Connect Gmail'} <span>↗</span></button>
          {authError && <p className="auth-error" role="alert"><span aria-hidden="true">⚠ </span>{authError}</p>}
          <div className="trust-row"><span>⌁</span><span>Read-only access</span><i /><span>Stored on this device</span><i /><span>Revoke anytime</span></div>
        </section>
        <p className="onboarding-footer">You choose what to import. Nothing is uploaded without your say-so.</p>
      </main>
    )
  }

  const todayLabel = new Date()
    .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span> Second Brain</div>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav>
          <button className="nav-item active" type="button"><span>⌂</span> Overview</button>
          <button className="nav-item" type="button"><span>◌</span> Sources <b>{activity.length}</b></button>
          <button className="nav-item" type="button"><span>▤</span> Collections</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="storage-title"><span>LOCAL VAULT</span><strong>{activity.length} item{activity.length === 1 ? '' : 's'}</strong></div>
          <p>Saved this session to your chosen folder.</p>
          <button className="theme-toggle sidebar-theme-toggle" type="button" onClick={toggleTheme}>
            {theme === 'light' ? '● Dark mode' : '○ Light mode'}
          </button>
          <button className="settings" type="button"><span>⚙</span> Settings</button>
          <div className="profile"><div className="avatar">SB</div><div><strong>Local workspace</strong><small>Not connected to any account name</small></div></div>
        </div>
      </aside>
      <section className="content">
        <header className="topbar"><div><span className="eyebrow">{todayLabel}</span><h1>{greeting} <span>✦</span></h1></div><button className="help-button" type="button">? <span>Help center</span></button></header>
        <div className="welcome-row"><div><p className="section-kicker">YOUR KNOWLEDGE BASE</p><h2>A clearer mind starts here.</h2><p className="subcopy">Bring the useful parts of your inbox into a space that stays yours.</p></div><div className="sync-status"><span className="status-dot" /> Local vault ready <span className="divider" /> <strong>Ready to import</strong></div></div>
        <section className="setup-grid">
          <article className="setup-card domain-card"><div className="card-heading"><span className="step-number">01</span><span className="card-status">FOCUS YOUR IMPORT</span></div><div className="card-icon domain-icon">⌁</div><h3>What matters to you?</h3><p>Only matching messages will be imported. Nothing else from Gmail is copied.</p><div className="domain-select">{domains.map((domain) => <button key={domain} className={selectedDomain === domain ? 'domain-option selected' : 'domain-option'} type="button" onClick={() => setSelectedDomain(domain)}><span className="option-dot" />{domain}{selectedDomain === domain && <span>✓</span>}</button>)}</div><button className="text-button" type="button" onClick={createDomain}>+ Create a new domain</button></article>
          <article className="setup-card folder-card"><div className="card-heading"><span className="step-number">02</span><span className="card-status">REQUIRED TO IMPORT</span></div><div className="card-icon folder-icon">↳</div><h3>Choose your vault folder</h3><p>Your selected messages will be saved here as portable Markdown files.</p><div className="folder-path"><span>▱</span><div><small>Current folder</small><strong>{folderPath || 'No folder selected'}</strong></div><button type="button" aria-label="Change folder" onClick={chooseFolder}>•••</button></div><button className="text-button" type="button" onClick={chooseFolder}>{folderPath ? 'Change folder' : 'Choose a folder'} <span>→</span></button><button className="primary-button import-button" type="button" onClick={importDomain} disabled={isSyncing || !folderPath}>{isSyncing ? 'Importing...' : 'Import selected domain'} <span>→</span></button>{syncMessage && <small className="sync-message" role="status">{syncMessage}</small>}<input ref={folderInputRef} className="hidden-folder-input" type="file" multiple onChange={handleBrowserFolder} /></article>
        </section>
        <section className="activity-section">
          <div className="section-header"><div><p className="section-kicker">RECENT ACTIVITY</p><h2>What’s in your vault</h2></div></div>
          {activity.length === 0 ? (
            <p className="empty-activity">Nothing imported yet. Run an import above to see your saved messages here.</p>
          ) : (
            <div className="activity-table">
              <div className="table-head"><span>ITEM</span><span>DOMAIN</span><span>ADDED</span><span>STATUS</span></div>
              {activity.map((entry, index) => (
                <div className="activity-row" key={`${entry.subject}-${index}`}>
                  <span className="item-name"><i className="mail-symbol">✉</i><strong>{entry.subject}</strong></span>
                  <span><em className="tag">{entry.domain}</em></span>
                  <span>{entry.addedAt}</span>
                  <span className="file-type">{entry.isNew ? 'New' : 'Already saved'}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <footer><span><i className="status-dot" /> Everything is stored on this device</span><span>v0.1.0 <span className="footer-separator">·</span> Privacy first, always</span></footer>
      </section>
    </main>
  )
}

export default App
