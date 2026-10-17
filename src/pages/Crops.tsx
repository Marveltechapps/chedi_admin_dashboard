import { useState, type ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import { pill } from '../lib/pill';
import { Icon } from '../lib/icons';
import { formatDay } from '../lib/dates';
import type { Crop, Cultivation, CropStage } from '../types';

const STAGES: CropStage[] = ['planned', 'growing', 'flowering', 'fruiting', 'ready', 'harvested'];

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d8cfb8',
  borderRadius: 4,
  fontSize: 14,
  background: '#faf8f2',
  color: '#1c3b2c',
};

type CropDraft = { isNew: boolean; key: string; name: string; season: string; unit: string };
type HarvestDraft = {
  isNew: boolean;
  previousPlotKey: string;
  plotKey: string;
  cropName: string;
  plantDate: string;
  harvestDate: string;
  cropStage: CropStage;
  targetYield: string;
  actualYield: string;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 12, color: '#6f7566', fontWeight: 600 }}>{label}</span>
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}

function cropDraft(crop?: Crop): CropDraft {
  return {
    isNew: !crop,
    key: crop?.key || '',
    name: crop?.name || '',
    season: crop?.season || '',
    unit: crop?.unit || '',
  };
}

function harvestDraft(row?: Cultivation): HarvestDraft {
  return {
    isNew: !row,
    previousPlotKey: row?.plotKey || '',
    plotKey: row?.plotKey || '',
    cropName: row?.cropName || '',
    plantDate: row?.plantDate || '',
    harvestDate: row?.harvestDate || '',
    cropStage: row?.cropStage || 'planned',
    targetYield: row ? String(row.targetYield) : '12',
    actualYield: row?.actualYield == null ? '' : String(row.actualYield),
  };
}

export function Crops() {
  const { state, actions } = useApp();
  const rows = state.cultivations;
  const shortfalls = rows.filter((r) => r.shortfall);
  const [cropForm, setCropForm] = useState<CropDraft | null>(null);
  const [harvestForm, setHarvestForm] = useState<HarvestDraft | null>(null);
  const [confirmCrop, setConfirmCrop] = useState(false);
  const [confirmHarvest, setConfirmHarvest] = useState(false);

  const saveCrop = async () => {
    if (!cropForm) return;
    const saved = await actions.saveCrop({
      isNew: cropForm.isNew,
      key: cropForm.key,
      name: cropForm.name,
      season: cropForm.season,
      unit: cropForm.unit,
    });
    if (saved) setCropForm(null);
  };

  const deleteCrop = async () => {
    if (!cropForm?.key) return;
    const removed = await actions.removeCrop(cropForm.key);
    if (removed) {
      setCropForm(null);
      setConfirmCrop(false);
    }
  };

  const saveHarvest = async () => {
    if (!harvestForm) return;
    const saved = await actions.saveHarvest({
      isNew: harvestForm.isNew,
      previousPlotKey: harvestForm.previousPlotKey,
      plotKey: harvestForm.plotKey,
      cropName: harvestForm.cropName,
      plantDate: harvestForm.plantDate,
      harvestDate: harvestForm.harvestDate,
      cropStage: harvestForm.cropStage,
      targetYield: Number(harvestForm.targetYield) || 0,
      actualYield: harvestForm.actualYield,
    });
    if (saved) setHarvestForm(null);
  };

  const deleteHarvest = async () => {
    const key = harvestForm?.previousPlotKey || harvestForm?.plotKey;
    if (!key) return;
    const removed = await actions.removeHarvest(key);
    if (removed) {
      setHarvestForm(null);
      setConfirmHarvest(false);
    }
  };

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => {
            setConfirmCrop(false);
            setCropForm(cropDraft());
            setHarvestForm(null);
          }}
          className="ch-btn-outline"
          style={{ padding: '10px 16px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}
        >
          Add crop
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirmHarvest(false);
            setHarvestForm(harvestDraft());
            setCropForm(null);
          }}
          className="ch-btn-primary"
          style={{ padding: '10px 16px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}
        >
          Add harvest
        </button>
      </div>

      {cropForm && (
        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22, marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 20, color: '#1c3b2c', margin: '0 0 14px' }}>
            {cropForm.isNew ? 'Add crop' : 'Edit crop'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.7fr', gap: 12 }}>
            <Field label="Name">
              <input value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} placeholder="Tomato" style={inputStyle} />
            </Field>
            <Field label="Season">
              <input value={cropForm.season} onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })} placeholder="Kharif, Rabi, or All" style={inputStyle} />
            </Field>
            <Field label="Unit">
              <input value={cropForm.unit} onChange={(e) => setCropForm({ ...cropForm, unit: e.target.value })} placeholder="kg or bunch" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={saveCrop} disabled={state.busy} className="ch-btn-primary" style={{ padding: '11px 18px', borderRadius: 3, fontWeight: 600, fontSize: 14 }}>
              {cropForm.isNew ? 'Save crop' : 'Save changes'}
            </button>
            {!cropForm.isNew && !confirmCrop && (
              <button type="button" onClick={() => setConfirmCrop(true)} className="ch-btn-outline" style={{ padding: '11px 16px', borderRadius: 3, fontWeight: 600, fontSize: 14, color: '#b0361f', borderColor: '#e7b2a6' }}>
                Delete
              </button>
            )}
            {!cropForm.isNew && confirmCrop && (
              <button type="button" onClick={deleteCrop} className="ch-btn-outline" style={{ padding: '11px 16px', borderRadius: 3, fontWeight: 600, fontSize: 14, color: '#b0361f', borderColor: '#e7b2a6' }}>
                Confirm delete
              </button>
            )}
            <button type="button" onClick={() => setCropForm(null)} className="ch-btn-outline" style={{ padding: '11px 16px', borderRadius: 3, fontWeight: 600, fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {harvestForm && (
        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22, marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 20, color: '#1c3b2c', margin: '0 0 14px' }}>
            {harvestForm.isNew ? 'Add harvest' : 'Edit harvest'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Plot">
              <select value={harvestForm.plotKey} onChange={(e) => setHarvestForm({ ...harvestForm, plotKey: e.target.value })} style={inputStyle}>
                <option value="">Select a plot</option>
                {state.plots.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Crop">
              <input value={harvestForm.cropName} onChange={(e) => setHarvestForm({ ...harvestForm, cropName: e.target.value })} placeholder="Type the crop name" style={inputStyle} />
            </Field>
            <Field label="Stage">
              <select value={harvestForm.cropStage} onChange={(e) => setHarvestForm({ ...harvestForm, cropStage: e.target.value as CropStage })} style={inputStyle}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>{pill(s).label}</option>
                ))}
              </select>
            </Field>
            <Field label="Planted">
              <input type="date" value={harvestForm.plantDate} onChange={(e) => setHarvestForm({ ...harvestForm, plantDate: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Harvest date">
              <input type="date" value={harvestForm.harvestDate} onChange={(e) => setHarvestForm({ ...harvestForm, harvestDate: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Target yield">
              <input value={harvestForm.targetYield} onChange={(e) => setHarvestForm({ ...harvestForm, targetYield: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Actual yield">
              <input value={harvestForm.actualYield} onChange={(e) => setHarvestForm({ ...harvestForm, actualYield: e.target.value })} placeholder="After harvest" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={saveHarvest} disabled={state.busy} className="ch-btn-primary" style={{ padding: '11px 18px', borderRadius: 3, fontWeight: 600, fontSize: 14 }}>
              {harvestForm.isNew ? 'Save harvest' : 'Save changes'}
            </button>
            {!harvestForm.isNew && !confirmHarvest && (
              <button type="button" onClick={() => setConfirmHarvest(true)} className="ch-btn-outline" style={{ padding: '11px 16px', borderRadius: 3, fontWeight: 600, fontSize: 14, color: '#b0361f', borderColor: '#e7b2a6' }}>
                Delete
              </button>
            )}
            {!harvestForm.isNew && confirmHarvest && (
              <button type="button" onClick={deleteHarvest} className="ch-btn-outline" style={{ padding: '11px 16px', borderRadius: 3, fontWeight: 600, fontSize: 14, color: '#b0361f', borderColor: '#e7b2a6' }}>
                Confirm delete
              </button>
            )}
            <button type="button" onClick={() => setHarvestForm(null)} className="ch-btn-outline" style={{ padding: '11px 16px', borderRadius: 3, fontWeight: 600, fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {shortfalls.map((s) => (
        <div key={s.plotKey} style={{ background: '#f9e6df', border: '1px solid #eabfb2', borderRadius: 8, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            <Icon name="alert" color="#b0361f" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#b0361f' }}>Harvest shortfall detected</div>
            <div style={{ fontSize: 13, color: '#8a4433' }}>
              {s.plotName} · {s.cropName} came in {s.actualYield}/{s.targetYield} {s.unit}. Add supplementary produce to keep baskets full.
            </div>
          </div>
          <button onClick={actions.addSupplement} className="ch-btn-primary" style={{ padding: '10px 16px', borderRadius: 3, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Add supplement → update basket
          </button>
        </div>
      ))}

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.9fr 0.9fr 0.9fr 1.1fr 1.3fr', background: '#eef2e9', padding: '13px 20px', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase', borderBottom: '1px solid #dbe0d1' }}>
          <span>Plot</span><span>Crop</span><span>Planted</span><span>Harvest</span><span>Stage</span><span>Yield</span><span></span>
        </div>
        {rows.map((row) => {
          const st = pill(row.cropStage);
          const yieldLabel =
            row.actualYield != null
              ? `${row.actualYield}/${row.targetYield} ${row.unit}${row.shortfall ? ' ⚠' : ''}`
              : `target ${row.targetYield} ${row.unit}`;
          return (
            <div key={row.plotKey} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.9fr 0.9fr 0.9fr 1.1fr 1.3fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #efe9db', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#1c3b2c' }}>{row.plotName}</div>
              <div style={{ color: '#4b5142' }}>{row.cropName || '—'}</div>
              <div style={{ color: '#6f7566' }}>{formatDay(row.plantDate) || '—'}</div>
              <div style={{ color: '#6f7566' }}>{formatDay(row.harvestDate) || '—'}</div>
              <div><span style={st.style}>{st.label}</span></div>
              <div style={{ color: '#4b5142' }}>{yieldLabel}</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmHarvest(false);
                    setHarvestForm(harvestDraft(row));
                    setCropForm(null);
                  }}
                  className="ch-btn-outline"
                  style={{ padding: '7px 11px', borderRadius: 3, fontSize: 12, fontWeight: 600 }}
                >
                  Edit
                </button>
                {row.canAdvance && row.nextStage && (
                  <button onClick={() => actions.advanceStage(row.plotKey)} className="ch-btn-outline" style={{ padding: '7px 11px', borderRadius: 3, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    → {pill(row.nextStage).label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>No harvests yet. Add one to a plot.</div>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22, marginTop: 16 }}>
        <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 19, color: '#1c3b2c', margin: '0 0 14px' }}>Crop library</h3>
        {state.crops.length === 0 && <div style={{ fontSize: 14, color: '#9aa08d' }}>No crops in the library.</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {state.crops.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setConfirmCrop(false);
                setCropForm(cropDraft(c));
                setHarvestForm(null);
              }}
              style={{ background: '#eef2e9', border: '1px solid #dbe0d1', color: '#2e5a41', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              {c.name} <span style={{ color: '#9aa08d', fontSize: 11 }}>· {c.season} · {c.unit}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
