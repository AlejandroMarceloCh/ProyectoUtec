import { useEffect, useMemo, useState } from 'react'
import { DAYS, DAY_LABELS } from '../utils/optimizer'
import {
  EMPLOYEE_COLORS,
  EMPLOYMENT_TYPES,
  SCHEDULE_GROUP_ORDER,
  SCHEDULE_GROUP_LABELS,
  normalizeScheduleGroup,
} from '../data/defaultData'
import { LIMITS } from '../utils/constants'
import Modal from './Modal'

const EMPTY_EMP = {
  name: '',
  scheduleGroup: 'kitchen',
  employmentType: 'full-time',
  isManager: false,
  isCashier: false,
  cashierKnowledge: false,
  hasSecondJob: false,
  isDishwasher: false,
  minDaysPerWeek: 5,
  availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
  color: EMPLOYEE_COLORS[0],
  notes: '',
}

function deriveMinDays(employmentType, current) {
  const et = EMPLOYMENT_TYPES[employmentType]
  if (!et) return current
  if (employmentType === 'full-time') return 5
  return Math.min(Math.max(current, et.minDays), et.maxDays)
}

function normalizeEmployee(e) {
  if (!e) return EMPTY_EMP
  const et = e.employmentType ?? (e.minDaysPerWeek >= 5 ? 'full-time' : 'part-time')
  const isCashier = !!e.isCashier
  return {
    ...EMPTY_EMP,
    ...e,
    employmentType: et,
    scheduleGroup: normalizeScheduleGroup(e.scheduleGroup),
    isCashier,
    // Invariante: si es cajero, cashierKnowledge=true siempre.
    cashierKnowledge: isCashier ? true : !!e.cashierKnowledge,
    minDaysPerWeek: deriveMinDays(et, e.minDaysPerWeek ?? 5),
    availability: { ...EMPTY_EMP.availability, ...e.availability },
  }
}

function validateForm(form) {
  const errors = {}
  const name = (form.name ?? '').trim()
  if (!name) errors.name = 'El nombre es obligatorio'
  else if (name.length > LIMITS.NAME_MAX_LENGTH)
    errors.name = `Máximo ${LIMITS.NAME_MAX_LENGTH} caracteres`
  if ((form.notes ?? '').length > LIMITS.NOTES_MAX_LENGTH)
    errors.notes = `Máximo ${LIMITS.NOTES_MAX_LENGTH} caracteres`
  const hasAnyDayAvailable = DAYS.some(d => form.availability?.[d])
  if (!hasAnyDayAvailable) errors.availability = 'Debe estar disponible al menos un día'
  return errors
}

export default function EmployeeModal({ employee, onSave, onDelete, onClose }) {
  const isNew = !employee
  const [form, setForm] = useState(() => (isNew ? EMPTY_EMP : normalizeEmployee(employee)))
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    setForm(isNew ? EMPTY_EMP : normalizeEmployee(employee))
    setAttempted(false)
  }, [employee, isNew])

  const errors = useMemo(() => validateForm(form), [form])
  const isValid = Object.keys(errors).length === 0
  const showErr = key => attempted && errors[key]

  function handleAvailability(day) {
    setForm(f => ({ ...f, availability: { ...f.availability, [day]: !f.availability[day] } }))
  }

  function handleEmploymentType(et) {
    setForm(f => ({
      ...f,
      employmentType: et,
      minDaysPerWeek: deriveMinDays(et, f.minDaysPerWeek),
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setAttempted(true)
    if (!isValid) return
    onSave({
      ...form,
      name: form.name.trim(),
      notes: (form.notes ?? '').trim(),
      scheduleGroup: normalizeScheduleGroup(form.scheduleGroup),
      id: form.id ?? `emp_${Date.now()}`,
    })
  }

  const isPartTime = form.employmentType === 'part-time'
  const ptRange = EMPLOYMENT_TYPES['part-time']

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? 'Agregar Empleado' : 'Editar Empleado'}
      labelledById="employee-modal-title"
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5" noValidate>
        {/* Name */}
        <div>
          <label
            htmlFor="emp-name"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Nombre
          </label>
          <input
            id="emp-name"
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Juan García"
            maxLength={LIMITS.NAME_MAX_LENGTH}
            aria-invalid={!!showErr('name')}
            aria-describedby={showErr('name') ? 'emp-name-err' : undefined}
            aria-required="true"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
            autoFocus
          />
          {showErr('name') && (
            <p id="emp-name-err" role="alert" className="text-[11px] text-red-600 mt-1 font-medium">
              {errors.name}
            </p>
          )}
        </div>

        {/* Employment type */}
        <fieldset>
          <legend className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tipo de contrato
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <EmploymentOption
              active={form.employmentType === 'full-time'}
              onClick={() => handleEmploymentType('full-time')}
              name="Full-time"
              desc="5 días / semana"
              sub="≈ 35–40 h/sem."
              accent="indigo"
            />
            <EmploymentOption
              active={form.employmentType === 'part-time'}
              onClick={() => handleEmploymentType('part-time')}
              name="Part-time"
              desc="1–3 días / semana"
              sub="según disponibilidad"
              accent="slate"
            />
          </div>

          {isPartTime && (
            <div className="mt-3 px-1">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="emp-minDays" className="text-xs text-slate-500 font-medium">
                  Días mínimos contratados:
                </label>
                <span className="text-sm font-bold text-slate-700" aria-live="polite">
                  {form.minDaysPerWeek} día{form.minDaysPerWeek > 1 ? 's' : ''}
                </span>
              </div>
              <input
                id="emp-minDays"
                type="range"
                min={ptRange.minDays}
                max={ptRange.maxDays}
                value={form.minDaysPerWeek}
                onChange={e => setForm(f => ({ ...f, minDaysPerWeek: Number(e.target.value) }))}
                className="w-full accent-slate-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1 día (~7h)</span>
                <span>2 días (~14h)</span>
                <span>3 días (~21h)</span>
              </div>
            </div>
          )}

          {!isPartTime && (
            <p className="text-[11px] text-slate-400 mt-2 px-1">
              Full-time siempre recibe 5 días asignados — salvo restricciones de disponibilidad.
            </p>
          )}
        </fieldset>

        {/* Print block */}
        <div>
          <label
            htmlFor="emp-scheduleGroup"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Bloque en impresión
          </label>
          <select
            id="emp-scheduleGroup"
            value={form.scheduleGroup ?? 'kitchen'}
            onChange={e => setForm(f => ({ ...f, scheduleGroup: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {SCHEDULE_GROUP_ORDER.map(g => (
              <option key={g} value={g}>
                {SCHEDULE_GROUP_LABELS[g] ?? g}
              </option>
            ))}
          </select>
        </div>

        {/* Color picker */}
        <fieldset>
          <legend className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Color en horario
          </legend>
          <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Color del empleado">
            {EMPLOYEE_COLORS.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => setForm(f => ({ ...f, color: c }))}
                role="radio"
                aria-checked={form.color === c}
                aria-label={`Color ${c}`}
                className={`w-7 h-7 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  form.color === c
                    ? 'scale-125 ring-2 ring-offset-2 ring-slate-400'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>

        {/* Roles */}
        <fieldset>
          <legend className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Rol especial
          </legend>
          <div className="space-y-2">
            <RoleCheckbox
              label="Supervisor"
              desc="Debe haber al menos 1 supervisor por día"
              checked={form.isManager}
              onChange={() => setForm(f => ({ ...f, isManager: !f.isManager }))}
            />
            <RoleCheckbox
              label="Cajero/a (cashier)"
              desc="Su rol principal es caja. Siempre ≥1 cajera por día; vie/sáb pueden pedir 2 según clima"
              checked={form.isCashier}
              onChange={() =>
                setForm(f => {
                  const nextIsCashier = !f.isCashier
                  return {
                    ...f,
                    isCashier: nextIsCashier,
                    // Si marca como cajero, activamos cashierKnowledge automáticamente
                    cashierKnowledge: nextIsCashier ? true : f.cashierKnowledge,
                  }
                })
              }
            />
            <RoleCheckbox
              label="Sabe operar la caja"
              desc="Puede cubrir turno de caja si falta una cajera (ej. supervisores senior)"
              checked={form.cashierKnowledge}
              disabled={form.isCashier}
              hint={form.isCashier ? 'Automático: los cajeros siempre saben caja' : undefined}
              onChange={() =>
                setForm(f => ({ ...f, cashierKnowledge: !f.cashierKnowledge }))
              }
            />
            <RoleCheckbox
              label="Dishwasher"
              desc="Rol de lavaplatos"
              checked={form.isDishwasher}
              onChange={() => setForm(f => ({ ...f, isDishwasher: !f.isDishwasher }))}
            />
            <RoleCheckbox
              label="Tiene segundo trabajo"
              desc="Se respeta su disponibilidad reducida"
              checked={form.hasSecondJob}
              onChange={() => setForm(f => ({ ...f, hasSecondJob: !f.hasSecondJob }))}
            />
          </div>
        </fieldset>

        {/* Availability */}
        <fieldset>
          <legend className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Días disponibles
          </legend>
          <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Días disponibles">
            {DAYS.map(day => (
              <button
                type="button"
                key={day}
                onClick={() => handleAvailability(day)}
                aria-pressed={!!form.availability[day]}
                aria-label={`${DAY_LABELS[day]}${form.availability[day] ? ' (disponible)' : ' (no disponible)'}`}
                className={`py-2 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  form.availability[day]
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {DAY_LABELS[day].slice(0, 3)}
              </button>
            ))}
          </div>
          {showErr('availability') ? (
            <p role="alert" className="text-[11px] text-red-600 mt-1.5 font-medium">
              {errors.availability}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1.5">Días azules = puede trabajar ese día</p>
          )}
        </fieldset>

        {/* Notes */}
        <div>
          <label
            htmlFor="emp-notes"
            className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Notas (opcional)
          </label>
          <textarea
            id="emp-notes"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Ej. solo puede trabajar tarde, prefiere no fines de semana…"
            rows={2}
            maxLength={LIMITS.NOTES_MAX_LENGTH}
            aria-invalid={!!showErr('notes')}
            aria-describedby={showErr('notes') ? 'emp-notes-err' : undefined}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          {showErr('notes') && (
            <p
              id="emp-notes-err"
              role="alert"
              className="text-[11px] text-red-600 mt-1 font-medium"
            >
              {errors.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {!isNew && (
            <button
              type="button"
              onClick={() => onDelete(employee.id)}
              className="text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-lg px-3 py-2 transition-colors"
            >
              Eliminar del equipo
            </button>
          )}
          <div className={`flex gap-3 ${isNew ? 'ml-auto' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={attempted && !isValid}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors"
            >
              {isNew ? 'Agregar' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function RoleCheckbox({ label, desc, checked, onChange, disabled, hint }) {
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} group`}
    >
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 w-4 h-4 rounded accent-indigo-600 focus:ring-2 focus:ring-indigo-500"
      />
      <span>
        <span className="text-sm font-medium text-slate-700 block">{label}</span>
        <span className="text-xs text-slate-400 block">{desc}</span>
        {hint && <span className="text-[10px] text-indigo-500 block italic">{hint}</span>}
      </span>
    </label>
  )
}

function EmploymentOption({ active, onClick, name, desc, sub, accent }) {
  const activeCls =
    accent === 'indigo' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-500 bg-slate-50'
  const dotActive = accent === 'indigo' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-600 bg-slate-600'

  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={active}
      className={`rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        active ? activeCls : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-slate-800">{name}</span>
        <span
          aria-hidden="true"
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            active ? dotActive : 'border-slate-300'
          }`}
        >
          {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
        </span>
      </div>
      <div className="text-xs text-slate-500">{desc}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </button>
  )
}
