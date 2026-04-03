import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, EmptyState } from '../../components/ui/Shared';
import { 
  getPartById, updatePart, getModels, getInventoryBatches, 
  getStockMovements, getQcInspections, getDocuments, getSupplierParts, getPriceHistory,
  addData
} from '../../firebase/firestore';
import { 
  PART_CATEGORIES, PART_SUB_CATEGORIES, PART_UNITS, REVISION_STATUSES, STOCK_STATUSES,
  formatNumber, formatDate, formatDateOnly, formatCurrency
} from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { 
  ChevronLeft, Save, Plus, History, Layers, Package, ShieldCheck, FileText, 
  ShoppingCart, TrendingUp, AlertTriangle, Crosshair, Box, Tag, Calculator,
  Download, ExternalLink, Trash2, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const TAB_STYLE = (active) => ({ 
  padding: '12px 24px', 
  fontSize: 13, 
  fontWeight: 600, 
  color: active ? '#f1f5f9' : '#64748b', 
  borderBottom: active ? '2px solid #dc2626' : '2px solid transparent', 
  background: 'transparent', 
  cursor: 'pointer', 
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: 8
});

const CARD_STYLE = { background: '#0d1117', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 16 };
const LABEL_STYLE = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' };
const INPUT_STYLE = { width: '100%', height: 38, padding: '0 12px', background: '#0a0f1e', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 13, outline: 'none' };

export default function PartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userDoc, isAdmin, isEngineer } = useAuth();
  const canEdit = isAdmin || isEngineer;

  const [loading, setLoading] = useState(true);
  const [part, setPart] = useState(null);
  const [activeTab, setActiveTab] = useState('Genel');
  
  // Related Data
  const [models, setModels] = useState([]);
  const [batches, setBatches] = useState([]);
  const [movements, setMovements] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [docs, setDocs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    if (id === 'new') {
      setPart({
        partNumber: '', name: '', category: 'Hammadde', subCategory: 'Çelik', unit: 'Adet',
        revision: 'A', revisionStatus: 'Aktif', revisionHistory: [], isAssembly: false, 
        isCritical: false, isForeignMilitary: false, currentStock: 0, minStock: 0, 
        warehouseLocation: '', stockStatus: 'Sağlam', isActive: true, components: [], usedInModels: [],
        material: '', materialStandard: '', surfaceTreatment: '', hardness: '', weight: '', dimensions: ''
      });
      setLoading(false);
    } else {
      load();
    }
  }, [id]);

  const load = async () => {
    try {
      const pDoc = await getPartById(id);
      if (!pDoc.exists()) {
        toast.error('Parça bulunamadı');
        navigate('/parts');
        return;
      }
      const data = { id: pDoc.id, ...pDoc.data() };
      setPart(data);

      const [m, b, mv, qc, d, s, ph] = await Promise.all([
        getModels(), getInventoryBatches(), getStockMovements(), 
        getQcInspections(), getDocuments(), getSupplierParts(), getPriceHistory()
      ]);

      setModels(m.docs.map(x => ({ id: x.id, ...x.data() })));
      setBatches(b.docs.map(x => ({ id: x.id, ...x.data() })).filter(x => x.partId === id));
      setMovements(mv.docs.map(x => ({ id: x.id, ...x.data() })).filter(x => x.partId === id).slice(0, 50));
      setInspections(qc.docs.map(x => ({ id: x.id, ...x.data() })).filter(x => x.partId === id));
      setDocs(d.docs.map(x => ({ id: x.id, ...x.data() })).filter(x => x.linkedPartId === id));
      setSuppliers(s.docs.map(x => ({ id: x.id, ...x.data() })).filter(x => x.partId === id));
      setPriceHistory(ph.docs.map(x => ({ id: x.id, ...x.data() })).filter(x => x.partId === id));

    } catch (e) {
      console.error(e);
      toast.error('Hata: Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      if (id === 'new') {
        await addData('parts', part);
        toast.success('Yeni parça başarıyla eklendi');
      } else {
        await updatePart(id, part);
        toast.success('Parça güncellendi');
      }
      navigate('/parts');
    } catch (e) {
      toast.error('Kayıt sırasında hata oluştu');
    }
  };

  const openNewRevision = () => {
    const reason = prompt('Yeni revizyon açma gerekçesi (ECN):');
    if (!reason) return;
    const oldRev = part.revision;
    const nextRev = String.fromCharCode(oldRev.charCodeAt(0) + 1);
    const newHist = [
      ...(part.revisionHistory || []),
      { rev: oldRev, changedBy: userDoc?.displayName, changeDate: new Date().toISOString(), changeReason: reason }
    ];
    setPart({ ...part, revision: nextRev, revisionHistory: newHist });
    toast.success(`Yeni Revizyon: ${nextRev} taslak olarak oluşturuldu.`);
  };

  if (loading) return <Spinner />;

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* HEADER SECTION */}
      <div style={{ background: '#0a0f1e', borderBottom: '1px solid #1e293b', padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/parts')} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #1e293b', background: '#0d1117', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{id === 'new' ? 'Yeni Parça Tanımı' : part.partNumber}</h1>
                {id !== 'new' && <span style={{ padding: '4px 10px', borderRadius: 6, background: '#1e293b', color: '#60a5fa', fontSize: 11, fontWeight: 800 }}>REV {part.revision}</span>}
                {id !== 'new' && <span style={{ padding: '4px 10px', borderRadius: 6, background: part.isActive ? '#065f46' : '#1e293b', color: part.isActive ? '#34d399' : '#64748b', fontSize: 11, fontWeight: 800 }}>{part.revisionStatus}</span>}
              </div>
              <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>{part.name || 'Yeni ürün detayları'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {id !== 'new' && canEdit && (
              <button onClick={openNewRevision} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', border: '1px solid #1e293b', background: '#0d1117', color: '#f1f5f9', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 8 }}>
                <History size={16} /> Yeni Revizyon Aç
              </button>
            )}
            {canEdit && (
              <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 24px', background: '#dc2626', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
                <Save size={18} /> {id === 'new' ? 'Oluştur' : 'Değişiklikleri Kaydet'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ background: '#0a0f1e', borderBottom: '1px solid #1e293b', display: 'flex', padding: '0 24px' }}>
        <button style={TAB_STYLE(activeTab==='Genel')} onClick={()=>setActiveTab('Genel')}><Package size={16}/> Genel Bilgiler</button>
        <button style={TAB_STYLE(activeTab==='BOM')} onClick={()=>setActiveTab('BOM')}><Layers size={16}/> BOM / Ürün Ağacı</button>
        <button style={TAB_STYLE(activeTab==='Stok')} onClick={()=>setActiveTab('Stok')}><Box size={16}/> Stok & Lot Takibi</button>
        <button style={TAB_STYLE(activeTab==='Kalite')} onClick={()=>setActiveTab('Kalite')}><ShieldCheck size={16}/> Kalite Geçmişi</button>
        <button style={TAB_STYLE(activeTab==='TeknikResim')} onClick={()=>setActiveTab('TeknikResim')}><FileText size={16}/> Teknik Resimler</button>
        <button style={TAB_STYLE(activeTab==='Tedarik')} onClick={()=>setActiveTab('Tedarik')}><ShoppingCart size={16}/> Tedarik</button>
      </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#05070a', padding: 24 }}>
        
        {/* TAB 1: GENEL BİLGİLER */}
        {activeTab === 'Genel' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1400, margin: '0 auto' }}>
            <div className="section">
              {part.isCritical && (
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', padding: '12px 16px', borderRadius: 8, display: 'flex', gap: 12, marginBottom: 20 }}>
                  <AlertTriangle color="#fbbf24" size={24} />
                  <div>
                    <h4 style={{ margin: 0, color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>EMNİYET KRİTİK PARÇA</h4>
                    <p style={{ margin: '4px 0 0', color: '#fcd34d', fontSize: 11 }}>Bu parça silah sisteminin emniyeti için kritiktir. Tüm işlemlere %100 muayene uygulanmalıdır.</p>
                  </div>
                </div>
              )}
              
              <div style={CARD_STYLE}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}><Tag size={16}/> Tanımlama & Temel Bilgiler</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={LABEL_STYLE}>Parça Numarası</label><input style={INPUT_STYLE} value={part.partNumber} onChange={e=>setPart({...part,partNumber:e.target.value})} disabled={!canEdit} /></div>
                  <div><label style={LABEL_STYLE}>Parça Adı</label><input style={INPUT_STYLE} value={part.name} onChange={e=>setPart({...part,name:e.target.value})} disabled={!canEdit} /></div>
                  <div>
                    <label style={LABEL_STYLE}>Kategori</label>
                    <select style={INPUT_STYLE} value={part.category} onChange={e=>setPart({...part,category:e.target.value})} disabled={!canEdit}>
                      {PART_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Alt Kategori</label>
                    <select style={INPUT_STYLE} value={part.subCategory} onChange={e=>setPart({...part,subCategory:e.target.value})} disabled={!canEdit}>
                      {PART_SUB_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Birim</label>
                    <select style={INPUT_STYLE} value={part.unit} onChange={e=>setPart({...part,unit:e.target.value})} disabled={!canEdit}>
                      {PART_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, paddingBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>
                      <input type="checkbox" checked={part.isAssembly} onChange={e=>setPart({...part,isAssembly:e.target.checked})} /> BOM Var (Montaj/Grup)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
                      <input type="checkbox" checked={part.isCritical} onChange={e=>setPart({...part,isCritical:e.target.checked})} /> Kritik Parça
                    </label>
                  </div>
                </div>
              </div>

              <div style={CARD_STYLE}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={16}/> Stok & Depo Ayarları</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div><label style={LABEL_STYLE}>Minimum Stok</label><input type="number" style={INPUT_STYLE} value={part.minStock} onChange={e=>setPart({...part,minStock:Number(e.target.value)})} disabled={!canEdit} /></div>
                  <div><label style={LABEL_STYLE}>Maksimum Stok</label><input type="number" style={INPUT_STYLE} value={part.maxStock} onChange={e=>setPart({...part,maxStock:Number(e.target.value)})} disabled={!canEdit} /></div>
                  <div><label style={LABEL_STYLE}>Depo Lokasyonu</label><input style={INPUT_STYLE} value={part.warehouseLocation} onChange={e=>setPart({...part,warehouseLocation:e.target.value})} disabled={!canEdit} /></div>
                </div>
              </div>
            </div>

            <div className="section">
              <div style={CARD_STYLE}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>📐 Malzeme & Teknik Spesifikasyon</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={LABEL_STYLE}>Malzeme</label><input style={INPUT_STYLE} value={part.material} onChange={e=>setPart({...part,material:e.target.value})} disabled={!canEdit} /></div>
                  <div><label style={LABEL_STYLE}>Malzeme Standardı</label><input style={INPUT_STYLE} value={part.materialStandard} onChange={e=>setPart({...part,materialStandard:e.target.value})} disabled={!canEdit} /></div>
                  <div><label style={LABEL_STYLE}>Yüzey İşlem</label><input style={INPUT_STYLE} value={part.surfaceTreatment} onChange={e=>setPart({...part,surfaceTreatment:e.target.value})} disabled={!canEdit} /></div>
                  <div><label style={LABEL_STYLE}>Sertlik</label><input style={INPUT_STYLE} value={part.hardness} onChange={e=>setPart({...part,hardness:e.target.value})} disabled={!canEdit} /></div>
                  <div><label style={LABEL_STYLE}>Ağırlık (Gram)</label><input type="number" style={INPUT_STYLE} value={part.weight} onChange={e=>setPart({...part,weight:e.target.value})} disabled={!canEdit} /></div>
                  <div><label style={LABEL_STYLE}>Boyutlar (mm)</label><input style={INPUT_STYLE} value={part.dimensions} onChange={e=>setPart({...part,dimensions:e.target.value})} disabled={!canEdit} /></div>
                </div>
              </div>

              <div style={CARD_STYLE}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}><History size={16}/> Revizyon Geçmişi (PDM)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(!part.revisionHistory || part.revisionHistory.length === 0) ? (
                    <p style={{ color: '#475569', fontSize: 12 }}>Henüz bir revizyon geçmişi yok.</p>
                  ) : (
                    part.revisionHistory.map((h, i) => (
                      <div key={i} style={{ borderLeft: '2px solid #1e293b', paddingLeft: 16, position: 'relative' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', position: 'absolute', left: -5, top: 6 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>Revizyon {h.rev}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{formatDateOnly(h.changeDate)}</span>
                        </div>
                        <p style={{ margin: '4px 0', fontSize: 12, color: '#94a3b8' }}>{h.changeReason}</p>
                        <p style={{ margin: 0, fontSize: 10, color: '#475569' }}>Değiştiren: {h.changedBy}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOM / ÜRÜN AĞACI */}
        {activeTab === 'BOM' && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {!part.isAssembly ? (
              <EmptyState message="Bu parça bir montaj grubu değil. BOM yönetmek için 'BOM Var' seçeneğini işaretleyin." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                <div style={CARD_STYLE}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Ürün Ağacı (BOM)</h3>
                    <button style={{ height: 32, padding: '0 12px', background: 'transparent', border: '1px solid #1e293b', borderRadius: 4, color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>BOM İndir (Excel)</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Poz. No</th>
                        <th style={TH}>Parça No</th>
                        <th style={TH}>Ad</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Miktar</th>
                        <th style={TH}>Birim</th>
                        <th style={{ ...TH, width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!part.components || part.components.length === 0) ? (
                        <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>Henüz alt parça eklenmedi.</td></tr>
                      ) : (
                        part.components.map((c, idx) => (
                          <tr key={idx}>
                            <td style={TD}>{idx + 1}</td>
                            <td style={{ ...TD, fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>{c.partNumber}</td>
                            <td style={TD}>{c.name}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#f1f5f9' }}>{c.qty}</td>
                            <td style={TD}>{c.unit || 'Adet'}</td>
                            <td style={TD}>
                              <button style={{ background: 'transparent', border: 'none', color: '#450a0a', cursor: 'pointer' }}><Trash2 size={14}/></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="summary">
                  <div style={CARD_STYLE}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', margin: '0 0 16px' }}>BOM Özeti</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Toplam Kalem:</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{part.components?.length || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Kritik Parça Sayısı:</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>0</span>
                      </div>
                      <div style={{ height: 1, background: '#1e293b', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Tahmini Maliyet:</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>₺0,00</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ ...CARD_STYLE, opacity: 0.5 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#64748b', margin: '0 0 12px' }}>Üretim Rotaları</h4>
                    <p style={{ fontSize: 11, color: '#475569' }}>Bu montaj için tanımlanmış aktif rota bulunmamaktadır.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STOK & LOT TAKİBİ */}
        {activeTab === 'Stok' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 24, maxWidth: 1600, margin: '0 auto' }}>
            <div className="main">
              <div style={CARD_STYLE}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', margin: '0 0 20px' }}>Aktif Lot / Batch Listesi</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Lot Numarası</th>
                      <th style={TH}>Kabul Tarihi</th>
                      <th style={TH}>Kalite Durumu</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Orijinal Miktar</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Kalan Miktar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>Stokta lot kaydı bulunmuyor.</td></tr>
                    ) : (
                      batches.map(b => (
                        <tr key={b.id}>
                          <td style={{ ...TD, fontFamily: 'monospace', fontWeight: 600, color: '#f1f5f9' }}>{b.batchId}</td>
                          <td style={TD}>{formatDateOnly(b.receivedDate)}</td>
                          <td style={TD}>
                             <span style={{ 
                               fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, 
                               background: b.qcStatus === 'Sağlam' ? '#065f46' : (b.qcStatus === 'Karantina' ? '#422006' : '#450a0a'),
                               color: b.qcStatus === 'Sağlam' ? '#34d399' : (b.qcStatus === 'Karantina' ? '#fbbf24' : '#f87171')
                             }}>
                               {b.qcStatus || 'BİLİNMİYOR'}
                             </span>
                          </td>
                          <td style={{ ...TD, textAlign: 'right' }}>{b.quantity}</td>
                          <td style={{ ...TD, textAlign: 'right', fontWeight: 800, color: '#f1f5f9', fontSize: 14 }}>{b.remainingQty}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={CARD_STYLE}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', margin: '0 0 20px' }}>Stok Hareket Geçmişi (Son 50)</h3>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                      <tr><th style={TH}>Tarih</th><th style={TH}>Tür</th><th style={TH}>Miktar</th><th style={TH}>Kullanıcı</th><th style={TH}>Referans</th></tr>
                    </thead>
                    <tbody>
                      {movements.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>Hareket kaydı bulunmuyor.</td></tr>
                      ) : (
                        movements.map(m => (
                          <tr key={m.id}>
                            <td style={{ ...TD, fontSize: 12 }}>{formatDate(m.createdAt)}</td>
                            <td style={TD}>
                              <span style={{ 
                                fontSize: 11, fontWeight: 600, 
                                color: m.movementType?.includes('Giriş') ? '#34d399' : '#f87171' 
                              }}>{m.movementType}</span>
                            </td>
                            <td style={{ ...TD, fontWeight: 700, color: '#f1f5f9' }}>{m.movementType?.includes('Giriş') ? '+' : '-'}{m.qty}</td>
                            <td style={TD}>{m.performedBy || 'Sistem'}</td>
                            <td style={{ ...TD, fontSize: 11, color: '#64748b' }}>{m.referenceNumber || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="sidebar">
              <div style={CARD_STYLE}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', margin: '0 0 16px' }}>Stok Özeti</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#0a0f1e', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: 10, color: '#475569', marginBottom: 4, textTransform: 'uppercase' }}>Fiili Stok</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{formatNumber(part.currentStock)}</span>
                  </div>
                  <div style={{ background: '#0a0f1e', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: 10, color: '#475569', marginBottom: 4, textTransform: 'uppercase' }}>Rezerve</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{formatNumber(part.reservedStock || 0)}</span>
                  </div>
                </div>
                <div style={{ marginTop: 12, background: 'rgba(52, 211, 153, 0.05)', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(52, 211, 153, 0.1)' }}>
                  <span style={{ display: 'block', fontSize: 10, color: '#34d399', marginBottom: 4, textTransform: 'uppercase', fontWeight: 800 }}>Kullanılabilir Müsait Stok</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#34d399' }}>{formatNumber((part.currentStock || 0) - (part.reservedStock || 0))}</span>
                </div>
              </div>

              {movements.length > 0 && (
                <div style={{ ...CARD_STYLE, padding: '20px 10px' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', margin: '0 0 16px', paddingLeft: 10 }}>Stok Eğilimi</h4>
                  <div style={{ height: 200, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={movements.slice().reverse()}>
                        <defs><linearGradient id="colorStog" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #1e293b' }} itemStyle={{ color: '#fff' }} />
                        <Area type="monotone" dataKey="qty" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStog)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: KALİTE GEÇMİŞİ */}
        {activeTab === 'Kalite' && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
              <div style={CARD_STYLE}>
                <span style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 4 }}>TOPLAM MUAYENE</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{inspections.length}</span>
              </div>
              <div style={CARD_STYLE}>
                <span style={{ display: 'block', fontSize: 11, color: '#34d399', marginBottom: 4 }}>KABUL ORANI</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>
                   {inspections.length > 0 ? `${Math.round((inspections.filter(i=>i.overallResult==='Kabul').length / inspections.length) * 100)}%` : '-%'}
                </span>
              </div>
              <div style={CARD_STYLE}>
                <span style={{ display: 'block', fontSize: 11, color: '#f87171', marginBottom: 4 }}>RET EDİLEN</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#f87171' }}>{inspections.filter(i=>i.overallResult==='Red').length}</span>
              </div>
              <div style={CARD_STYLE}>
                <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>SON SONUÇ</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {inspections[0]?.overallResult === 'Kabul' ? <CheckCircle2 size={18} color="#34d399"/> : <XCircle size={18} color="#f87171"/>}
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{inspections[0]?.overallResult || '—'}</span>
                </div>
              </div>
            </div>

            <div style={CARD_STYLE}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', margin: '0 0 20px' }}>Detaylı Muayene Kayıtları</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>QC No</th>
                    <th style={TH}>Tarih</th>
                    <th style={TH}>Tür</th>
                    <th style={TH}>Lot No</th>
                    <th style={TH}>Müfettiş</th>
                    <th style={{ ...TH, textAlign: 'center' }}>Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                   {inspections.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>Muayene kaydı bulunmuyor.</td></tr>
                   ) : (
                     inspections.map(i => (
                       <tr key={i.id}>
                         <td style={{ ...TD, fontFamily: 'monospace', fontWeight: 600, color: '#f1f5f9' }}>{i.inspectionNo || i.id.slice(0,8).toUpperCase()}</td>
                         <td style={TD}>{formatDateOnly(i.inspectionDate || i.createdAt)}</td>
                         <td style={TD}>{i.inspectionType}</td>
                         <td style={{ ...TD, fontFamily: 'monospace' }}>{i.lotNumber || '—'}</td>
                         <td style={TD}>{i.inspectorName}</td>
                         <td style={{ ...TD, textAlign: 'center' }}>
                            <span style={{ 
                               fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                               background: i.overallResult === 'Kabul' ? '#065f46' : '#450a0a',
                               color: i.overallResult === 'Kabul' ? '#34d399' : '#f87171'
                            }}>{i.overallResult}</span>
                         </td>
                       </tr>
                     ))
                   )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: TEKNİK RESİMLER */}
        {activeTab === 'TeknikResim' && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
               {docs.length === 0 ? (
                 <div style={{ gridColumn: '1/-1' }}><EmptyState message="Bu parça için yüklenmiş teknik döküman bulunamadı." /></div>
               ) : (
                 docs.map(doc => {
                   const isCurrent = doc.revision === part.revision;
                   return (
                     <div key={doc.id} style={{ ...CARD_STYLE, position: 'relative', overflow: 'hidden', padding: 0 }}>
                       {!isCurrent && <div style={{ position: 'absolute', top: 10, right: -25, background: '#1e293b', color: '#64748b', fontSize: 9, fontWeight: 800, padding: '4px 30px', transform: 'rotate(45deg)' }}>OBSOLETE</div>}
                       <div style={{ padding: 16 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <FileText size={32} color={isCurrent ? '#3b82f6' : '#475569'} />
                            <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? '#3b82f6' : '#475569' }}>REV {doc.revision}</span>
                         </div>
                         <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '16px 0 4px' }}>{doc.title}</h4>
                         <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{doc.docNumber}</p>
                         <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                           <button style={{ flex: 1, height: 32, background: '#1e1b4b', border: 'none', borderRadius: 6, color: '#818cf8', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Download size={12}/> İndir</button>
                           <button style={{ flex: 1, height: 32, background: 'transparent', border: '1px solid #1e293b', borderRadius: 6, color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Görüntüle</button>
                         </div>
                       </div>
                       <div style={{ background: '#111827', padding: '8px 16px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 9, color: '#475569' }}>Onaylayan: {doc.approvedBy || '—'}</span>
                          <span style={{ fontSize: 9, color: '#475569' }}>{formatDateOnly(doc.approvedAt)}</span>
                       </div>
                     </div>
                   );
                 })
               )}
               {canEdit && (
                 <div style={{ ...CARD_STYLE, borderStyle: 'dashed', borderDashArray: '4', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                   <div style={{ textAlign: 'center' }}>
                     <Plus size={24} color="#334155" style={{ margin: '0 auto 8px' }} />
                     <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569' }}>Yeni Döküman Yükle</span>
                   </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* TAB 6: TEDARİK */}
        {activeTab === 'Tedarik' && (
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 24 }}>
             <div className="main">
                <div style={CARD_STYLE}>
                   <h3 style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', margin: '0 0 20px' }}>Tanımlı Tedarikçiler & Katalog Bilgisi</h3>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                       <tr>
                         <th style={TH}>Tedarikçi</th>
                         <th style={TH}>Tedarikçi Kodu</th>
                         <th style={{ ...TH, textAlign: 'right' }}>Birim Fiyat</th>
                         <th style={TH}>Termin (Gün)</th>
                         <th style={TH}>Öncelik</th>
                       </tr>
                     </thead>
                     <tbody>
                       {suppliers.length === 0 ? (
                         <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>Bu parça için tedarikçi tanımı bulunmuyor.</td></tr>
                       ) : (
                         suppliers.map(s => (
                           <tr key={s.id}>
                             <td style={{ ...TD, fontWeight: 700, color: '#f1f5f9' }}>{s.supplierName}</td>
                             <td style={{ ...TD, fontFamily: 'monospace' }}>{s.supplierPartCode || '—'}</td>
                             <td style={{ ...TD, textAlign: 'right', fontWeight: 800, color: '#38bdf8' }}>{formatCurrency(s.unitPrice, s.currency)}</td>
                             <td style={TD}>{s.leadTimeDays || '—'}</td>
                             <td style={TD}>
                               {s.isPreferred ? <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#065f46', color: '#34d399' }}>ANA TEDARİKÇİ</span> : <span style={{ fontSize: 10, color: '#64748b' }}>ALTERNATİF</span>}
                             </td>
                           </tr>
                         ))
                       )}
                     </tbody>
                   </table>
                </div>

                <div style={CARD_STYLE}>
                   <h3 style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', margin: '0 0 20px' }}>Satınalma Fiyat Geçmişi</h3>
                   <div style={{ height: 300, width: '100%' }}>
                     {priceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={priceHistory.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="purchaseDate" tickFormatter={d => formatDateOnly(d)} stroke="#475569" fontSize={10} />
                            <YAxis stroke="#475569" fontSize={10} />
                            <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #1e293b' }} itemStyle={{ color: '#fff' }} />
                            <Line type="monotone" dataKey="unitPrice" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, fill: '#dc2626' }} />
                          </LineChart>
                        </ResponsiveContainer>
                     ) : (
                       <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #1e293b', borderRadius: 8, color: '#475569', fontSize: 13 }}>Fiili satın alma verisi bulunmuyor.</div>
                     )}
                   </div>
                </div>
             </div>

             <div className="summary">
                <div style={CARD_STYLE}>
                   <h4 style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', margin: '0 0 16px' }}>Maliyet Analizi</h4>
                   <div style={{ background: '#0a0f1e', padding: 20, borderRadius: 8, textAlign: 'center', border: '1px solid #1e293b' }}>
                      <span style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 8, textTransform: 'uppercase', fontWeight: 800 }}>Son Alım Fiyatı</span>
                      <span style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9' }}>{formatCurrency(part.lastPurchasePrice, part.lastPurchaseCurrency)}</span>
                   </div>
                   <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                         <span style={{ color: '#64748b' }}>Standart Maliyet:</span>
                         <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{formatCurrency(part.standardCost || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                         <span style={{ color: '#64748b' }}>Varyans:</span>
                         <span style={{ fontWeight: 700, color: '#f87171' }}>0.00%</span>
                      </div>
                   </div>
                </div>
                
                <div style={CARD_STYLE}>
                   <h4 style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', margin: '0 0 12px' }}>Açık Siparişler (PO)</h4>
                   <p style={{ fontSize: 11, color: '#475569' }}>Bu parça için beklenen sevkiyat bulunmuyor.</p>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
