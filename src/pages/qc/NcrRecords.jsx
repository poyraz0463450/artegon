import { useEffect, useState } from 'react';
import { Spinner, EmptyState } from '../../components/ui/Shared';
import { 
  getNcrRecords, getParts, updateNcrRecord, addNcrRecord 
} from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertTriangle, Search, Filter, Trash2, 
  ChevronRight, CheckCircle2, FlaskConical, Ban, 
  RotateCcw, ShieldAlert, History, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { formatDateOnly } from '../../utils/helpers';

const TH = { background: '#0d1117', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #1e3a5f', whiteSpace: 'nowrap' };
const TD = { padding: '0 16px', height: 52, fontSize: 13, color: '#94a3b8', borderBottom: '1px solid #1a2332', verticalAlign: 'middle' };
const INPUT = { width: '100%', height: 38, padding: '0 12px', background: '#0a0f1e', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 13, outline: 'none' };
const LABEL_STYLE = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' };

export default function NcrRecords() {
  const { isAdmin, isKalite } = useAuth();
  const canEdit = isAdmin || isKalite;
  
  const [ncrs, setNcrs] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal for Disposition / Analysis
  const [modal, setModal] = useState(false);
  const [selNcr, setSelNcr] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [nRes, pRes] = await Promise.all([getNcrRecords(), getParts()]);
      setNcrs(nRes.docs.map(d => ({ id: d.id, ...d.data() })));
      setParts(pRes.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      toast.error('NCR kayıtları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateNcrRecord(selNcr.id, selNcr);
      toast.success('NCR güncellendi');
      setModal(false);
      load();
    } catch (e) {
      toast.error('Giriş başarısız');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Yeni': return { bg: '#450a0a', color: '#ef4444' };
      case 'Analizde': return { bg: '#422006', color: '#fbbf24' };
      case 'Dispositioned': return { bg: '#1e3a8a', color: '#60a5fa' };
      case 'Kapalı': return { bg: '#065f46', color: '#34d399' };
      default: return { bg: '#1e293b', color: '#94a3b8' };
    }
  };

  const filtered = ncrs.filter(n => {
    const p = parts.find(x => x.id === n.partId);
    return !search || p?.partNumber?.toLowerCase().includes(search.toLowerCase()) || n.lotNumber?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <Spinner />;

  return (
    <div className="anim-fade" style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Uygunsuzluk Raporları (NCR)</h1>
          <p style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>Kalite sapmaları, hurda takibi ve kök neden analizleri</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <div style={{ background: '#0d1117', border: '1px solid #dc2626', padding: '10px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldAlert color="#ef4444" size={24} />
              <div>
                 <span style={{ display: 'block', fontSize: 10, color: '#ef4444', fontWeight: 800 }}>AÇIK NCR</span>
                 <span style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9' }}>{ncrs.filter(n=>n.status!=='Kapalı').length}</span>
              </div>
           </div>
        </div>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 12, padding: 12, marginBottom: 20, display: 'flex', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
           <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
           <input style={{ ...INPUT, paddingLeft: 36 }} placeholder="Parça veya Lot No ile ara..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <button style={{ ...INPUT, width: 'auto', background: 'transparent' }}><Filter size={16}/></button>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>NCR No</th>
              <th style={TH}>Tarih</th>
              <th style={TH}>Parça / Ürün</th>
              <th style={TH}>Lot No</th>
              <th style={TH}>Hata Özeti</th>
              <th style={TH}>Durum</th>
              <th style={TH}>Karar (Disposition)</th>
              <th style={{ ...TH, width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={8} style={{ padding: 48 }}><EmptyState message="Aktif NRC kaydı bulunmamaktadır." /></td></tr> : filtered.map(n => {
              const p = parts.find(x => x.id === n.partId);
              const ss = getStatusStyle(n.status);
              return (
                <tr key={n.id} onClick={() => { setSelNcr(n); setModal(true); }} style={{ cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ ...TD, fontFamily: 'monospace', fontWeight: 800, color: '#f1f5f9' }}>{n.id.slice(0,8).toUpperCase()}</td>
                  <td style={TD}>{formatDateOnly(n.createdAt)}</td>
                  <td style={TD}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{p?.partNumber || '—'}</span>
                       <span style={{ fontSize: 11, color: '#475569' }}>{p?.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ ...TD, fontFamily: 'monospace' }}>{n.lotNumber || '—'}</td>
                  <td style={{ ...TD, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.description}</td>
                  <td style={TD}>
                     <span style={{ 
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                        background: ss.bg, color: ss.color
                     }}>{n.status?.toUpperCase()}</span>
                  </td>
                  <td style={TD}>
                     {n.disposition ? (
                       <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: n.disposition==='Scrap'?'#f87171':'#60a5fa' }}>
                          {n.disposition === 'Scrap' ? <Ban size={12}/> : <RotateCcw size={12}/>}
                          {n.disposition === 'Scrap' ? 'HURDA' : n.disposition?.toUpperCase()}
                       </div>
                     ) : '—'}
                  </td>
                  <td style={TD}><ChevronRight size={16} color="#334155" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="NCR Analizi & Karar Mekanizması" width={800}>
        {selNcr && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                 <div style={CARD_STYLE}>
                    <h4 style={{ ...LABEL_STYLE, color: '#60a5fa', marginBottom: 12 }}>Uygunsuzluk Detayı</h4>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                       <p style={{ margin: '0 0 8px' }}><strong>Açıklama:</strong> {selNcr.description}</p>
                       <p style={{ margin: '0 0 8px' }}><strong>Tarih:</strong> {formatDateOnly(selNcr.createdAt)}</p>
                       <p style={{ margin: '0 0 8px' }}><strong>Bildiren:</strong> {selNcr.reportedBy || 'Kalite Sorumlusu'}</p>
                    </div>
                 </div>
                 <div style={CARD_STYLE}>
                    <h4 style={{ ...LABEL_STYLE, color: '#60a5fa', marginBottom: 12 }}>Süreç Durumu Management</h4>
                    <label style={LABEL_STYLE}>STÁTÜ</label>
                    <select style={INPUT} value={selNcr.status} onChange={e => setSelNcr({...selNcr, status: e.target.value})}>
                       {['Yeni', 'Analizde', 'Dispositioned', 'Kapalı'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label style={{ ...LABEL_STYLE, marginTop: 12 }}>KARAR (DISPOSITION)</label>
                    <select style={INPUT} value={selNcr.disposition || ''} onChange={e => setSelNcr({...selNcr, disposition: e.target.value})}>
                       <option value="">Seçin...</option>
                       <option value="Scrap">Hurda (Scrap)</option>
                       <option value="Rework">Yeniden İşlem (Rework)</option>
                       <option value="Use-As-Is">Olduğu Gibi Kullan</option>
                       <option value="Return to Vendor">Tedarikçiye İade</option>
                    </select>
                 </div>
              </div>

              <div style={CARD_STYLE}>
                 <h4 style={{ ...LABEL_STYLE, color: '#60a5fa', marginBottom: 12 }}>Root Cause Analysis (Kök Neden)</h4>
                 <div style={{ borderLeft: '2px dashed #1e293b', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div><label style={{ fontSize: 10, color: '#475569' }}>ANALYST OBS:</label><textarea style={{ ...INPUT, height: 60, padding: 8 }} value={selNcr.analysis || ''} onChange={e => setSelNcr({...selNcr, analysis: e.target.value})} placeholder="Bulgu analizi..." /></div>
                    <div><label style={{ fontSize: 10, color: '#475569' }}>CORRECTIVE ACTION:</label><textarea style={{ ...INPUT, height: 60, padding: 8 }} value={selNcr.capa || ''} onChange={e => setSelNcr({...selNcr, capa: e.target.value})} placeholder="Düzeltici faaliyet..." /></div>
                 </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                 <button onClick={() => setModal(false)} style={{ height: 40, padding: '0 24px', background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Kapat</button>
                 <button onClick={handleUpdate} style={{ height: 40, padding: '0 32px', background: '#dc2626', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Analizi Kaydet</button>
              </div>
           </div>
        )}
      </Modal>
    </div>
  );
}
