import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import GoalForm from './pages/GoalForm';
import Cycles from './pages/Cycles';
import Reviews from './pages/Reviews';
import ReviewDetail from './pages/ReviewDetail';
import KeyboardShortcuts from './components/KeyboardShortcuts';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PrivateRoute />}>
            <Route element={<ThemeProvider><KeyboardShortcuts /><Layout /></ThemeProvider>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/goals/new" element={<GoalForm />} />
              <Route path="/goals/:id/edit" element={<GoalForm />} />
              <Route path="/cycles" element={<Cycles />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/reviews/:id" element={<ReviewDetail />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
