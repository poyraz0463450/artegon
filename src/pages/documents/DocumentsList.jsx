import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { Spinner, EmptyState } from '../../components/ui/Shared';
import { getDocuments, addDocument, updateDocument, deleteDocument, getParts } from '../../firebase/firestore';
import { DOC_CATEGORIES, DOC_REV_STATUSES, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Pencil, Trash2, FileText, File, CheckCircle, UploadCloud, AlertCircle } from 'lucide-react';

const INPUT = { width: '100%', height: 38, padding: '0 12px', background: '#0a0f1e', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 13, outline: 'none' };
const emptyForm = { title: '', category: 'Teknik Resim', linkedPartId: '', linkedWO: '', revision: 'A', fileName: '', description: '', revisionStatus: 'Taslak', isDownloadable: true };

export default function DocumentsList() {
  const { isAdmin, isEngineer, user, userDoc } = useAuth();
  const canEdit = isAdmin || isEngineer;
  const [docs, setDocs] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [dS, pS] = await Promise.all([getDocuments(), getParts()]);
    setDocs(dS.docs.map(d => ({ id: d.id, ...d.data() })));
    setParts(pS.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setModal(true); };
  const openEdit = d => { setEditId(d.id); setForm({ ...emptyForm, ...d }); setModal(true); };
  
  const save = async () => {
    let toSave = { ...form };
    
    if (!editId) {
      toSave.uploadedBy = userDoc?.displayName || user?.email;
    }

    // Auto-obsolete older revisions if this is approved or incelemede
    if (form.linkedPartId && (form.revisionStatus === 'Onaylandı' || form.revisionStatus === 'İncelemede')) {
      const olderDocs = docs.filter(d => d.linkedPartId === form.linkedPartId && d.id !== editId && d.category === form.category);
      for (const od of olderDocs) {
        if (od.revision !== form.revision && od.revisionStatus !== 'Pasif') {
          // Marking old document as Pasif
          await updateDocument(od.id, { revisionStatus: 'Pasif', isDownloadable: false });
        }
      }
    }

    if (editId) await updateDocument(editId, toSave); 
    else await addDocument(toSave); 

    setModal(false); load();
  };
  
  const del = async id => { if (!confirm('Silmek istediğinizden emin misiniz?')) return; await deleteDocument(id); load(); };

  const approve = async doc => {
    await updateDocument(doc.id, { revisionStatus: 'Onaylandı', approvedBy: userDoc?.displayName || user?.email, approvedAt: new Date().toISOString() });
    
    // Obsolete older ones
    if (doc.linkedPartId) {
      const olderDocs = docs.filter(d => d.linkedPartId === doc.linkedPartId && d.id !== doc.id && d.category === doc.category);
      for (const od of olderDocs) {
        if (od.revisionStatus !== 'Pasif') {
          await updateDocument(od.id, { revisionStatus: 'Pasif', isDownloadable: false });
        }
      }
    }
    load();
  };

  const submitReview = async doc => {
    await updateDocument(doc.id, { revisionStatus: 'İncelemede' });
    load();
  };

  const filtered = docs.filter(d => {
    const s = search.toLowerCase();
    return (!search || d.title?.toLowerCase().includes(s) || d.fileName?.toLowerCase().includes(s)) && (!filterCat || d.category === filterCat);
  });

  const extIcon = fn => {
    const ext = (fn || '').split('.').pop()?.toLowerCase();
    return ext === 'pdf' || ext === 'dwg' || ext === 'xlsx' || ext === 'docx' ? <FileText size={20} /> : <File size={20} />;
  };

  if (loading) return <Spinner />;

  return (
    <div className="anim-fade" style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 240 }}>
          <Search size={14} strokeWidth={1.7} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input type="text" placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...INPUT, paddingLeft: 32, width: 240 }} onFocus={e=>{e.target.style.borderColor='#dc2626'}} onBlur={e=>{e.target.style.borderColor='#334155'}} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...INPUT, width: 160, cursor: 'pointer' }}>
          <option value="">Tüm Kategoriler</option>
          {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#475569' }}>{filtered.length} doküman</span>
        {canEdit && <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', background: '#dc2626', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Plus size={15} strokeWidth={2} /> Yeni Doküman</button>}
      </div>

      {filtered.length === 0 ? <EmptyState message="Doküman yok" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(doc => {
            const isPasif = doc.revisionStatus === 'Pasif';
            return (
            <div key={doc.id} style={{ background: '#0d1117', border: `1px solid ${isPasif ? '#450a0a' : '#1e293b'}`, borderRadius: 8, padding: '18px 20px', transition: 'border-color 0.1s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = isPasif ? '#7f1d1d' : '#334155'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isPasif ? '#450a0a' : '#1e293b'; }}
            >
              {isPasif && (
                <div style={{ position: 'absolute', top: 20, right: -30, background: '#dc2626', color: 'white', fontSize: 9, fontWeight: 800, padding: '4px 30px', transform: 'rotate(45deg)', letterSpacing: 2 }}>OBSOLETE</div>
              )}
              {doc.revisionStatus === 'Onaylandı' && !isPasif && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#22c55e' }} />
              )}
              {doc.revisionStatus === 'İncelemede' && !isPasif && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#fbbf24' }} />
              )}
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, opacity: isPasif ? 0.6 : 1 }}>
                <div style={{ width: 38, height: 38, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
                  {extIcon(doc.fileName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</p>
                  <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0', fontFamily: 'monospace' }}>{doc.fileName || '—'}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', background: '#1e293b', padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' }}>{doc.category}</span>
              </div>
              
              {doc.description && <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', opacity: isPasif ? 0.6 : 1 }}>{doc.description}</p>}
              
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#475569', marginBottom: 12, opacity: isPasif ? 0.6 : 1 }}>
                <span style={{ color: doc.revisionStatus === 'Onaylandı' ? '#22c55e' : doc.revisionStatus === 'İncelemede' ? '#fbbf24' : '#64748b', fontWeight: 600 }}>Rev: {doc.revision}</span>
                {doc.linkedPartId && <span>Parça: {parts.find(p=>p.id===doc.linkedPartId)?.partNumber || doc.linkedPartId}</span>}
                {doc.linkedWO && <span>İE: {doc.linkedWO}</span>}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #1a2332' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>{doc.uploadedBy} · {formatDate(doc.createdAt)}</span>
                  {doc.approvedBy && <span style={{ fontSize: 10, color: '#22c55e' }}>Onay: {doc.approvedBy}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {doc.revisionStatus === 'Taslak' && (doc.uploadedBy === userDoc?.displayName || doc.uploadedBy === user?.email || canEdit) && (
                    <button onClick={() => submitReview(doc)} title="İncelemeye Gönder" style={{ height: 26, padding: '0 10px', border: '1px solid #1e293b', background: 'transparent', color: '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4, fontSize: 10, fontWeight: 600 }} onMouseEnter={e=>e.currentTarget.style.background='#1e293b'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><UploadCloud size={12} /> Gönder</button>
                  )}
                  {doc.revisionStatus === 'İncelemede' && canEdit && (
                    <button onClick={() => approve(doc)} title="Onayla" style={{ height: 26, padding: '0 10px', border: '1px solid #14532d', background: 'rgba(34,197,94,0.1)', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4, fontSize: 10, fontWeight: 600 }} onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.1)'}><CheckCircle size={12} /> Onayla</button>
                  )}
                  {doc.isDownloadable && !isPasif && (
                    <button onClick={() => alert('Firebase Storage mock: Dosya İndirildi.')} title="İndir" style={{ height: 26, padding: '0 10px', border: '1px solid #1e293b', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4, fontSize: 10, fontWeight: 600 }} onMouseEnter={e=>e.currentTarget.style.background='#1e293b'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>İndir</button>
                  )}
                  {canEdit && (
                    <>
                      <button onClick={() => openEdit(doc)} style={{ width: 26, height: 26, border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#1e293b';e.currentTarget.style.color='#e2e8f0'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569'}}
                      ><Pencil size={12} strokeWidth={1.7} /></button>
                      {isAdmin && <button onClick={() => del(doc.id)} style={{ width: 26, height: 26, border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,38,38,0.1)';e.currentTarget.style.color='#dc2626'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#475569'}}
                      ><Trash2 size={12} strokeWidth={1.7} /></button>}
                    </>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Doküman Düzenle' : 'Yeni Doküman'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Başlık</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={INPUT} onFocus={e=>{e.target.style.borderColor='#dc2626'}} onBlur={e=>{e.target.style.borderColor='#334155'}} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Kategori</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{ ...INPUT, cursor: 'pointer' }}>{DOC_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Revizyon</label><input value={form.revision} onChange={e=>setForm({...form,revision:e.target.value})} style={INPUT} onFocus={e=>{e.target.style.borderColor='#dc2626'}} onBlur={e=>{e.target.style.borderColor='#334155'}} /></div>
          </div>
          <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Dosya Adı</label><input value={form.fileName} onChange={e=>setForm({...form,fileName:e.target.value})} placeholder="teknik-resim.pdf" style={INPUT} onFocus={e=>{e.target.style.borderColor='#dc2626'}} onBlur={e=>{e.target.style.borderColor='#334155'}} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Bağlı Parça</label><select value={form.linkedPartId} onChange={e=>setForm({...form,linkedPartId:e.target.value})} style={{ ...INPUT, cursor: 'pointer' }}><option value="">Seçin...</option>{parts.map(p=><option key={p.id} value={p.id}>{p.partNumber} — {p.name}</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Bağlı İE</label><input value={form.linkedWO} onChange={e=>setForm({...form,linkedWO:e.target.value})} style={INPUT} onFocus={e=>{e.target.style.borderColor='#dc2626'}} onBlur={e=>{e.target.style.borderColor='#334155'}} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Durum</label><select value={form.revisionStatus} onChange={e=>setForm({...form,revisionStatus:e.target.value})} style={{ ...INPUT, cursor: 'pointer' }}>{DOC_REV_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', fontSize: 13, marginTop: 22 }}><input type="checkbox" checked={form.isDownloadable} onChange={e=>setForm({...form,isDownloadable:e.target.checked})} /> İndirilebilir</label>
          </div>
          <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Açıklama</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} style={{ ...INPUT, height: 'auto', padding: 12, resize: 'none' }} /></div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={() => setModal(false)} style={{ height: 36, padding: '0 18px', background: 'transparent', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>İptal</button>
            <button onClick={save} style={{ height: 36, padding: '0 20px', background: '#dc2626', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{editId ? 'Güncelle' : 'Kaydet'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
