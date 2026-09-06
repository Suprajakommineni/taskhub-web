import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/register';
import Login from './pages/login';
import OAuthSuccess from './pages/OAuthSuccess';
import ProtectedRoute from './components/ProtectedRoute';
import Projects from './pages/Projects';
import ProjectDetail from './pages/projectDetail';
import Settings from './pages/Settings';
import { ProjectsProvider } from './context/ProjectsContext';
import AppLayout from './layout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        <Route
          element={
            <ProtectedRoute>
              <ProjectsProvider>
                <AppLayout />
              </ProjectsProvider>
            </ProtectedRoute>
          }
        >
          
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;