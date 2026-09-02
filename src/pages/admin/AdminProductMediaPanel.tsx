import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  archiveAdminProductMediaSet,
  createAdminProductMediaSet,
  createAdminProductMediaTargets,
  deleteAdminProductMediaSet,
  fetchAdminProductMedia,
  finalizeAdminProductMediaAssets,
  patchAdminProductMediaSet,
  publishAdminProductMediaSet,
  type AdminProductMediaSet,
} from '../../lib/portalApi'
import { PRODUCT_MEDIA_MODES } from '@shared/productMedia'

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function imageSize(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const size = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return size
}

function modelSlugOf(set: AdminProductMediaSet): string {
  const related = set.scooter_models
  if (Array.isArray(related)) return related[0]?.slug ?? ''
  return related?.slug ?? ''
}

export default function AdminProductMediaPanel({
  busyId,
  onBusy,
  onNotice,
  onError,
}: Readonly<{
  busyId: string | null
  onBusy: (id: string | null) => void
  onNotice: (message: string) => void
  onError: (message: string) => void
}>) {
  const [sets, setSets] = useState<AdminProductMediaSet[]>([])
  const [modelSlug, setModelSlug] = useState('amptron-storm')
  const [mode, setMode] = useState<(typeof PRODUCT_MEDIA_MODES)[number]>('exterior')
  const [label, setLabel] = useState('Storm exterior')
  const [activeId, setActiveId] = useState<number | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [stateKey, setStateKey] = useState('front-left')
  const [startKey, setStartKey] = useState('')
  const [direction, setDirection] = useState<'clockwise' | 'counterclockwise'>(
    'clockwise',
  )

  const refresh = useCallback(() => {
    return fetchAdminProductMedia()
      .then((payload) => setSets(payload.sets))
      .catch((error) => {
        onError(error instanceof Error ? error.message : 'Could not load media.')
      })
  }, [onError])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const active = sets.find((set) => set.id === activeId) ?? null

  const createSet = async () => {
    onBusy('media-create')
    try {
      const created = await createAdminProductMediaSet({ modelSlug, mode, label })
      setActiveId(created.set.id)
      onNotice('Draft media set created. Upload images next.')
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not create set.')
    } finally {
      onBusy(null)
    }
  }

  const upload = async () => {
    if (!active || files.length === 0 || !supabase) {
      onError('Choose a draft set and image files. Sign in is required to upload.')
      return
    }
    onBusy('media-upload')
    try {
      const payload = files.map((file, index) => ({
        originalFilename: file.name,
        stateKey:
          mode === '360'
            ? `frame-${String(index + 1).padStart(3, '0')}`
            : `${stateKey}-${index + 1}`,
        sequenceIndex: index,
        mimeType: file.type || 'image/jpeg',
        byteSize: file.size,
      }))
      const { targets } = await createAdminProductMediaTargets(active.id, payload)
      const finalized = []
      for (const [index, file] of files.entries()) {
        const target = targets[index]
        if (!target) continue
        const { error } = await supabase.storage
          .from('site-media')
          .upload(target.objectPath, file, {
            upsert: false,
            contentType: file.type || 'image/jpeg',
            cacheControl: '31536000',
          })
        if (error) throw error
        const size = await imageSize(file)
        finalized.push({
          objectPath: target.objectPath,
          originalFilename: file.name,
          stateKey: target.stateKey,
          sequenceIndex: target.sequenceIndex,
          width: size.width,
          height: size.height,
          mimeType: target.mimeType,
          byteSize: file.size,
          checksum: await sha256Hex(file),
          alt: `${modelSlug} ${target.stateKey}`,
          approval: 'hold' as const,
        })
      }
      await finalizeAdminProductMediaAssets(active.id, finalized)
      setFiles([])
      onNotice('Images stored with canonical names. Review approval, then publish.')
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      onBusy(null)
    }
  }

  const saveOrder = async () => {
    if (!active) return
    onBusy('media-order')
    try {
      await patchAdminProductMediaSet(active.id, {
        startKey: startKey || undefined,
        direction: mode === '360' || mode === 'exterior' ? direction : null,
      })
      onNotice('Start view and direction saved.')
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not save order.')
    } finally {
      onBusy(null)
    }
  }

  const setApproval = async (assetId: number, approval: 'approved' | 'hold') => {
    if (!active) return
    onBusy(`asset-${assetId}`)
    try {
      await patchAdminProductMediaSet(active.id, {
        assets: [{ id: assetId, approval }],
      })
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not update approval.')
    } finally {
      onBusy(null)
    }
  }

  const moveAsset = async (assetId: number, step: -1 | 1) => {
    if (!active) return
    const ordered = [...(active.product_media_assets ?? [])].toSorted(
      (a, b) => a.sequence_index - b.sequence_index,
    )
    const index = ordered.findIndex((asset) => asset.id === assetId)
    const swapWith = index + step
    if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return
    const next = [...ordered]
    const current = next[index]
    const neighbor = next[swapWith]
    if (!current || !neighbor) return
    next[index] = neighbor
    next[swapWith] = current
    onBusy(`asset-${assetId}`)
    try {
      await patchAdminProductMediaSet(active.id, {
        assetOrder: next.map((asset) => asset.id),
      })
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not reorder images.')
    } finally {
      onBusy(null)
    }
  }

  const publish = async () => {
    if (!active) return
    onBusy('media-publish')
    try {
      await publishAdminProductMediaSet(active.id)
      onNotice('Published. The product page will use this set.')
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not publish.')
    } finally {
      onBusy(null)
    }
  }

  return (
    <article className="ops-panel ops-panel-head--spaced">
      <div className="ops-panel-head">
        <h2>Product media</h2>
      </div>
      <p>
        The server names folders and files. For 360° sets, upload in orbit order,
        then confirm the start view. Do not publish a 360° label unless the sequence
        is contiguous and visually consistent.
      </p>
      <form
        className="simple-form"
        onSubmit={(event) => {
          event.preventDefault()
          void createSet()
        }}
      >
        <label htmlFor="media-model">
          Model
          <select
            id="media-model"
            value={modelSlug}
            onChange={(event) => setModelSlug(event.target.value)}
          >
            <option value="amptron-storm">Amptron Storm</option>
            <option value="amptron-volt">Amptron Volt</option>
            <option value="amptron-cruise">Amptron Cruise</option>
          </select>
        </label>
        <label htmlFor="media-mode">
          Experience
          <select
            id="media-mode"
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as (typeof PRODUCT_MEDIA_MODES)[number])
            }
          >
            {PRODUCT_MEDIA_MODES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="media-label">
          Label
          <input
            id="media-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={busyId === 'media-create'}
        >
          {busyId === 'media-create' ? 'Creating…' : 'Create draft set'}
        </button>
      </form>

      <label htmlFor="media-files">
        Images
        <input
          id="media-files"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) =>
            setFiles(Array.from(event.currentTarget.files ?? []))
          }
        />
      </label>
      {mode !== '360' ? (
        <label htmlFor="media-state">
          State key prefix
          <input
            id="media-state"
            value={stateKey}
            onChange={(event) => setStateKey(event.target.value)}
          />
        </label>
      ) : null}
      <button
        type="button"
        className="btn btn-primary"
        disabled={!active || files.length === 0 || busyId === 'media-upload'}
        onClick={() => void upload()}
      >
        {busyId === 'media-upload' ? 'Uploading…' : 'Upload into this draft'}
      </button>

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th scope="col">Set</th>
              <th scope="col">Mode</th>
              <th scope="col">Status</th>
              <th scope="col">Open</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set) => (
              <tr key={set.id}>
                <td>
                  <strong>
                    {modelSlugOf(set)} v{set.version}
                  </strong>
                  <div>{set.label}</div>
                </td>
                <td>{set.mode}</td>
                <td>{set.lifecycle}</td>
                <td>
                  <button
                    type="button"
                    className="ops-btn"
                    onClick={() => setActiveId(set.id)}
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active ? (
        <div>
          <h3 className="ops-subhead">
            Draft {active.id} · {active.mode}
          </h3>
          <div className="product-media-contact">
            {(active.product_media_assets ?? [])
              .toSorted((a, b) => a.sequence_index - b.sequence_index)
              .map((asset) => (
                <figure key={asset.id}>
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/site-media/${asset.object_path}`}
                    alt={asset.alt}
                    width={96}
                    height={96}
                  />
                  <figcaption>
                    {asset.sequence_index} · {asset.state_key}
                  </figcaption>
                  <div className="ops-actions">
                    <button
                      type="button"
                      className="ops-btn"
                      aria-label={`Move ${asset.state_key} earlier`}
                      disabled={busyId === `asset-${asset.id}`}
                      onClick={() => void moveAsset(asset.id, -1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="ops-btn"
                      aria-label={`Move ${asset.state_key} later`}
                      disabled={busyId === `asset-${asset.id}`}
                      onClick={() => void moveAsset(asset.id, 1)}
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ops-btn"
                    disabled={busyId === `asset-${asset.id}`}
                    onClick={() =>
                      void setApproval(
                        asset.id,
                        asset.approval === 'approved' ? 'hold' : 'approved',
                      )
                    }
                  >
                    {asset.approval === 'approved' ? 'Hold' : 'Approve'}
                  </button>
                </figure>
              ))}
          </div>
          <label htmlFor="media-start">
            Start view
            <input
              id="media-start"
              value={startKey}
              onChange={(event) => setStartKey(event.target.value)}
              placeholder="front-left or frame-001"
            />
          </label>
          {active.mode === '360' || active.mode === 'exterior' ? (
            <label htmlFor="media-direction">
              Direction
              <select
                id="media-direction"
                value={direction}
                onChange={(event) =>
                  setDirection(
                    event.target.value as 'clockwise' | 'counterclockwise',
                  )
                }
              >
                <option value="clockwise">Clockwise</option>
                <option value="counterclockwise">Counterclockwise</option>
              </select>
            </label>
          ) : null}
          <div className="ops-actions">
            <button
              type="button"
              className="ops-btn"
              onClick={() => void saveOrder()}
            >
              Save start view
            </button>
            <button
              type="button"
              className="ops-btn ops-btn--success"
              onClick={() => void publish()}
            >
              Publish
            </button>
            <button
              type="button"
              className="ops-btn"
              onClick={() =>
                void archiveAdminProductMediaSet(active.id).then(refresh)
              }
            >
              Archive
            </button>
            {active.lifecycle === 'draft' ? (
              <button
                type="button"
                className="ops-btn ops-btn--danger"
                onClick={() =>
                  void deleteAdminProductMediaSet(active.id).then(refresh)
                }
              >
                Delete draft
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}
