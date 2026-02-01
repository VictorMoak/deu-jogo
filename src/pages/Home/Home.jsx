import { useState } from 'react'
import { useGameDay } from '../../hooks/useGameDay'
import { MenuButton } from '../../components/Sidebar'
import styles from './Home.module.css'

export function Home({ onSelectGameDay, onToggleSidebar }) {
  const { gameDays, loading, error, createGameDay, deleteGameDay, updateGameDay } = useGameDay()
  const [confirmDeleteGameDay, setConfirmDeleteGameDay] = useState(null)
  const [editingGameDay, setEditingGameDay] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState('scheduled')
  const [activeTab, setActiveTab] = useState('active') // 'active' or 'finished'
  const [showAll, setShowAll] = useState(false) // Control how many items to show

  const handleCreateClick = () => {
    setIsCreating(true)
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    // Formatar horário atual no formato HH:MM para o input type="time"
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const currentTime = `${hours}:${minutes}`

    setEditDate(today)
    setEditTitle('')
    setEditTime(currentTime)
    setEditStatus('scheduled')
  }

  const handleSaveEdit = async () => {
    if (isCreating) {
      // Creating new game day
      // Se título estiver vazio, usar data + horário como padrão
      const finalTitle = editTitle.trim() || getDefaultTitle(editDate, editTime)
      const newGameDay = await createGameDay({
        date: editDate,
        title: finalTitle,
        time: editTime || null,
        status: editStatus,
      })
      if (newGameDay) {
        setIsCreating(false)
        setEditTitle('')
        setEditTime('')
        setEditDate('')
        setEditStatus('scheduled')
        onSelectGameDay(newGameDay)
      }
    } else if (editingGameDay) {
      // Updating existing game day
      // Se título estiver vazio, usar data + horário como padrão
      const finalTitle = editTitle.trim() || getDefaultTitle(editDate, editTime)
      await updateGameDay(editingGameDay.id, {
        title: finalTitle,
        time: editTime || null,
        date: editDate,
        status: editStatus,
      })
      setEditingGameDay(null)
      setEditTitle('')
      setEditTime('')
      setEditDate('')
      setEditStatus('scheduled')
    }
  }

  const handleCancelEdit = () => {
    setIsCreating(false)
    setEditingGameDay(null)
    setEditTitle('')
    setEditTime('')
    setEditDate('')
    setEditStatus('scheduled')
  }

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Agendado',
      in_progress: 'Em Andamento',
      finished: 'Encerrado',
    }
    return labels[status] || status
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    return `${hours}:${minutes}`
  }

  const getDefaultTitle = (dateStr, timeStr = null) => {
    const dateFormatted = formatDate(dateStr)
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':')
      return `${dateFormatted} - ${hours}:${minutes}`
    }
    return dateFormatted
  }

  const handleEditClick = (gameDay) => {
    setIsCreating(false)
    setEditingGameDay(gameDay)
    setEditTitle(gameDay.title || getDefaultTitle(gameDay.date, gameDay.time))
    setEditTime(gameDay.time || '')
    setEditDate(gameDay.date)
    setEditStatus(gameDay.status)
  }

  const handleDeleteGameDay = async () => {
    if (confirmDeleteGameDay) {
      await deleteGameDay(confirmDeleteGameDay.id)
      setConfirmDeleteGameDay(null)
    }
  }

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <MenuButton onClick={onToggleSidebar} />
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚽</span>
            <h1>Deu Ruim!!!!!</h1>
          </div>
          <div className={styles.headerSpacer}></div>
        </div>
        <p className={styles.tagline}>Organize suas peladas como um campeão</p>
      </header>

      <main className={styles.main}>
        <section className={styles.newGame}>
          <h2>Iniciar novo Game Day</h2>
          <div className={styles.createButtonContainer}>
            <button
              onClick={handleCreateClick}
              className="btn btn-primary btn-lg"
            >
              🏆 Criar Game Day
            </button>
          </div>
        </section>

        <section className={styles.history}>
          <h2>Game Days</h2>

          {loading && (
            <div className={styles.loading}>
              <div className="spinner"></div>
              <p>Carregando...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erro ao carregar: {error}</p>
            </div>
          )}

          {!loading && gameDays.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p>Nenhum dia de jogo registrado ainda.</p>
              <p className="text-sm text-gray">Crie seu primeiro dia de jogo acima!</p>
            </div>
          )}

          {!loading && gameDays.length > 0 && (
            <>
              {/* Tabs */}
              <div className={styles.tabsRow}>
                <div className={styles.tabs}>
                  <button
                    className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
                    onClick={() => {
                      setActiveTab('active')
                      setShowAll(false)
                    }}
                  >
                    📅 Ativos ({gameDays.filter(gd => gd.status !== 'finished').length})
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'finished' ? styles.tabActive : ''}`}
                    onClick={() => {
                      setActiveTab('finished')
                      setShowAll(false)
                    }}
                  >
                    ✅ Finalizados ({gameDays.filter(gd => gd.status === 'finished').length})
                  </button>
                </div>
              </div>

              {/* Filtered and limited game days */}
              {(() => {
                const activeGameDays = gameDays.filter(gd => gd.status !== 'finished')
                const finishedGameDays = gameDays.filter(gd => gd.status === 'finished')
                const currentGameDays = activeTab === 'active' ? activeGameDays : finishedGameDays
                const displayedGameDays = showAll ? currentGameDays : currentGameDays.slice(0, 5)
                const hasMore = currentGameDays.length > 5

                return (
                  <>
                    <div className={styles.gameDayList}>
                      {displayedGameDays.map((gameDay) => {
                        const title = gameDay.title || getDefaultTitle(gameDay.date, gameDay.time)
                        const time = gameDay.time ? formatTime(gameDay.time) : ''
                        const dateFormatted = formatDate(gameDay.date)

                        return (
                          <div
                            key={gameDay.id}
                            className={`${styles.gameDayCard} card`}
                          >
                            <div
                              className={styles.gameDayContent}
                              onClick={() => onSelectGameDay(gameDay)}
                            >
                              <div className={styles.gameDayHeader}>
                                <div className={styles.gameDayTitleRow}>
                                  <h3 className={styles.gameDayTitle}>{title}</h3>
                                  <span className={`badge badge-${gameDay.status.replace('_', '-')}`}>
                                    {getStatusLabel(gameDay.status)}
                                  </span>
                                </div>
                              </div>
                              <div className={styles.gameDayDetails}>
                                <div className={styles.gameDayDetailsContent}>
                                  <span className={styles.date}>{dateFormatted}</span>
                                  {time && <span className={styles.time}>• {time}</span>}
                                </div>
                                <div className={styles.gameDayActionsMobile}>
                                  <button
                                    className={styles.editBtn}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditClick(gameDay)
                                    }}
                                    title="Editar Game Day"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmDeleteGameDay(gameDay)
                                    }}
                                    title="Excluir Game Day"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className={styles.gameDayActions}>
                              <button
                                className={styles.editBtn}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditClick(gameDay)
                                }}
                                title="Editar Game Day"
                              >
                                ✏️
                              </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setConfirmDeleteGameDay(gameDay)
                                }}
                                title="Excluir Game Day"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {hasMore && (
                      <button
                        className={styles.showMoreBtn}
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Mostrar menos' : `Mostrar todos (${currentGameDays.length})`}
                      </button>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </section>
      </main>

      {/* Edit/Create Modal */}
      {(editingGameDay || isCreating) && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{isCreating ? 'Criar Game Day' : 'Editar Game Day'}</h3>
            <div className={styles.editForm}>
              <div className={styles.formGroup}>
                <label htmlFor="editTitle">Título</label>
                <input
                  id="editTitle"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={styles.input}
                  placeholder="Digite o título (ex: Pelada de domingo)"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editDate">Data</label>
                <input
                  id="editDate"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editTime">Horário</label>
                <input
                  id="editTime"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editStatus">Status</label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={styles.input}
                >
                  <option value="scheduled">Agendado</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="finished">Encerrado</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteGameDay && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDeleteGameDay(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Excluir Dia de Jogo?</h3>
            <p className={styles.modalText}>
              <strong>{confirmDeleteGameDay.title || formatDate(confirmDeleteGameDay.date)}</strong>
            </p>
            <p className={styles.modalSubtext}>Esta ação não pode ser desfeita. Tem certeza que deseja excluir este dia de jogo?</p>
            <div className={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteGameDay(null)}
              >
                Cancelar
              </button>
              <button
                className={`btn ${styles.modalDeleteBtn}`}
                onClick={handleDeleteGameDay}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

