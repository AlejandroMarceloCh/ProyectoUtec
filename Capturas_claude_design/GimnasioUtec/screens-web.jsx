/* UTEC GYM — Pantallas web: Panel de Recepción + Scanner + Alumno detail */

const ReceptionPanel = () => {
  const [filter, setFilter] = React.useState('todos');
  const [search, setSearch] = React.useState('');

  const students = [
    { name: 'Diego Mamani', code: 'a20200053', faculty: 'BIO', in: '11:45 PM', out: '01:46 AM', pts: 1438, status: 'closed', mins: 121 },
    { name: 'Miguel Ortiz', code: 'a20200048', faculty: 'CDIA', in: '02:13 PM', out: '04:16 PM', pts: 491, status: 'closed', mins: 123 },
    { name: 'Héctor Rodríguez', code: 'a20200049', faculty: 'AND', in: '02:09 PM', out: '04:11 PM', pts: 960, status: 'closed', mins: 122 },
    { name: 'Camila Vargas', code: 'a20200008', faculty: 'BIO', in: '02:04 PM', out: '04:06 PM', pts: 644, status: 'closed', mins: 122 },
    { name: 'Mónica Vega', code: 'a20200060', faculty: 'MEC', in: '02:03 PM', out: '04:06 PM', pts: 1138, status: 'closed', mins: 123 },
    { name: 'Cristian García', code: 'a20200120', faculty: 'MEC', in: '02:00 PM', out: '04:01 PM', pts: 622, status: 'closed', mins: 121 },
    { name: 'Héctor Vega', code: 'a20200015', faculty: 'ELE', in: '01:57 PM', out: '04:01 PM', pts: 1066, status: 'closed', mins: 124 },
    { name: 'Carlos Villanueva', code: 'a20200021', faculty: 'BIO', in: '01:55 PM', out: '04:01 PM', pts: 386, status: 'closed', mins: 126 },
    { name: 'Verónica Pérez', code: 'a20200095', faculty: 'SI', in: '01:52 PM', out: '03:56 PM', pts: 1116, status: 'closed', mins: 124 },
    { name: 'Rafael Mamani', code: 'a20200070', faculty: 'BA', in: '01:33 PM', out: '03:36 PM', pts: 891, status: 'closed', mins: 123 },
    { name: 'Kevin Ramírez', code: 'a20200006', faculty: 'CIV', in: '01:32 PM', out: '03:36 PM', pts: 1004, status: 'active', mins: 124 },
    { name: 'Carolina Rojas', code: 'a20200017', faculty: 'ELE', in: '01:12 PM', out: '03:16 PM', pts: 1195, status: 'active', mins: 124 },
    { name: 'Renato Reyes', code: 'a20200059', faculty: 'IND', in: '01:12 PM', out: '03:16 PM', pts: 859, status: 'active', mins: 124 },
  ];

  const filtered = students.filter(s => {
    if (filter === 'activos' && s.status !== 'active') return false;
    if (filter === 'cerrados' && s.status !== 'closed') return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.code.includes(search) && !s.faculty.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const facultyColors = window.UTEC_TOKENS?.color?.faculty || {};

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        padding: '16px 24px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-sunken)'
      }}>
        <div className="row gap-3">
          <BrandMark size={26}/>
          <div>
            <div className="eyebrow" style={{ color: 'var(--brand)' }}>UTEC · GYM</div>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-hi)' }}>Panel de Recepción</div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div className="row gap-2 font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>
          <span style={{ width: 6, height: 6, background: 'var(--success)', borderRadius: 999, animation: 'pulse 2s infinite' }}/>
          Auto-refresh cada 10s · 08:39:31 PM
        </div>
        <button className="btn btn-secondary btn-sm">{Icons.scan} Abrir Scanner</button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--fg-mute)' }}>{Icons.logout} Salir</button>
      </header>

      {/* KPIs */}
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard
          label="Ocupación actual"
          value="42"
          sub="/ 100"
          accent="var(--brand)"
          progress={42}
          tone="success"
          extra="42% del aforo"
        />
        <KpiCard
          label="Activos ahora"
          value="3"
          sub="alumnos"
          accent="var(--success)"
          extra="+2 últimos 20 min"
        />
        <KpiCard
          label="Hoy"
          value="58"
          sub="ingresos"
          accent="var(--fg-hi)"
          extra="vs. 42 ayer · +38%"
          extraTone="success"
        />
        <KpiCard
          label="Tiempo promedio"
          value="01:18"
          sub="hrs"
          accent="var(--fg-hi)"
          mono
          extra="por sesión hoy"
        />
      </div>

      {/* Tabla */}
      <div style={{ flex: 1, padding: '0 24px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="ds-card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            padding: 16, borderBottom: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-mute)' }}>
                {Icons.search}
              </span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, código o facultad…"
                className="ds-input"
                style={{ paddingLeft: 40, height: 40 }}
              />
            </div>
            <Segmented
              items={[
                { label: `Todos (${students.length})`, value: 'todos' },
                { label: `Activos (${students.filter(s=>s.status==='active').length})`, value: 'activos' },
                { label: `Cerrados (${students.filter(s=>s.status==='closed').length})`, value: 'cerrados' },
              ]}
              value={filter}
              onChange={setFilter}
            />
            <button className="btn btn-secondary btn-sm">Exportar CSV</button>
          </div>

          {/* Tabla */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-sunken)', zIndex: 1 }}>
                  {['Alumno','Facultad','Entrada','Salida','Duración','Puntos','Estado'].map(h => (
                    <th key={h} className="eyebrow" style={{
                      textAlign: 'left', padding: '10px 16px', fontWeight: 500,
                      borderBottom: '1px solid var(--line)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--line-muted)',
                    transition: 'background var(--t-fast)',
                    cursor: 'pointer'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--fg-hi)' }}>{s.name}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>
                        {s.code}@utec.edu.pe
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '3px 8px', borderRadius: 6,
                        background: 'var(--bg-raised)',
                        fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.04em',
                        color: facultyColors[s.faculty] || 'var(--fg-base)'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: facultyColors[s.faculty] || 'var(--fg-mute)' }}/>
                        {s.faculty}
                      </span>
                    </td>
                    <td className="font-mono tabular" style={{ padding: '12px 16px', color: 'var(--fg-base)' }}>{s.in}</td>
                    <td className="font-mono tabular" style={{ padding: '12px 16px', color: s.status === 'active' ? 'var(--fg-dim)' : 'var(--fg-base)' }}>
                      {s.status === 'active' ? '—' : s.out}
                    </td>
                    <td className="font-mono tabular" style={{ padding: '12px 16px', color: 'var(--fg-mute)' }}>
                      {Math.floor(s.mins/60)}h {s.mins%60}m
                    </td>
                    <td className="font-mono tabular" style={{ padding: '12px 16px', color: 'var(--brand)', fontWeight: 600 }}>
                      {s.pts}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.status === 'active'
                        ? <Badge tone="success" dot>Activa</Badge>
                        : <Badge tone="neutral">Cerrada</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }`}</style>
    </div>
  );
};

const KpiCard = ({ label, value, sub, accent, progress, tone, extra, extraTone, mono }) => (
  <div className="ds-card" style={{ padding: 18 }}>
    <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
    <div className="row" style={{ alignItems: 'baseline', gap: 6 }}>
      <span className="font-display tabular" style={{
        fontSize: 36, fontWeight: 700, color: accent || 'var(--fg-hi)',
        letterSpacing: '-0.02em', lineHeight: 1,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)'
      }}>{value}</span>
      {sub && <span style={{ fontSize: 14, color: 'var(--fg-mute)' }}>{sub}</span>}
    </div>
    {progress != null && (
      <div style={{ marginTop: 12 }}>
        <Progress value={progress} max={100} color={accent} height={4}/>
      </div>
    )}
    {extra && (
      <div style={{ marginTop: 8, fontSize: 11, color: extraTone === 'success' ? 'var(--success)' : 'var(--fg-mute)' }}>
        {extra}
      </div>
    )}
  </div>
);

// ── SCANNER ───────────────────────────────────────────────────────────────
const ScannerScreen = () => {
  const [lastScan, setLastScan] = React.useState({
    name: 'Diego Mamani', code: 'a20200053', faculty: 'BIO', time: '8:40:21 PM', pts: 1438
  });

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        padding: '14px 24px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-sunken)'
      }}>
        <div className="row gap-3">
          <BrandMark size={22}/>
          <div className="eyebrow" style={{ color: 'var(--brand)' }}>UTEC · GYM · Scanner</div>
        </div>
        <div style={{ flex: 1 }}/>
        <Badge tone="success" dot>Conectado</Badge>
        <div className="font-mono tabular" style={{ fontSize: 12, color: 'var(--fg-mute)' }}>
          <span style={{ color: 'var(--fg-hi)', fontWeight: 600 }}>42</span>/100 activos · 42%
        </div>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--fg-mute)' }}>Salir</button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', overflow: 'hidden' }}>
        {/* Cámara */}
        <div style={{ position: 'relative', background: 'var(--bg-sunken)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          <div style={{
            width: 'min(60vh, 480px)', aspectRatio: 1, borderRadius: 20, overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(135deg, #1a1d24 0%, #0a0b0d 100%)'
          }}>
            {/* Fake camera content */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,.08), transparent 50%)`,
            }}/>

            {/* Scan corners */}
            {[
              { top: 24, left: 24, br: '0 0 0 4px', bl: '4px 0 0 4px' },
              { top: 24, right: 24, br: '0 0 4px 0', bl: '0 4px 0 4px' },
              { bottom: 24, left: 24, br: '0 4px 0 0', bl: '4px 0 4px 0' },
              { bottom: 24, right: 24, br: '4px 0 0 0', bl: '0 0 4px 4px' },
            ].map((c, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: c.top, left: c.left, right: c.right, bottom: c.bottom,
                width: 32, height: 32,
                borderTop: c.top != null ? '3px solid var(--brand)' : 'none',
                borderBottom: c.bottom != null ? '3px solid var(--brand)' : 'none',
                borderLeft: c.left != null ? '3px solid var(--brand)' : 'none',
                borderRight: c.right != null ? '3px solid var(--brand)' : 'none',
                borderRadius: c.bl
              }}/>
            ))}

            {/* Scan line animation */}
            <div style={{
              position: 'absolute', left: 24, right: 24, height: 2,
              background: 'linear-gradient(90deg, transparent, var(--brand), transparent)',
              boxShadow: '0 0 12px var(--brand)',
              animation: 'scanline 2.5s ease-in-out infinite'
            }}/>

            {/* Center hint */}
            <div style={{
              position: 'absolute', bottom: 56, left: 0, right: 0,
              textAlign: 'center', color: 'rgba(255,255,255,.7)', fontSize: 13
            }}>
              Apunta la cámara al QR del alumno
            </div>
          </div>

          {/* Status mono terminal */}
          <div style={{
            position: 'absolute', bottom: 24, left: 24, right: 24,
            background: 'rgba(6,7,10,.85)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--line)', borderRadius: 8,
            padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--fg-mute)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div className="row gap-3">
              <span style={{ color: 'var(--success)' }}>●</span>
              <span>cámara lista · enfoque OK</span>
            </div>
            <span>FPS 30</span>
          </div>
        </div>

        {/* Side panel: último escaneo + log */}
        <aside style={{ borderLeft: '1px solid var(--line)', padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="eyebrow">Último ingreso</div>

          <Card variant="brand" style={{ padding: 18 }}>
            <div className="row gap-3" style={{ marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 999,
                background: 'var(--brand-glow)', border: '2px solid var(--brand)',
                display: 'grid', placeItems: 'center'
              }}>
                <span className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand)' }}>DM</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-hi)' }}>{lastScan.name}</div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>{lastScan.code}@utec.edu.pe</div>
              </div>
              <Badge tone="success" dot>OK</Badge>
            </div>

            <div className="row gap-2" style={{ marginBottom: 12 }}>
              <Badge tone="info">{lastScan.faculty}</Badge>
              <Badge tone="neutral">{lastScan.pts.toLocaleString()} pts</Badge>
            </div>

            <div className="row between font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)', paddingTop: 10, borderTop: '1px solid var(--line-muted)' }}>
              <span>Check-in</span>
              <span style={{ color: 'var(--fg-hi)' }}>{lastScan.time}</span>
            </div>
          </Card>

          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Eventos</div>
            <div style={{
              background: 'var(--bg-sunken)', borderRadius: 10, padding: 12,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--fg-mute)', maxHeight: 220, overflow: 'auto',
              border: '1px solid var(--line)'
            }}>
              {[
                ['8:40:21', 'Diego Mamani · check-in', 'success'],
                ['8:39:54', 'Camila Vargas · check-out', 'info'],
                ['8:38:12', 'Kevin Ramírez · check-in', 'success'],
                ['8:36:02', 'QR expirado · reintenta', 'warning'],
                ['8:34:50', 'Renato Reyes · check-in', 'success'],
                ['8:33:02', 'Cámara lista', 'mute'],
                ['8:33:00', 'Iniciando cámara…', 'mute'],
              ].map(([t, msg, tone], i) => (
                <div key={i} className="row gap-2" style={{ padding: '3px 0', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--fg-dim)', flexShrink: 0 }}>{t}</span>
                  <span style={{
                    color: tone === 'success' ? 'var(--success)' :
                           tone === 'warning' ? 'var(--warning)' :
                           tone === 'info' ? 'var(--brand)' : 'var(--fg-mute)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`@keyframes scanline {
        0% { top: 24px; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: calc(100% - 24px); opacity: 0; }
      }`}</style>
    </div>
  );
};

// ── ALUMNO DETAIL ─────────────────────────────────────────────────────────
const StudentDetail = () => {
  const facultyColors = window.UTEC_TOKENS?.color?.faculty || {};
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', overflow: 'auto' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)' }}>
        <div className="row gap-3">
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--fg-mute)' }}>
            <span style={{ transform: 'rotate(180deg)', display: 'flex' }}>{Icons.arrow}</span> Volver
          </button>
          <span style={{ color: 'var(--fg-dim)' }}>/</span>
          <span className="eyebrow">Alumno</span>
        </div>
      </header>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {/* Hero */}
        <div className="row gap-4" style={{ marginBottom: 24, alignItems: 'flex-start' }}>
          <div style={{
            width: 96, height: 96, borderRadius: 999, flexShrink: 0,
            background: 'var(--brand-glow)', border: '2px solid var(--brand)',
            display: 'grid', placeItems: 'center'
          }}>
            <span className="font-display" style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand)' }}>DM</span>
          </div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Estudiante · BIO · 6° ciclo</div>
            <h1 className="font-display" style={{
              margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--fg-hi)', letterSpacing: '-0.02em'
            }}>Diego Mamani</h1>
            <div className="font-mono" style={{ fontSize: 13, color: 'var(--fg-mute)', marginTop: 4 }}>
              a20200053@utec.edu.pe · Reg. 2020-08-15
            </div>
            <div className="row gap-2" style={{ marginTop: 10 }}>
              <Badge tone="success" dot>Sesión activa</Badge>
              <span style={{
                padding: '3px 8px', borderRadius: 6, background: 'var(--bg-raised)',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                color: facultyColors.BIO
              }}>BIO · Bioingeniería</span>
            </div>
          </div>
          <div className="row gap-2">
            <button className="btn btn-secondary btn-sm">Forzar cierre</button>
            <button className="btn btn-secondary btn-sm">Ver historial completo</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <Stat value="1,438" label="Puntos totales" accent="var(--brand)" />
          <Stat value="68" label="Sesiones" />
          <Stat value="67.2" label="Horas totales" />
          <Stat value="01:24" label="Promedio" mono />
        </div>

        {/* Sesión actual */}
        <Card style={{ marginBottom: 16 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="eyebrow">Sesión en curso</div>
            <Badge tone="success" dot>Activa</Badge>
          </div>
          <div className="row gap-6">
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)' }}>Check-in</div>
              <div className="font-mono tabular" style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg-hi)', marginTop: 2 }}>
                07:32 PM
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)' }}>Tiempo</div>
              <div className="font-mono tabular" style={{ fontSize: 18, fontWeight: 600, color: 'var(--brand)', marginTop: 2 }}>
                01:08:15
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)' }}>Método</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-hi)', marginTop: 4 }}>
                <Badge tone="success">Manual</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Recientes */}
        <Card style={{ padding: 0 }}>
          <div className="row between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-muted)' }}>
            <div className="eyebrow">Sesiones recientes</div>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>últimas 7</span>
          </div>
          {[
            ['Sáb, 25 Abr', '12:03 PM', 83, 26, 'manual'],
            ['Vie, 24 Abr', '12:42 PM', 64, 22, 'manual'],
            ['Jue, 23 Abr', '09:36 AM', 74, 24, 'geofence'],
            ['Mié, 22 Abr', '09:00 AM', 26, 15, 'manual'],
          ].map((r, i) => (
            <div key={i} className="row between" style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--line-muted)'
            }}>
              <div className="row gap-3 font-mono" style={{ fontSize: 12, color: 'var(--fg-mute)' }}>
                <span style={{ color: 'var(--fg-hi)', fontWeight: 600, width: 100 }}>{r[0]}</span>
                <span style={{ width: 80 }}>{r[1]}</span>
              </div>
              <div className="row gap-4 font-mono tabular" style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--fg-base)' }}>{r[2]} min</span>
                <span style={{ color: 'var(--brand)', fontWeight: 600 }}>+{r[3]} pts</span>
                <Badge tone={r[4] === 'manual' ? 'success' : 'info'}>{r[4]}</Badge>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

Object.assign(window, { ReceptionPanel, KpiCard, ScannerScreen, StudentDetail });
