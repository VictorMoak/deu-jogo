import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchPlayers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setPlayers(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
          secondary_position: playerData.secondary_position || null,
          phone: playerData.phone || null,
        }])
        .select()
        .single()

      if (error) throw error
      setPlayers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
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
      setPlayers(prev => prev.map(p => p.id === playerId ? data : p).sort((a, b) => a.name.localeCompare(b.name)))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function deletePlayer(playerId) {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) throw error
      setPlayers(prev => prev.filter(p => p.id !== playerId))
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('players')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
      }, () => {
        fetchPlayers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    players,
    loading,
    error,
    addPlayer,
    updatePlayer,
    deletePlayer,
    refetch: fetchPlayers,
  }
}

