import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';  // FIXED: Go up 2 levels to src/
import { isOverdue } from '../utils/dateUtils';

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    if (!supabase) {
      console.warn('Supabase not configured, using mock data');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (text, date, category) => {
    if (!supabase) {
      console.warn('Supabase not configured, simulating add');
      const newTodo = {
        id: Date.now(),
        text,
        date,
        category,
        completed: false
      };
      setTodos(prevTodos => [...prevTodos, newTodo]);
      return newTodo;
    }

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ text, date, category, completed: false }])
        .select()
        .single();

      if (error) throw error;

      setTodos(prevTodos => [...prevTodos, data]);
      return data;
    } catch (error) {
      console.error('Error adding todo:', error);
      // Fallback to local state if database fails
      const newTodo = {
        id: Date.now(),
        text,
        date,
        category,
        completed: false
      };
      setTodos(prevTodos => [...prevTodos, newTodo]);
      return newTodo;
    }
  };

  const toggleTodo = async (id, currentStatus) => {
    if (!supabase) {
      console.warn('Supabase not configured, updating local state only');
      setTodos(prevTodos => prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setTodos(prevTodos => prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ));
    } catch (error) {
      console.error('Error toggling todo:', error);
      // Fallback to local state if database fails
      setTodos(prevTodos => prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ));
    }
  };

  const deleteTodo = async (id) => {
    if (!supabase) {
      console.warn('Supabase not configured, updating local state only');
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      // Fallback to local state if database fails
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(todos.map(todo => todo.category))];
    return cats;
  }, [todos]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(t => isOverdue(t.date, t.completed)).length;

    return { total, completed, pending, overdue };
  }, [todos]);

  return {
    todos,
    setTodos,
    loading,
    addTodo,
    toggleTodo,
    deleteTodo,
    categories,
    stats
  };
};