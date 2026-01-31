import styles from './Scoreboard.module.css'

export function Scoreboard({ match, onUpdateScore, isEditable = true }) {
  const handleScoreChange = (team, delta) => {
    const newScoreA = team === 'a' ? Math.max(0, match.score_a + delta) : match.score_a
    const newScoreB = team === 'b' ? Math.max(0, match.score_b + delta) : match.score_b
    onUpdateScore(match.id, newScoreA, newScoreB)
  }

  // Allow editing if:
  // - Match is in progress (normal editing)
  // - OR match is finished AND in edit mode (isEditable from parent)
  // Never allow editing for pending matches (match hasn't started)
  const canEdit = isEditable && match.status !== 'pending'

  return (
    <div className={styles.scoreboard}>
      {/* Team names row (visible on small screens) */}
      <div className={styles.teamNamesRow}>
        <span className={styles.teamNameTop}>{match.team_a?.name || 'Time A'}</span>
        <span className={styles.xSmall}>×</span>
        <span className={styles.teamNameTop}>{match.team_b?.name || 'Time B'}</span>
      </div>

      {/* Scores row */}
      <div className={styles.scoresRow}>
        <div className={styles.team}>
          <span className={styles.teamName}>{match.team_a?.name || 'Time A'}</span>
          <div className={styles.scoreControl}>
            {canEdit && (
              <button
                className={styles.scoreBtnMinus}
                onClick={() => handleScoreChange('a', -1)}
                disabled={match.score_a <= 0}
                title="Diminuir gol"
              >
                −
              </button>
            )}
            <span className={styles.score}>{match.score_a}</span>
            {canEdit && (
              <button
                className={styles.scoreBtnPlus}
                onClick={() => handleScoreChange('a', 1)}
                title="Adicionar gol"
              >
                +
              </button>
            )}
          </div>
        </div>

        <div className={styles.separator}>
          <span className={styles.x}>×</span>
        </div>

        <div className={styles.team}>
          <span className={styles.teamName}>{match.team_b?.name || 'Time B'}</span>
          <div className={styles.scoreControl}>
            {canEdit && (
              <button
                className={styles.scoreBtnMinus}
                onClick={() => handleScoreChange('b', -1)}
                disabled={match.score_b <= 0}
                title="Diminuir gol"
              >
                −
              </button>
            )}
            <span className={styles.score}>{match.score_b}</span>
            {canEdit && (
              <button
                className={styles.scoreBtnPlus}
                onClick={() => handleScoreChange('b', 1)}
                title="Adicionar gol"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
