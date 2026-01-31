import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export function useMatches(gameDayId) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchMatches() {
    if (!gameDayId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          team_a:teams!team_a_id(
            *,
            team_players(
              *,
              player:players(*)
            )
          ),
          team_b:teams!team_b_id(
            *,
            team_players(
              *,
              player:players(*)
            )
          ),
          match_stats(
            *,
            player:players(*)
          )
        `)
        .eq('game_day_id', gameDayId)
        .order('match_number', { ascending: true })

      if (error) throw error
      setMatches(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createMatch(teamAId, teamBId) {
    if (!gameDayId) return null

    try {
      const matchNumber = matches.length + 1

      const { data, error } = await supabase
        .from('matches')
        .insert([{
          game_day_id: gameDayId,
          team_a_id: teamAId,
          team_b_id: teamBId,
          score_a: 0,
          score_b: 0,
          match_number: matchNumber,
          status: 'pending',
        }])
        .select(`
          *,
          team_a:teams!team_a_id(
            *,
            team_players(
              *,
              player:players(*)
            )
          ),
          team_b:teams!team_b_id(
            *,
            team_players(
              *,
              player:players(*)
            )
          )
        `)
        .single()

      if (error) throw error
      setMatches(prev => [...prev, { ...data, match_stats: [] }])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function updateMatchScore(matchId, scoreA, scoreB) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({ score_a: scoreA, score_b: scoreB })
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...data } : m))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function updateMatchStatus(matchId, status) {
    try {
      const updateData = { status }

      // Set started_at when match starts
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString()
      }

      // Set finished_at when match ends
      if (status === 'finished') {
        updateData.finished_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...data } : m))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function addMatchStat(matchId, playerId, statType) {
    try {
      const match = matches.find(m => m.id === matchId)

      // Check if stat exists for this player/match
      const existingStat = match?.match_stats?.find(s => s.player_id === playerId)

      if (existingStat) {
        // Update existing stat
        const newValue = (existingStat[statType] || 0) + 1
        const { data, error } = await supabase
          .from('match_stats')
          .update({ [statType]: newValue })
          .eq('id', existingStat.id)
          .select(`
            *,
            player:players(*)
          `)
          .single()

        if (error) throw error

        setMatches(prev => prev.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              match_stats: m.match_stats.map(s =>
                s.id === existingStat.id ? data : s
              )
            }
          }
          return m
        }))

        // If it's a goal, update the team score
        if (statType === 'goals' && match) {
          await updateScoreFromGoal(match, playerId, 1)
        }

        return data
      } else {
        // Create new stat
        const { data, error } = await supabase
          .from('match_stats')
          .insert([{
            match_id: matchId,
            player_id: playerId,
            goals: statType === 'goals' ? 1 : 0,
            assists: statType === 'assists' ? 1 : 0,
            yellow_cards: statType === 'yellow_cards' ? 1 : 0,
            red_cards: statType === 'red_cards' ? 1 : 0,
          }])
          .select(`
            *,
            player:players(*)
          `)
          .single()

        if (error) throw error

        setMatches(prev => prev.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              match_stats: [...(m.match_stats || []), data]
            }
          }
          return m
        }))

        // If it's a goal, update the team score
        if (statType === 'goals' && match) {
          await updateScoreFromGoal(match, playerId, 1)
        }

        return data
      }
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  // Helper function to get total goals for a team from stats
  function getTeamGoalsFromStats(match, team) {
    const teamPlayerIds = team?.team_players?.map(tp => tp.player_id) || []
    return match.match_stats
      ?.filter(s => teamPlayerIds.includes(s.player_id))
      .reduce((sum, s) => sum + (s.goals || 0), 0) || 0
  }

  // Helper function to update score when a goal is added/removed from stats
  async function updateScoreFromGoal(match, playerId, delta) {
    const isTeamA = match.team_a?.team_players?.some(tp => tp.player_id === playerId)
    const isTeamB = match.team_b?.team_players?.some(tp => tp.player_id === playerId)

    if (isTeamA) {
      // Get current total goals from stats for team A (after this change)
      const statsGoals = getTeamGoalsFromStats(match, match.team_a) + delta
      // Only update score if stats goals would exceed current score
      if (delta > 0 && statsGoals > match.score_a) {
        await updateMatchScore(match.id, statsGoals, match.score_b)
      } else if (delta < 0) {
        // When removing, decrease score but not below stats total
        const newScore = Math.max(statsGoals, 0)
        await updateMatchScore(match.id, newScore, match.score_b)
      }
    } else if (isTeamB) {
      // Get current total goals from stats for team B (after this change)
      const statsGoals = getTeamGoalsFromStats(match, match.team_b) + delta
      // Only update score if stats goals would exceed current score
      if (delta > 0 && statsGoals > match.score_b) {
        await updateMatchScore(match.id, match.score_a, statsGoals)
      } else if (delta < 0) {
        // When removing, decrease score but not below stats total
        const newScore = Math.max(statsGoals, 0)
        await updateMatchScore(match.id, match.score_a, newScore)
      }
    }
  }

  async function removeMatchStat(matchId, playerId, statType) {
    try {
      const match = matches.find(m => m.id === matchId)
      const existingStat = match?.match_stats?.find(s => s.player_id === playerId)

      if (!existingStat || existingStat[statType] <= 0) return

      const newValue = existingStat[statType] - 1
      const { data, error } = await supabase
        .from('match_stats')
        .update({ [statType]: newValue })
        .eq('id', existingStat.id)
        .select(`
          *,
          player:players(*)
        `)
        .single()

      if (error) throw error

      setMatches(prev => prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            match_stats: m.match_stats.map(s =>
              s.id === existingStat.id ? data : s
            )
          }
        }
        return m
      }))

      // If it's a goal, update the team score
      if (statType === 'goals' && match) {
        await updateScoreFromGoal(match, playerId, -1)
      }

      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function deleteMatch(matchId) {
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

      if (error) throw error
      setMatches(prev => prev.filter(m => m.id !== matchId))
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [gameDayId])

  // Realtime subscription
  useEffect(() => {
    if (!gameDayId) return

    const channel = supabase
      .channel(`matches:${gameDayId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `game_day_id=eq.${gameDayId}`,
      }, () => {
        fetchMatches()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'match_stats',
      }, () => {
        fetchMatches()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameDayId])

  return {
    matches,
    loading,
    error,
    createMatch,
    updateMatchScore,
    updateMatchStatus,
    addMatchStat,
    removeMatchStat,
    deleteMatch,
    refetch: fetchMatches,
  }
}

