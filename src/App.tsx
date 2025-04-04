import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Appointments from './pages/Appointments';
import Quote from './pages/Quote';
import { useAuth } from './hooks/useAuth';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Pages
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Dependents from "./pages/Dependents";
import Schedule from "./pages/Schedule";
import Contact from "./pages/Contact";
import UnitUnavailable from "./pages/UnitUnavailable";
import ScheduleConfirmation from "./pages/ScheduleConfirmation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { user } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rotas protegidas com Layout */}
            <Route
              path="/"
              element={
                user ? (
                  <Layout>
                    <Home />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/appointments"
              element={
                user ? (
                  <Layout>
                    <Appointments />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/quote"
              element={
                user ? (
                  <Layout>
                    <Quote />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/profile"
              element={
                user ? (
                  <Layout>
                    <Profile />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/dependents"
              element={
                user ? (
                  <Layout>
                    <Dependents />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/schedule"
              element={
                user ? (
                  <Layout>
                    <Schedule />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/contact"
              element={
                user ? (
                  <Layout>
                    <Contact />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            
            {/* Rotas especiais */}
            <Route
              path="/unit-unavailable"
              element={
                user ? (
                  <Layout>
                    <UnitUnavailable />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/schedule-confirmation"
              element={
                user ? (
                  <Layout>
                    <ScheduleConfirmation />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            
            {/* Rota catch-all */}
            <Route
              path="*"
              element={
                user ? (
                  <Layout>
                    <NotFound />
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
