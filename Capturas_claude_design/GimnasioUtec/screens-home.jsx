/* UTEC GYM — Mi QR (pantalla de inicio) + En Vivo */

const MyQRScreen = () => {
  const [secs, setSecs] = React.useState(29);
  React.useEffect(() => {
    const id = setInterval(() => setSecs(s => s > 0 ? s - 1 : 30), 1000);
    return () => clearInterval(id);
  }, []);

  const memberId = 'A20200053';
  const issued = '14:08';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '52px 20px 100px' }}>
        {/* Header */}
        <div className="row between" style={{ marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--fg-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              Mi acceso
            </div>
            <h1 className="font-display" style={{
              margin: '2px 0 0', fontSize: 22, fontWeight: 700,
              letterSpacing: '-0.01em', color: 'var(--fg-hi)'
            }}>Diego Mamani</h1>
          </div>
          <BrandMark size={28} />
        </div>

        {/* Pase de acceso — credencial unificada */}
        <AccessPass
          name="Diego Mamani"
          memberId={memberId}
          issued={issued}
          secs={secs}
        />

        {/* Quick stats — fila inferior, 3 columnas iguales que respetan el rectángulo del pase */}
        <div className="row gap-2" style={{ marginTop: 16 }}>
          <PassStat icon={Icons.trophy} label="Puntos" value="1,438" accent="var(--brand)" />
          <PassStat icon={Icons.medal} label="Ranking BIO" value="#2" />
          <PassStat icon={Icons.calendar} label="Sesiones" value="68" />
        </div>

        {/* Aforo */}
        <div style={{
          marginTop: 16,
          padding: '14px 16px',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-card)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--success-bg)', color: 'var(--success)',
            display: 'grid', placeItems: 'center'
          }}>
            {Icons.pulse}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-mute)' }}>Aforo del gym ahora</div>
            <div className="font-display tabular" style={{
              fontSize: 18, fontWeight: 700, color: 'var(--fg-hi)', letterSpacing: '-0.01em', lineHeight: 1.1
            }}>
              42<span style={{ color: 'var(--fg-dim)', fontSize: 13, fontWeight: 500 }}> / 100</span>
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 500,
                color: 'var(--success)', background: 'var(--success-bg)',
                padding: '2px 8px', borderRadius: 999
              }}>Disponible</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="qr" />
    </div>
  );
};

// ── ACCESS PASS · credencial unificada con QR integrado ────────────────────
const AccessPass = ({ name, memberId, issued, secs }) => {
  const pct = (30 - secs) / 30;
  // SVG de la "credencial" — todo en una sola pieza para que nada se vea desalineado
  return (
    <div style={{
      position: 'relative',
      borderRadius: 20,
      overflow: 'hidden',
      background: 'linear-gradient(180deg, rgba(34,211,238,0.10) 0%, var(--bg-elev) 60%)',
      border: '1px solid var(--border-strong)',
      boxShadow: '0 24px 60px -28px rgba(34,211,238,0.35), 0 1px 0 rgba(255,255,255,0.04) inset'
    }}>
      {/* Banda superior — meta info */}
      <div style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px dashed var(--border)'
      }}>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)',
            boxShadow: '0 0 8px var(--brand)'
          }}/>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)', letterSpacing: '0.06em' }}>
            UTEC GYM · PASE DIGITAL
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>
          ID {memberId}
        </span>
      </div>

      {/* "Recortes" laterales tipo ticket */}
      <span style={{
        position: 'absolute', left: -10, top: 'calc(48px + 110px)', width: 20, height: 20,
        borderRadius: '50%', background: 'var(--bg)'
      }}/>
      <span style={{
        position: 'absolute', right: -10, top: 'calc(48px + 110px)', width: 20, height: 20,
        borderRadius: '50%', background: 'var(--bg)'
      }}/>

      {/* QR — protagonista, centrado matemáticamente */}
      <div style={{
        padding: '28px 24px 24px',
        display: 'grid',
        placeItems: 'center'
      }}>
        <div style={{
          position: 'relative',
          width: 232, height: 232,
          background: '#fff',
          borderRadius: 16,
          padding: 14,
          boxShadow: '0 0 0 1px rgba(34,211,238,0.25), 0 12px 32px -12px rgba(34,211,238,0.4)'
        }}>
          <QRPattern />
          {/* Logo en el centro, sobre fondo blanco para legibilidad del QR */}
          <div style={{
            position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: '#0A0B0D',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 0 0 4px #fff'
            }}>
              <BrandMark size={22} color="var(--brand)" />
            </div>
          </div>
          {/* Esquinas de marca — perfectamente alineadas a las esquinas del padding */}
          {['tl','tr','bl','br'].map(c => {
            const off = 6;
            return (
              <span key={c} style={{
                position: 'absolute', width: 14, height: 14,
                borderColor: 'var(--brand)', borderStyle: 'solid', borderWidth: 0,
                ...(c.includes('t') ? { top: off, borderTopWidth: 2 } : { bottom: off, borderBottomWidth: 2 }),
                ...(c.includes('l') ? { left: off, borderLeftWidth: 2 } : { right: off, borderRightWidth: 2 }),
                borderRadius: 3
              }}/>
            );
          })}
        </div>
      </div>

      {/* Línea divisoria punteada — se alinea con los recortes */}
      <div style={{
        height: 0, borderTop: '1px dashed var(--border)',
        margin: '0 14px'
      }}/>

      {/* Banda inferior — info del titular + countdown */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div className="row between" style={{ alignItems: 'center', marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Titular
            </div>
            <div className="font-display" style={{
              fontSize: 16, fontWeight: 700, color: 'var(--fg-hi)',
              letterSpacing: '-0.005em', marginTop: 2
            }}>{name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--fg-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Emitido
            </div>
            <div className="font-mono" style={{ fontSize: 14, color: 'var(--fg-hi)', fontWeight: 600, marginTop: 2 }}>
              {issued}
            </div>
          </div>
        </div>

        {/* Countdown como progress lineal con número embebido */}
        <div style={{
          position: 'relative',
          height: 28,
          background: 'var(--bg)',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            width: `${pct * 100}%`,
            background: 'linear-gradient(90deg, rgba(34,211,238,0.16), rgba(34,211,238,0.32))',
            transition: 'width 1s linear'
          }}/>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 12px',
            fontSize: 12
          }}>
            <span className="row gap-2" style={{ color: 'var(--fg-mute)' }}>
              {Icons.refresh}
              Renueva automáticamente
            </span>
            <span className="font-mono tabular" style={{
              color: 'var(--brand)', fontWeight: 600, letterSpacing: '0.04em'
            }}>
              {String(secs).padStart(2, '0')}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat compacto que comparte el lenguaje del pase
const PassStat = ({ icon, label, value, accent }) => (
  <div style={{
    flex: 1,
    background: 'var(--bg-elev)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-card)',
    padding: '12px 12px 14px',
    minWidth: 0
  }}>
    <div className="row gap-2" style={{ alignItems: 'center', color: 'var(--fg-mute)', marginBottom: 6 }}>
      <span style={{ display: 'inline-flex' }}>{icon}</span>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
        {label}
      </span>
    </div>
    <div className="font-display tabular" style={{
      fontSize: 22, fontWeight: 700, lineHeight: 1,
      color: accent || 'var(--fg-hi)',
      letterSpacing: '-0.02em'
    }}>{value}</div>
  </div>
);

// QR pattern fake (no necesitamos uno real, es placeholder visual)
const QRPattern = () => {
  const cells = React.useMemo(() => {
    const grid = [];
    const rng = (s) => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    let s = 1;
    for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
      s = (s * 9301 + 49297) % 233280;
      grid.push({ x, y, on: s % 2 === 0 });
    }
    return grid;
  }, []);
  return (
    <svg width="220" height="220" viewBox="0 0 25 25" shapeRendering="crispEdges">
      <rect width="25" height="25" fill="#fff"/>
      {cells.map((c, i) => c.on && <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="#0A0B0D"/>)}
      {/* Finder patterns */}
      {[[0,0],[18,0],[0,18]].map(([fx,fy], i) => (
        <g key={i}>
          <rect x={fx} y={fy} width="7" height="7" fill="#0A0B0D"/>
          <rect x={fx+1} y={fy+1} width="5" height="5" fill="#fff"/>
          <rect x={fx+2} y={fy+2} width="3" height="3" fill="#0A0B0D"/>
        </g>
      ))}
    </svg>
  );
};

// ── EN VIVO ────────────────────────────────────────────────────────────────
const LiveScreen = () => {
  // 4 weeks × 7 days × 9 buckets de 2h
  const heatData = React.useMemo(() => {
    const rng = (s) => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const arr = []; let s = 7;
    for (let d = 0; d < 7; d++) {
      const row = [];
      for (let h = 0; h < 9; h++) {
        s = (s * 9301 + 49297) % 233280;
        const v = s / 233280;
        // Picos en 14-20h (h=4..7), menos lunes/dom
        const peak = (h >= 4 && h <= 7) ? 0.6 : 0.15;
        row.push(Math.min(1, v * peak * (d === 6 ? 0.4 : 1)));
      }
      arr.push(row);
    }
    return arr;
  }, []);

  const occupancy = 42;
  const cap = 100;
  const pct = occupancy / cap;
  const ramp = ['var(--bg-raised)', '#1F2A1F', '#3D5226', '#7BAB30', 'var(--action)'];
  const heatColor = (v) => {
    if (v < 0.05) return ramp[0];
    if (v < 0.25) return ramp[1];
    if (v < 0.5) return ramp[2];
    if (v < 0.75) return ramp[3];
    return ramp[4];
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '48px 20px 100px' }}>
        <PageHeader
          kicker="Estado del gym"
          title="En Vivo"
          right={<Badge tone="success" dot>Live</Badge>}
        />

        {/* Aforo */}
        <Card variant="brand" style={{ padding: 20, marginBottom: 16, marginTop: 4 }}>
          <div className="row between" style={{ marginBottom: 16 }}>
            <span className="eyebrow">Aforo actual</span>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>
              actualizado ahora
            </span>
          </div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span className="font-display tabular" style={{
              fontSize: 64, fontWeight: 700, lineHeight: 0.9,
              letterSpacing: '-0.03em', color: 'var(--brand)'
            }}>{occupancy}</span>
            <span className="font-display" style={{ fontSize: 24, color: 'var(--fg-mute)', fontWeight: 500 }}>
              / {cap}
            </span>
            <span style={{ marginLeft: 'auto' }}>
              <Badge tone={pct < 0.7 ? 'success' : pct < 0.9 ? 'warning' : 'danger'} dot>
                {pct < 0.7 ? 'Disponible' : pct < 0.9 ? 'Casi lleno' : 'Lleno'}
              </Badge>
            </span>
          </div>
          <Progress
            value={occupancy}
            max={cap}
            color={pct < 0.7 ? 'var(--brand)' : pct < 0.9 ? 'var(--warning)' : 'var(--danger)'}
          />
          <div className="row between" style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-mute)' }}>
            <span>{Math.round(pct * 100)}% del aforo</span>
            <span>Capacidad: {cap}</span>
          </div>
        </Card>

        {/* Heat horas pico */}
        <Card>
          <div className="row between" style={{ marginBottom: 4 }}>
            <h3 className="font-display" style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--fg-hi)' }}>
              Horas pico
            </h3>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>4 SEM</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginBottom: 16 }}>
            Promedio de afluencia por bloque de 2 horas
          </div>

          {/* Grid heatmap */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(9, 1fr)', gap: 3 }}>
            {/* Header horas */}
            <span/>
            {[6,8,10,12,14,16,18,20,22].map(h => (
              <span key={h} className="font-mono" style={{ fontSize: 10, color: 'var(--fg-dim)', textAlign: 'center' }}>
                {h}h
              </span>
            ))}
            {/* Filas */}
            {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d, di) => (
              <React.Fragment key={d}>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)', alignSelf: 'center' }}>{d}</span>
                {heatData[di].map((v, i) => (
                  <div key={i} style={{
                    aspectRatio: '1',
                    background: heatColor(v),
                    borderRadius: 3,
                    transition: 'background var(--t-base)'
                  }}/>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Leyenda */}
          <div className="row gap-3" style={{ marginTop: 16, fontSize: 11, color: 'var(--fg-mute)' }}>
            <span>Vacío</span>
            <div className="row gap-1">
              {ramp.map((c, i) => (
                <div key={i} style={{ width: 20, height: 8, background: c, borderRadius: 2 }}/>
              ))}
            </div>
            <span>Lleno</span>
          </div>
        </Card>

        {/* Recomendación */}
        <Card style={{ marginTop: 16 }}>
          <div className="row gap-3">
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--action-ghost)', color: 'var(--action)',
              display: 'grid', placeItems: 'center'
            }}>
              {Icons.zap}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-hi)' }}>Mejor momento hoy</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 2 }}>
                Antes de las 14:00 — afluencia baja históricamente
              </div>
            </div>
          </div>
        </Card>
      </div>
      <BottomNav active="live" />
    </div>
  );
};

Object.assign(window, { MyQRScreen, LiveScreen, QRPattern });
