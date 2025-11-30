import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home/Home.jsx';
import Profile from './pages/Profile/Profile.jsx';
import NotFound from './pages/NotFound.jsx';
import CameraCapture from './components/cameracapture/CameraCapture.jsx';
import ParkingZone from './components/parkingzone/ParkingZone.jsx';
import Success from './pages/Success.jsx';
import History from './pages/History/History.jsx';
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'profil', element: <Profile /> },
      { path: '*', element: <NotFound /> },
      { path: 'camera', element: <CameraCapture /> },
      { path: 'parking', element: <ParkingZone /> },
      { path: 'success', element: <Success /> },
      { path: 'history', element: <History /> },

    ],
  },
]);

export default router;
