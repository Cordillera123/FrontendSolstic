// src/App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
  return (
    <AuthProvider>
      {/* ✅ Agregar basename para manejar la base URL correctamente */}
     <Router>
        <Routes>
          {/* ✅ Ruta raíz - redirigir a login si no está autenticado */}
          <Route 
            path="/" 
            element={<Navigate to="/login" replace />} 
          />
          
          {/* ✅ Ruta pública: Login */}
          <Route path="/login" element={<Login />} />
          
          {/* ✅ Rutas protegidas con Outlet pattern */}
          <Route element={<ProtectedRoute />}>
            {/* ✅ Dashboard con wildcard para sub-rutas */}
            <Route path="/dashboard/*" element={<Dashboard />} />
            
            {/* ✅ Aquí puedes añadir más rutas protegidas */}
            {/* <Route path="/usuarios" element={<Usuarios />} /> */}
            {/* <Route path="/reportes" element={<Reportes />} /> */}
          </Route>
          
          {/* ✅ Catch-all - redirigir rutas no encontradas */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;