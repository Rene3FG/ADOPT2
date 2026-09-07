import { useState, useEffect } from 'react'
import './App.css'
import Login from './pages/login/login.jsx'
import DropDrag from './pages/Patio/DropDrag.jsx'
import { useIsMobile } from './lib/hooks/useIsMobile.js'
import { LoginPage } from './lib/presentation/pages/LoginPage.jsx'
import { PatioPage } from './lib/presentation/pages/PatioPage.jsx'

// Sesión compartida por mobile y escritorio: mismo localStorage ('sesionAdo')
// y mismo useAuthBloc (POST /login real) — antes DesktopApp usaba un stack
// de auth paralelo (AuthContext/authService/react-router) que nunca llegó a
// conectarse a la SCA API real.
function useSesion() {
  const [usuarioActual, setUsuarioActual] = useState(null)
  const [verificandoSesion, setVerificandoSesion] = useState(true)

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('sesionAdo')
    if (sesionGuardada) {
      try {
        setUsuarioActual(JSON.parse(sesionGuardada))
      } catch {
        localStorage.removeItem('sesionAdo')
      }
    }
    setVerificandoSesion(false)
  }, [])

  const iniciarSesion = (datos) => {
    localStorage.setItem('sesionAdo', JSON.stringify(datos))
    setUsuarioActual(datos)
  }

  const cerrarSesion = () => setUsuarioActual(null)

  return { usuarioActual, verificandoSesion, iniciarSesion, cerrarSesion }
}

function PantallaCarga() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
      <h2 style={{ color: '#6b21a8' }}>Cargando sistema...</h2>
    </div>
  )
}

function MobileApp() {
  const { usuarioActual, verificandoSesion, iniciarSesion } = useSesion()

  if (verificandoSesion) return <PantallaCarga />
  if (!usuarioActual) return <LoginPage onLoginSuccess={iniciarSesion} />
  return <PatioPage usuario={usuarioActual} />
}

function DesktopApp() {
  const { usuarioActual, verificandoSesion, iniciarSesion, cerrarSesion } = useSesion()

  if (verificandoSesion) return <PantallaCarga />
  if (!usuarioActual) return <Login onLoginSuccess={iniciarSesion} />
  return <DropDrag usuario={usuarioActual} onLogout={cerrarSesion} />
}

function App() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileApp /> : <DesktopApp />
}

export default App
