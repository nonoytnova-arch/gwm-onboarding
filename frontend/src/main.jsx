import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { FormProvider } from './context/FormContext';
import { LanguageProvider } from './context/LanguageContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AdminAuthProvider>
          <FormProvider>
            <App />
          </FormProvider>
        </AdminAuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
