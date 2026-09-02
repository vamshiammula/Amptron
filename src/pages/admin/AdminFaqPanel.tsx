import { useMemo, useState } from 'react'
import {
  deleteAdminFaq,
  patchAdminFaq,
  seedAdminFaqs,
  upsertAdminFaq,
  type AdminFaq,
} from '../../lib/portalApi'

const EMPTY: {
  slug: string
  question: string
  answer: string
  audience: 'rider' | 'dealer' | 'both'
  category: string
  aliases: string
  cta: '' | 'buy' | 'test_ride' | 'showroom' | 'stock'
  isActive: boolean
} = {
  slug: '',
  question: '',
  answer: '',
  audience: 'both',
  category: 'general',
  aliases: '',
  cta: '',
  isActive: true,
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

function slugFromQuestion(question: string) {
  return question
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 80)
}

export default function AdminFaqPanel({
  faqs,
  search,
  busyId,
  onBusy,
  onNotice,
  onError,
  onRefresh,
}: Readonly<{
  faqs: AdminFaq[]
  search: string
  busyId: string | null
  onBusy: (id: string | null) => void
  onNotice: (message: string) => void
  onError: (message: string) => void
  onRefresh: () => void
}>) {
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminFaq | null>(null)
  const [confirmSeed, setConfirmSeed] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return faqs
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        faq.slug.toLowerCase().includes(term) ||
        faq.category.toLowerCase().includes(term),
    )
  }, [faqs, search])

  const missingEmbeddings = faqs.filter(
    (faq) => faq.isActive && !faq.hasEmbedding,
  ).length

  const submit = async () => {
    onBusy(editingId ?? 'faq-create')
    onError('')
    try {
      const payload = {
        slug: form.slug || slugFromQuestion(form.question),
        question: form.question,
        answer: form.answer,
        audience: form.audience,
        category: form.category.trim() || 'general',
        aliases: form.aliases
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        cta: form.cta === '' ? null : form.cta,
        isActive: form.isActive,
      }
      if (editingId) {
        await patchAdminFaq(editingId, payload)
        onNotice('FAQ updated.')
      } else {
        await upsertAdminFaq(payload)
        onNotice('FAQ saved.')
      }
      setForm(EMPTY)
      setEditingId(null)
      onRefresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not save FAQ.')
    } finally {
      onBusy(null)
    }
  }

  const loadSeed = () => {
    onBusy('faq-seed')
    void seedAdminFaqs()
      .then((result) => {
        onNotice(result.message)
        onRefresh()
      })
      .catch((error: unknown) =>
        onError(
          error instanceof Error ? error.message : 'Could not load test FAQs.',
        ),
      )
      .finally(() => {
        onBusy(null)
        setConfirmSeed(false)
      })
  }

  return (
    <section
      className="ops-split"
      id="ops-panel-faqs"
      role="tabpanel"
      aria-labelledby="ops-tab-faqs"
    >
      <article className="ops-panel">
        <div className="ops-panel-head">
          <div>
            <h2>{editingId ? 'Edit FAQ' : 'Add FAQ'}</h2>
            <p>
              English questions and answers only. The visitor always sees this exact
              answer.
            </p>
          </div>
        </div>
        <form
          className="simple-form"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <label>
            Question
            <input
              required
              name="question"
              autoComplete="off"
              value={form.question}
              placeholder="e.g. What is the certified range of Amptron Storm?"
              onChange={(event) => {
                const question = event.target.value
                setForm((previous) => ({
                  ...previous,
                  question,
                  slug:
                    editingId || previous.slug
                      ? previous.slug
                      : slugFromQuestion(question),
                }))
              }}
            />
          </label>
          <label>
            Exact English answer
            <textarea
              required
              name="answer"
              rows={5}
              value={form.answer}
              placeholder="Write the published answer. It is returned unchanged."
              onChange={(event) =>
                setForm((previous) => ({ ...previous, answer: event.target.value }))
              }
            />
          </label>
          <label>
            Slug
            <input
              required
              name="slug"
              autoComplete="off"
              spellCheck={false}
              value={form.slug}
              placeholder="storm-range"
              onChange={(event) =>
                setForm((previous) => ({ ...previous, slug: event.target.value }))
              }
            />
          </label>
          <label>
            Aliases, comma-separated
            <input
              name="aliases"
              autoComplete="off"
              value={form.aliases}
              placeholder="storm km, how far does storm go"
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  aliases: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Category
            <input
              name="category"
              autoComplete="off"
              value={form.category}
              placeholder="models, specs, warranty…"
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  category: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Audience
            <select
              name="audience"
              value={form.audience}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  audience: event.target.value as 'rider' | 'dealer' | 'both',
                }))
              }
            >
              <option value="both">Rider and dealer</option>
              <option value="rider">Rider</option>
              <option value="dealer">Dealer</option>
            </select>
          </label>
          <label>
            Follow-up action
            <select
              name="cta"
              value={form.cta}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  cta: event.target.value as typeof form.cta,
                }))
              }
            >
              <option value="">None</option>
              <option value="buy">Buy Amptron</option>
              <option value="test_ride">Book a Test Ride</option>
              <option value="showroom">Find a Showroom</option>
              <option value="stock">Stock Amptron</option>
            </select>
          </label>
          <label className="chatbot-consent">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  isActive: event.target.checked,
                }))
              }
            />
            Active — visitors can match this FAQ
          </label>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={busyId !== null}
          >
            {busyId === (editingId ?? 'faq-create')
              ? 'Saving…'
              : editingId
                ? 'Save changes'
                : 'Save FAQ'}
          </button>
          {editingId ? (
            <button
              type="button"
              className="ops-text-btn"
              onClick={() => {
                setEditingId(null)
                setForm(EMPTY)
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </form>
      </article>

      <article className="ops-panel">
        <div className="ops-panel-head">
          <div>
            <h2>Published FAQs</h2>
            {missingEmbeddings > 0 ? (
              <p>
                {missingEmbeddings} active{' '}
                {missingEmbeddings === 1 ? 'FAQ is' : 'FAQs are'} missing an
                embedding. Cross-language matching will fall back to exact wording.
              </p>
            ) : (
              <p>{filtered.length} in this view.</p>
            )}
          </div>
          <button
            type="button"
            className="ops-btn"
            disabled={busyId === 'faq-seed'}
            onClick={() => {
              if (faqs.length > 0) setConfirmSeed(true)
              else loadSeed()
            }}
          >
            {busyId === 'faq-seed' ? 'Loading…' : 'Load test FAQs'}
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="ops-empty">
            <p>No FAQs yet</p>
            <span>Add a question-answer pair, or load the test set.</span>
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Embedding</th>
                  <th className="ops-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((faq) => (
                  <tr key={faq.id}>
                    <td className="ops-person">
                      <strong>{faq.question}</strong>
                      <span>
                        {faq.isSeed ? 'Test seed' : faq.category} · updated{' '}
                        {dateFormatter.format(new Date(faq.updatedAt))}
                      </span>
                    </td>
                    <td>{faq.audience}</td>
                    <td>
                      <span
                        className={`ops-badge ops-badge--${faq.isActive ? 'success' : 'neutral'}`}
                      >
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`ops-badge ops-badge--${faq.hasEmbedding ? 'info' : 'warning'}`}
                      >
                        {faq.hasEmbedding ? 'Ready' : 'Missing'}
                      </span>
                    </td>
                    <td className="ops-col-actions">
                      <div className="ops-actions">
                        <button
                          type="button"
                          className="ops-btn"
                          aria-label={`Edit ${faq.question}`}
                          onClick={() => {
                            setEditingId(faq.id)
                            setForm({
                              slug: faq.slug,
                              question: faq.question,
                              answer: faq.answer,
                              audience: faq.audience as 'rider' | 'dealer' | 'both',
                              category: faq.category,
                              aliases: faq.aliases.join(', '),
                              cta: (faq.cta as typeof form.cta) ?? '',
                              isActive: faq.isActive,
                            })
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ops-btn ops-btn--danger"
                          aria-label={`Delete ${faq.question}`}
                          onClick={() => setPendingDelete(faq)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {confirmSeed ? (
        <div className="ops-dialog-layer">
          <button
            type="button"
            className="ops-dialog-backdrop"
            aria-label="Dismiss seed confirmation"
            onClick={() => setConfirmSeed(false)}
          />
          <div
            className="ops-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ops-faq-seed-title"
            aria-describedby="ops-faq-seed-body"
          >
            <h2 id="ops-faq-seed-title">Load the test FAQ set?</h2>
            <p id="ops-faq-seed-body">
              This upserts the spec-true test questions. Existing rows with the same
              slug are overwritten. You can edit them afterwards.
            </p>
            <div className="ops-dialog-actions">
              <button
                type="button"
                className="ops-btn"
                onClick={() => setConfirmSeed(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ops-btn ops-btn--success"
                disabled={busyId === 'faq-seed'}
                onClick={loadSeed}
              >
                {busyId === 'faq-seed' ? 'Loading…' : 'Load test FAQs'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="ops-dialog-layer">
          <button
            type="button"
            className="ops-dialog-backdrop"
            aria-label="Dismiss delete confirmation"
            onClick={() => setPendingDelete(null)}
          />
          <div
            className="ops-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ops-faq-delete-title"
            aria-describedby="ops-faq-delete-body"
          >
            <h2 id="ops-faq-delete-title">Delete this FAQ?</h2>
            <p id="ops-faq-delete-body">
              “{pendingDelete.question}” will no longer match visitor questions.
            </p>
            <div className="ops-dialog-actions">
              <button
                type="button"
                className="ops-btn"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ops-btn ops-btn--danger"
                disabled={busyId === pendingDelete.id}
                onClick={() => {
                  const id = pendingDelete.id
                  onBusy(id)
                  void deleteAdminFaq(id)
                    .then(() => {
                      onNotice('FAQ deleted.')
                      if (editingId === id) {
                        setEditingId(null)
                        setForm(EMPTY)
                      }
                      setPendingDelete(null)
                      onRefresh()
                    })
                    .catch((error: unknown) =>
                      onError(
                        error instanceof Error
                          ? error.message
                          : 'Could not delete FAQ.',
                      ),
                    )
                    .finally(() => onBusy(null))
                }}
              >
                {busyId === pendingDelete.id ? 'Deleting…' : 'Delete FAQ'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
