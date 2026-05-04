/* UTEC GYM — Historial + Detalle de sesión + Ranking + Perfil */

const HistoryScreen = () => {
  const sessions = [
    { date: 'Mar, 28 Abr', time: '11:45 PM', mins: 120, pts: 27, type: 'auto', penalty: true },
    { date: 'Dom, 26 Abr', time: '01:01 AM', mins: 124, pts: 27, type: 'auto', penalty: true },
    { date: 'Sáb, 25 Abr', time: '12:03 PM', mins: 83, pts: 26, type: 'manual' },
    { date: 'Vie, 24 Abr', time: '12:42 PM', mins: 64, pts: 22, type: 'manual' },
    { date: 'Jue, 23 Abr', time: '09:36 AM', mins: 74, pts: 24, type: 'geofence' },
    { date: 'Mié, 22 Abr', time: '09:00 AM', mins: 26, pts: 15, type: 'manual' },
    { date: 'Lun, 20 Abr', time: '02:33 PM', mins: 44, pts: 18, type: 'manual' },
    { date: 'Sáb, 18 Abr', time: '11:05 AM', mins: 53, pts: 16, type: 'auto', penalty: true },
  ];

  const typeMeta = {
    manual:   { label: 'Manual',   tone: 'success', accent: 'var(--success)', desc: 'Inicio y fin con QR' },
    auto:     { label: 'Auto',     tone: 'warning', accent: 'var(--warning)', desc: 'Cierre automático' },
    geofence: { label: 'Geofence', tone: 'info',    accent: 'var(--brand)',   desc: 'Detectada por ubicación' },
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '48px 20px 100px' }}>
        <PageHeader kicker="Últimas sesiones" title="Historial" />

        {/* Resumen */}
        <Card style={{ marginTop: 4, marginBottom: 16 }}>
          <div className="row between">
            <div>
              <div className="eyebrow">Esta semana</div>
              <div className="font-display tabular" style={{
                fontSize: 28, fontWeight: 700, color: 'var(--fg-hi)', letterSpacing: '-0.02em', marginTop: 2
              }}>
                4<span style={{ color: 'var(--fg-mute)', fontSize: 16 }}> sesiones</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="eyebrow">Total puntos</div>
              <div className="font-display tabular" style={{
                fontSize: 28, fontWeight: 700, color: 'var(--brand)', letterSpacing: '-0.02em', marginTop: 2
              }}>+99</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Progress value={4} max={6} color="var(--brand)" height={4}/>
            <div style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 6 }}>
              Meta semanal: 6 sesiones
            </div>
          </div>
        </Card>

        {/* Leyenda compacta */}
        <div className="row gap-3" style={{ marginBottom: 12, fontSize: 11, color: 'var(--fg-mute)', flexWrap: 'wrap' }}>
          {Object.entries(typeMeta).map(([k, m]) => (
            <div key={k} className="row gap-2">
              <span style={{ width: 3, height: 12, background: m.accent, borderRadius: 2 }}/>
              <span>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map((s, i) => {
            const m = typeMeta[s.type];
            return (
              <div key={i} className="ds-card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
                <span style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: 3, background: m.accent
                }}/>
                <div style={{ padding: '14px 16px 14px 18px' }}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div className="row gap-2 font-mono" style={{ fontSize: 12, color: 'var(--fg-mute)' }}>
                      <span style={{ color: 'var(--fg-hi)', fontWeight: 600 }}>{s.date}</span>
                      <span>·</span>
                      <span>{s.time}</span>
                    </div>
                    <Badge tone={m.tone}>{m.label}</Badge>
                  </div>
                  <div className="row between" style={{ alignItems: 'center' }}>
                    <div className="row gap-3" style={{ alignItems: 'baseline' }}>
                      <span className="font-display tabular" style={{
                        fontSize: 22, fontWeight: 700, color: 'var(--fg-hi)', letterSpacing: '-0.01em'
                      }}>{s.mins}<span style={{ fontSize: 13, color: 'var(--fg-mute)', fontWeight: 500 }}> min</span></span>
                      <span className="font-display tabular" style={{
                        fontSize: 18, fontWeight: 700, color: s.penalty ? 'var(--warning)' : 'var(--action)'
                      }}>+{s.pts}<span style={{ fontSize: 11, color: 'var(--fg-mute)', fontWeight: 500, marginLeft: 2 }}>pts</span></span>
                      {s.penalty && (
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--warning)' }}>
                          –20%
                        </span>
                      )}
                    </div>
                    <button className="btn btn-ghost" style={{ height: 32, padding: '0 8px', color: 'var(--fg-mute)' }}>
                      {Icons.chev}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav active="history" />
    </div>
  );
};

// ── DETALLE DE SESIÓN ─────────────────────────────────────────────────────
const SessionDetailScreen = () => {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '50px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-icon" style={{ height: 40, width: 40, color: 'var(--fg-hi)' }}>
          <span style={{ transform: 'rotate(180deg)', display: 'flex' }}>{Icons.arrow}</span>
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Detalle</div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg-hi)' }}>
            Sáb, 25 Abr · 12:03 PM
          </div>
        </div>
        <Badge tone="success">Manual</Badge>
      </header>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 24px' }}>
        {/* KPIs */}
        <div className="row gap-3" style={{ marginBottom: 16 }}>
          <Stat value="83" label="Minutos" mono />
          <Stat value="+26" label="Puntos" accent="var(--action)" />
          <Stat value="6" label="Ejercicios" mono />
        </div>

        {/* Timeline */}
        <Card style={{ marginBottom: 16 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <span className="eyebrow">Timeline</span>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>
              12:03 → 13:26
            </span>
          </div>
          {[
            { t: '12:03', icon: Icons.scan, label: 'Check-in', sub: 'QR escaneado en recepción', tone: 'success' },
            { t: '12:08', icon: Icons.zap, label: 'Calentamiento', sub: '5 min · Bicicleta', tone: 'neutral' },
            { t: '12:14', icon: Icons.routine, label: 'Bench Press', sub: '4×8-12 · 60 kg', tone: 'neutral' },
            { t: '12:36', icon: Icons.routine, label: 'OHP', sub: '4×8-12 · 35 kg', tone: 'neutral' },
            { t: '13:00', icon: Icons.routine, label: 'Dips', sub: '3×10 · BW', tone: 'neutral' },
            { t: '13:26', icon: Icons.check, label: 'Check-out', sub: 'Cerrado correctamente', tone: 'success' },
          ].map((step, i, arr) => (
            <div key={i} className="row gap-3" style={{ alignItems: 'flex-start', position: 'relative', paddingBottom: i === arr.length - 1 ? 0 : 12 }}>
              <div className="font-mono tabular" style={{ fontSize: 11, color: 'var(--fg-mute)', width: 40, paddingTop: 6 }}>
                {step.t}
              </div>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: step.tone === 'success' ? 'var(--success-bg)' : 'var(--bg-raised)',
                  color: step.tone === 'success' ? 'var(--success)' : 'var(--fg-mute)',
                  display: 'grid', placeItems: 'center', flexShrink: 0, zIndex: 1
                }}>
                  {React.cloneElement(step.icon, { props: { size: 14 } })}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, width: 1, background: 'var(--line)', minHeight: 16 }}/>
                )}
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-hi)' }}>{step.label}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-mute)' }}>{step.sub}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Puntos */}
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Cálculo de puntos</div>
          {[
            { label: 'Tiempo (83 min)', val: '+18' },
            { label: 'Constancia (3 días)', val: '+5' },
            { label: 'Bonus rutina completa', val: '+3' },
          ].map(r => (
            <div key={r.label} className="row between" style={{ padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--fg-base)' }}>{r.label}</span>
              <span className="font-mono tabular" style={{ color: 'var(--fg-hi)', fontWeight: 600 }}>{r.val}</span>
            </div>
          ))}
          <div className="row between" style={{
            paddingTop: 10, marginTop: 6,
            borderTop: '1px solid var(--line-muted)',
            fontSize: 14
          }}>
            <span style={{ fontWeight: 600, color: 'var(--fg-hi)' }}>Total</span>
            <span className="font-display tabular" style={{ fontSize: 20, fontWeight: 700, color: 'var(--action)' }}>+26 pts</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

Object.assign(window, { HistoryScreen, SessionDetailScreen });
