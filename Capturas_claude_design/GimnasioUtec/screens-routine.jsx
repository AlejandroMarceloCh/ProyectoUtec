/* UTEC GYM — Rutina + Mapa de calor muscular */

const RoutineScreen = () => {
  const [days, setDays] = React.useState('4d');
  const [sex, setSex] = React.useState('M');
  const [focus, setFocus] = React.useState('Hipertrofia');
  const [side, setSide] = React.useState('frente');
  const [period, setPeriod] = React.useState('semana');

  const plan = {
    'Día 1': [
      { name: 'Squat', muscle: 'Cuádriceps', sets: '4×8-12', rir: 2 },
      { name: 'Romanian DL', muscle: 'Isquios', sets: '4×8-12', rir: 2 },
      { name: 'Cable Kickback', muscle: 'Glúteos', sets: '4×8-12', rir: 2 },
      { name: 'Calf Raise', muscle: 'Gemelos', sets: '3×8-12', rir: 2 },
    ],
    'Día 2': [
      { name: 'Bench Press', muscle: 'Pecho', sets: '4×8-12', rir: 2, done: true },
      { name: 'OHP', muscle: 'Hombros ant.', sets: '4×8-12', rir: 2, done: true },
      { name: 'Dips', muscle: 'Tríceps', sets: '3×8-12', rir: 2 },
    ],
    'Día 3': [
      { name: 'Hyperextension', muscle: 'Lumbar', sets: '3×12', rir: 2 },
    ],
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '48px 20px 100px' }}>
        <PageHeader kicker="Plan personalizado" title="Rutina" />

        {/* Generador */}
        <Card style={{ marginTop: 4 }}>
          <h3 className="font-display" style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: 'var(--fg-hi)' }}>
            Generar mi rutina
          </h3>

          <ChipGroup
            label="Días por semana"
            options={['2d','3d','4d','5d','6d']}
            value={days}
            onChange={setDays}
          />
          <ChipGroup
            label="Sexo"
            options={['M','F','Otro']}
            value={sex}
            onChange={setSex}
          />
          <ChipGroup
            label="Enfoque"
            options={['Hipertrofia','Fuerza','Pérdida de grasa','Resistencia','Recomp']}
            value={focus}
            onChange={setFocus}
          />

          <Button variant="primary" full>Generar rutina</Button>
        </Card>

        {/* Plan */}
        <div style={{ marginTop: 20 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h3 className="font-display" style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--fg-hi)' }}>
              Mi plan
            </h3>
            <Badge tone="info">{days} · {focus}</Badge>
          </div>

          {Object.entries(plan).map(([day, exs]) => (
            <div key={day} style={{ marginBottom: 16 }}>
              <div className="row between" style={{ marginBottom: 8, padding: '0 4px' }}>
                <span className="eyebrow" style={{ color: 'var(--brand)' }}>{day}</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>
                  {exs.filter(e => e.done).length}/{exs.length} hechos
                </span>
              </div>
              <Card style={{ padding: 0 }}>
                {exs.map((ex, i) => (
                  <div key={i} className="list-item" style={{ padding: '14px 16px' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: ex.done ? 'var(--success-bg)' : 'var(--bg-raised)',
                      color: ex.done ? 'var(--success)' : 'var(--fg-dim)',
                      display: 'grid', placeItems: 'center', flexShrink: 0
                    }}>
                      {ex.done ? Icons.check : <span className="font-mono" style={{ fontSize: 12 }}>{i+1}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: 'var(--fg-hi)',
                        textDecoration: ex.done ? 'line-through' : 'none',
                        opacity: ex.done ? 0.6 : 1
                      }}>{ex.name}</div>
                      <div className="row gap-2" style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 2 }}>
                        <span>{ex.muscle}</span>
                        <span>·</span>
                        <span className="font-mono">{ex.sets}</span>
                        <span>·</span>
                        <span className="font-mono">RIR {ex.rir}</span>
                      </div>
                    </div>
                    <button className={`btn btn-sm ${ex.done ? 'btn-ghost' : 'btn-secondary'}`} style={{ flexShrink: 0 }}>
                      {ex.done ? 'Editar' : '+ Log'}
                    </button>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>

        {/* Mapa de calor */}
        <div style={{ marginTop: 24 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <div>
              <h3 className="font-display" style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--fg-hi)' }}>
                Mapa de calor muscular
              </h3>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 2 }}>
                Volumen acumulado por grupo
              </div>
            </div>
          </div>

          <Card>
            <div className="row between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <Segmented
                items={[
                  { label: 'Hoy', value: 'hoy' },
                  { label: 'Semana', value: 'semana' },
                  { label: 'Mes', value: 'mes' },
                  { label: 'Total', value: 'total' },
                ]}
                value={period}
                onChange={setPeriod}
              />
              <Segmented
                items={[
                  { label: 'Frente', value: 'frente' },
                  { label: 'Espalda', value: 'espalda' }
                ]}
                value={side}
                onChange={setSide}
              />
            </div>

            <MuscleMap side={side} variant={(typeof window !== 'undefined' && window.__tweaks?.muscleStyle) || 'anatomy'} />

            {/* Leyenda */}
            <div className="row between" style={{ marginTop: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>Menos volumen</span>
              <div className="row gap-1">
                {['#1A1C22', '#0E4A52', '#147A8A', '#1AA9BD', '#22D3EE', '#7DEEF8'].map(c => (
                  <div key={c} style={{ width: 28, height: 8, background: c, borderRadius: 2 }}/>
                ))}
              </div>
              <span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>Más</span>
            </div>

            {/* Top muscles */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line-muted)' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Top esta semana</div>
              {[
                { name: 'Pecho', sets: 12, color: '#7DEEF8' },
                { name: 'Cuádriceps', sets: 10, color: '#22D3EE' },
                { name: 'Hombros ant.', sets: 8, color: '#1AA9BD' },
              ].map(m => (
                <div key={m.name} className="row between" style={{ padding: '6px 0', fontSize: 13 }}>
                  <div className="row gap-2">
                    <span style={{ width: 8, height: 8, background: m.color, borderRadius: 2 }}/>
                    <span style={{ color: 'var(--fg-hi)' }}>{m.name}</span>
                  </div>
                  <span className="font-mono tabular" style={{ color: 'var(--fg-mute)' }}>{m.sets} sets</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <BottomNav active="routine" />
    </div>
  );
};

const ChipGroup = ({ label, options, value, onChange }) => (
  <div style={{ marginBottom: 16 }}>
    <div className="ds-label">{label}</div>
    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: active ? 'var(--brand)' : 'var(--line)',
              background: active ? 'var(--brand-glow)' : 'transparent',
              color: active ? 'var(--brand)' : 'var(--fg-base)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              transition: 'all var(--t-base)'
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

const MuscleMap = ({ side, variant = 'anatomy' }) => {
  // Volumen 0..1 por músculo
  const data = {
    pecho: 0.85, hombrosAnt: 0.65, biceps: 0.3, abs: 0.4,
    cuadriceps: 0.7, gemelos: 0.2,
    espalda: 0.5, trapecio: 0.3, hombrosPost: 0.4, triceps: 0.55,
    lumbar: 0.25, gluteos: 0.6, isquios: 0.5,
  };
  const ramp = ['#1A1C22', '#0E4A52', '#147A8A', '#1AA9BD', '#22D3EE', '#7DEEF8'];
  const c = (v) => {
    if (v < 0.05) return ramp[0];
    const i = Math.min(ramp.length - 1, Math.floor(v * ramp.length));
    return ramp[i];
  };

  return (
    <div className="row center" style={{ minHeight: 320, padding: 16 }}>
      {variant === 'silhouette' ? (
        <SilhouetteMap side={side} data={data} c={c}/>
      ) : (
      <svg width="220" height="320" viewBox="0 0 220 320" fill="none" stroke="var(--line)" strokeWidth="0.8">
        {side === 'frente' ? (
          <g>
            {/* Cabeza */}
            <ellipse cx="110" cy="32" rx="22" ry="26" fill="var(--bg-raised)"/>
            <path d="M95 56 Q110 64 125 56 L130 70 L90 70 Z" fill="var(--bg-raised)"/>

            {/* Hombros anteriores */}
            <ellipse cx="78" cy="82" rx="14" ry="13" fill={c(data.hombrosAnt)}/>
            <ellipse cx="142" cy="82" rx="14" ry="13" fill={c(data.hombrosAnt)}/>

            {/* Pecho */}
            <path d="M88 78 Q110 75 132 78 L138 110 Q110 116 82 110 Z" fill={c(data.pecho)}/>
            <line x1="110" y1="78" x2="110" y2="113" stroke="var(--bg)" strokeWidth="1.5"/>

            {/* Brazos — bíceps */}
            <path d="M64 84 Q56 100 60 130 Q70 132 74 128 Q78 100 80 88 Z" fill={c(data.biceps)}/>
            <path d="M156 84 Q164 100 160 130 Q150 132 146 128 Q142 100 140 88 Z" fill={c(data.biceps)}/>

            {/* Antebrazos */}
            <path d="M58 132 Q54 158 60 178 L72 178 Q74 156 72 132 Z" fill="var(--bg-raised)"/>
            <path d="M162 132 Q166 158 160 178 L148 178 Q146 156 148 132 Z" fill="var(--bg-raised)"/>

            {/* Abs */}
            <path d="M86 112 Q110 120 134 112 L132 168 Q110 174 88 168 Z" fill={c(data.abs)}/>
            <line x1="110" y1="116" x2="110" y2="170" stroke="var(--bg)" strokeWidth="1.2"/>
            <line x1="92" y1="130" x2="128" y2="130" stroke="var(--bg)" strokeWidth="1"/>
            <line x1="92" y1="146" x2="128" y2="146" stroke="var(--bg)" strokeWidth="1"/>

            {/* Cuadriceps */}
            <path d="M82 170 Q88 220 84 256 L100 256 Q108 220 106 170 Z" fill={c(data.cuadriceps)}/>
            <path d="M114 170 Q112 220 120 256 L136 256 Q140 220 138 170 Z" fill={c(data.cuadriceps)}/>

            {/* Gemelos / canilla */}
            <path d="M86 258 Q88 290 90 310 L100 310 Q102 290 100 258 Z" fill={c(data.gemelos)}/>
            <path d="M120 258 Q120 290 122 310 L132 310 Q134 290 132 258 Z" fill={c(data.gemelos)}/>
          </g>
        ) : (
          <g>
            {/* Cabeza */}
            <ellipse cx="110" cy="32" rx="22" ry="26" fill="var(--bg-raised)"/>
            <path d="M95 56 Q110 64 125 56 L130 70 L90 70 Z" fill="var(--bg-raised)"/>

            {/* Trapecio */}
            <path d="M84 70 Q110 64 136 70 L132 96 Q110 92 88 96 Z" fill={c(data.trapecio)}/>

            {/* Hombros posteriores */}
            <ellipse cx="76" cy="86" rx="14" ry="13" fill={c(data.hombrosPost)}/>
            <ellipse cx="144" cy="86" rx="14" ry="13" fill={c(data.hombrosPost)}/>

            {/* Espalda media */}
            <path d="M86 96 Q110 100 134 96 L138 150 Q110 156 82 150 Z" fill={c(data.espalda)}/>
            <line x1="110" y1="100" x2="110" y2="154" stroke="var(--bg)" strokeWidth="1.5"/>

            {/* Tríceps */}
            <path d="M62 90 Q56 110 60 132 Q70 134 74 130 Q76 108 78 92 Z" fill={c(data.triceps)}/>
            <path d="M158 90 Q164 110 160 132 Q150 134 146 130 Q144 108 142 92 Z" fill={c(data.triceps)}/>

            {/* Antebrazos */}
            <path d="M58 134 Q54 160 60 180 L72 180 Q74 158 72 134 Z" fill="var(--bg-raised)"/>
            <path d="M162 134 Q166 160 160 180 L148 180 Q146 158 148 134 Z" fill="var(--bg-raised)"/>

            {/* Lumbar */}
            <path d="M88 152 Q110 158 132 152 L130 178 Q110 182 90 178 Z" fill={c(data.lumbar)}/>

            {/* Glúteos */}
            <path d="M84 180 Q92 200 100 200 L108 200 Q108 188 102 180 Z" fill={c(data.gluteos)}/>
            <path d="M136 180 Q128 200 120 200 L112 200 Q112 188 118 180 Z" fill={c(data.gluteos)}/>

            {/* Isquios */}
            <path d="M82 200 Q88 230 84 256 L100 256 Q106 230 104 200 Z" fill={c(data.isquios)}/>
            <path d="M116 200 Q114 230 120 256 L136 256 Q140 230 138 200 Z" fill={c(data.isquios)}/>

            {/* Gemelos */}
            <path d="M86 258 Q88 290 90 310 L100 310 Q102 290 100 258 Z" fill={c(data.gemelos)}/>
            <path d="M120 258 Q120 290 122 310 L132 310 Q134 290 132 258 Z" fill={c(data.gemelos)}/>
          </g>
        )}
      </svg>
      )}
    </div>
  );
};

// Silueta limpia — sin músculos detallados, hotspots circulares por grupo
const SilhouetteMap = ({ side, data, c }) => {
  const hotspots = side === 'frente' ? [
    { name: 'pecho', cx: 110, cy: 96, r: 26, v: data.pecho },
    { name: 'hombros', cx: 78, cy: 84, r: 14, v: data.hombrosAnt },
    { name: 'hombros2', cx: 142, cy: 84, r: 14, v: data.hombrosAnt },
    { name: 'biceps-l', cx: 68, cy: 110, r: 12, v: data.biceps },
    { name: 'biceps-r', cx: 152, cy: 110, r: 12, v: data.biceps },
    { name: 'abs', cx: 110, cy: 142, r: 22, v: data.abs },
    { name: 'cuad-l', cx: 92, cy: 210, r: 18, v: data.cuadriceps },
    { name: 'cuad-r', cx: 128, cy: 210, r: 18, v: data.cuadriceps },
    { name: 'gem-l', cx: 94, cy: 280, r: 10, v: data.gemelos },
    { name: 'gem-r', cx: 126, cy: 280, r: 10, v: data.gemelos },
  ] : [
    { name: 'trap', cx: 110, cy: 80, r: 18, v: data.trapecio },
    { name: 'hp-l', cx: 76, cy: 88, r: 14, v: data.hombrosPost },
    { name: 'hp-r', cx: 144, cy: 88, r: 14, v: data.hombrosPost },
    { name: 'esp', cx: 110, cy: 124, r: 28, v: data.espalda },
    { name: 'tri-l', cx: 66, cy: 112, r: 12, v: data.triceps },
    { name: 'tri-r', cx: 154, cy: 112, r: 12, v: data.triceps },
    { name: 'lumbar', cx: 110, cy: 166, r: 18, v: data.lumbar },
    { name: 'glut-l', cx: 96, cy: 192, r: 14, v: data.gluteos },
    { name: 'glut-r', cx: 124, cy: 192, r: 14, v: data.gluteos },
    { name: 'isq-l', cx: 92, cy: 228, r: 16, v: data.isquios },
    { name: 'isq-r', cx: 128, cy: 228, r: 16, v: data.isquios },
    { name: 'gem-l', cx: 94, cy: 280, r: 10, v: data.gemelos },
    { name: 'gem-r', cx: 126, cy: 280, r: 10, v: data.gemelos },
  ];
  return (
    <svg width="220" height="320" viewBox="0 0 220 320" fill="none">
      <defs>
        <radialGradient id="hot-g">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95"/>
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Silueta humana — outline limpio */}
      <g fill="var(--bg-raised)" stroke="var(--line)" strokeWidth="1">
        <ellipse cx="110" cy="32" rx="20" ry="24"/>
        <path d="M95 56 Q110 62 125 56 L135 78 Q160 82 162 110 Q164 140 158 178 L150 178 Q152 158 150 134 Q140 132 138 108 L138 168 Q110 174 82 168 L82 108 Q80 132 70 134 Q68 158 70 178 L62 178 Q56 140 58 110 Q60 82 85 78 Z"/>
        <path d="M82 168 Q88 220 84 256 L100 256 Q108 220 106 170 Z"/>
        <path d="M114 170 Q112 220 120 256 L136 256 Q140 220 138 168 Z"/>
        <path d="M86 258 Q88 290 90 310 L100 310 Q102 290 100 258 Z"/>
        <path d="M120 258 Q120 290 122 310 L132 310 Q134 290 132 258 Z"/>
      </g>
      {/* Hotspots de calor (gradient blobs) */}
      {hotspots.map((h, i) => (
        <circle key={i} cx={h.cx} cy={h.cy} r={h.r} fill="url(#hot-g)" style={{ color: c(h.v) }}/>
      ))}
    </svg>
  );
};

Object.assign(window, { RoutineScreen, MuscleMap, SilhouetteMap, ChipGroup });
