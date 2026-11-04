export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__mark" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="rgba(99,179,237,0.35)" strokeWidth="1.3" fill="none" />
          <path d="M4.5 8L7 10.5L11.5 5.5" stroke="rgba(99,179,237,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div className="footer__name">AMET University</div>
        <div className="footer__meta">Cybersecurity Capstone Project · 2024</div>
      </div>
      <div className="footer__ver">v1.0.0</div>
    </footer>
  );
}
