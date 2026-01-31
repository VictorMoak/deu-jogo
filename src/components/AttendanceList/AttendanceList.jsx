import { useState, useRef } from 'react'
import styles from './AttendanceList.module.css'

export function AttendanceList({
  attendance,
  players,
  addPlayer,
  updatePlayer,
  markAttendance,
  removeAttendance,
  reorderAttendance
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerType, setNewPlayerType] = useState('avulso')
  const [newPlayerPrimaryPosition, setNewPlayerPrimaryPosition] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const dragNode = useRef(null)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [editPlayerName, setEditPlayerName] = useState('')
  const [editPlayerType, setEditPlayerType] = useState('avulso')
  const [editPlayerPrimaryPosition, setEditPlayerPrimaryPosition] = useState('')
  const [editPlayerSecondaryPosition, setEditPlayerSecondaryPosition] = useState('')
  const [editPlayerPhone, setEditPlayerPhone] = useState('')

  const POSITIONS = [
    { value: '', label: 'Posição' },
    { value: 'ATA', label: 'ATA' },
    { value: 'MEI', label: 'MEI' },
    { value: 'ALA', label: 'ALA' },
    { value: 'ZAG', label: 'ZAG' },
    { value: 'GOL', label: 'GOL' },
  ]

  // Sort attendance by arrival order
  const sortedAttendance = [...(attendance || [])].sort((a, b) =>
    a.arrival_order - b.arrival_order
  )

  // Filter players not yet in attendance
  const availablePlayers = (players || []).filter(
    player => !attendance?.some(a => a.player_id === player.id)
  )

  const filteredPlayers = availablePlayers.filter(
    player => player.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return

    const player = await addPlayer({
      name: newPlayerName.trim(),
      type: newPlayerType,
      primary_position: newPlayerPrimaryPosition || null,
    })
    if (player) {
      await markAttendance(player.id)
      setNewPlayerName('')
      setNewPlayerType('avulso')
      setNewPlayerPrimaryPosition('')
    }
  }

  const handleSelectPlayer = async (playerId) => {
    await markAttendance(playerId)
    setSearchTerm('')
  }

  const handleEditClick = (player) => {
    setEditingPlayer(player)
    setEditPlayerName(player.name)
    setEditPlayerType(player.type)
    setEditPlayerPrimaryPosition(player.primary_position || '')
    setEditPlayerSecondaryPosition(player.secondary_position || '')
    setEditPlayerPhone(player.phone || '')
  }

  const handleSaveEdit = async () => {
    if (!editingPlayer || !editPlayerName.trim()) return

    await updatePlayer(editingPlayer.id, {
      name: editPlayerName.trim(),
      type: editPlayerType,
      primary_position: editPlayerPrimaryPosition || null,
      secondary_position: editPlayerSecondaryPosition || null,
      phone: editPlayerPhone.trim() || null,
    })
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

  // Filter positions for secondary position (exclude primary)
  const getSecondaryPositionOptions = (primaryPosition) => {
    return POSITIONS.filter(pos => pos.value === '' || pos.value !== primaryPosition)
  }

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    dragNode.current = e.target
    e.target.addEventListener('dragend', handleDragEnd)

    setTimeout(() => {
      e.target.classList.add(styles.dragging)
    }, 0)
  }

  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.classList.remove(styles.dragging)
      dragNode.current.removeEventListener('dragend', handleDragEnd)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
    dragNode.current = null
  }

  const handleDragEnter = (e, index) => {
    if (index !== draggedIndex) {
      setDragOverIndex(index)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newList = [...sortedAttendance]
    const [draggedItem] = newList.splice(draggedIndex, 1)
    newList.splice(dropIndex, 0, draggedItem)

    // Update arrival_order for reordered items
    const reorderedList = newList.map((item, idx) => ({
      ...item,
      arrival_order: idx + 1
    }))

    reorderAttendance(reorderedList)
    handleDragEnd()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Lista de Presença</h2>
        <span className={styles.count}>{attendance?.length || 0} jogadores</span>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar jogador cadastrado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && filteredPlayers.length > 0 && (
            <div className={styles.suggestions}>
              {filteredPlayers.slice(0, 5).map(player => (
                <button
                  key={player.id}
                  className={styles.suggestion}
                  onClick={() => handleSelectPlayer(player.id)}
                >
                  <span>{player.name}</span>
                  <span className={`badge badge-${player.type}`}>
                    {player.type === 'mensalista' ? 'M' : 'A'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.newPlayerForm} card`}>
        <h3>Cadastrar Novo Jogador</h3>
        <div className={styles.formRow}>
          <input
            type="text"
            placeholder="Nome do jogador"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          />
          <select
            value={newPlayerType}
            onChange={(e) => setNewPlayerType(e.target.value)}
          >
            <option value="avulso">Avulso</option>
            <option value="mensalista">Mensalista</option>
          </select>
          <select
            value={newPlayerPrimaryPosition}
            onChange={(e) => setNewPlayerPrimaryPosition(e.target.value)}
          >
            {POSITIONS.map(pos => (
              <option key={pos.value} value={pos.value}>{pos.label}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleAddPlayer}>
            Adicionar
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {sortedAttendance.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>Nenhum jogador presente ainda.</p>
            <p className="text-sm text-gray">Busque ou cadastre jogadores acima.</p>
          </div>
        ) : (
          sortedAttendance.map((item, index) => (
            <div
              key={item.id}
              className={`${styles.playerCard} ${dragOverIndex === index ? styles.dragOver : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className={styles.dragHandle} title="Arrastar para reordenar">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className={styles.playerOrder}>{index + 1}</div>
              <div className={styles.playerInfo}>
                <div className={styles.playerNameRow}>
                  <span className={styles.playerName}>{item.player?.name}</span>
                  <span className={`${styles.typeBadge} ${styles[`badge${item.player?.type === 'mensalista' ? 'Mensalista' : 'Avulso'}`]}`}>
                    <span className={styles.badgeFull}>{item.player?.type === 'mensalista' ? 'Mensalista' : 'Avulso'}</span>
                    <span className={styles.badgeShort}>{item.player?.type === 'mensalista' ? 'M' : 'A'}</span>
                  </span>
                </div>
                {(item.player?.primary_position || item.player?.secondary_position) && (
                  <div className={styles.playerPositionRow}>
                    {item.player?.primary_position && (
                      <span className={`${styles.positionBadge} ${styles.positionPrimary}`}>
                        {item.player.primary_position}
                      </span>
                    )}
                    {item.player?.secondary_position && (
                      <span className={`${styles.positionBadge} ${styles.positionSecondary}`}>
                        {item.player.secondary_position}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.playerActions}>
                <button
                  className="btn btn-icon btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditClick(item.player)
                  }}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-icon btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeAttendance(item.id)
                  }}
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Editar Jogador</h3>
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
                  onChange={(e) => setEditPlayerPhone(e.target.value)}
                  className={styles.input}
                  placeholder="Telefone (opcional)"
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
    </div>
  )
}
