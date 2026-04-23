import { Fragment } from 'react'
import { DAYS, STAFFING_REQS } from '../utils/optimizer'
import { sortEmployeesByScheduleGroup, normalizeScheduleGroup } from '../data/defaultData'

const DAY_ABBREV = {
  Mon: 'MONDAY',
  Tue: 'TUESDAY',
  Wed: 'WEDNESDAY',
  Thu: 'THURSDAY',
  Fri: 'FRIDAY',
  Sat: 'SATURDAY',
  Sun: 'SUNDAY',
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function chunkByScheduleGroup(employees) {
  const ordered = sortEmployeesByScheduleGroup(employees)
  const chunks = []
  let currentGroup = null
  let bucket = []
  for (const emp of ordered) {
    const g = normalizeScheduleGroup(emp.scheduleGroup)
    if (currentGroup !== null && g !== currentGroup) {
      chunks.push({ group: currentGroup, employees: bucket })
      bucket = []
    }
    currentGroup = g
    bucket.push(emp)
  }
  if (bucket.length) chunks.push({ group: currentGroup, employees: bucket })
  return chunks
}

export default function PrintView({ employees, schedule, dayLevels, weekMonday, scoreData }) {
  if (!schedule || !weekMonday) return null

  const dayDates = DAYS.map((_, i) => {
    const d = addDays(weekMonday, i)
    return { num: d.getDate() }
  })

  const shiftStart = '11'
  const chunks = chunkByScheduleGroup(employees)

  let globalRowIdx = 0

  return (
    <div className="print-only" style={{ fontFamily: 'Arial, sans-serif', padding: '20px 24px', backgroundColor: 'white' }}>

      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>
          Le Chamois Schedule
        </h1>
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        tableLayout: 'fixed',
      }}>
        <colgroup>
          <col style={{ width: '110px' }} />
          {DAYS.map(d => <col key={d} style={{ width: '12%' }} />)}
        </colgroup>

        <thead>
          <tr>
            <td style={{ border: '2px solid black', padding: '4px 6px', fontWeight: 'bold', fontSize: '11px' }}>
              DATE:
            </td>
            {DAYS.map((day, i) => (
              <td key={day} style={{
                border: '2px solid black',
                padding: '3px 4px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '13px',
              }}>
                {ordinal(dayDates[i].num)}
              </td>
            ))}
          </tr>

          <tr style={{ backgroundColor: '#1e293b', color: 'white' }}>
            <td style={{
              border: '2px solid black',
              padding: '5px 6px',
              fontWeight: 'bold',
              fontSize: '11px',
              color: 'white',
            }}>
              EMPLOYEE
            </td>
            {DAYS.map(day => (
              <td key={day} style={{
                border: '2px solid black',
                padding: '5px 4px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '10px',
                letterSpacing: '0.3px',
                color: 'white',
              }}>
                {DAY_ABBREV[day]}
              </td>
            ))}
          </tr>
        </thead>

        <tbody>
          {chunks.map((chunk, chunkIdx) => (
            <Fragment key={chunk.group}>
              {chunkIdx > 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      border: 'none',
                      borderTop: '4px solid #000',
                      padding: 0,
                      height: 0,
                      lineHeight: 0,
                      backgroundColor: 'white',
                    }}
                  />
                </tr>
              )}

              {chunk.employees.map(emp => {
                const rowIdx = globalRowIdx++
                const isWorking = (day) => schedule[emp.id]?.[day] ?? false
                const isAvailable = (day) => emp.availability[day]

                return (
                  <tr key={emp.id} style={{ backgroundColor: rowIdx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                    <td style={{
                      border: '1.5px solid #999',
                      padding: '5px 6px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      color: emp.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {emp.name}
                      {emp.isManager ? ' ★' : ''}
                    </td>

                    {DAYS.map(day => {
                      const working = isWorking(day)
                      const available = isAvailable(day)

                      let content = null
                      if (!available) {
                        content = (
                          <div style={{
                            borderBottom: '2px solid #aaa',
                            width: '70%',
                            margin: '0 auto',
                            marginTop: '8px',
                            marginBottom: '8px',
                          }} />
                        )
                      } else if (working) {
                        content = (
                          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
                            {shiftStart}
                          </span>
                        )
                      } else {
                        content = (
                          <span style={{ color: '#666', fontWeight: 'bold', fontSize: '14px' }}>-</span>
                        )
                      }

                      return (
                        <td key={day} style={{
                          border: '1.5px solid #999',
                          padding: '4px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          height: '28px',
                        }}>
                          {content}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </Fragment>
          ))}

          <tr>
            <td colSpan={8} style={{ border: 'none', height: '8px', backgroundColor: 'white' }} />
          </tr>

          <tr style={{ backgroundColor: '#1e293b', color: 'white' }}>
            <td style={{
              border: '2px solid black',
              padding: '5px 6px',
              fontWeight: 'bold',
              fontSize: '11px',
              color: 'white',
            }}>
              TOTAL STAFF
            </td>
            {DAYS.map(day => {
              const ds = scoreData?.dayScores?.[day]
              const count = ds?.actual ?? 0
              const optimal = ds?.optimal ?? STAFFING_REQS[dayLevels[day] ?? 'medium'].optimal
              const over = count > optimal
              const under = count < optimal

              return (
                <td key={day} style={{
                  border: '2px solid black',
                  padding: '4px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  color: over ? '#fbbf24' : under ? '#f87171' : '#86efac',
                }}>
                  {count}
                </td>
              )
            })}
          </tr>

          <tr style={{ backgroundColor: '#334155', color: '#94a3b8' }}>
            <td style={{
              border: '1.5px solid #555',
              padding: '3px 6px',
              fontSize: '10px',
              color: '#94a3b8',
            }}>
              ÓPTIMO
            </td>
            {DAYS.map(day => {
              const req = STAFFING_REQS[dayLevels[day] ?? 'medium']
              return (
                <td key={day} style={{
                  border: '1.5px solid #555',
                  padding: '3px',
                  textAlign: 'center',
                  fontSize: '10px',
                  color: '#94a3b8',
                }}>
                  {req.optimal}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
        <div>
          <strong>Horario:</strong>{' '}
          {DAYS.map((day, i) => {
            const level = dayLevels[day] ?? 'medium'
            const req = STAFFING_REQS[level]
            return (
              <span key={day}>
                {DAY_ABBREV[day].slice(0, 3)}: {req.label} ({req.optimal})
                {i < 6 ? '  ·  ' : ''}
              </span>
            )
          })}
        </div>
        {scoreData && (
          <div style={{ textAlign: 'right' }}>
            <strong>Score:</strong> {scoreData.score}/100 &nbsp;|&nbsp;
            <strong>Horas totales:</strong> {scoreData.totalHours}h
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '60px' }}>
        <div style={{ fontSize: '10px', color: '#64748b' }}>
          <div style={{ borderBottom: '1px solid #999', width: '160px', marginBottom: '3px', marginTop: '20px' }} />
          Supervisor — Firma / Fecha
        </div>
        <div style={{ fontSize: '10px', color: '#64748b' }}>
          <div style={{ borderBottom: '1px solid #999', width: '160px', marginBottom: '3px', marginTop: '20px' }} />
          Recibido por — Firma / Fecha
        </div>
      </div>
    </div>
  )
}
