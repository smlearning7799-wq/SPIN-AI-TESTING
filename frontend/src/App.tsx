import { useState, useEffect } from 'react';
import './index.css';

const API_BASE = '';

interface Issue {
  key: string;
  summary: string;
  type: string;
  status: string;
}

interface Status {
  msg: string;
  type: string;
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentStep, setCurrentStep] = useState(1);
  
  // Connectors State
  const [llmProvider, setLlmProvider] = useState('ollama');
  const [llmUrlOrKey, setLlmUrlOrKey] = useState('');
  const [llmStatus, setLlmStatus] = useState<Status>({ msg: '', type: '' });
  const [llmConnected, setLlmConnected] = useState(false);

  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [jiraStatus, setJiraStatus] = useState<Status>({ msg: '', type: '' });
  const [jiraConnected, setJiraConnected] = useState(false);

  // Fetch Issues State
  const [projectKey, setProjectKey] = useState('');
  const [jiraIssues, setJiraIssues] = useState<Issue[]>([]);
  const [fetchStatus, setFetchStatus] = useState<Status>({ msg: '', type: '' });

  // Test Plan Generation State
  const [testPlan, setTestPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const testLlmConnection = async () => {
    setLlmStatus({ msg: 'Testing LLM connection...', type: 'text-muted' });
    try {
      const res = await fetch(`${API_BASE}/api/test-llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: llmProvider, 
          url_or_key: llmUrlOrKey || 'http://localhost:11434' 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLlmStatus({ msg: data.message, type: 'text-success' });
        setLlmConnected(true);
      } else {
        setLlmStatus({ msg: data.detail || 'Connection failed', type: 'text-danger' });
      }
    } catch {
      setLlmStatus({ msg: 'Server not reachable', type: 'text-danger' });
    }
  };

  const testJiraConnection = async () => {
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      setJiraStatus({ msg: 'Please fill all Jira fields', type: 'text-danger' });
      return;
    }
    setJiraStatus({ msg: 'Testing Jira connection...', type: 'text-muted' });
    try {
      const res = await fetch(`${API_BASE}/api/test-jira`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jiraUrl, email: jiraEmail, token: jiraToken })
      });
      const data = await res.json();
      if (res.ok) {
        setJiraStatus({ msg: data.message, type: 'text-success' });
        setJiraConnected(true);
      } else {
        setJiraStatus({ msg: data.detail || 'Authentication failed', type: 'text-danger' });
      }
    } catch {
      setJiraStatus({ msg: 'Server not reachable', type: 'text-danger' });
    }
  };

  const fetchJiraIssues = async () => {
    if (!projectKey) {
      setFetchStatus({ msg: 'Please provide a Project Key', type: 'text-danger' });
      return;
    }
    setFetchStatus({ msg: 'Fetching issues from Jira...', type: 'text-muted' });
    try {
      const res = await fetch(`${API_BASE}/api/fetch-jira`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           url: jiraUrl, 
           email: jiraEmail, 
           token: jiraToken,
           project_key: projectKey
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFetchStatus({ msg: data.message, type: 'text-success' });
        setJiraIssues(data.issues || []);
        setCurrentStep(3); // Auto-advance to review on success
      } else {
        setFetchStatus({ msg: data.detail || 'Fetch failed', type: 'text-danger' });
      }
    } catch {
      setFetchStatus({ msg: 'Server not reachable', type: 'text-danger' });
    }
  };

  const generateTestPlan = async () => {
    setIsGenerating(true);
    setGenerationError('');
    setCurrentStep(4);
    
    try {
      const res = await fetch(`${API_BASE}/api/generate-test-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           provider: llmProvider, 
           url_or_key: llmUrlOrKey || (llmProvider === 'ollama' ? 'http://localhost:11434' : ''),
           issues: jiraIssues
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestPlan(data.test_plan);
      } else {
        setGenerationError(data.detail || 'Generation failed');
      }
    } catch {
      setGenerationError('Server not reachable');
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">TB</div>
          <div className="logo-text">
            <h2>TestingBuddy AI</h2>
            <p>Testing Platform</p>
          </div>
        </div>
        
        <div className="nav-group">
          <h3 className="nav-title">Main</h3>
          <ul className="nav-links">
            <li className="active"><i className="fas fa-home"></i> Dashboard</li>
            <li><i className="fas fa-cog"></i> Settings</li>
          </ul>
        </div>
        
        <div className="nav-group">
          <h3 className="nav-title">PLANNING & STRATEGY</h3>
          <ul className="nav-links">
            <li className="active-sub"><i className="fas fa-bullseye"></i> Intelligent Test Planning...</li>
          </ul>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="main-content">
        <div className="top-bar">
          <button onClick={toggleTheme} className="btn-icon">
            <i className={theme === 'light' ? "fas fa-moon" : "fas fa-sun"}></i>
          </button>
        </div>
        
        <header className="page-header">
          <div className="header-title">
            <div className="header-icon"><i className="fas fa-bullseye"></i></div>
            <div>
              <h1>Intelligent Test Planning Agent</h1>
              <p>Generate comprehensive test plans from Jira requirements using AI</p>
            </div>
          </div>
          <button className="btn btn-outline"><i className="fas fa-history"></i> View History</button>
        </header>
        
        {/* Stepper */}
        <div className="stepper">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`step ${currentStep === step ? 'active' : ''}`}>
              {step}. {step === 1 ? 'Setup' : step === 2 ? 'Fetch Issues' : step === 3 ? 'Review' : 'Test Plan'}
            </div>
          ))}
        </div>
        
        {/* Step 1: Setup */}
        {currentStep === 1 && (
          <div className="step-content active">
            <div className="card">
              <h2>LLM Connection</h2>
              <p className="text-muted">Connect your Intelligence Provider (Ollama, Groq, Grok)</p>
              
              <div className="form-group">
                <label>Provider</label>
                <select className="form-control" value={llmProvider} onChange={e => setLlmProvider(e.target.value)}>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="groq">Groq (Cloud)</option>
                  <option value="grok">Grok (xAI Cloud)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>{llmProvider === 'ollama' ? 'Ollama URL (e.g., http://localhost:11434)' : `${llmProvider.toUpperCase()} API Key`}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={llmProvider === 'ollama' ? "http://localhost:11434" : "gsk_..."}
                  value={llmUrlOrKey}
                  onChange={e => setLlmUrlOrKey(e.target.value)}
                />
              </div>
              
              <button onClick={testLlmConnection} className="btn btn-outline"><i className="fas fa-plug"></i> Test Connection</button>
              {llmStatus.msg && <div className={`status-msg ${llmStatus.type}`}><i className={llmStatus.type === 'text-success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i> {llmStatus.msg}</div>}
            </div>

            <div className="card mt-2">
              <h2>Jira Connection</h2>
              <p className="text-muted">Connect to your Jira instance to fetch requirements</p>
              
              <div className="form-group">
                <label>Connection Name</label>
                <input type="text" className="form-control" placeholder="e.g., VWO Production" />
              </div>
              
              <div className="form-group">
                <label>Jira URL</label>
                <input type="text" className="form-control" placeholder="https://yourcompany.atlassian.net" value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} />
              </div>
              
              <div className="form-group">
                <label>Jira Email</label>
                <input type="email" className="form-control" placeholder="you@company.com" value={jiraEmail} onChange={e => setJiraEmail(e.target.value)} />
              </div>
              
              <div className="form-group">
                <label>API Token</label>
                <input type="password" className="form-control" placeholder="........." value={jiraToken} onChange={e => setJiraToken(e.target.value)} />
                <small className="text-muted-sm">Generate at: https://id.atlassian.com/manage-profile/security/api-tokens</small>
              </div>
              
              <div className="action-buttons">
                <button onClick={testJiraConnection} className="btn btn-outline"><i className="fas fa-vial"></i> Test Connection</button>
                <button onClick={() => setCurrentStep(2)} className="btn btn-primary" disabled={!(llmConnected && jiraConnected)}>Save & Continue To Fetch</button>
              </div>
              {jiraStatus.msg && <div className={`status-msg ${jiraStatus.type}`}><i className={jiraStatus.type === 'text-success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i> {jiraStatus.msg}</div>}
            </div>
          </div>
        )}

        {/* Step 2: Fetch Issues */}
        {currentStep === 2 && (
          <div className="step-content active">
            <div className="card">
              <h2>Fetch Jira Requirements</h2>
              <p className="text-muted">Enter project details to fetch user stories and requirements</p>
              <div className="form-group">
                <label>Project Key</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g., VWOAPP" 
                  value={projectKey}
                  onChange={e => setProjectKey(e.target.value)}
                />
              </div>
              <div className="action-buttons">
                 <button onClick={() => setCurrentStep(1)} className="btn btn-outline">Back</button>
                 <button onClick={fetchJiraIssues} className="btn btn-primary">Fetch Issues</button>
              </div>
              {fetchStatus.msg && <div className={`status-msg ${fetchStatus.type}`}><i className={fetchStatus.type === 'text-success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i> {fetchStatus.msg}</div>}
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="step-content active">
            <div className="card">
              <h2>Review Jira Issues ({jiraIssues.length})</h2>
              <p className="text-muted">Issues that will be used to generate the test plan</p>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '15px', marginBottom: '15px', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px' }}>
                {jiraIssues.length === 0 ? (
                   <p className="text-muted" style={{ textAlign: 'center', margin: '20px 0' }}>No issues fetched yet.</p>
                ) : (
                   <ul style={{ listStyle: 'none' }}>
                     {jiraIssues.map((issue, idx) => (
                       <li key={idx} style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                         <strong>{issue.key}</strong> - {issue.type} ({issue.status})<br/>
                         <span className="text-muted">{issue.summary}</span>
                       </li>
                     ))}
                   </ul>
                )}
              </div>

              <div className="action-buttons">
                 <button onClick={() => setCurrentStep(2)} className="btn btn-outline">Back</button>
                 <button onClick={generateTestPlan} className="btn btn-primary" disabled={jiraIssues.length === 0}>Generate Test Plan</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Output */}
        {currentStep === 4 && (
          <div className="step-content active">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2><i className="fas fa-file-alt"></i> Generated Test Plan</h2>
                {testPlan && <button className="btn btn-outline btn-sm" onClick={() => {
                  // Add UTF-8 BOM (\uFEFF) to ensure Excel and Notepad recognize it correctly on Windows
                  const blob = new Blob(["\uFEFF", testPlan], { type: 'text/markdown;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  const safeProjectKey = projectKey.replace(/[^a-z0-9]/gi, '_') || 'Project';
                  a.href = url;
                  a.download = `TestPlan_${safeProjectKey}.md`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}>Download MD</button>}
              </div>

              {isGenerating ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="status-msg text-muted" style={{ display: 'block' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                    <p>AI is analyzing {jiraIssues.length} issues and crafting your plan...</p>
                  </div>
                </div>
              ) : generationError ? (
                <div className="status-msg text-danger">
                  <i className="fas fa-exclamation-circle"></i> {generationError}
                  <button onClick={generateTestPlan} className="btn btn-outline btn-sm mt-1">Try Again</button>
                </div>
              ) : (
                <div className="test-plan-viewer">
                  {testPlan || "No test plan generated yet."}
                </div>
              )}
              
              <div className="action-buttons mt-2">
                 <button onClick={() => setCurrentStep(3)} className="btn btn-outline">Back to Review</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
