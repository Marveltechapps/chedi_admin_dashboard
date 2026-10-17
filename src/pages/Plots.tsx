import { useRef, useState, type ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import { pill, sPill } from '../lib/pill';
import { filterChipStyle, filterCountStyle } from '../lib/buttons';
import { mediaUrl } from '../lib/apiBase';
import type { Plot, PlotImage } from '../types';

const GROUPS: [string, string][] = [
  ['all', 'All plots'],
  ['available', 'Available'],
  ['cultivating', 'In cultivation'],
  ['reserved', 'Reserved'],
  ['maintenance', 'Maintenance'],
];

const STATUSES: [string, string][] = [
  ['available', 'Available'],
  ['reserved', 'Reserved'],
  ['cultivating', 'In cultivation'],
  ['harvesting', 'Harvesting'],
  ['leased', 'Leased'],
  ['maintenance', 'Maintenance'],
  ['unavailable', 'Unavailable'],
];

type PendingImage = { id: string; dataUrl?: string; link?: string; label: string; setCover: boolean };

type PlotDraft = {
  isNew: boolean;
  key: string;
  name: string;
  farmId: string;
  region: string;
  city: string;
  district: string;
  stateName: string;
  size: string;
  crop: string;
  soil: string;
  status: string;
  totalUnits: string;
  availableUnits: string;
  imageUrl: string;
  gallery: PlotImage[];
  pending: PendingImage[];
};

type FarmDraft = { id: string; name: string; region: string; farmer: string };

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d8cfb8',
  borderRadius: 4,
  fontSize: 14,
  background: '#faf8f2',
  color: '#1c3b2c',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 12, color: '#6f7566', fontWeight: 600 }}>{label}</span>
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}

function draftFromPlot(p: Plot): PlotDraft {
  return {
    isNew: false,
    key: p.key,
    name: p.name,
    farmId: p.farmId,
    region: p.region || '',
    city: p.city || '',
    district: p.district || '',
    stateName: p.stateName || '',
    size: p.size || '600 sq ft',
    crop: p.cropLabel || p.cropName || '',
    soil: p.soil || '',
    status: p.status || 'available',
    totalUnits: String(p.totalUnits ?? 0),
    availableUnits: String(p.availableUnits ?? 0),
    imageUrl: p.imageUrl || '',
    gallery: p.gallery || [],
    pending: [],
  };
}

function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const src = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const max = 960;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.72;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 180_000 && quality > 0.35) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function Plots() {
  const { state, actions } = useApp();
  const plotCards = state.plots;
  const fileRef = useRef<HTMLInputElement>(null);
  const imageLock = useRef(false);
  const [draft, setDraft] = useState<PlotDraft | null>(null);
  const [farmDraft, setFarmDraft] = useState<FarmDraft | null>(null);
  const [imageLabel, setImageLabel] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [useCover, setUseCover] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmFarmDelete, setConfirmFarmDelete] = useState(false);

  const openDetails = async (key: string) => {
    const known = state.plots.find((p) => p.key === key);
    setConfirmDelete(false);
    setImageLabel('');
    setImageLink('');
    setUseCover(true);
    if (known) setDraft(draftFromPlot(known));
    const fresh = await actions.fetchPlot(key);
    if (fresh) setDraft(draftFromPlot(fresh));
  };

  const openCreate = () => {
    const farm = state.farms[0];
    setConfirmDelete(false);
    setImageLabel('');
    setImageLink('');
    setUseCover(true);
    setDraft({
      isNew: true,
      key: '',
      name: '',
      farmId: farm?.id || '',
      region: farm?.region || '',
      city: '',
      district: '',
      stateName: 'Tamil Nadu',
      size: '600 sq ft',
      crop: '',
      soil: 'Red loam · organic certified',
      status: 'available',
      totalUnits: '1',
      availableUnits: '1',
      imageUrl: '',
      gallery: [],
      pending: [],
    });
  };

  const onFarmChange = (farmId: string) => {
    if (!draft) return;
    const farm = state.farms.find((f) => f.id === farmId);
    setDraft({ ...draft, farmId, region: draft.region || farm?.region || '' });
  };

  const saveDraft = async () => {
    if (!draft) return;
    const saved = await actions.savePlot({
      isNew: draft.isNew,
      key: draft.key,
      name: draft.name.trim(),
      farmId: draft.farmId,
      region: draft.region.trim(),
      city: draft.city.trim(),
      district: draft.district.trim(),
      state: draft.stateName.trim(),
      size: draft.size.trim(),
      crop: draft.crop.trim(),
      soil: draft.soil.trim(),
      opsStatus: draft.status,
      totalUnits: Number(draft.totalUnits),
      availableUnits: Number(draft.availableUnits),
    });
    if (!saved) return;
    let current = saved;
    const leftover: PendingImage[] = [];
    for (const img of draft.pending) {
      const next = await actions.addPlotImage(current.key, {
        dataUrl: img.dataUrl,
        imageUrl: img.link,
        label: img.label,
        setCover: img.setCover,
      });
      if (next) current = next;
      else leftover.push(img);
    }
    setDraft({ ...draftFromPlot(current), pending: leftover });
    setConfirmDelete(false);
  };

  const onPickImage = async (file: File | undefined) => {
    if (!draft || !file) return;
    if (!file.type.startsWith('image/')) {
      actions.flash('Choose an image file');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      actions.flash('Image must be under 8 MB');
      return;
    }
    const dataUrl = await compressImage(file);
    const label = imageLabel.trim() || file.name.replace(/\.[^.]+$/, '') || 'photo';
    const setCover = useCover || (!draft.imageUrl && draft.gallery.length + draft.pending.length === 0);
    if (draft.isNew || !draft.key) {
      setDraft({
        ...draft,
        pending: draft.pending.concat({ id: crypto.randomUUID(), dataUrl, label, setCover }),
        imageUrl: setCover ? dataUrl : draft.imageUrl,
      });
      setImageLabel('');
      return;
    }
    if (imageLock.current) return;
    imageLock.current = true;
    try {
      const next = await actions.addPlotImage(draft.key, { dataUrl, label, setCover });
      if (next) setDraft(draftFromPlot(next));
      setImageLabel('');
    } finally {
      imageLock.current = false;
    }
  };

  const addImageLink = async () => {
    if (!draft) return;
    const link = imageLink.trim();
    let parsed: URL;
    try {
      parsed = new URL(link);
    } catch {
      actions.flash('Paste a full image link starting with https://');
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      actions.flash('Image link must start with http:// or https://');
      return;
    }
    const label = imageLabel.trim() || 'photo';
    const setCover = useCover || (!draft.imageUrl && draft.gallery.length + draft.pending.length === 0);
    if (draft.isNew || !draft.key) {
      setDraft({
        ...draft,
        pending: draft.pending.concat({ id: crypto.randomUUID(), link, label, setCover }),
        imageUrl: setCover ? link : draft.imageUrl,
      });
      setImageLabel('');
      setImageLink('');
      return;
    }
    if (imageLock.current) return;
    imageLock.current = true;
    try {
      const next = await actions.addPlotImage(draft.key, { imageUrl: link, label, setCover });
      if (next) setDraft(draftFromPlot(next));
      setImageLabel('');
      setImageLink('');
    } finally {
      imageLock.current = false;
    }
  };

  const removeImage = async (imageUrl: string, pendingId?: string) => {
    if (!draft || !imageUrl) return;
    if (pendingId) {
      const pending = draft.pending.filter((img) => img.id !== pendingId);
      const imageUrlNext = draft.imageUrl === imageUrl ? pending.find((img) => img.setCover)?.dataUrl || draft.gallery[0]?.imageUrl || '' : draft.imageUrl;
      setDraft({ ...draft, pending, imageUrl: imageUrlNext });
      return;
    }
    if (imageLock.current) return;
    const previous = draft;
    const gallery = draft.gallery.filter((g) => g.imageUrl !== imageUrl);
    const imageUrlNext = draft.imageUrl === imageUrl ? gallery[0]?.imageUrl || '' : draft.imageUrl;
    setDraft({ ...draft, gallery, imageUrl: imageUrlNext });
    imageLock.current = true;
    try {
      const next = await actions.removePlotImage(draft.key, imageUrl);
      if (next) setDraft(draftFromPlot(next));
      else setDraft(previous);
    } finally {
      imageLock.current = false;
    }
  };

  const deleteDraft = async () => {
    if (!draft?.key) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const ok = await actions.removePlot(draft.key);
    if (ok) {
      setDraft(null);
      setConfirmDelete(false);
    }
  };

  const saveFarm = async () => {
    if (!farmDraft) return;
    const ok = await actions.saveFarm({
      id: farmDraft.id || undefined,
      name: farmDraft.name.trim(),
      region: farmDraft.region.trim(),
      farmer: farmDraft.farmer.trim(),
    });
    if (ok) setFarmDraft(null);
  };

  const deleteFarm = async () => {
    if (!farmDraft?.id) return;
    if (!confirmFarmDelete) {
      setConfirmFarmDelete(true);
      return;
    }
    const ok = await actions.removeFarm(farmDraft.id);
    if (ok) {
      setFarmDraft(null);
      setConfirmFarmDelete(false);
    }
  };

  const live = draft?.key ? state.plots.find((p) => p.key === draft.key) : null;
  const cover = draft?.imageUrl ? mediaUrl(draft.imageUrl) : '';

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => {
            setConfirmFarmDelete(false);
            setFarmDraft({ id: '', name: '', region: '', farmer: '' });
          }}
          className="ch-btn-outline"
          style={{ padding: '10px 16px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}
        >
          Add farm
        </button>
        <button
          onClick={openCreate}
          className="ch-btn-primary"
          style={{ padding: '10px 16px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}
        >
          Add plot
        </button>
      </div>

      {state.farms.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
          {state.farms.map((f) => (
            <div key={f.id} style={{ background: '#1c3b2c', borderRadius: 8, padding: '18px 20px', color: '#f6f3ea' }}>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 19 }}>{f.name}</div>
              <div style={{ fontSize: 12.5, color: '#a8b8a0', marginTop: 2 }}>{f.region}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12.5 }}>
                <div>
                  <div style={{ color: '#d9b45f', fontFamily: "'Space Mono',monospace", fontSize: 18 }}>{f.plotCount ?? 0}</div>
                  <div style={{ color: '#8fa389' }}>plots</div>
                </div>
                <div>
                  <div style={{ color: '#d9b45f', fontFamily: "'Space Mono',monospace", fontSize: 18 }}>{f.leasedCount ?? 0}</div>
                  <div style={{ color: '#8fa389' }}>leased</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ color: '#8fa389' }}>Farmer</div>
                  <div style={{ color: '#f6f3ea', fontWeight: 600 }}>{f.farmer}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={() => {
                    setConfirmFarmDelete(false);
                    setFarmDraft({ id: f.id, name: f.name, region: f.region, farmer: f.farmer });
                  }}
                  className="ch-btn-outline"
                  style={{ flex: 1, padding: 8, borderRadius: 3, fontSize: 12.5, fontWeight: 600, background: 'transparent', color: '#f6f3ea', borderColor: '#3a5545' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setConfirmFarmDelete(true);
                    setFarmDraft({ id: f.id, name: f.name, region: f.region, farmer: f.farmer });
                  }}
                  style={{ flex: 1, padding: 8, borderRadius: 3, fontSize: 12.5, fontWeight: 600, background: 'transparent', color: '#f0c2b4', border: '1px solid #6d4034', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GROUPS.map(([k, label]) => {
            const on = state.plotFilter === k;
            const count = state.plotCounts[k] ?? 0;
            return (
              <button key={k} onClick={() => actions.setPlotFilter(k)} style={filterChipStyle(on)}>
                {label}
                <span style={filterCountStyle(on)}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {plotCards.map((p) => {
          const pil = pill(p.status);
          const stage = sPill(p.stage);
          const pillStyle = { ...pil.style, fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: '.04em', borderRadius: 3, padding: '3px 8px' };
          return (
            <div key={p.key} style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: 140, background: 'repeating-linear-gradient(45deg,#dbe1d1,#dbe1d1 10px,#e6ebdd 10px,#e6ebdd 20px)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: 10 }}>
                {p.imageUrl && (
                  <img src={mediaUrl(p.imageUrl)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <span style={{ ...pillStyle, position: 'relative' }}>{pil.label}</span>
                {p.cropKey && (
                  <span style={{ position: 'relative', background: 'rgba(255,255,255,.85)', color: '#2e5a41', border: '1px solid #c3dcb8', fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 3 }}>
                    {stage.label}
                  </span>
                )}
              </div>
              <div style={{ padding: '15px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#1c3b2c' }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: '#9aa08d' }}>{p.size}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6f7566', marginTop: 2 }}>{p.region || ''}</div>
                <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid #efe9db', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9aa08d' }}>Member</span><span style={{ color: '#3a4033' }}>{p.memberName || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9aa08d' }}>Crop</span><span style={{ color: '#3a4033' }}>{p.cropName || p.cropLabel || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9aa08d' }}>Farmer</span><span style={{ color: '#3a4033' }}>{p.farmerName || '—'}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 7, marginTop: 13 }}>
                  <button onClick={() => openDetails(p.key)} className="ch-btn-outline" style={{ flex: 1, padding: 8, borderRadius: 3, fontSize: 12.5, fontWeight: 600 }}>Details</button>
                  {p.status === 'available' && (
                    <button onClick={() => actions.assignPlot(p.key)} className="ch-btn-primary" style={{ flex: 1, padding: 8, borderRadius: 3, fontSize: 12.5, fontWeight: 600 }}>Assign</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {plotCards.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 40, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>
          No plots in this view.
        </div>
      )}

      {draft && (
        <div onClick={() => setDraft(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,24,.5)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="ch-fade" style={{ width: '100%', maxWidth: 920, maxHeight: '92vh', overflow: 'auto', background: '#f6f3ea', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '22px 24px 0' }}>
              <div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '.08em', color: '#b98a2e' }}>PLOTS & FARM</div>
                <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 26, color: '#1c3b2c', margin: '6px 0 0' }}>
                  {draft.isNew ? 'Add plot' : draft.name || 'Plot details'}
                </h3>
              </div>
              <button onClick={() => setDraft(null)} className="ch-btn-outline" style={{ height: 36, padding: '0 12px', borderRadius: 3, fontWeight: 600 }}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 22, padding: 24 }}>
              <div>
                <div style={{ height: 220, borderRadius: 8, overflow: 'hidden', background: '#dbe1d1', position: 'relative', border: '1px solid #cdd5be' }}>
                  {cover && <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  <span style={{ position: 'absolute', left: 12, bottom: 12, fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#fff', background: 'rgba(28,59,44,.72)', padding: '4px 8px', borderRadius: 2 }}>
                    Cover photo
                  </span>
                  {draft.imageUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeImage(draft.imageUrl);
                      }}
                      style={{ position: 'absolute', top: 12, right: 12, background: '#b0361f', color: '#fff', border: 'none', borderRadius: 3, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {draft.gallery.map((g, index) => (
                    <div key={`${g.imageUrl}-${index}`} style={{ width: 92 }}>
                      <div style={{ height: 64, borderRadius: 4, overflow: 'hidden', border: '1px solid #cdd5be', position: 'relative' }}>
                        <img src={mediaUrl(g.imageUrl)} alt={g.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeImage(g.imageUrl);
                        }}
                        style={{ marginTop: 4, width: '100%', border: '1px solid #e7b2a6', background: '#fff', color: '#b0361f', borderRadius: 3, padding: '5px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {draft.pending.map((g) => (
                    <div key={g.id} style={{ width: 92 }}>
                      <div style={{ height: 64, borderRadius: 4, overflow: 'hidden', border: '1px solid #cdd5be' }}>
                        <img src={g.dataUrl || g.link} alt={g.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <button type="button" onClick={() => removeImage(g.dataUrl || g.link || '', g.id)} style={{ marginTop: 4, width: '100%', border: '1px solid #e7b2a6', background: '#fff', color: '#b0361f', borderRadius: 3, padding: '5px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1c3b2c' }}>Add image</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input value={imageLabel} onChange={(e) => setImageLabel(e.target.value)} placeholder="Label, e.g. beds" style={{ ...inputStyle, flex: 1 }} />
                    <button type="button" onClick={() => fileRef.current?.click()} className="ch-btn-primary" style={{ padding: '10px 14px', borderRadius: 3, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Upload file
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      value={imageLink}
                      onChange={(e) => setImageLink(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void addImageLink();
                        }
                      }}
                      placeholder="Or paste an image link, https://..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button type="button" onClick={() => void addImageLink()} className="ch-btn-outline" style={{ padding: '10px 14px', borderRadius: 3, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Add link
                    </button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13, color: '#4b5142' }}>
                    <input type="checkbox" checked={useCover} onChange={(e) => setUseCover(e.target.checked)} />
                    Use as cover photo
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      void onPickImage(file);
                    }}
                  />
                  {draft.isNew && <div style={{ marginTop: 8, fontSize: 12, color: '#9aa08d' }}>Files and links are saved with the plot.</div>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {live && (
                  <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: '12px 14px', fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9aa08d' }}>Member</span><span>{live.memberName || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span style={{ color: '#9aa08d' }}>Farmer</span><span>{live.farmerName || '—'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span style={{ color: '#9aa08d' }}>Current crop</span><span>{live.cropName || '—'}</span></div>
                  </div>
                )}
                <Field label="Plot name">
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} />
                </Field>
                <Field label="Farm">
                  <select value={draft.farmId} onChange={(e) => onFarmChange(e.target.value)} style={inputStyle}>
                    <option value="">Choose a farm</option>
                    {state.farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Region">
                    <input value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} style={inputStyle} />
                  </Field>
                  <Field label="Size">
                    <input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} style={inputStyle} />
                  </Field>
                  <Field label="City">
                    <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} style={inputStyle} />
                  </Field>
                  <Field label="District">
                    <input value={draft.district} onChange={(e) => setDraft({ ...draft, district: e.target.value })} style={inputStyle} />
                  </Field>
                  <Field label="State">
                    <input value={draft.stateName} onChange={(e) => setDraft({ ...draft, stateName: e.target.value })} style={inputStyle} />
                  </Field>
                  <Field label="Status">
                    <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} style={inputStyle}>
                      {STATUSES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                    </select>
                  </Field>
                  <Field label="Crop">
                    <input value={draft.crop} onChange={(e) => setDraft({ ...draft, crop: e.target.value })} style={inputStyle} />
                  </Field>
                  <Field label="Soil">
                    <input value={draft.soil} onChange={(e) => setDraft({ ...draft, soil: e.target.value })} style={inputStyle} />
                  </Field>
                  <Field label="Total units">
                    <input value={draft.totalUnits} onChange={(e) => setDraft({ ...draft, totalUnits: e.target.value })} inputMode="numeric" style={inputStyle} />
                  </Field>
                  <Field label="Available units">
                    <input value={draft.availableUnits} onChange={(e) => setDraft({ ...draft, availableUnits: e.target.value })} inputMode="numeric" style={inputStyle} />
                  </Field>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {!draft.isNew && (
                    <button type="button" onClick={deleteDraft} style={{ flex: 1, padding: 12, borderRadius: 3, fontWeight: 600, fontSize: 14, background: confirmDelete ? '#b0361f' : '#fff', color: confirmDelete ? '#fff' : '#b0361f', border: '1px solid #e7b2a6', cursor: 'pointer' }}>
                      {confirmDelete ? 'Confirm delete' : 'Delete plot'}
                    </button>
                  )}
                  <button type="button" onClick={saveDraft} disabled={state.busy} className="ch-btn-primary" style={{ flex: 1.4, padding: 12, borderRadius: 3, fontWeight: 600, fontSize: 14, opacity: state.busy ? 0.7 : 1 }}>
                    {state.busy ? 'Saving…' : draft.isNew ? 'Create plot' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {farmDraft && (
        <div onClick={() => setFarmDraft(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,24,.5)', zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#f6f3ea', borderRadius: 10, padding: 24 }}>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 24, color: '#1c3b2c', margin: '0 0 16px' }}>
              {farmDraft.id ? 'Edit farm' : 'Add farm'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Farm name">
                <input value={farmDraft.name} onChange={(e) => setFarmDraft({ ...farmDraft, name: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Region">
                <input value={farmDraft.region} onChange={(e) => setFarmDraft({ ...farmDraft, region: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Farmer">
                <input value={farmDraft.farmer} onChange={(e) => setFarmDraft({ ...farmDraft, farmer: e.target.value })} style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              {farmDraft.id && (
                <button type="button" onClick={deleteFarm} style={{ flex: 1, padding: 12, borderRadius: 3, fontWeight: 600, background: confirmFarmDelete ? '#b0361f' : '#fff', color: confirmFarmDelete ? '#fff' : '#b0361f', border: '1px solid #e7b2a6', cursor: 'pointer' }}>
                  {confirmFarmDelete ? 'Confirm delete' : 'Delete'}
                </button>
              )}
              <button type="button" onClick={() => setFarmDraft(null)} className="ch-btn-outline" style={{ flex: 1, padding: 12, borderRadius: 3, fontWeight: 600 }}>Cancel</button>
              <button type="button" onClick={saveFarm} disabled={state.busy} className="ch-btn-primary" style={{ flex: 1.3, padding: 12, borderRadius: 3, fontWeight: 600, opacity: state.busy ? 0.7 : 1 }}>
                {farmDraft.id ? 'Save farm' : 'Create farm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
