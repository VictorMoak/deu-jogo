import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export function useTeams(gameDayId) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchTeams() {
    if (!gameDayId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_players(
            *,
            player:players(*)
          )
        `)
        .eq('game_day_id', gameDayId)
        .order('display_order', { ascending: true })

      if (error) throw error
      setTeams(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createTeam(name, displayOrder) {
    if (!gameDayId) return null

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          game_day_id: gameDayId,
          name,
          display_order: displayOrder,
        }])
        .select()
        .single()

      if (error) throw error
      setTeams(prev => [...prev, { ...data, team_players: [] }])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function updateTeam(teamId, updates) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single()

      if (error) throw error
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...data } : t))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function deleteTeam(teamId) {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error
      setTeams(prev => prev.filter(t => t.id !== teamId))
    } catch (err) {
      setError(err.message)
    }
  }

  async function addPlayerToTeam(teamId, playerId, number = null, isCaptain = false) {
    try {
      // Check if this is the first player - make them captain
      const team = teams.find(t => t.id === teamId)
      const isFirstPlayer = !team?.team_players || team.team_players.length === 0

      const { data, error } = await supabase
        .from('team_players')
        .insert([{
          team_id: teamId,
          player_id: playerId,
          number,
          is_captain: isFirstPlayer || isCaptain,
        }])
        .select(`
          *,
          player:players(*)
        `)
        .single()

      if (error) throw error

      setTeams(prev => prev.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            team_players: [...(t.team_players || []), data]
          }
        }
        return t
      }))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function removePlayerFromTeam(teamPlayerId) {
    try {
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('id', teamPlayerId)

      if (error) throw error

      setTeams(prev => prev.map(t => ({
        ...t,
        team_players: (t.team_players || []).filter(tp => tp.id !== teamPlayerId)
      })))
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateTeamPlayer(teamPlayerId, updates) {
    try {
      // If setting as captain, unset other captains in the same team first
      if (updates.is_captain === true) {
        // Find which team this player belongs to
        let teamId = null
        for (const team of teams) {
          const tp = team.team_players?.find(p => p.id === teamPlayerId)
          if (tp) {
            teamId = team.id
            break
          }
        }

        if (teamId) {
          // Unset all other captains in this team
          const team = teams.find(t => t.id === teamId)
          const otherCaptains = team?.team_players?.filter(tp => tp.is_captain && tp.id !== teamPlayerId) || []

          for (const captain of otherCaptains) {
            await supabase
              .from('team_players')
              .update({ is_captain: false })
              .eq('id', captain.id)
          }
        }
      }

      const { data, error } = await supabase
        .from('team_players')
        .update(updates)
        .eq('id', teamPlayerId)
        .select(`
          *,
          player:players(*)
        `)
        .single()

      if (error) throw error

      // Refetch to get updated state
      await fetchTeams()
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [gameDayId])

  // Realtime subscription
  useEffect(() => {
    if (!gameDayId) return

    const channel = supabase
      .channel(`teams:${gameDayId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `game_day_id=eq.${gameDayId}`,
      }, () => {
        fetchTeams()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_players',
      }, () => {
        fetchTeams()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameDayId])

  return {
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    addPlayerToTeam,
    removePlayerFromTeam,
    updateTeamPlayer,
    refetch: fetchTeams,
  }
}

