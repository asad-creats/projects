import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Todo from './todo-app-refactored/Todo';
import Weather from './pages/Weather';
import Notes from './pages/Notes';
import Calculator from './pages/Calculator';
import TicTacToe from './pages/TicTacToe';
import Pomodoro from './pages/Pomodoro';
import Ecommerce from './pages/Ecommerce';
import Cart from './pages/Cart';
import Quorum from './quorum/Quorum';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
        <Route path="/ecommerce" element={<Ecommerce />} />
        <Route path="/ecommerce/cart" element={<Cart />} />
        <Route path="/quorum" element={<Quorum />} />
      </Routes>
    </Router>
  );
}

export default App;
