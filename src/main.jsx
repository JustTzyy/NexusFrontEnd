import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </GoogleReCaptchaProvider>
  </StrictMode>,
)
