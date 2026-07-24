import { useState } from 'react'
import api from '../utils/api.js'
import { FilePlus, MapPin, Map, User, ShieldAlert, CheckCircle } from 'lucide-react'

export default function RegisterFIRPage() {
  const [form, setForm] = useState({
    district: '',
    station: '',
    crime_group: '',
    crime_head: '',
    place: '',
    accused: '',
    lat: '',
    lon: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        lat: parseFloat(form.lat) || 12.9716,
        lon: parseFloat(form.lon) || 77.5946,
      }
      // Send to backend
      await api.post('/fir/register', payload)
      setSuccess(true)
      setForm({ district: '', station: '', crime_group: '', crime_head: '', place: '', accused: '', lat: '', lon: '' })
    } catch (err) {
      alert("Failed to register FIR: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter">
      <div className="card mb-6" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div>
            <div className="card-title">Register New FIR</div>
            <div className="card-subtitle">Digital First Information Report Entry (Karnataka State Police)</div>
          </div>
          <FilePlus size={20} className="text-muted" />
        </div>
        
        <div className="card-body">
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle size={48} className="text-green mx-auto mb-4" />
              <h3 style={{ color: '#fff', marginBottom: 8 }}>FIR Registered Successfully</h3>
              <p className="text-muted mb-6">The report has been permanently appended to the NCRB Data Lake.</p>
              <button className="btn btn-primary" onClick={() => setSuccess(false)}>Register Another FIR</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label className="text-muted block mb-2 text-xs font-500 uppercase">District</label>
                  <div className="input-wrap">
                    <Map size={16} className="ml-3 text-muted" />
                    <input name="district" value={form.district} onChange={handleChange} className="input-field" style={{ paddingLeft: 36, width: '100%' }} placeholder="e.g. Bengaluru Urban" required />
                  </div>
                </div>
                <div>
                  <label className="text-muted block mb-2 text-xs font-500 uppercase">Police Station</label>
                  <div className="input-wrap">
                    <ShieldAlert size={16} className="ml-3 text-muted" />
                    <input name="station" value={form.station} onChange={handleChange} className="input-field" style={{ paddingLeft: 36, width: '100%' }} placeholder="e.g. Koramangala PS" required />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label className="text-muted block mb-2 text-xs font-500 uppercase">Crime Category</label>
                  <input name="crime_group" value={form.crime_group} onChange={handleChange} className="input-field" style={{ width: '100%' }} placeholder="e.g. THEFT" required />
                </div>
                <div>
                  <label className="text-muted block mb-2 text-xs font-500 uppercase">Crime Sub-Category</label>
                  <input name="crime_head" value={form.crime_head} onChange={handleChange} className="input-field" style={{ width: '100%' }} placeholder="e.g. THEFT - DAY" required />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-2 text-xs font-500 uppercase">Accused Name</label>
                <div className="input-wrap">
                  <User size={16} className="ml-3 text-muted" />
                  <input name="accused" value={form.accused} onChange={handleChange} className="input-field" style={{ paddingLeft: 36, width: '100%' }} placeholder="Enter accused name or 'Unknown'" required />
                </div>
              </div>
              
              <div>
                <label className="text-muted block mb-2 text-xs font-500 uppercase">Place of Occurrence</label>
                <input name="place" value={form.place} onChange={handleChange} className="input-field" style={{ width: '100%' }} placeholder="Exact location details" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label className="text-muted block mb-2 text-xs font-500 uppercase">Latitude</label>
                  <div className="input-wrap">
                    <MapPin size={16} className="ml-3 text-muted" />
                    <input name="lat" type="number" step="any" value={form.lat} onChange={handleChange} className="input-field" style={{ paddingLeft: 36, width: '100%' }} placeholder="e.g. 12.9716" required />
                  </div>
                </div>
                <div>
                  <label className="text-muted block mb-2 text-xs font-500 uppercase">Longitude</label>
                  <div className="input-wrap">
                    <MapPin size={16} className="ml-3 text-muted" />
                    <input name="lon" type="number" step="any" value={form.lon} onChange={handleChange} className="input-field" style={{ paddingLeft: 36, width: '100%' }} placeholder="e.g. 77.5946" required />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: 42, padding: '0 32px' }}>
                  {loading ? <div className="spinner spinner-sm" /> : 'SUBMIT FIR REPORT'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}