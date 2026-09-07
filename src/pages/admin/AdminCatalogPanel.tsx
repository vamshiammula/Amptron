import { useCallback, useEffect, useRef, useState } from 'react'
import {
  catalogSchema,
  createModelTemplate,
  duplicateModel,
  MODEL_TEMPLATES,
  type CatalogEntry,
} from '@shared/catalog'
import { supabase } from '../../lib/supabase'
import { mapScooterModel } from '../../lib/siteContentMap'
import ScooterStage from '../../components/ScooterStage'

type Row = CatalogEntry & { id: number }
export default function AdminCatalogPanel() {
  const [rows, setRows] = useState<Row[]>([])
  const [draft, setDraft] = useState<CatalogEntry>(createModelTemplate())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [template, setTemplate] = useState('everyday')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [schemaMissing, setSchemaMissing] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const change = <K extends keyof CatalogEntry>(key: K, value: CatalogEntry[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }))
    setDirty(true)
  }
  const reload = useCallback(async () => {
    if (!supabase)
      throw new Error('Catalog management requires a configured admin account.')
    const result = await supabase
      .from('scooter_models')
      .select('*')
      .order('sort_order')
    if (result.error) throw new Error(result.error.message)
    const first = result.data?.[0]
    setSchemaMissing(
      Boolean(
        first &&
        ![
          'model_3d_url',
          'media_ready',
          'captions_url',
          'battery_kwh',
          'certified_range_km',
        ].every((key) => key in first),
      ),
    )
    setRows(
      (result.data ?? []).map((row) => ({
        ...createModelTemplate('blank'),
        ...row,
        model_3d_url: row.model_3d_url ?? '',
        media_ready: row.media_ready ?? false,
        battery_kwh: row.battery_kwh ?? 0,
        certified_range_km: row.certified_range_km ?? 0,
        video_url: row.media_ready ? (row.video_url ?? '') : '',
        captions_url: row.media_ready ? (row.captions_url ?? '') : '',
        image_url: row.media_ready ? row.image_url : '',
        price_inr: row.price_inr ?? null,
      })),
    )
  }, [])
  useEffect(() => {
    // Load the external catalog; state changes happen after the database response.
    // oxlint-disable-next-line react/set-state-in-effect
    void reload().catch(() =>
      setError('Could not load the catalog. Check your connection and retry.'),
    )
  }, [reload])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  const select = (entry: CatalogEntry, id: number | null) => {
    if (busy) return
    if (dirty && !window.confirm('Discard unsaved model changes?')) return
    setDraft(structuredClone(entry))
    setEditingId(id)
    setDirty(false)
    setError('')
    setMessage('')
  }
  const save = async () => {
    if (!supabase || busy || schemaMissing) return
    setError('')
    setMessage('')
    const parsed = catalogSchema.safeParse(draft)
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(' '),
      )
      return
    }
    const payload = parsed.data
    setBusy(true)
    try {
      const result =
        editingId === null
          ? await supabase
              .from('scooter_models')
              .insert(payload)
              .select('id')
              .single()
          : await supabase
              .from('scooter_models')
              .update(payload)
              .eq('id', editingId)
              .select('id')
              .single()
      if (result.error)
        throw new Error(
          result.error.code === '23505'
            ? 'That URL slug is already in use. Choose another.'
            : result.error.code === 'PGRST204'
              ? 'Catalog setup is pending. Apply the model templates and 3D database migration before saving.'
              : result.error.message,
        )
      setEditingId(result.data.id)
      setDirty(false)
      await reload()
      window.dispatchEvent(new Event('amptron:catalog-updated'))
      setMessage(
        payload.published
          ? 'Model saved and published.'
          : 'Draft saved. It is not visible on the website.',
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save this model.',
      )
    } finally {
      setBusy(false)
    }
  }
  const archive = async (row: Row) => {
    if (!supabase || busy) return
    if (
      dirty &&
      !window.confirm(
        'Discard unsaved changes and remove this model from the website?',
      )
    )
      return
    setBusy(true)
    setError('')
    try {
      const { error: failure } = await supabase
        .from('scooter_models')
        .update({ published: false })
        .eq('id', row.id)
      if (failure) throw failure
      if (editingId === row.id) {
        setDraft((value) => ({ ...value, published: false }))
        setDirty(false)
      }
      await reload()
      window.dispatchEvent(new Event('amptron:catalog-updated'))
      setMessage(
        `${row.name} removed from the website. Its draft is kept for reuse.`,
      )
    } catch {
      setError('Could not remove this model. Please retry.')
    } finally {
      setBusy(false)
    }
  }
  const upload = async (
    file: File,
    kind: 'image_url' | 'video_url' | 'model_3d_url' | 'captions_url',
  ) => {
    if (!supabase) return
    const extensions =
      kind === 'captions_url'
        ? /\.vtt$/i
        : kind === 'model_3d_url'
          ? /\.glb$/i
          : kind === 'video_url'
            ? /\.(mp4|webm)$/i
            : /\.(png|jpe?g|webp)$/i
    if (!extensions.test(file.name) || file.size > 50 * 1024 * 1024) {
      setError('Choose a supported file under 50 MB. 3D models must be GLB.')
      return
    }
    if (kind === 'model_3d_url') {
      const bytes = new DataView(await file.slice(0, 12).arrayBuffer())
      if (
        bytes.byteLength < 12 ||
        bytes.getUint32(0, true) !== 0x46546c67 ||
        bytes.getUint32(4, true) !== 2
      ) {
        setError('This is not a valid GLB version 2 file.')
        return
      }
    }
    setBusy(true)
    setError('')
    try {
      const path = `catalog/${crypto.randomUUID()}.${file.name.split('.').pop()!.toLowerCase()}`
      const { error: failure } = await supabase.storage
        .from('site-media')
        .upload(path, file, {
          contentType:
            kind === 'captions_url'
              ? 'text/vtt'
              : kind === 'model_3d_url'
                ? 'model/gltf-binary'
                : file.type,
          upsert: false,
        })
      if (failure) throw failure
      const { data } = supabase.storage.from('site-media').getPublicUrl(path)
      setDraft((previous) => ({
        ...previous,
        [kind]: data.publicUrl,
        media_ready: true,
      }))
      setDirty(true)
      setMessage('File uploaded. Save the model to use it on the website.')
    } catch {
      setError(
        'Upload failed. Check your connection and media bucket setup, then retry.',
      )
    } finally {
      setBusy(false)
    }
  }
  const exportTemplate = () => {
    const { published: _, ...rest } = draft
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ ...rest, published: false }, null, 2)], {
        type: 'application/json',
      }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `${draft.slug || 'amptron-model'}-template.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const preview = mapScooterModel({
    ...draft,
    image_url: draft.media_ready ? draft.image_url : '',
  })
  return (
    <section className="catalog-workspace" aria-label="Model catalog manager">
      {schemaMissing && (
        <div className="ops-banner ops-banner--error" role="alert">
          <strong>Catalog setup required</strong>
          <span>
            The connected database needs the model templates and 3D migration before
            model changes can be saved. You can prepare and export a template now.
            Apply supabase/migrations/20260906_model_templates_3d.sql, then refresh
            this editor.
          </span>
        </div>
      )}
      <div className="ops-panel-head">
        <div>
          <p className="eyebrow">Catalog studio</p>
          <h2>Build the next Amptron.</h2>
          <p>
            Reusable model pages. Add the details now; bring photos, film and 3D
            later.
          </p>
        </div>
        <button
          className="btn btn-ghost-dark"
          type="button"
          onClick={() =>
            void reload().catch(() => setError('Could not reload catalog.'))
          }
        >
          Refresh
        </button>
      </div>
      {error && (
        <p role="alert" className="ops-banner ops-banner--error">
          {error}
        </p>
      )}
      {message && (
        <output className="ops-banner ops-banner--success">{message}</output>
      )}
      <div className="catalog-layout">
        <aside className="catalog-library">
          <h3>
            Models <span>{rows.length}</span>
          </h3>
          {rows.length === 0 && <p>No models yet. Start from a template.</p>}
          {rows.map((row) => (
            <article
              key={row.id}
              className={editingId === row.id ? 'is-selected' : ''}
            >
              <button type="button" onClick={() => select(row, row.id)}>
                <strong>{row.name}</strong>
                <span>{row.published ? 'Published' : 'Draft'}</span>
              </button>
              <div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => select(duplicateModel(row), null)}
                >
                  Duplicate
                </button>
                {row.published && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void archive(row)}
                  >
                    Remove from site
                  </button>
                )}
              </div>
            </article>
          ))}
          <h3>Start from a template</h3>
          <label>
            Page template
            <select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {MODEL_TEMPLATES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <p>{MODEL_TEMPLATES.find((item) => item.id === template)?.detail}</p>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => select(createModelTemplate(template), null)}
          >
            Create model
          </button>
          <button
            className="btn btn-ghost-dark"
            type="button"
            onClick={() => importRef.current?.click()}
          >
            Import template
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Import model template"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                if (file.size > 100000) throw new Error()
                const parsed = catalogSchema.safeParse(
                  JSON.parse(await file.text()),
                )
                if (!parsed.success) throw new Error()
                select({ ...parsed.data, published: false }, null)
              } catch {
                setError(
                  'Choose a valid exported Amptron model template under 100 KB.',
                )
              }
              e.target.value = ''
            }}
          />
        </aside>
        <div className="catalog-editor">
          <div className="catalog-editor-head">
            <h3>{editingId === null ? 'New model' : 'Edit model'}</h3>
            <span>{dirty ? 'Unsaved changes' : 'Ready to edit'}</span>
          </div>
          <form
            className="simple-form"
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
          >
            <div className="catalog-fields">
              <label>
                Model name
                <input
                  value={draft.name}
                  maxLength={80}
                  onChange={(e) => change('name', e.target.value)}
                  placeholder="Amptron model name"
                  required
                />
              </label>
              <label>
                URL slug
                <input
                  value={draft.slug}
                  maxLength={80}
                  onChange={(e) => change('slug', e.target.value)}
                  placeholder="amptron-model-name"
                  required
                />
              </label>
            </div>
            <label>
              Tagline
              <input
                value={draft.tagline}
                onChange={(e) => change('tagline', e.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                value={draft.description}
                onChange={(e) => change('description', e.target.value)}
              />
            </label>
            <div className="catalog-fields">
              <label>
                Ex-showroom price (₹)
                <input
                  type="number"
                  min="1"
                  value={draft.price_inr ?? ''}
                  onChange={(e) =>
                    change(
                      'price_inr',
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </label>
              <label>
                Display order
                <input
                  type="number"
                  min="0"
                  value={draft.sort_order}
                  onChange={(e) => change('sort_order', Number(e.target.value))}
                />
              </label>
              <label>
                Battery capacity (kWh)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={draft.battery_kwh}
                  onChange={(e) => change('battery_kwh', Number(e.target.value))}
                />
              </label>
              <label>
                Certified range (km)
                <input
                  type="number"
                  min="0"
                  value={draft.certified_range_km}
                  onChange={(e) =>
                    change('certified_range_km', Number(e.target.value))
                  }
                />
              </label>
            </div>
            <h4>Specification highlights</h4>
            {draft.highlights.map((item, index) => (
              <div className="catalog-highlight" key={index}>
                <label>
                  Label
                  <input
                    value={item.label}
                    onChange={(e) =>
                      change(
                        'highlights',
                        draft.highlights.map((value, i) =>
                          i === index ? { ...value, label: e.target.value } : value,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Value
                  <input
                    value={item.value}
                    onChange={(e) =>
                      change(
                        'highlights',
                        draft.highlights.map((value, i) =>
                          i === index ? { ...value, value: e.target.value } : value,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Remove highlight ${index + 1}`}
                  onClick={() =>
                    change(
                      'highlights',
                      draft.highlights.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost-dark"
              onClick={() =>
                change('highlights', [
                  ...draft.highlights,
                  { label: '', value: '', note: '' },
                ])
              }
            >
              Add highlight
            </button>
            <label>
              Features (one per line)
              <textarea
                value={draft.features.join('\n')}
                onChange={(e) => change('features', e.target.value.split('\n'))}
              />
            </label>
            <h4>Media slots</h4>
            <p>
              Leave these empty for the branded studio layout. Upload an
              uncompressed GLB for true 3D rotation and zoom. Images and film are
              optional.
            </p>
            {(
              ['model_3d_url', 'image_url', 'video_url', 'captions_url'] as const
            ).map((key) => (
              <div className="catalog-upload" key={key}>
                <label>
                  {key === 'captions_url'
                    ? 'Film captions · VTT'
                    : key === 'model_3d_url'
                      ? '3D model · GLB'
                      : key === 'image_url'
                        ? 'Product photo'
                        : 'Product film'}
                  <input
                    value={draft[key]}
                    onChange={(e) => {
                      change(key, e.target.value)
                      change('media_ready', true)
                    }}
                    placeholder="No file added"
                  />
                </label>
                <label className="catalog-file-label">
                  Upload file
                  <input
                    type="file"
                    disabled={busy}
                    accept={
                      key === 'captions_url'
                        ? '.vtt'
                        : key === 'model_3d_url'
                          ? '.glb'
                          : key === 'image_url'
                            ? '.png,.jpg,.jpeg,.webp'
                            : '.mp4,.webm'
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void upload(file, key)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            ))}
            <details>
              <summary>Full specifications, colours and story</summary>
              <h4>Full specifications</h4>
              {draft.specs.map((item, index) => (
                <div className="catalog-highlight" key={index}>
                  <label>
                    Specification
                    <input
                      value={item.label}
                      onChange={(e) =>
                        change(
                          'specs',
                          draft.specs.map((value, i) =>
                            i === index
                              ? { ...value, label: e.target.value }
                              : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Value
                    <input
                      value={item.value}
                      onChange={(e) =>
                        change(
                          'specs',
                          draft.specs.map((value, i) =>
                            i === index
                              ? { ...value, value: e.target.value }
                              : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        'specs',
                        draft.specs.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost-dark"
                onClick={() =>
                  change('specs', [...draft.specs, { label: '', value: '' }])
                }
              >
                Add specification
              </button>
              <h4>Colours</h4>
              {draft.colours.map((item, index) => (
                <div className="catalog-highlight" key={index}>
                  <label>
                    Colour name
                    <input
                      value={item.name}
                      onChange={(e) =>
                        change(
                          'colours',
                          draft.colours.map((value, i) =>
                            i === index
                              ? { ...value, name: e.target.value }
                              : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Colour
                    <input
                      type="color"
                      value={item.hex}
                      onChange={(e) =>
                        change(
                          'colours',
                          draft.colours.map((value, i) =>
                            i === index ? { ...value, hex: e.target.value } : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        'colours',
                        draft.colours.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost-dark"
                onClick={() =>
                  change('colours', [
                    ...draft.colours,
                    { name: '', hex: '#171c1b' },
                  ])
                }
              >
                Add colour
              </button>
              <h4>Story sections</h4>
              {draft.story.map((item, index) => (
                <div className="catalog-upload" key={index}>
                  <label>
                    Section label
                    <input
                      value={item.eyebrow}
                      onChange={(e) =>
                        change(
                          'story',
                          draft.story.map((value, i) =>
                            i === index
                              ? { ...value, eyebrow: e.target.value }
                              : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Heading
                    <input
                      value={item.title}
                      onChange={(e) =>
                        change(
                          'story',
                          draft.story.map((value, i) =>
                            i === index
                              ? { ...value, title: e.target.value }
                              : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Body
                    <textarea
                      value={item.body}
                      onChange={(e) =>
                        change(
                          'story',
                          draft.story.map((value, i) =>
                            i === index
                              ? { ...value, body: e.target.value }
                              : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        'story',
                        draft.story.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove section
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-ghost-dark"
                onClick={() =>
                  change('story', [
                    ...draft.story,
                    { eyebrow: '', title: '', body: '' },
                  ])
                }
              >
                Add story section
              </button>
            </details>
            <div className="catalog-options">
              <label>
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => change('featured', e.target.checked)}
                />{' '}
                Featured on the homepage
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.price_placeholder}
                  onChange={(e) => change('price_placeholder', e.target.checked)}
                />{' '}
                Price is indicative
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => change('published', e.target.checked)}
                />{' '}
                Publish on the website
              </label>
            </div>
            <div className="catalog-save">
              <button
                className="btn btn-primary"
                disabled={busy || !supabase || schemaMissing}
                type="submit"
              >
                {busy
                  ? 'Saving…'
                  : draft.published
                    ? 'Save and publish'
                    : 'Save draft'}
              </button>
              <button
                className="btn btn-ghost-dark"
                type="button"
                onClick={exportTemplate}
              >
                Export template
              </button>
            </div>
          </form>
          {preview && (
            <div className="catalog-preview">
              <h3>Media preview</h3>
              <ScooterStage
                key={`${preview.slug}-${preview.model3d}`}
                model={preview}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
