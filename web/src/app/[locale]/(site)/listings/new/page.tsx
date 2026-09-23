'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useLabels } from '@/i18n/use-labels';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import {
  Ad,
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  DURATION_DAYS,
  JobType,
  MAX_EXTRA_PHONES,
} from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Button, FormField, Input } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';
import { Icon } from '@/components/Icon';
import { PhoneField } from '@/components/PhoneField';

// Leaflet uses window: client-only.
const MapPicker = dynamic(
  () => import('@/components/MapPicker').then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="h-64 bg-surface-container" /> },
);

// Wizard steps: publishing on a single page was overwhelming (11 fields);
// three short screens are faster to finish, especially on mobile.
const STEPS = ['position', 'placeAndPay', 'contact'] as const;

// Progress indicator: numbered circles; already visited steps are
// clickable to go back.
function StepIndicator({
  step,
  onStep,
}: {
  step: number;
  onStep: (s: number) => void;
}) {
  const t = useTranslations('publish');
  return (
    <ol className="mb-5 flex items-center gap-1" aria-label={t('progress')}>
      {STEPS.map((key, i) => (
        <li key={key} className="flex flex-1 items-center gap-1 last:flex-none">
          <button
            type="button"
            disabled={i >= step}
            onClick={() => onStep(i)}
            aria-current={i === step ? 'step' : undefined}
            className="flex items-center gap-2 disabled:cursor-default"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : i === step
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {i < step ? <Icon name="check" className="text-sm" /> : i + 1}
            </span>
            <span
              className={`hidden text-xs sm:block ${
                i === step
                  ? 'font-bold text-on-surface'
                  : 'text-on-surface-variant'
              }`}
            >
              {t(`steps.${key}`)}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <span
              aria-hidden
              className={`h-0.5 flex-1 rounded ${
                i < step ? 'bg-tertiary-container' : 'bg-surface-container-high'
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

function Form() {
  const t = useTranslations('publish');
  const labels = useLabels();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const { user } = useRequireAuth();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    locationReference: '',
    department: '' as Department | '',
    category: '' as Category | '',
    schedule: '',
    salary: '',
    salaryMax: '',
    phone: '',
    jobType: 'TIEMPO_COMPLETO' as JobType,
    durationDays: 3,
  });
  // Extra contact numbers (optional, see MAX_EXTRA_PHONES).
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  // Map pin (optional). Saved along with the listing.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loaded, setLoaded] = useState(!editId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Can't publish with an unverified email (admins exempt).
  const notVerified = !!user && !user.isAdmin && !user.emailVerified;

  // Admins only need description and phone (same rules as their panel);
  // everyone else needs every field except the schedule.
  const isAdmin = !!user?.isAdmin;

  // Required fields still missing, PER STEP: they disable the step's button
  // and are listed in a visible notice (no hover tooltips, which don't exist
  // on mobile). Job type and duration always have a value.
  const missing = (pairs: readonly (readonly [string, string])[]) =>
    pairs.filter(([value]) => !value.trim()).map(([, label]) => label);

  const missingByStep = [
    missing([
      [form.title, t('missing.title')],
      [form.description, t('missing.description')],
      ...(isAdmin
        ? []
        : ([
            [form.requirements, t('missing.requirements')],
            [form.category, t('missing.category')],
          ] as const)),
    ] as const),
    missing(
      isAdmin
        ? []
        : ([
            [form.department, t('missing.department')],
            [form.location, t('missing.location')],
            [form.salary, t('missing.salary')],
          ] as const),
    ),
    missing([[form.phone, t('missing.phone')]] as const),
  ];
  const missingFields = missingByStep.flat();

  // Extra numbers actually typed in (empty fields aren't sent).
  const filledExtraPhones = extraPhones.map((p) => p.trim()).filter(Boolean);
  // The ceiling only counts if there's a floor and it exceeds it; otherwise
  // it's a fixed amount.
  const salaryRange =
    form.salary.trim() !== '' &&
    form.salaryMax.trim() !== '' &&
    Number(form.salaryMax) > Number(form.salary);

  useEffect(() => {
    if (editId) {
      api<Ad>(`/listings/${editId}`).then((a) => {
        setForm({
          title: a.title,
          description: a.description,
          requirements: a.requirements ?? '',
          location: a.location ?? '',
          locationReference: a.locationReference ?? '',
          department: a.department ?? '',
          category: a.category ?? '',
          schedule: a.schedule ?? '',
          salary: a.salary != null ? String(a.salary) : '',
          salaryMax: a.salaryMax != null ? String(a.salaryMax) : '',
          phone: a.phone,
          jobType: a.jobType,
          durationDays: a.durationDays ?? 3,
        });
        setExtraPhones(a.extraPhones ?? []);
        if (a.latitude != null && a.longitude != null) {
          setCoords({ lat: a.latitude, lng: a.longitude });
        }
        setLoaded(true);
      });
    }
  }, [editId]);

  // On create, the phone is prefilled with the one from the user's profile
  // (the one the Llamar and Chatear buttons will use). It stays editable.
  useEffect(() => {
    if (!editId && user?.phone) {
      setForm((f) => (f.phone ? f : { ...f, phone: user.phone! }));
    }
  }, [editId, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // Empty values can only come from an admin: they're omitted (salary
      // "a convenir") or take the same defaults as their panel and import.
      const payload = {
        title: form.title.trim(),
        description: form.description,
        requirements: form.requirements.trim() || undefined,
        location: form.location.trim() || undefined,
        locationReference: form.locationReference.trim() || undefined,
        department: form.department || 'SANTA_CRUZ',
        category: form.category || 'OTRO',
        latitude: coords?.lat,
        longitude: coords?.lng,
        schedule: form.schedule.trim() || undefined,
        salary: form.salary.trim() ? Number(form.salary) : undefined,
        // The ceiling is only sent if it forms a valid range with the floor
        // (the API rejects a lower maximum or one without a minimum).
        salaryMax: salaryRange ? Number(form.salaryMax) : undefined,
        phone: form.phone,
        extraPhones: filledExtraPhones.length ? filledExtraPhones : undefined,
        jobType: form.jobType,
        durationDays: form.durationDays,
      };
      if (editId) {
        await api(`/listings/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/listings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/my-listings');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-card border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">
        {editId ? t('titleEdit') : t('titleNew')}
      </h1>
      {notVerified && (
        <div className="mb-4 bg-secondary-container px-3 py-2 text-sm text-on-secondary-container">
          {t('notVerified')}
        </div>
      )}
      <p className="mb-3 text-xs text-on-surface-variant">
        {t.rich('requiredNote', {
          req: (chunks) => <span className="text-error">{chunks}</span>,
        })}
      </p>

      <StepIndicator step={step} onStep={setStep} />

      <form onSubmit={onSubmit} className="space-y-4">
        {/* ——— Step 1: the position ——— */}
        {step === 0 && (
          <>
            <FormField label={t('fields.title')} required>
              <Input
                placeholder={t('fields.titlePlaceholder')}
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <span className="block text-right text-xs text-on-surface-variant">
                {form.title.length}/120
              </span>
            </FormField>
            <FormField label={t('fields.description')} required>
              <textarea
                className="w-full border border-outline-variant px-3 py-2 text-base outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                rows={4}
                placeholder={t('fields.descriptionPlaceholder')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <span className="block text-xs text-on-surface-variant">
                {t('fields.descriptionHint')}
              </span>
            </FormField>
            <FormField label={t('fields.requirements')} required={!isAdmin}>
              <textarea
                className="w-full border border-outline-variant px-3 py-2 text-base outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                rows={3}
                placeholder={t('fields.requirementsPlaceholder')}
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                required={!isAdmin}
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t('fields.category')} required={!isAdmin}>
                <CustomSelect
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v as Category })}
                  required={!isAdmin}
                  placeholder={t('fields.selectPlaceholder')}
                  options={(Object.keys(CATEGORY_LABEL) as Category[]).map((value) => ({
                    value,
                    label: labels.category(value),
                  }))}
                />
              </FormField>
              <FormField label={t('fields.jobType')} required>
                <CustomSelect
                  value={form.jobType}
                  onChange={(v) => setForm({ ...form, jobType: v as JobType })}
                  options={(
                    ['DIARIA', 'TIEMPO_COMPLETO', 'MEDIA_JORNADA'] as const
                  ).map((value) => ({ value, label: labels.jobType(value) }))}
                />
              </FormField>
            </div>
          </>
        )}

        {/* ——— Step 2: place and pay ——— */}
        {step === 1 && (
          <>
            <FormField label={t('fields.department')} required={!isAdmin}>
              <CustomSelect
                value={form.department}
                onChange={(v) =>
                  setForm({ ...form, department: v as Department })
                }
                required={!isAdmin}
                placeholder={t('fields.selectPlaceholder')}
                options={Object.entries(DEPARTMENT_LABEL).map(
                  ([value, label]) => ({ value, label }),
                )}
              />
            </FormField>
            <FormField label={t('fields.location')} required={!isAdmin}>
              <Input
                placeholder={t('fields.locationPlaceholder')}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required={!isAdmin}
              />
            </FormField>
            <FormField label={t('fields.locationReference')}>
              <Input
                placeholder={t('fields.locationReferencePlaceholder')}
                value={form.locationReference}
                onChange={(e) =>
                  setForm({ ...form, locationReference: e.target.value })
                }
              />
            </FormField>
            <FormField label={t('fields.map')}>
              {/* Mounted once the data has loaded in edit mode, so it centers
                  on the existing pin. */}
              {loaded && (
                <MapPicker
                  lat={coords?.lat ?? null}
                  lng={coords?.lng ?? null}
                  onChange={(lat, lng) => setCoords({ lat, lng })}
                  onPlace={(name) =>
                    setForm((f) => (f.location ? f : { ...f, location: name }))
                  }
                />
              )}
            </FormField>
            {/* Salary: an amount or a range. The ceiling is optional and only
                sent if it exceeds the minimum. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t('fields.salary')} required={!isAdmin}>
                <Input
                  type="number"
                  min={1}
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  required={!isAdmin}
                />
              </FormField>
              <FormField label={t('fields.salaryMax')}>
                <Input
                  type="number"
                  min={1}
                  placeholder={t('fields.salaryMaxPlaceholder')}
                  value={form.salaryMax}
                  onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                />
              </FormField>
            </div>
            {form.salaryMax.trim() !== '' && !salaryRange && (
              <p className="bg-secondary-container px-3 py-2 text-xs text-on-secondary-container">
                {t('fields.salaryRangeWarning')}
              </p>
            )}
            <FormField label={t('fields.schedule')}>
              <Input
                placeholder={t('fields.schedulePlaceholder')}
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              />
            </FormField>
          </>
        )}

        {/* ——— Step 3: contact and publishing ——— */}
        {step === 2 && (
          <>
            <FormField label={t('fields.phone')} required>
              <PhoneField
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                required
              />
            </FormField>
            {/* Extra numbers: useful when the listing takes calls on two
                lines. The first one is still the one the contact buttons use. */}
            {extraPhones.map((value, i) => (
              <FormField key={i} label={t('fields.extraPhone', { n: i + 1 })}>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <PhoneField
                      value={value}
                      onChange={(v) =>
                        setExtraPhones((list) =>
                          list.map((p, j) => (j === i ? v : p)),
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setExtraPhones((list) => list.filter((_, j) => j !== i))
                    }
                  >
                    {t('fields.removePhone')}
                  </Button>
                </div>
              </FormField>
            ))}
            {extraPhones.length < MAX_EXTRA_PHONES && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setExtraPhones((list) => [...list, ''])}
              >
                {t('fields.addPhone')}
              </Button>
            )}
            <FormField label={t('fields.duration')} required>
              <CustomSelect
                value={String(form.durationDays)}
                onChange={(v) => setForm({ ...form, durationDays: Number(v) })}
                options={DURATION_DAYS.map((d) => ({
                  value: String(d),
                  label: t(
                    d === 3 ? 'fields.durationOptionDefault' : 'fields.durationOption',
                    { days: d },
                  ),
                }))}
              />
            </FormField>
            <p className="bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              {t('fields.contactNote')}
            </p>
          </>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        {/* Notice ALWAYS visible (no tooltip): there's no hover on mobile. */}
        {missingByStep[step].length > 0 && (
          <p className="bg-secondary-container px-3 py-2 text-xs text-on-secondary-container">
            {t('missingNotice', { fields: missingByStep[step].join(', ') })}
          </p>
        )}

        <div className="flex gap-2">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
            >
              {t('back')}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              className="flex-1"
              disabled={missingByStep[step].length > 0}
              onClick={() => setStep((s) => s + 1)}
            >
              {t('next')}
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || notVerified || missingFields.length > 0}
            >
              {saving
                ? t('saving')
                : editId
                  ? t('saveChanges')
                  : t('publish')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Loading() {
  const t = useTranslations('publish');
  return <p className="text-on-surface-variant">{t('loading')}</p>;
}

export default function NewAdPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Form />
    </Suspense>
  );
}
