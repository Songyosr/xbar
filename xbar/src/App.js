import './App.css';

function App() {
  return (
    <main className="app-shell" style={{ background: 'var(--bg-primary)' }}>
      <div className="container">
        <section className="section">
          <div className="speakeasy-card">
            <h1 className="app-title"><span style={{color:'var(--navy)'}}>[</span>xbar<span style={{color:'var(--orange)'}}>] </span><span aria-hidden className="cursor" style={{display:'inline-block',width:'0.6ch',height:'1em',background:'var(--ink)',marginLeft:'0.25ch',verticalAlign:'-0.1em',animation:'blink 1.15s steps(1) infinite'}} /></h1>
            <p className="app-desc">Minimal, high-contrast UI primitives for applets. Stay focused on the stats.</p>
            <div className="cta">
              <a className="btn btn-primary" href="/">Explore Applets</a>
              <a className="btn btn-secondary" href="https://github.com/Songyosr/xbar" target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
