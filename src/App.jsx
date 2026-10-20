import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ToastProvider } from "./hooks/useToast";
import AppRoutes from "./routes/AppRoutes";
import TermsGate from "./components/auth/TermsGate";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <AppRoutes />
            <TermsGate />
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
