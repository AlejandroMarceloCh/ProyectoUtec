/* UTEC GYM — Pantallas de auth (Login + Sign In) */

const LoginScreen = () => {
  const [email, setEmail] = React.useState('a20200053@utec.edu.pe');
  const [pass, setPass] = React.useState('••••••••');
  const [showPass, setShowPass] = React.useState(false);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: 'var(--bg)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Imagen institucional UTEC, sutil */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(180deg, rgba(10,11,13,.4) 0%, rgba(10,11,13,.85) 60%, var(--bg) 100%),
          url("https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=70")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.55
      }} />

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <BrandMark size={56} />
          <div className="eyebrow" style={{ marginTop: 18, color: 'var(--brand)' }}>UTEC · GYM</div>
          <h1 className="font-display" style={{
            margin: '8px 0 4px', fontSize: 36, fontWeight: 700,
            letterSpacing: '-0.02em', color: 'var(--fg-hi)'
          }}>Bienvenido</h1>
          <div style={{ fontSize: 14, color: 'var(--fg-mute)', textAlign: 'center' }}>
            Inicia sesión con tu correo UTEC
          </div>
        </div>

        <div>
          <Field label="Correo institucional">
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={Icons.mail}
              placeholder="aXXXXXXXX@utec.edu.pe"
            />
          </Field>

          <Field label="Contraseña">
            <Input
              type={showPass ? 'text' : 'password'}
              value={pass}
              onChange={e => setPass(e.target.value)}
              leftIcon={Icons.lock}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="btn btn-ghost btn-icon"
                  style={{ height: 36, width: 36, color: 'var(--fg-mute)' }}
                  aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                >
                  {Icons.eye}
                </button>
              }
            />
          </Field>

          <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
            <a href="#" style={{ fontSize: 13, color: 'var(--fg-mute)', textDecoration: 'none' }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <Button variant="primary" full>Iniciar sesión</Button>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--fg-mute)' }}>
            ¿No tienes cuenta?{' '}
            <a href="#" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
              Regístrate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignInScreen = () => {
  const carreras = ['Sistemas de Información', 'Bioingeniería', 'Ingeniería Electrónica', 'Ingeniería Química', 'Business Analytics', 'Ciencia de Datos e IA'];

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: 'var(--bg)', overflow: 'auto',
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(180deg, rgba(10,11,13,.5) 0%, rgba(10,11,13,.9) 50%, var(--bg) 100%),
          url("https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=70")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.4
      }} />

      <div style={{ position: 'relative', padding: '50px 24px 24px' }}>
        <div className="row gap-3" style={{ marginBottom: 24 }}>
          <BrandMark size={36} />
          <div>
            <div className="eyebrow" style={{ color: 'var(--brand)' }}>UTEC · GYM</div>
            <h1 className="font-display" style={{
              margin: 0, fontSize: 26, fontWeight: 700,
              letterSpacing: '-0.02em', color: 'var(--fg-hi)'
            }}>Crear cuenta</h1>
          </div>
        </div>

        <div style={{
          padding: '8px 12px', background: 'var(--brand-glow)',
          border: '1px solid color-mix(in oklab, var(--brand) 30%, transparent)',
          borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--fg-base)',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8
        }}>
          {Icons.shield}
          Solo correos <span className="font-mono" style={{ color: 'var(--brand)' }}>@utec.edu.pe</span> o <span className="font-mono" style={{ color: 'var(--brand)' }}>@utec.pe</span>
        </div>

        <Field label="Nombre completo">
          <Input placeholder="Juan García" defaultValue="" />
        </Field>

        <Field label="Correo institucional">
          <Input type="email" placeholder="aXXXXXXXX@utec.edu.pe" leftIcon={Icons.mail} />
        </Field>

        <Field label="Contraseña" hint="Mínimo 8 caracteres, una mayúscula y un número">
          <Input type="password" placeholder="••••••••" leftIcon={Icons.lock} />
        </Field>

        <Field label="Confirmar contraseña">
          <Input type="password" placeholder="••••••••" leftIcon={Icons.lock} />
        </Field>

        <Field label="Carrera / Facultad">
          <select className="ds-input" defaultValue="">
            <option value="" disabled>Selecciona tu carrera</option>
            {carreras.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <Button variant="primary" full>Crear cuenta</Button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--fg-mute)' }}>
          ¿Ya tienes cuenta?{' '}
          <a href="#" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
            Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LoginScreen, SignInScreen });
