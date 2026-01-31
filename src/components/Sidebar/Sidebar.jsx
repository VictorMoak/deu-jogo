import styles from './Sidebar.module.css'

export function Sidebar({ onManagePlayers, isOpen, onToggle }) {
  const handleManagePlayers = () => {
    onManagePlayers()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>Menu</h2>
          <button
            className={styles.closeButton}
            onClick={onToggle}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>
        <nav className={styles.nav}>
          <button
            className={styles.navItem}
            onClick={handleManagePlayers}
          >
            <span className={styles.navIcon}>👥</span>
            <span className={styles.navText}>Gerenciar Jogadores</span>
          </button>
        </nav>
      </aside>
    </>
  )
}

export function MenuButton({ onClick }) {
  return (
    <button
      className={styles.menuButton}
      onClick={onClick}
      aria-label="Abrir menu"
    >
      ☰
    </button>
  )
}

