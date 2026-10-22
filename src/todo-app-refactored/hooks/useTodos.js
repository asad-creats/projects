import { useState, useEffect, useMemo } from 'react';
import { supabase as supabaseClient } from '../../supabaseClient';  // FIXED: Go up 2 levels to src/
import { isOverdue } from '../utils/dateUtils';

// Sample tasks for the no-login demo, dated relative to today so "Today",
// "Overdue" and "Upcoming" all have something in them.
const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const demoTodos = () => [
  { id: 1, text: 'Review budget for Q4', date: dayOffset(0), category: 'Finance', completed: false },
  { id: 2, text: 'Send project update email to the client', date: dayOffset(0), category: 'Work', completed: false },
  { id: 3, text: 'Gym — leg day', date: dayOffset(0), category: 'Health', completed: true },
  { id: 4, text: 'Renew car insurance', date: dayOffset(-2), category: 'Finance', completed: false },
  { id: 5, text: 'Buy groceries for the week', date: dayOffset(-1), category: 'Shopping', completed: false },
  { id: 6, text: 'Prepare slides for Monday stand-up', date: dayOffset(1), category: 'Work', completed: false },
  { id: 7, text: 'Finish chapter 3 of the React course', date: dayOffset(2), category: 'Learning', completed: false },
  { id: 8, text: 'Book dentist appointment', date: dayOffset(4), category: 'Health', completed: false },
  { id: 9, text: 'Pay electricity bill', date: dayOffset(-3), category: 'Finance', completed: true },
];

// demo: keep everything in memory (seeded), never touch Supabase.
export const useTodos = ({ demo = false } = {}) => {
  const [todos, setTodos] = useState(() => (demo ? demoTodos() : []));
  const [loading, setLoading] = useState(!demo);
  // In demo mode the local-only branches below are used, same as when
  // Supabase isn't configured.
  const supabase = demo ? null : supabaseClient;

  useEffect(() => {
    if (!demo) fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!demo) console.warn('Supabase not configured, simulating add');
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

    const { data, error } = await supabase
      .from('todos')
      .insert([{ text, date, category, completed: false }])
      .select()
      .single();

    if (error) {
      // The DB trigger raises 'TASK_LIMIT' once a user hits 100 tasks.
      if ((error.message || '').includes('TASK_LIMIT')) {
        const limitErr = new Error('TASK_LIMIT');
        limitErr.code = 'TASK_LIMIT';
        throw limitErr;
      }
      console.error('Error adding todo:', error);
      throw error;
    }

    setTodos(prevTodos => [...prevTodos, data]);
    return data;
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