import { useState } from 'react'
import appLogo from '/IconParking-512.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Parking App</h1>
      <p>Welcome to the parking app!</p>

      <img src={appLogo} alt="Parking App logo" />
    </>
  )
}

export default App
