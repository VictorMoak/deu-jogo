import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export function useGameDay() {
  const [gameDays, setGameDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchGameDays() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('game_days')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setGameDays(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createGameDay({ date, title, time, status = 'scheduled' }) {
    try {
      // Title should already be set (with date + time if empty) by the caller
      // This function just uses whatever title is passed
      const { data, error } = await supabase
        .from('game_days')
        .insert([{ date, title: title, time: time || null, status }])
        .select()
        .single()

      if (error) throw error
      setGameDays(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function updateGameDayStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('game_days')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setGameDays(prev => prev.map(gd => gd.id === id ? data : gd))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function updateGameDay(id, updates) {
    try {
      const { data, error } = await supabase
        .from('game_days')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setGameDays(prev => prev.map(gd => gd.id === id ? data : gd))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  async function deleteGameDay(id) {
    try {
      const { error } = await supabase
        .from('game_days')
        .delete()
        .eq('id', id)

      if (error) throw error
      setGameDays(prev => prev.filter(gd => gd.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  useEffect(() => {
    fetchGameDays()
  }, [])

  return {
    gameDays,
    loading,
    error,
    createGameDay,
    updateGameDayStatus,
    updateGameDay,
    deleteGameDay,
    refetch: fetchGameDays,
  }
}

