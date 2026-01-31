import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export function useAttendance(gameDayId) {
  const [attendance, setAttendance] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchAttendance() {
    if (!gameDayId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          player:players(*)
        `)
        .eq('game_day_id', gameDayId)
        .order('arrival_order', { ascending: true })

      if (error) throw error
      setAttendance(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPlayers() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setPlayers(data || [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function addPlayer(playerData) {
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{
          name: playerData.name,
          type: playerData.type || 'avulso',
          primary_position: playerData.primary_position || null,
        }])
        .select()
        .single()

      if (error) throw error
      setPlayers(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function updatePlayer(playerId, updates) {
    try {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      setPlayers(prev => prev.map(p => p.id === playerId ? data : p))
      // Refetch attendance to update player data in attendance list
      await fetchAttendance()
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function markAttendance(playerId) {
    if (!gameDayId) return null

    try {
      // Find the player to check their type
      const player = players.find(p => p.id === playerId)
      const isMensalista = player?.type === 'mensalista'

      let newOrder

      if (isMensalista) {
        // Count existing mensalistas to insert after them
        const mensalistasCount = attendance.filter(a => a.player?.type === 'mensalista').length
        newOrder = mensalistasCount + 1

        // Shift all avulsos down by 1
        const avulsosToUpdate = attendance
          .filter(a => a.player?.type !== 'mensalista')
          .map(a => a.id)

        if (avulsosToUpdate.length > 0) {
          // Update arrival_order for avulsos
          const updates = attendance
            .filter(a => a.player?.type !== 'mensalista')
            .map(a =>
              supabase
                .from('attendance')
                .update({ arrival_order: a.arrival_order + 1 })
                .eq('id', a.id)
            )
          await Promise.all(updates)
        }
      } else {
        // Avulso goes at the end
        const maxOrder = attendance.length > 0
          ? Math.max(...attendance.map(a => a.arrival_order))
          : 0
        newOrder = maxOrder + 1
      }

      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          game_day_id: gameDayId,
          player_id: playerId,
          arrival_order: newOrder,
          arrived_at: new Date().toISOString(),
        }])
        .select(`
          *,
          player:players(*)
        `)
        .single()

      if (error) throw error

      // Refetch to get updated order
      await fetchAttendance()
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function removeAttendance(attendanceId) {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', attendanceId)

      if (error) throw error
      setAttendance(prev => prev.filter(a => a.id !== attendanceId))
    } catch (err) {
      setError(err.message)
    }
  }

  async function reorderAttendance(reorderedList) {
    // Update local state immediately for instant feedback
    setAttendance(reorderedList)

    try {
      // Update arrival_order for each item in the database
      const updates = reorderedList.map((item, index) =>
        supabase
          .from('attendance')
          .update({ arrival_order: index + 1 })
          .eq('id', item.id)
      )

      await Promise.all(updates)
    } catch (err) {
      setError(err.message)
      // Revert on error
      fetchAttendance()
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [gameDayId])

  // Realtime subscription
  useEffect(() => {
    if (!gameDayId) return

    const channel = supabase
      .channel(`attendance:${gameDayId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance',
        filter: `game_day_id=eq.${gameDayId}`,
      }, () => {
        fetchAttendance()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameDayId])

  return {
    attendance,
    players,
    loading,
    error,
    addPlayer,
    updatePlayer,
    markAttendance,
    removeAttendance,
    reorderAttendance,
    refetch: fetchAttendance,
  }
}

