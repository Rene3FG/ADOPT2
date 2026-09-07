// src/pages/login/login.jsx — pantalla de login de escritorio.
// Mismo BLoC real que la vista mobile (useAuthBloc -> POST /login), solo
// cambia el diseño visual (rediseño de Rosaura).
import { RiBus2Line } from "react-icons/ri";
import { useAuthBloc } from "../../lib/logic/useAuthBloc";
import "./login.css";

function Login({ onLoginSuccess }) {
  const {
    idEmpleado, setIdEmpleado,
    password, setPassword,
    error, cargando, iniciarSesion
  } = useAuthBloc(onLoginSuccess);

  return (
    <div className="ado-desktop-login">
      <header className="top-bar">
        <div className="header-content">
          <div className="mini-bus">
            <RiBus2Line />
          </div>
          <div>
            <h2>ADO - Control de patio</h2>
            <p>Operaciones de flota</p>
          </div>
        </div>
      </header>

      <main className="login-container">
        <div className="login-card">
          <div className="bus-icon">
            <RiBus2Line className="bus-svg" />
          </div>

          <h1>SCA</h1>
          <p className="subtitle">
            Ingresa tu número de empleado para continuar
          </p>

          <form onSubmit={iniciarSesion}>
            <div className="input-group">
              <label htmlFor="idEmpleado">NÚMERO DE EMPLEADO</label>
              <input
                type="text"
                id="idEmpleado"
                placeholder="Ej: 1001"
                value={idEmpleado}
                onChange={(e) => setIdEmpleado(e.target.value)}
                disabled={cargando}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">CONTRASEÑA</label>
              <input
                type="password"
                id="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={cargando}
                required
              />
            </div>

            {error && (
              <div style={{ color: '#C62828', marginBottom: '15px', fontSize: '14px', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '8px', textAlign: 'left' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="login-button" disabled={cargando}>
              {cargando ? "Validando..." : "Entrar al sistema"}
            </button>
          </form>

          <p className="help-text">
            Si no puedes entrar, contacta a tu supervisor para activar tu turno.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
