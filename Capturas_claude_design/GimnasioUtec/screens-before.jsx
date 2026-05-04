/* UTEC GYM — Capturas "antes" (versión actual reproducida fielmente) */

const BeforeLogin = () => (
  <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative', overflow: 'hidden', fontFamily: 'system-ui' }}>
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.3), rgba(0,0,0,.85)), url("https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=70")`,
      backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5
    }}/>
    <div style={{ position: 'relative', padding: '120px 24px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <BrandMark size={50}/>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '12px 0 4px' }}>UTEC GYM</h1>
        <div style={{ color: '#aaa', fontSize: 13 }}>Inicia sesión con tu correo UTEC</div>
      </div>
      <div>
        <div style={{ color: '#ddd', fontSize: 12, marginBottom: 6 }}>Correo institucional</div>
        <input value="recepcion@utec.pe" readOnly style={{
          width: '100%', height: 44, padding: '0 14px', borderRadius: 999,
          background: '#f0f3f7', border: 0, color: '#000', fontSize: 14, marginBottom: 16
        }}/>
        <div style={{ color: '#ddd', fontSize: 12, marginBottom: 6 }}>Contraseña</div>
        <input type="password" value="••••••••" readOnly style={{
          width: '100%', height: 44, padding: '0 14px', borderRadius: 999,
          background: '#f0f3f7', border: 0, color: '#000', fontSize: 14, marginBottom: 20
        }}/>
        <button style={{
          width: '100%', height: 48, borderRadius: 999,
          background: '#00E5E5', color: '#000', fontWeight: 700, border: 0, fontSize: 14
        }}>Iniciar sesión</button>
        <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 18 }}>
          ¿No tienes cuenta? <span style={{ color: '#00E5E5', fontWeight: 600 }}>Regístrate</span>
        </div>
      </div>
    </div>
  </div>
);

const BeforeQR = () => (
  <div style={{ width: '100%', height: '100%', background: '#0a0a0a', padding: '50px 20px 80px', fontFamily: 'system-ui', overflow: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 13, color: '#888' }}>Bienvenido</div>
        <div style={{ fontSize: 22, color: '#fff', fontWeight: 700 }}>Diego Mamani</div>
      </div>
      <BrandMark size={26}/>
    </div>
    <div style={{ border: '1px solid #00E5E5', borderRadius: 12, padding: 16, marginBottom: 16, background: '#0d1518' }}>
      <div style={{ background: '#fff', borderRadius: 6, padding: 12, marginBottom: 8 }}>
        <QRPattern/>
      </div>
      <div style={{ textAlign: 'center', color: '#888', fontSize: 12 }}>Renueva en 29s</div>
    </div>
    <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 16 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999, border: '1.5px dashed #444',
        margin: '0 auto 12px', display: 'grid', placeItems: 'center', color: '#666'
      }}>{Icons.scan}</div>
      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Sin sesión activa</div>
      <div style={{ color: '#777', fontSize: 12, marginTop: 4 }}>Muestra tu QR en la entrada del gym</div>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 10, padding: 14 }}>
        <div style={{ color: '#00E5E5', fontSize: 22, fontWeight: 700 }}>1438</div>
        <div style={{ color: '#888', fontSize: 11 }}>Puntos</div>
      </div>
      <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 10, padding: 14 }}>
        <div style={{ color: '#666', fontSize: 22, fontWeight: 700 }}>—</div>
        <div style={{ color: '#888', fontSize: 11 }}>Rank</div>
      </div>
    </div>
  </div>
);

const BeforeReception = () => (
  <div style={{ width: '100%', height: '100%', background: '#0a0a0a', fontFamily: 'system-ui', padding: 16, color: '#ddd', fontSize: 12 }}>
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: '#00E5E5', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em' }}>UTEC GYM</div>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Panel de Recepción</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
      {[
        ['OCUPACIÓN ACTUAL', '0 / 100', '0% de aforo'],
        ['ACTIVOS AHORA', '0', 'De los últimos 20 ingresos'],
        ['ÚLTIMA ACTUALIZACIÓN', '08:39:31 p.m.', 'Auto-refresh cada 10s'],
      ].map(([k, v, s], i) => (
        <div key={i} style={{ background: '#161616', border: '1px solid #222', borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 9, color: '#666', letterSpacing: '0.06em' }}>{k}</div>
          <div style={{ fontSize: 22, color: i < 2 ? '#00E5E5' : '#fff', fontWeight: 700, margin: '4px 0' }}>{v}</div>
          <div style={{ fontSize: 9, color: '#666' }}>{s}</div>
        </div>
      ))}
    </div>
    <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 6, padding: 10 }}>
      <input placeholder="Buscar por nombre, correo o facultad..." readOnly style={{
        width: '100%', height: 28, background: 'transparent', border: '1px solid #333',
        borderRadius: 4, padding: '0 10px', color: '#888', fontSize: 11, marginBottom: 8
      }}/>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr><th style={{ textAlign: 'left', color: '#666', padding: '6px 4px', fontSize: 9 }}>ALUMNO</th>
              <th style={{ textAlign: 'left', color: '#666', padding: '6px 4px', fontSize: 9 }}>FAC.</th>
              <th style={{ textAlign: 'left', color: '#666', padding: '6px 4px', fontSize: 9 }}>ENT.</th>
              <th style={{ textAlign: 'left', color: '#666', padding: '6px 4px', fontSize: 9 }}>SAL.</th>
              <th style={{ textAlign: 'right', color: '#666', padding: '6px 4px', fontSize: 9 }}>PTS</th>
              <th style={{ textAlign: 'left', color: '#666', padding: '6px 4px', fontSize: 9 }}>EST.</th></tr>
        </thead>
        <tbody>
          {['Diego Mamani BIO 11:45 PM 01:46 AM 1438', 'Miguel Ortiz CDIA 02:13 PM 04:16 PM 491',
            'Héctor Rodríguez AND 02:09 PM 04:11 PM 960', 'Camila Vargas BIO 02:04 PM 04:06 PM 644',
            'Mónica Vega MEC 02:03 PM 04:06 PM 1138', 'Cristian García MEC 02:00 PM 04:01 PM 622'].map((row, i) => {
            const parts = row.split(' ');
            const pts = parts.pop(); const out = parts.slice(-2).join(' '); const inT = parts.slice(-4, -2).join(' ');
            const fac = parts[parts.length - 5]; const name = parts.slice(0, -5).join(' ');
            return (
              <tr key={i} style={{ borderTop: '1px solid #1a1a1a' }}>
                <td style={{ padding: '7px 4px', color: '#fff', fontWeight: 500 }}>{name}<div style={{ color: '#555', fontSize: 9 }}>aXXXXXXXX@utec.edu.pe</div></td>
                <td style={{ padding: '7px 4px', color: '#888' }}>{fac}</td>
                <td style={{ padding: '7px 4px', color: '#888' }}>{inT}</td>
                <td style={{ padding: '7px 4px', color: '#888' }}>{out}</td>
                <td style={{ padding: '7px 4px', textAlign: 'right', color: '#00E5E5', fontWeight: 600 }}>{pts}</td>
                <td style={{ padding: '7px 4px' }}><span style={{ fontSize: 9, color: '#555', border: '1px solid #333', borderRadius: 3, padding: '2px 6px' }}>○ Cerrado</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

Object.assign(window, { BeforeLogin, BeforeQR, BeforeReception });
