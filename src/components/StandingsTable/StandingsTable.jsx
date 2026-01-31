import { useState } from 'react'
import styles from './StandingsTable.module.css'

export function StandingsTable({ matches, teams }) {
  // Calculate standings from matches
  const standings = calculateStandings(matches, teams)

  // Calculate top scorers and assist leaders
  const topScorers = calculateTopScorers(matches)
  const topAssists = calculateTopAssists(matches)

  const [showAllScorers, setShowAllScorers] = useState(false)
  const [showAllAssists, setShowAllAssists] = useState(false)

  return (
    <div className={styles.container}>
      <h2>Classificação</h2>

      {standings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <p>Nenhuma partida finalizada ainda.</p>
          <p className="text-sm text-gray">A classificação será atualizada conforme as partidas forem jogadas.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.pos}>#</th>
                <th className={styles.team}>Time</th>
                <th>P</th>
                <th>J</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>GP</th>
                <th>GC</th>
                <th>SG</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.id} className={index === 0 ? styles.topTeam : ''}>
                  <td className={styles.pos}>
                    <span className={`${styles.position} ${index === 0 ? styles.first : ''}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className={styles.team}>{team.name}</td>
                  <td className={styles.points}>{team.points}</td>
                  <td>{team.played}</td>
                  <td>{team.wins}</td>
                  <td>{team.draws}</td>
                  <td>{team.losses}</td>
                  <td>{team.goalsFor}</td>
                  <td>{team.goalsAgainst}</td>
                  <td className={team.goalDiff > 0 ? styles.positive : team.goalDiff < 0 ? styles.negative : ''}>
                    {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.legend}>
        <p><strong>P</strong> = Pontos | <strong>J</strong> = Jogos | <strong>V</strong> = Vitórias | <strong>E</strong> = Empates | <strong>D</strong> = Derrotas</p>
        <p><strong>GP</strong> = Gols Pró | <strong>GC</strong> = Gols Contra | <strong>SG</strong> = Saldo de Gols</p>
      </div>

      {/* Top Scorers */}
      <div className={styles.statsSection}>
        <h3>⚽ Artilheiros</h3>
        {topScorers.length === 0 ? (
          <div className="empty-state">
            <p className="text-sm text-gray">Nenhum gol registrado ainda.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.pos}>#</th>
                    <th className={styles.team}>Jogador</th>
                    <th>Gols</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllScorers ? topScorers : topScorers.slice(0, 5)).map((player, index) => (
                    <tr key={player.playerId} className={index === 0 ? styles.topTeam : ''}>
                      <td className={styles.pos}>
                        <span className={`${styles.position} ${index === 0 ? styles.first : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className={styles.team}>
                        <div className={styles.playerNameRow}>
                          <span>{player.playerName}</span>
                          {(player.primaryPosition || player.secondaryPosition) && (
                            <div className={styles.playerPositionRow}>
                              {player.primaryPosition && (
                                <span className={`${styles.positionBadge} ${styles.positionPrimary}`}>
                                  {player.primaryPosition}
                                </span>
                              )}
                              {player.secondaryPosition && (
                                <span className={`${styles.positionBadge} ${styles.positionSecondary}`}>
                                  {player.secondaryPosition}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={styles.points}>{player.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {topScorers.length > 5 && (
              <button
                className={styles.showMoreBtn}
                onClick={() => setShowAllScorers(!showAllScorers)}
              >
                {showAllScorers ? 'Mostrar menos' : `Mostrar todos (${topScorers.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Top Assists */}
      <div className={styles.statsSection}>
        <h3>👟 Assistências</h3>
        {topAssists.length === 0 ? (
          <div className="empty-state">
            <p className="text-sm text-gray">Nenhuma assistência registrada ainda.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.pos}>#</th>
                    <th className={styles.team}>Jogador</th>
                    <th>Assist.</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllAssists ? topAssists : topAssists.slice(0, 5)).map((player, index) => (
                    <tr key={player.playerId} className={index === 0 ? styles.topTeam : ''}>
                      <td className={styles.pos}>
                        <span className={`${styles.position} ${index === 0 ? styles.first : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className={styles.team}>
                        <div className={styles.playerNameRow}>
                          <span>{player.playerName}</span>
                          {(player.primaryPosition || player.secondaryPosition) && (
                            <div className={styles.playerPositionRow}>
                              {player.primaryPosition && (
                                <span className={`${styles.positionBadge} ${styles.positionPrimary}`}>
                                  {player.primaryPosition}
                                </span>
                              )}
                              {player.secondaryPosition && (
                                <span className={`${styles.positionBadge} ${styles.positionSecondary}`}>
                                  {player.secondaryPosition}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={styles.points}>{player.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {topAssists.length > 5 && (
              <button
                className={styles.showMoreBtn}
                onClick={() => setShowAllAssists(!showAllAssists)}
              >
                {showAllAssists ? 'Mostrar menos' : `Mostrar todos (${topAssists.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function calculateStandings(matches, teams) {
  if (!teams || teams.length === 0) return []

  // Initialize standings for all teams
  const standings = {}
  teams.forEach(team => {
    standings[team.id] = {
      id: team.id,
      name: team.name,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
    }
  })

  // Process finished matches
  const finishedMatches = matches?.filter(m => m.status === 'finished') || []

  finishedMatches.forEach(match => {
    const teamA = standings[match.team_a_id]
    const teamB = standings[match.team_b_id]

    if (!teamA || !teamB) return

    // Update games played
    teamA.played++
    teamB.played++

    // Update goals
    teamA.goalsFor += match.score_a
    teamA.goalsAgainst += match.score_b
    teamB.goalsFor += match.score_b
    teamB.goalsAgainst += match.score_a

    // Update results
    if (match.score_a > match.score_b) {
      // Team A wins
      teamA.wins++
      teamA.points += 3
      teamB.losses++
    } else if (match.score_a < match.score_b) {
      // Team B wins
      teamB.wins++
      teamB.points += 3
      teamA.losses++
    } else {
      // Draw
      teamA.draws++
      teamA.points += 1
      teamB.draws++
      teamB.points += 1
    }
  })

  // Calculate goal difference and sort
  return Object.values(standings)
    .map(team => ({
      ...team,
      goalDiff: team.goalsFor - team.goalsAgainst
    }))
    .filter(team => team.played > 0)
    .sort((a, b) => {
      // Sort by points, then goal diff, then goals scored
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      return b.goalsFor - a.goalsFor
    })
}

function calculateTopScorers(matches) {
  const finishedMatches = matches?.filter(m => m.status === 'finished') || []
  const playerGoals = {}

  finishedMatches.forEach(match => {
    if (match.match_stats) {
      match.match_stats.forEach(stat => {
        const playerId = stat.player_id
        const playerName = stat.player?.name || 'Jogador Desconhecido'
        const primaryPosition = stat.player?.primary_position || null
        const secondaryPosition = stat.player?.secondary_position || null
        const goals = stat.goals || 0

        if (!playerGoals[playerId]) {
          playerGoals[playerId] = {
            playerId,
            playerName,
            primaryPosition,
            secondaryPosition,
            goals: 0
          }
        }
        playerGoals[playerId].goals += goals
      })
    }
  })

  return Object.values(playerGoals)
    .filter(p => p.goals > 0)
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals
      return a.playerName.localeCompare(b.playerName)
    })
}

function calculateTopAssists(matches) {
  if (!matches || matches.length === 0) return []

  const finishedMatches = matches.filter(m => m.status === 'finished') || []
  const playerAssists = {}

  finishedMatches.forEach(match => {
    if (match.match_stats && Array.isArray(match.match_stats)) {
      match.match_stats.forEach(stat => {
        if (!stat) return

        const playerId = stat.player_id
        const playerName = stat.player?.name || 'Jogador Desconhecido'
        const primaryPosition = stat.player?.primary_position || null
        const secondaryPosition = stat.player?.secondary_position || null
        const assists = Number(stat.assists) || 0

        if (assists > 0) {
          if (!playerAssists[playerId]) {
            playerAssists[playerId] = {
              playerId,
              playerName,
              primaryPosition,
              secondaryPosition,
              assists: 0
            }
          }
          playerAssists[playerId].assists += assists
        }
      })
    }
  })

  return Object.values(playerAssists)
    .filter(p => p.assists > 0)
    .sort((a, b) => {
      if (b.assists !== a.assists) return b.assists - a.assists
      return a.playerName.localeCompare(b.playerName)
    })
}

