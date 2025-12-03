import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home/Home.jsx';
import Profile from './pages/Profile/Profile.jsx';
import NotFound from './pages/NotFound.jsx';
import HouseholdWaiting from './pages/HouseholdWaiting/Waiting.jsx';
import CameraCapture from './components/cameracapture/CameraCapture.jsx';
import ParkingZone from './components/parkingzone/ParkingZone.jsx';
import Success from './pages/Success.jsx';
import History from './pages/History/History.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Login from './pages/Auth/Login/login.jsx';
import Signup from './pages/Auth/Signup/signup.jsx';
import CheckEmail from './pages/checkEmail/checkEmail.jsx';
import HouseHolds from './pages/HouseHolds/households.jsx';
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <ProtectedRoute><Home /></ProtectedRoute> },
      { path: 'profil', element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: 'camera', element: <ProtectedRoute><CameraCapture /></ProtectedRoute> },
      { path: 'parking', element: <ProtectedRoute><ParkingZone /></ProtectedRoute> },
      { path: 'success', element: <ProtectedRoute><Success /></ProtectedRoute> },
      { path: 'history', element: <ProtectedRoute><History /></ProtectedRoute> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'check-email', element: <CheckEmail /> },
      { path: 'households', element: <ProtectedRoute><HouseHolds /></ProtectedRoute> },
      { path: 'household/waiting', element: <ProtectedRoute><HouseholdWaiting /></ProtectedRoute> },
      { path: '*', element: <NotFound /> },

    ],
  },
]);

export default router;
