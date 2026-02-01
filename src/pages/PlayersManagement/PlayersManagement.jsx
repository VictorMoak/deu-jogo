import { useState } from 'react'
import { usePlayers } from '../../hooks/usePlayers'
import { MenuButton } from '../../components/Sidebar'
import { formatPhone, removePhoneMask } from '../../utils/phone'
import styles from './PlayersManagement.module.css'

const POSITIONS = [
  { value: '', label: 'Selecione' },
  { value: 'ATA', label: 'ATA' },
  { value: 'MEI', label: 'MEI' },
  { value: 'ALA', label: 'ALA' },
  { value: 'ZAG', label: 'ZAG' },
  { value: 'GOL', label: 'GOL' },
]

export function PlayersManagement({ onBack, onToggleSidebar }) {
  const { players, addPlayer, updatePlayer, deletePlayer } = usePlayers()
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [editPlayerName, setEditPlayerName] = useState('')
  const [editPlayerType, setEditPlayerType] = useState('avulso')
  const [editPlayerPrimaryPosition, setEditPlayerPrimaryPosition] = useState('')
  const [editPlayerSecondaryPosition, setEditPlayerSecondaryPosition] = useState('')
  const [editPlayerPhone, setEditPlayerPhone] = useState('')
  const [confirmDeletePlayer, setConfirmDeletePlayer] = useState(null)
  const [draggedPlayer, setDraggedPlayer] = useState(null)

  const mensalistas = players.filter(p => p.type === 'mensalista')
  const avulsos = players.filter(p => p.type === 'avulso')

  const handleEditClick = (player) => {
    setEditingPlayer(player)
    setEditPlayerName(player.name)
    setEditPlayerType(player.type)
    setEditPlayerPrimaryPosition(player.primary_position || '')
    setEditPlayerSecondaryPosition(player.secondary_position || '')
    // Aplica máscara ao carregar telefone existente
    setEditPlayerPhone(player.phone ? formatPhone(player.phone) : '')
  }

  const handleNewPlayerClick = () => {
    setEditingPlayer({}) // Empty object to indicate new player
    setEditPlayerName('')
    setEditPlayerType('avulso')
    setEditPlayerPrimaryPosition('')
    setEditPlayerSecondaryPosition('')
    setEditPlayerPhone('')
  }

  const handleSaveEdit = async () => {
    if (!editPlayerName.trim()) return

    // Remove máscara do telefone antes de salvar
    const phoneWithoutMask = removePhoneMask(editPlayerPhone)

    // Check if it's a new player (editingPlayer has no id) or editing existing
    if (editingPlayer && editingPlayer.id) {
      // Editing existing player
      await updatePlayer(editingPlayer.id, {
        name: editPlayerName.trim(),
        type: editPlayerType,
        primary_position: editPlayerPrimaryPosition || null,
        secondary_position: editPlayerSecondaryPosition || null,
        phone: phoneWithoutMask || null,
      })
    } else {
      // Creating new player
      await addPlayer({
        name: editPlayerName.trim(),
        type: editPlayerType,
        primary_position: editPlayerPrimaryPosition || null,
        secondary_position: editPlayerSecondaryPosition || null,
        phone: phoneWithoutMask || null,
      })
    }
    setEditingPlayer(null)
    setEditPlayerName('')
    setEditPlayerType('avulso')
    setEditPlayerPrimaryPosition('')
    setEditPlayerSecondaryPosition('')
    setEditPlayerPhone('')
  }

  const handleCancelEdit = () => {
    setEditingPlayer(null)
    setEditPlayerName('')
    setEditPlayerType('avulso')
    setEditPlayerPrimaryPosition('')
    setEditPlayerSecondaryPosition('')
    setEditPlayerPhone('')
  }


  const handleDeletePlayer = async () => {
    if (confirmDeletePlayer) {
      await deletePlayer(confirmDeletePlayer.id)
      setConfirmDeletePlayer(null)
    }
  }

  // Filter positions for secondary position (exclude primary)
  const getSecondaryPositionOptions = (primaryPosition) => {
    return POSITIONS.filter(pos => pos.value === '' || pos.value !== primaryPosition)
  }

  // Drag and Drop handlers
  const handleDragStart = (e, player) => {
    setDraggedPlayer(player)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add(styles.dragOver)
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove(styles.dragOver)
  }

  const handleDrop = async (e, targetType) => {
    e.preventDefault()
    e.currentTarget.classList.remove(styles.dragOver)

    if (draggedPlayer && draggedPlayer.type !== targetType) {
      await updatePlayer(draggedPlayer.id, { type: targetType })
    }
    setDraggedPlayer(null)
  }

  const handleToggleType = async (player) => {
    const newType = player.type === 'mensalista' ? 'avulso' : 'mensalista'
    await updatePlayer(player.id, { type: newType })
  }

  const renderPlayerCard = (player) => (
    <div
      key={player.id}
      className={styles.playerCard}
      draggable
      onDragStart={(e) => handleDragStart(e, player)}
    >
      <div className={styles.playerInfo}>
        <div className={styles.playerNameRow}>
          <span className={styles.playerName}>{player.name}</span>
          {(player.primary_position || player.secondary_position) && (
            <div className={styles.playerPositionRow}>
              {player.primary_position && (
                <span className={`${styles.positionBadge} ${styles.positionPrimary}`}>
                  {player.primary_position}
                </span>
              )}
              {player.secondary_position && (
                <span className={`${styles.positionBadge} ${styles.positionSecondary}`}>
                  {player.secondary_position}
                </span>
              )}
            </div>
          )}
        </div>
        {player.phone && (
          <div className={styles.playerPhone}>
            📞 {formatPhone(player.phone)}
          </div>
        )}
      </div>
      <div className={styles.playerActions}>
        <button
          className={styles.toggleTypeBtn}
          onClick={() => handleToggleType(player)}
          title={player.type === 'mensalista' ? 'Tornar Avulso' : 'Tornar Mensalista'}
        >
          {player.type === 'mensalista' ? '⬇️' : '⬆️'}
        </button>
        <button
          className={styles.editBtn}
          onClick={() => handleEditClick(player)}
          title="Editar"
        >
          ✏️
        </button>
        <button
          className={styles.deleteBtn}
          onClick={() => setConfirmDeletePlayer(player)}
          title="Excluir"
        >
          🗑️
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <MenuButton onClick={onToggleSidebar} />
          <button onClick={onBack} className="btn btn-secondary">
            ← Voltar
          </button>
        </div>
        <h1>Gerenciar Jogadores</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      <main className={styles.main}>
        {/* Add New Player Header */}
        <div className={styles.newPlayerHeader}>
          <h2>Jogadores ({players.length})</h2>
          <button
            className={`${styles.newPlayerBtn} btn btn-primary btn-sm`}
            onClick={handleNewPlayerClick}
          >
            ＋ Novo Jogador
          </button>
        </div>

        {/* Players Lists */}
        <div className={styles.playersGrid}>
          {/* Mensalistas */}
          <div
            className={`${styles.playerTypeSection} card`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'mensalista')}
          >
            <h3 className={styles.sectionTitle}>
              <span className={styles.badgeMensalista}>Mensalistas</span>
              <span className={styles.count}>({mensalistas.length})</span>
            </h3>
            <div className={styles.playerList}>
              {mensalistas.length === 0 ? (
                <div className={styles.emptyList}>
                  <p className="text-gray text-sm">Arraste jogadores aqui</p>
                </div>
              ) : (
                mensalistas.map(player => renderPlayerCard(player))
              )}
            </div>
          </div>

          {/* Avulsos */}
          <div
            className={`${styles.playerTypeSection} card`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'avulso')}
          >
            <h3 className={styles.sectionTitle}>
              <span className={styles.badgeAvulso}>Avulsos</span>
              <span className={styles.count}>({avulsos.length})</span>
            </h3>
            <div className={styles.playerList}>
              {avulsos.length === 0 ? (
                <div className={styles.emptyList}>
                  <p className="text-gray text-sm">Arraste jogadores aqui</p>
                </div>
              ) : (
                avulsos.map(player => renderPlayerCard(player))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit/Create Player Modal */}
      {editingPlayer !== null && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{editingPlayer.id ? 'Editar Jogador' : 'Novo Jogador'}</h3>
            <div className={styles.editForm}>
              <div className={styles.formGroup}>
                <label htmlFor="editPlayerName">Nome</label>
                <input
                  id="editPlayerName"
                  type="text"
                  value={editPlayerName}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  className={styles.input}
                  placeholder="Nome do jogador"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editPlayerType">Tipo</label>
                <select
                  id="editPlayerType"
                  value={editPlayerType}
                  onChange={(e) => setEditPlayerType(e.target.value)}
                  className={styles.input}
                >
                  <option value="avulso">Avulso</option>
                  <option value="mensalista">Mensalista</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editPlayerPrimaryPosition">Posição Principal</label>
                <select
                  id="editPlayerPrimaryPosition"
                  value={editPlayerPrimaryPosition}
                  onChange={(e) => {
                    setEditPlayerPrimaryPosition(e.target.value)
                    if (e.target.value === editPlayerSecondaryPosition) {
                      setEditPlayerSecondaryPosition('')
                    }
                  }}
                  className={styles.input}
                >
                  {POSITIONS.map(pos => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editPlayerSecondaryPosition">Posição Secundária</label>
                <select
                  id="editPlayerSecondaryPosition"
                  value={editPlayerSecondaryPosition}
                  onChange={(e) => setEditPlayerSecondaryPosition(e.target.value)}
                  className={styles.input}
                >
                  {getSecondaryPositionOptions(editPlayerPrimaryPosition).map(pos => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editPlayerPhone">Telefone</label>
                <input
                  id="editPlayerPhone"
                  type="tel"
                  value={editPlayerPhone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    setEditPlayerPhone(formatted)
                  }}
                  className={styles.input}
                  placeholder="(XX) XXXXX-XXXX"
                  maxLength={15}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
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
      {confirmDeletePlayer && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDeletePlayer(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Excluir Jogador?</h3>
            <p className={styles.modalText}>
              <strong>{confirmDeletePlayer.name}</strong>
            </p>
            <p className={styles.modalSubtext}>Esta ação não pode ser desfeita. Tem certeza que deseja excluir este jogador?</p>
            <div className={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeletePlayer(null)}
              >
                Cancelar
              </button>
              <button
                className={`btn ${styles.modalDeleteBtn}`}
                onClick={handleDeletePlayer}
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

