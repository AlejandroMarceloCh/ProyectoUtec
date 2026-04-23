import { useMemo, useState } from 'react'
import Modal from './Modal'
import { LIMITS } from '../utils/constants'

/**
 * Valida los settings y devuelve un mapa de errores por campo.
 * Las claves vacías se omiten, así que el caller puede usar `Object.keys(errors).length === 0`.
 */
function validate(form) {
  const errors = {}
  const name = (form.restaurantName ?? '').trim()
  if (!name) errors.restaurantName = 'El nombre no puede estar vacío'
  else if (name.length > LIMITS.RESTAURANT_NAME_MAX)
    errors.restaurantName = `Máximo ${LIMITS.RESTAURANT_NAME_MAX} caracteres`

  const locName = (form.location?.name ?? '').trim()
  if (locName.length > LIMITS.LOCATION_NAME_MAX)
    errors.locationName = `Máximo ${LIMITS.LOCATION_NAME_MAX} caracteres`

  const { lat, lon } = form.location ?? {}
  if (!Number.isFinite(lat)) errors.lat = 'Latitud requerida'
  else if (lat < LIMITS.LAT_MIN || lat > LIMITS.LAT_MAX)
    errors.lat = `Entre ${LIMITS.LAT_MIN} y ${LIMITS.LAT_MAX}`

  if (!Number.isFinite(lon)) errors.lon = 'Longitud requerida'
  else if (lon < LIMITS.LON_MIN || lon > LIMITS.LON_MAX)
    errors.lon = `Entre ${LIMITS.LON_MIN} y ${LIMITS.LON_MAX}`

  return errors
}

export default function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    ...settings,
    location: { ...settings.location },
  }))
  const [attempted, setAttempted] = useState(false)
  const errors = useMemo(() => validate(form), [form])
  const isValid = Object.keys(errors).length === 0

  function handleSubmit(e) {
    e.preventDefault()
    setAttempted(true)
    if (!isValid) return
    onSave({
      ...form,
      restaurantName: form.restaurantName.trim(),
      location: {
        ...form.location,
        name: (form.location?.name ?? '').trim(),
      },
    })
  }

  const showErr = key => attempted && errors[key]

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Configuración"
      labelledById="settings-title"
      maxWidthClass="max-w-sm"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 py-5 space-y-4">
          <Field
            id="settings-restaurant"
            label="Nombre del restaurante"
            error={showErr('restaurantName')}
          >
            <input
              id="settings-restaurant"
              type="text"
              value={form.restaurantName}
              onChange={e => setForm(f => ({ ...f, restaurantName: e.target.value }))}
              maxLength={LIMITS.RESTAURANT_NAME_MAX}
              aria-invalid={!!showErr('restaurantName')}
              aria-describedby={showErr('restaurantName') ? 'settings-restaurant-err' : undefined}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>

          <div>
            <span
              id="settings-location-label"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Ubicación (para pronóstico)
            </span>
            <input
              type="text"
              aria-labelledby="settings-location-label"
              value={form.location.name}
              onChange={e =>
                setForm(f => ({ ...f, location: { ...f.location, name: e.target.value } }))
              }
              placeholder="Nombre del lugar"
              maxLength={LIMITS.LOCATION_NAME_MAX}
              aria-invalid={!!showErr('locationName')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />
            {showErr('locationName') && <ErrorHint>{errors.locationName}</ErrorHint>}

            <div className="grid grid-cols-2 gap-2">
              <Field id="settings-lat" label="Latitud" small error={showErr('lat')}>
                <input
                  id="settings-lat"
                  type="number"
                  step="0.0001"
                  min={LIMITS.LAT_MIN}
                  max={LIMITS.LAT_MAX}
                  value={Number.isFinite(form.location.lat) ? form.location.lat : ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      location: { ...f.location, lat: parseFloat(e.target.value) },
                    }))
                  }
                  aria-invalid={!!showErr('lat')}
                  aria-describedby={showErr('lat') ? 'settings-lat-err' : undefined}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>
              <Field id="settings-lon" label="Longitud" small error={showErr('lon')}>
                <input
                  id="settings-lon"
                  type="number"
                  step="0.0001"
                  min={LIMITS.LON_MIN}
                  max={LIMITS.LON_MAX}
                  value={Number.isFinite(form.location.lon) ? form.location.lon : ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      location: { ...f.location, lon: parseFloat(e.target.value) },
                    }))
                  }
                  aria-invalid={!!showErr('lon')}
                  aria-describedby={showErr('lon') ? 'settings-lon-err' : undefined}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Por defecto: Palisades Tahoe (Olympic Valley). Puedes afinar lat/lon si quieres otro
              punto del resort.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={attempted && !isValid}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl transition-colors"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ id, label, error, small, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className={
          small
            ? 'text-[11px] text-slate-400 block'
            : 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5'
        }
      >
        {label}
      </label>
      {children}
      {error && (
        <ErrorHint id={`${id}-err`}>
          {error}
        </ErrorHint>
      )}
    </div>
  )
}

function ErrorHint({ id, children }) {
  return (
    <p id={id} role="alert" className="text-[11px] text-red-600 mt-1 font-medium">
      {children}
    </p>
  )
}
