/* UTEC GYM — Ranking + Perfil */

const RankingScreen = () => {
  const faculties = [
    { rank: 1, name: 'Sistemas de Información', code: 'SI', pts: 9511 },
    { rank: 2, name: 'Bioingeniería', code: 'BIO', pts: 9204, mine: true },
    { rank: 3, name: 'Ingeniería Electrónica', code: 'ELE', pts: 8899 },
    { rank: 4, name: 'Ingeniería Química', code: 'QUI', pts: 7937 },
    { rank: 5, name: 'Business Analytics', code: 'BA', pts: 7395 },
    { rank: 6, name: 'Ciencia de Datos e IA', code: 'CDIA', pts: 6954 },
    { rank: 7, name: 'Adm. y Negocios Digitales', code: 'AND', pts: 6448 },
    { rank: 8, name: 'Ingeniería Mecatrónica', code: 'MEC', pts: 6136 },
    { rank: 9, name: 'Ingeniería de la Energía', code: 'ENE', pts: 5989 },
    { rank: 10, name: 'Ingeniería Ambiental', code: 'AMB', pts: 5918 },
  ];

  const max = faculties[0].pts;
  const top3 = faculties.slice(0, 3);
  const rest = faculties.slice(3);
  const medalColor = (r) => r === 1 ? '#FFD24A' : r === 2 ? 'var(--brand)' : '#E08A4A';

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '48px 20px 100px' }}>
        <PageHeader
          kicker="Competencia inter-facultad"
          title="Ranking"
          right={
            <div className="row gap-2" style={{ alignItems: 'center' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--action)',
                boxShadow: '0 0 8px var(--action)'
              }}/>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)', letterSpacing: '0.06em' }}>
                ABRIL · DÍA 14
              </span>
            </div>
          }
        />

        {/* Podio top-3 — visual rompedor */}
        <div style={{ marginTop: 8, marginBottom: 20 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1fr',
            alignItems: 'end',
            gap: 8,
            padding: '0 4px'
          }}>
            {[top3[1], top3[0], top3[2]].map((f, idx) => {
              const realRank = f.rank;
              const heights = { 1: 124, 2: 96, 3: 80 };
              const color = medalColor(realRank);
              return (
                <div key={f.code} style={{ textAlign: 'center' }}>
                  {/* Avatar circular */}
                  <div style={{
                    width: realRank === 1 ? 56 : 44,
                    height: realRank === 1 ? 56 : 44,
                    borderRadius: '50%',
                    margin: '0 auto 8px',
                    background: `color-mix(in oklab, ${color} 18%, var(--bg-elev))`,
                    border: `2px solid ${color}`,
                    display: 'grid', placeItems: 'center',
                    color, position: 'relative'
                  }}>
                    <span className="font-display" style={{
                      fontSize: realRank === 1 ? 18 : 14, fontWeight: 700, letterSpacing: '0.04em'
                    }}>{f.code}</span>
                    {realRank === 1 && (
                      <div style={{
                        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                        background: color, color: '#0A0B0D', borderRadius: 999,
                        padding: '2px 8px', fontSize: 10, fontWeight: 700,
                        fontFamily: 'var(--font-display)', letterSpacing: '0.04em'
                      }}>★ #1</div>
                    )}
                  </div>
                  <div className="font-display" style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--fg-hi)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 2
                  }}>{f.name.split(' ').slice(-1)[0]}</div>
                  <div className="font-mono tabular" style={{ fontSize: 11, color: 'var(--fg-mute)', marginBottom: 8 }}>
                    {f.pts.toLocaleString()}
                  </div>
                  {/* Plinto del podio */}
                  <div style={{
                    height: heights[realRank],
                    background: `linear-gradient(180deg, color-mix(in oklab, ${color} 22%, var(--bg-elev)) 0%, var(--bg-elev) 100%)`,
                    border: `1px solid color-mix(in oklab, ${color} 30%, var(--border))`,
                    borderBottom: 'none',
                    borderRadius: '8px 8px 0 0',
                    display: 'grid', placeItems: 'center',
                    position: 'relative'
                  }}>
                    <span className="font-display" style={{
                      fontSize: realRank === 1 ? 32 : 24, fontWeight: 700,
                      color, letterSpacing: '-0.02em', lineHeight: 1
                    }}>#{realRank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tu facultad — banda destacada */}
        <div style={{
          padding: '14px 16px',
          background: 'linear-gradient(90deg, color-mix(in oklab, var(--brand) 14%, var(--bg-elev)) 0%, var(--bg-elev) 70%)',
          border: '1px solid color-mix(in oklab, var(--brand) 35%, var(--border))',
          borderRadius: 'var(--r-card)',
          marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div className="font-display tabular" style={{
            fontSize: 36, fontWeight: 700, color: 'var(--brand)',
            letterSpacing: '-0.03em', lineHeight: 1
          }}>#2</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 2 }}>Tu facultad</div>
            <div className="font-display" style={{
              fontSize: 16, fontWeight: 700, color: 'var(--fg-hi)', letterSpacing: '-0.005em'
            }}>Bioingeniería</div>
            <div className="row gap-3" style={{ marginTop: 4, fontSize: 11, color: 'var(--fg-mute)' }}>
              <span>tu aporte <span style={{ color: 'var(--action)', fontFamily: 'var(--font-mono)' }}>+1,438</span></span>
              <span>·</span>
              <span>307 pts del #1</span>
            </div>
          </div>
        </div>

        {/* Lista 4-10 */}
        <div style={{ marginBottom: 8 }}>
          <div className="row between" style={{ padding: '0 4px 8px' }}>
            <span className="eyebrow">Resto de facultades</span>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--fg-dim)' }}>
              {rest.length} de {faculties.length}
            </span>
          </div>
          <div style={{
            background: 'var(--bg-elev)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-card)',
            overflow: 'hidden'
          }}>
            {rest.map((f, i) => (
              <div key={f.code} style={{
                padding: '12px 14px',
                borderBottom: i < rest.length - 1 ? '1px solid var(--line-muted)' : 0,
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <span className="font-display tabular" style={{
                  fontSize: 14, fontWeight: 700, color: 'var(--fg-mute)',
                  width: 24, textAlign: 'center'
                }}>{f.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row between" style={{ marginBottom: 4 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--fg-hi)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: 180
                    }}>{f.name}</div>
                    <span className="font-mono tabular" style={{ fontSize: 12, color: 'var(--fg-base)' }}>
                      {f.pts.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={f.pts} max={max} color="var(--fg-dim)" height={2}/>
                </div>
                <span className="font-mono" style={{
                  fontSize: 9, color: 'var(--fg-dim)',
                  letterSpacing: '0.08em', minWidth: 32, textAlign: 'right'
                }}>{f.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav active="ranking" />
    </div>
  );
};

const ProfileScreen = () => {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '48px 20px 100px' }}>
        <PageHeader kicker="Mi cuenta" title="Perfil" />

        {/* Card identidad */}
        <Card style={{ marginTop: 4, marginBottom: 16, padding: 20, textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 999,
            background: 'var(--brand-glow)',
            border: '2px solid var(--brand)',
            display: 'inline-grid', placeItems: 'center',
            marginBottom: 12
          }}>
            <span className="font-display" style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand)' }}>DM</span>
          </div>
          <h2 className="font-display" style={{
            margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--fg-hi)', letterSpacing: '-0.01em'
          }}>Diego Mamani</h2>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 4 }}>
            a20200053@utec.edu.pe
          </div>
          <div className="row gap-2" style={{ justifyContent: 'center', marginTop: 12 }}>
            <Badge tone="info">Estudiante</Badge>
            <Badge tone="neutral">BIO · 6° ciclo</Badge>
          </div>
        </Card>

        {/* Stats */}
        <div className="row gap-3" style={{ marginBottom: 20 }}>
          <Stat value="1,438" label="Puntos" accent="var(--brand)" />
          <Stat value="68" label="Sesiones" />
          <Stat value="67.2" label="Horas" />
        </div>

        {/* Logros */}
        <div className="eyebrow" style={{ marginBottom: 8, paddingLeft: 4 }}>Logros</div>
        <Card style={{ padding: 16, marginBottom: 20 }}>
          <div className="row gap-3" style={{ overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { icon: Icons.flame, name: 'Racha 7', tone: 'warning', got: true },
              { icon: Icons.trophy, name: 'Top 3 BIO', tone: 'info', got: true },
              { icon: Icons.zap, name: 'Madrugador', tone: 'success', got: true },
              { icon: Icons.routine, name: '50 sesiones', tone: 'info', got: true },
              { icon: Icons.shield, name: 'Sin penalty', tone: 'neutral', got: false },
            ].map(a => (
              <div key={a.name} style={{ flexShrink: 0, textAlign: 'center', width: 64, opacity: a.got ? 1 : 0.35 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, margin: '0 auto 6px',
                  background: a.got ? `var(--${a.tone === 'info' ? 'brand-glow' : a.tone+'-bg'})` : 'var(--bg-raised)',
                  color: a.got ? `var(--${a.tone === 'info' ? 'brand' : a.tone})` : 'var(--fg-dim)',
                  display: 'grid', placeItems: 'center'
                }}>
                  {a.icon}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-mute)', fontWeight: 500 }}>{a.name}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Settings */}
        <Card style={{ padding: 0 }}>
          {[
            { icon: Icons.bell, label: 'Notificaciones', sub: 'Recordatorios y rachas' },
            { icon: Icons.lock, label: 'Seguridad / Face ID', sub: 'Bloqueo del QR' },
            { icon: Icons.help, label: 'Ayuda', sub: 'FAQ y soporte' },
          ].map((it, i, arr) => (
            <button key={i} className="list-item" style={{
              padding: '14px 16px', width: '100%', textAlign: 'left',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line-muted)' : '0'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--bg-raised)', color: 'var(--fg-base)',
                display: 'grid', placeItems: 'center', flexShrink: 0
              }}>{it.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-hi)' }}>{it.label}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-mute)' }}>{it.sub}</div>
              </div>
              <span style={{ color: 'var(--fg-dim)' }}>{Icons.chev}</span>
            </button>
          ))}
        </Card>

        <button className="btn btn-danger" style={{ width: '100%', marginTop: 16 }}>
          {Icons.logout} Cerrar sesión
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--fg-dim)' }}>
          <BrandMark size={20} color="var(--fg-dim)"/>
          <div style={{ marginTop: 4 }} className="font-mono">UTEC GYM v2.0</div>
        </div>
      </div>
      <BottomNav active="profile" />
    </div>
  );
};

Object.assign(window, { RankingScreen, ProfileScreen });
