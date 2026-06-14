import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // <-- ADD THIS LINE
import './App.css';

function App() {
  const [desks, setDesks] = useState(
    Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      status: 'Free',
      studentName: '',
      minutesElapsed: 0,
    }))
  );

  const [currentView, setCurrentView] = useState('student');
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [promptingDesk, setPromptingDesk] = useState(null);
  const [promptCountdown, setPromptCountdown] = useState(30);
  const [inputName, setInputName] = useState('');
  
  // New Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');

  const totalFree = desks.filter(d => d.status === 'Free').length;
  const totalOccupied = desks.filter(d => d.status === 'Occupied').length;
  const totalAway = desks.filter(d => d.status === 'Away').length;

  useEffect(() => {
    const cronSweep = setInterval(() => {
      setDesks((prevDesks) =>
        prevDesks.map((desk) => {
          if (desk.status === 'Free') return desk;
          const updatedMinutes = desk.minutesElapsed + 1;

          if (desk.status === 'Away' && updatedMinutes > 20) {
            return { id: desk.id, status: 'Free', studentName: '', minutesElapsed: 0 };
          }

          if (desk.status === 'Occupied' && updatedMinutes >= 120 && !promptingDesk) {
            setPromptingDesk(desk);
            setPromptCountdown(30);
          }

          return { ...desk, minutesElapsed: updatedMinutes };
        })
      );
    }, 30000);

    return () => clearInterval(cronSweep);
  }, [promptingDesk]);

  useEffect(() => {
    let countdownInterval;
    if (promptingDesk) {
      countdownInterval = setInterval(() => {
        setPromptCountdown((prev) => {
          if (prev <= 1) {
            setDesks((prevDesks) =>
              prevDesks.map((d) =>
                d.id === promptingDesk.id
                  ? { id: d.id, status: 'Free', studentName: '', minutesElapsed: 0 }
                  : d
              )
            );
            setPromptingDesk(null);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [promptingDesk]);

  const handleDeskClick = (desk) => {
    setSelectedDesk(desk);
    setInputName(desk.status === 'Occupied' ? desk.studentName : '');
  };

  const handleCheckIn = (e) => {
    if (e) e.preventDefault();
    let nameToUse = inputName.trim() || selectedDesk?.studentName;
    if (!nameToUse) return alert("Please specify a student identifier.");

    setDesks((prev) =>
      prev.map((d) => (d.id === selectedDesk.id ? { ...d, status: 'Occupied', studentName: nameToUse, minutesElapsed: 0 } : d))
    );
    setInputName('');
    setSelectedDesk(null);
  };

  const handleGoAway = () => {
    setDesks((prev) =>
      prev.map((d) => (d.id === selectedDesk.id ? { ...d, status: 'Away', minutesElapsed: 0 } : d))
    );
    setSelectedDesk(null);
  };

  const handleCheckout = () => {
    setDesks((prev) =>
      prev.map((d) => (d.id === selectedDesk.id ? { id: d.id, status: 'Free', studentName: '', minutesElapsed: 0 } : d))
    );
    setSelectedDesk(null);
  };

  const handleConfirmStillHere = () => {
    setDesks((prev) =>
      prev.map((d) => (d.id === promptingDesk.id ? { ...d, minutesElapsed: 0 } : d))
    );
    setPromptingDesk(null);
  };

  const forceFreeDesk = (deskId) => {
    setDesks((prev) =>
      prev.map((d) => (d.id === deskId ? { id: d.id, status: 'Free', studentName: '', minutesElapsed: 0 } : d))
    );
  };

  const forceTwoHoursOccupied = (deskId) => {
    setDesks((prev) =>
      prev.map((d) => (d.id === deskId ? { ...d, status: 'Occupied', studentName: d.studentName || 'Alex Mercer', minutesElapsed: 120 } : d))
    );
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!authEmail.trim()) return;
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthEmail('');
  };

  return (
    <div className="pastel-glass-wrapper">
      <div className="holo-orb orb-1"></div>
      <div className="holo-orb orb-2"></div>
      <div className="holo-orb orb-3"></div>
      <div className="glass-ribbon"></div>

      {/* NEW: PREMIUM FROSTED NAVBAR */}
      <nav className="glass-navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-dot"></span>
            Desk<span className="metallic-text">Guard</span>
          </div>
          
          <div className="nav-links">
            <span className="nav-system-status">
              <span className="pulse-indicator"></span> Operational Node
            </span>
            <div className="nav-divider"></div>
            
            {isLoggedIn ? (
              <div className="user-profile-menu">
                <span className="user-badge">{authEmail.split('@')[0]}</span>
                <button onClick={handleLogout} className="btn-nav-auth logout">Sign Out</button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="btn-nav-auth login">
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="app-container">
        <header className="glass-header">
          <div className="header-meta">ROOM ALLOCATION NETWORK</div>
          <h1>The Grand Reading Room</h1>
          <p className="subtitle">High-Density Space Optimization & Active Monitoring</p>

          <div className="view-toggle-container">
            <button 
              className={`toggle-btn ${currentView === 'student' ? 'active' : ''}`}
              onClick={() => setCurrentView('student')}
            >
              Workspace Map
            </button>
            <button 
              className={`toggle-btn ${currentView === 'librarian' ? 'active' : ''}`}
              onClick={() => setCurrentView('librarian')}
            >
              Control Ledger
            </button>
          </div>
        </header>

        {/* STUDENT MATRIX VIEW */}
        {currentView === 'student' && (
          <main className="grid-container">
            {desks.map((desk) => (
              <div key={desk.id} className="desk-wrapper">
                <button
                  onClick={() => handleDeskClick(desk)}
                  className={`glass-desk-card ${desk.status.toLowerCase()}`}
                >
                  <div className="card-shimmer"></div>
                  <span className="seat-id">UNIT {String(desk.id).padStart(2, '0')}</span>
                  
                  <div className="status-indicator-ring">
                    <span className="dot"></span>
                  </div>

                  <span className="status-label">{desk.status}</span>
                  
                  {desk.status !== 'Free' && (
                    <div className="occupant-tray">
                      <span className="occupant-name">{desk.studentName}</span>
                      <span className="occupant-timer">{desk.minutesElapsed}m filled</span>
                    </div>
                  )}
                </button>
                <span className="test-trigger" onClick={() => forceTwoHoursOccupied(desk.id)}>
                  [Trigger 2hr Expiry]
                </span>
              </div>
            ))}
          </main>
        )}

        {/* ADMINISTRATIVE LEDGER VIEW */}
{currentView === 'librarian' && (
  <main className="librarian-panel">
    {/* ... keeps your existing stats-grid here ... */}

    <div className="table-container-glass">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Node Target</th>
            <th>Current Allocation</th>
            <th>Student ID Vector</th>
            <th>Session Log</th>
            <th>QR Code Vector</th> {/* <-- ADDED COLUMN HEADER */}
            <th>System Controls</th>
          </tr>
        </thead>
        <tbody>
          {desks.map((desk) => (
            <tr key={desk.id} className={`table-row-${desk.status.toLowerCase()}`}>
              <td className="font-medium">Unit {desk.id}</td>
              <td>
                <span className={`status-pill pill-${desk.status.toLowerCase()}`}>
                  {desk.status}
                </span>
              </td>
              <td className="text-dim">{desk.studentName || '• None •'}</td>
              <td className="font-mono">{desk.status !== 'Free' ? `${desk.minutesElapsed} min` : '—'}</td>
              
              {/* NEW: THIS TD GENERATES A PERFECT DIGITAL QR CODE FOR EACH DESK */}
              <td>
                <div className="qr-container-cell">
                  <QRCodeSVG 
                    value={`http://localhost:5173/?deskId=${desk.id}`} 
                    size={50} /* Small enough to fit perfectly inside a table row */
                    bgColor={"transparent"}
                    fgColor={"#1e293b"} /* Matches your deep charcoal slate theme color */
                    level={"M"}
                  />
                </div>
              </td>

              <td>
                {desk.status !== 'Free' ? (
                  <button 
                    onClick={() => forceFreeDesk(desk.id)} 
                    className="action-btn-override"
                  >
                    Purge State
                  </button>
                ) : (
                  <span className="action-disabled">Vacant</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </main>
)}

        {/* REGISTRATION MODAL */}
        {selectedDesk && (
          <div className="modal-overlay" onClick={() => setSelectedDesk(null)}>
            <div className="modal-content glass-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-top-metallic"></div>
              <h3>Node Allocation: Unit {selectedDesk.id}</h3>
              <p className="modal-subtitle">Current Node Status: <span className="status-highlight">{selectedDesk.status}</span></p>

              {selectedDesk.status === 'Free' && (
                <form onSubmit={handleCheckIn} className="modal-form">
                  <label className="input-label">Student Authentication ID</label>
                  <input
                    type="text"
                    placeholder="Enter full name or student ID"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-checkin">Confirm Session Authorization</button>
                </form>
              )}

              {selectedDesk.status === 'Occupied' && (
                <div className="modal-actions">
                  <p className="user-info">Verified Holder: <strong>{selectedDesk.studentName}</strong></p>
                  <button onClick={handleGoAway} className="btn btn-away">Log Temporary Break</button>
                  <button onClick={handleCheckout} className="btn btn-checkout">Force Manual Release</button>
                </div>
              )}

              {selectedDesk.status === 'Away' && (
                <div className="modal-actions">
                  <p className="user-info">Break Duration Logged: <strong>{selectedDesk.minutesElapsed} mins</strong></p>
                  <button onClick={handleCheckIn} className="btn btn-checkin">Resume Active Station</button>
                  <button onClick={handleCheckout} className="btn btn-checkout">Force Manual Release</button>
                </div>
              )}
              <button className="btn-close" onClick={() => setSelectedDesk(null)}>Discard Window</button>
            </div>
          </div>
        )}

        {/* AUTHENTICATION PORTAL OVERLAY */}
        {showAuthModal && (
          <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="modal-content glass-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-top-metallic"></div>
              <h3>Account Portal</h3>
              <p className="modal-subtitle">Synchronize dashboard metrics with cloud servers.</p>
              
              <form onSubmit={handleAuthSubmit} className="modal-form">
                <label className="input-label">Administrator/Student Email</label>
                <input 
                  type="email" 
                  placeholder="name@university.edu" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
                <label className="input-label">Security Credentials</label>
                <input type="password" placeholder="••••••••" required />
                
                <button type="submit" className="btn btn-checkin">Establish Connection</button>
              </form>
              <button className="btn-close" onClick={() => setShowAuthModal(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* CRON THRESHOLD WARNING DIALOG */}
        {promptingDesk && (
          <div className="modal-overlay alert-mode">
            <div className="modal-content glass-modal dynamic-alert">
              <div className="warning-pill">CRON AUDIT TIMEOUT INTERCEPT</div>
              <h3>Confirm Occupancy at Unit {promptingDesk.id}</h3>
              <p className="prompt-desc">
                Continuous 2-hour occupancy limit hit. Please acknowledge active status to prevent database record garbage collection sweep.
              </p>
              <div className="countdown-display">
                Automated Release Sequence in: <span className="seconds-counter">{promptCountdown}s</span>
              </div>
              <button onClick={handleConfirmStillHere} className="btn btn-checkin text-bold">
                Acknowledge Session Presence
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;