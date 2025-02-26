
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Dependents from "./pages/Dependents";
import Schedule from "./pages/Schedule";
import Appointments from "./pages/Appointments";
import Contact from "./pages/Contact";
import Quote from "./pages/Quote";
import UnitUnavailable from "./pages/UnitUnavailable";
import ScheduleConfirmation from "./pages/ScheduleConfirmation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Main Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dependents" element={<Dependents />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/quote" element={<Quote />} />
          
          {/* Special Routes */}
          <Route path="/unit-unavailable" element={<UnitUnavailable />} />
          <Route path="/schedule-confirmation" element={<ScheduleConfirmation />} />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
