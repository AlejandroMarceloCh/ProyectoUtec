/* UTEC GYM — Página DS overview (typography, color, components) */

const DSOverview = () => (
  <div style={{ width: '100%', height: '100%', background: 'var(--bg)', overflow: 'auto', padding: 32 }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="row gap-3" style={{ marginBottom: 32 }}>
        <BrandMark size={36}/>
        <div>
          <div className="eyebrow" style={{ color: 'var(--brand)' }}>UTEC GYM · DESIGN SYSTEM v2.0</div>
          <h1 className="font-display" style={{
            margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--fg-hi)', letterSpacing: '-0.02em'
          }}>Sistema unificado</h1>
        </div>
      </div>

      {/* Brand */}
      <Section title="Marca">
        <div className="row gap-6" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Card style={{ padding: 32, display: 'grid', placeItems: 'center', minWidth: 200 }}>
            <BrandMark size={56}/>
          </Card>
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{ color: 'var(--fg-base)', fontSize: 14, lineHeight: 1.6 }}>
              El logotipo "hUl" es marca fija. Lo respetamos. El cyan UTEC se mantiene
              como <strong style={{ color: 'var(--brand)' }}>color de marca</strong> y de datos —
              no como CTA. Para acción usamos lima eléctrico, separando "esto soy yo"
              de "esto se toca".
            </p>
          </div>
        </div>
      </Section>

      {/* Color */}
      <Section title="Color">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Superficies</div>
        <div className="row gap-2" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            ['#06070A', 'sunken'], ['#0A0B0D', 'base'], ['#101115', 'surface'],
            ['#181A20', 'raised'], ['#23262E', 'line']
          ].map(([h, n]) => <Swatch key={n} hex={h} name={n}/>)}
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>Marca + Acción</div>
        <div className="row gap-2" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          <Swatch hex="#22D3EE" name="brand cyan" big/>
          <Swatch hex="#D4FF3F" name="action lima" big/>
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>Estado</div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Swatch hex="#5EEAA0" name="success"/>
          <Swatch hex="#FFB454" name="warning"/>
          <Swatch hex="#FF6464" name="danger"/>
        </div>
      </Section>

      {/* Type */}
      <Section title="Tipografía">
        <div style={{ display: 'grid', gap: 16 }}>
          <TypeRow label="Display · Space Grotesk" size={44} weight={700} sample="Bienvenido, Diego"/>
          <TypeRow label="H3 · Space Grotesk" size={28} weight={700} sample="Mapa de calor muscular"/>
          <TypeRow label="H5 · Space Grotesk" size={20} weight={600} sample="Sesión actual"/>
          <TypeRow label="Body · Inter Tight" size={15} weight={400} sample="Muestra tu QR en la entrada del gym para iniciar." family="text"/>
          <TypeRow label="Mono · JetBrains Mono" size={13} weight={500} sample="08:40:21 PM · a20200053" family="mono"/>
          <TypeRow label="Eyebrow · Mono uppercase" size={11} weight={500} sample="ÚLTIMAS SESIONES" family="mono" tracking="0.14em"/>
        </div>
      </Section>

      {/* Componentes */}
      <Section title="Componentes">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Buttons</div>
            <div className="row gap-2" style={{ marginBottom: 12 }}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="row gap-2">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="danger" size="sm">{Icons.logout} Cerrar sesión</Button>
            </div>
          </Card>

          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Inputs</div>
            <Field label="Correo">
              <Input leftIcon={Icons.mail} placeholder="aXXXXXXXX@utec.edu.pe"/>
            </Field>
          </Card>

          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Badges</div>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <Badge tone="success" dot>Activa</Badge>
              <Badge tone="warning">Auto</Badge>
              <Badge tone="danger">–20%</Badge>
              <Badge tone="info">BIO</Badge>
              <Badge tone="neutral">Cerrada</Badge>
            </div>
          </Card>

          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Stats</div>
            <div className="row gap-2">
              <Stat value="1,438" label="Puntos" accent="var(--brand)"/>
              <Stat value="68" label="Sesiones"/>
            </div>
          </Card>

          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Segmented</div>
            <Segmented
              items={[{label:'Hoy',value:'h'},{label:'Semana',value:'s'},{label:'Mes',value:'m'}]}
              value="s" onChange={()=>{}}
            />
          </Card>

          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Progress</div>
            <Progress value={42} max={100} color="var(--brand)"/>
            <div style={{ height: 8 }}/>
            <Progress value={88} max={100} color="var(--warning)"/>
          </Card>
        </div>
      </Section>

      {/* Tokens */}
      <Section title="Tokens (Tailwind config)">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <pre className="font-mono" style={{
            margin: 0, padding: 20, fontSize: 12, color: 'var(--fg-base)',
            background: 'var(--bg-sunken)', overflow: 'auto', lineHeight: 1.6
          }}>{`// tailwind.config.js — comparte entre web (Vite) y NativeWind
module.exports = {
  theme: {
    extend: {
      colors: {
        bg:       { DEFAULT: '#0A0B0D', surface: '#101115', raised: '#181A20', sunken: '#06070A' },
        line:     { DEFAULT: '#23262E', muted: '#1A1C22' },
        fg:       { hi: '#F4F5F7', base: '#D6D8DD', mute: '#9AA0AB', dim: '#6B7280' },
        brand:    { DEFAULT: '#22D3EE', dim: '#0E7490' },
        action:   { DEFAULT: '#D4FF3F', hover: '#C2F032', press: '#A6D026' },
        success:  '#5EEAA0', warning:  '#FFB454', danger:   '#FF6464'
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans:    ['Inter Tight', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      borderRadius: { sm:'6px', md:'10px', lg:'14px', xl:'20px' },
      fontSize: {
        caption:'11px', tiny:'12px', small:'13px', body:'15px', lead:'17px',
        h6:'18px', h5:'20px', h4:'24px', h3:'28px', h2:'34px', h1:'44px', display:'56px'
      }
    }
  }
};`}</pre>
        </Card>
      </Section>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <section style={{ marginBottom: 36 }}>
    <h2 className="font-display" style={{
      margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: 'var(--fg-hi)',
      letterSpacing: '-0.01em', paddingBottom: 8, borderBottom: '1px solid var(--line)'
    }}>{title}</h2>
    {children}
  </section>
);

const Swatch = ({ hex, name, big }) => (
  <div style={{ width: big ? 160 : 110, textAlign: 'left' }}>
    <div style={{
      height: big ? 80 : 56, background: hex, borderRadius: 8,
      border: '1px solid var(--line)', marginBottom: 6
    }}/>
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-hi)' }}>{name}</div>
    <div className="font-mono" style={{ fontSize: 10, color: 'var(--fg-mute)' }}>{hex}</div>
  </div>
);

const TypeRow = ({ label, size, weight, sample, family = 'display', tracking }) => (
  <div className="ds-card" style={{ padding: 16 }}>
    <div className="eyebrow" style={{ marginBottom: 8 }}>{label} · {size}px / {weight}</div>
    <div style={{
      fontFamily: family === 'display' ? 'var(--font-display)' :
                  family === 'mono' ? 'var(--font-mono)' : 'var(--font-text)',
      fontSize: size, fontWeight: weight, color: 'var(--fg-hi)',
      letterSpacing: tracking || (size > 24 ? '-0.02em' : '-0.005em'),
      textTransform: family === 'mono' && tracking ? 'uppercase' : 'none'
    }}>{sample}</div>
  </div>
);

Object.assign(window, { DSOverview });
