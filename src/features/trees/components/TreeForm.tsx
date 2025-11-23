import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Plus, X } from 'lucide-react';

import type { TreeFormValues } from '@features/trees/types';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import { supabase } from '@shared/services/supabase';

type TreeFormMode = 'field' | 'classification';

type TreeFormProps = {
  initialValues: TreeFormValues;
  onSubmit: (values: TreeFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  readOnly?: boolean;
  mode?: TreeFormMode;
};

const cloneFormValues = (values: TreeFormValues): TreeFormValues => ({
  ...values,
  taxonomy: { ...values.taxonomy },
  endemic: {
    ...values.endemic,
    countries: [...(values.endemic.countries ?? [])],
    provinces: [...(values.endemic.provinces ?? [])],
  },
  coordinates: { ...values.coordinates },
  characteristics: [...values.characteristics],
});

const taxonomyFields: Array<keyof TreeFormValues['taxonomy']> = [
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
];

const COMMON_NAME_MIN_QUERY = 2;
const COMMON_NAME_SUGGESTION_LIMIT = 3;
const LOCATION_MIN_QUERY = 2;
const LOCATION_SUGGESTION_LIMIT = 5;
const TEMPLATE_FIELDS =
  'id, common_name, scientific_name, taxonomy, endemic, description, characteristics';

const TreeForm = ({
  initialValues,
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  readOnly = false,
  mode = 'field',
}: TreeFormProps) => {
  const [values, setValues] = useState<TreeFormValues>(() => cloneFormValues(initialValues));
  const [characteristicInput, setCharacteristicInput] = useState('');
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [templateHydrating, setTemplateHydrating] = useState(false);
  const [templateHydrateError, setTemplateHydrateError] = useState<string | null>(null);
  const [templateHydratedFrom, setTemplateHydratedFrom] = useState<string | null>(null);
  const [recentSuggestions, setRecentSuggestions] = useState<string[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [recentLocationSuggestions, setRecentLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [, setGeolocationError] = useState<string | null>(null);
  const nameDebounceRef = useRef<number>(0);
  const skipNextLookupRef = useRef(false);
  const nameSuggestionsRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const locationDebounceRef = useRef<number>(0);
  const skipNextLocationLookupRef = useRef(false);
  const locationSuggestionsRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const locationBlurTimeoutRef = useRef<number | null>(null);
  const createdAtFallbackRef = useRef(initialValues.created_at ?? new Date().toISOString());

  useEffect(() => {
    setValues(cloneFormValues(initialValues));
  }, [initialValues]);

  useEffect(() => {
    if (initialValues.created_at) {
      createdAtFallbackRef.current = initialValues.created_at;
    }
  }, [initialValues.created_at]);

  useEffect(() => {
    return () => {
      if (locationBlurTimeoutRef.current) {
        clearTimeout(locationBlurTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showNameSuggestions) return undefined;
    const handler = (event: MouseEvent) => {
      if (nameSuggestionsRef.current && !nameSuggestionsRef.current.contains(event.target as Node)) {
        setShowNameSuggestions(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showNameSuggestions]);

  useEffect(() => {
    if (!showLocationSuggestions) return undefined;
    const handler = (event: MouseEvent) => {
      if (
        locationSuggestionsRef.current &&
        !locationSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showLocationSuggestions]);

    const fieldDisabled = isSubmitting || readOnly;
    const isClassificationMode = mode === 'classification';

  useEffect(() => {
    if (isClassificationMode) {
      setShowLocationSuggestions(false);
    }
  }, [isClassificationMode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  const formattedCreatedAt = useMemo(() => {
    const source = values.created_at ?? createdAtFallbackRef.current;
    return new Date(source).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [values.created_at]);

  const setTaxonomy = (field: keyof TreeFormValues['taxonomy'], value: string) => {
    setValues((prev) => ({
      ...prev,
      taxonomy: { ...prev.taxonomy, [field]: value },
    }));
  };

  const setEndemicArray = (
    field: keyof Pick<TreeFormValues['endemic'], 'countries' | 'provinces'>,
    value: string
  ) => {
    setValues((prev) => ({
      ...prev,
      endemic: {
        ...prev.endemic,
        [field]: value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      },
    }));
  };

  const setCoordinates = (field: keyof TreeFormValues['coordinates'], value: string) => {
    const toNumeric = () => {
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    setValues((prev) => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [field]: field === 'location' ? value : toNumeric(),
      },
    }));
  };

  const handleGetLocation = () => {
    if (fieldDisabled) return;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeolocationError('Geolocation is not supported in this browser.');
      return;
    }

    setGeolocationError(null);
    setGeolocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeolocationLoading(false);
        setValues((prev) => ({
          ...prev,
          coordinates: {
            ...prev.coordinates,
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        }));
      },
      (error) => {
        setGeolocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocationError('Location permission denied. Please allow access and try again.');
          return;
        }
        if (error.code === error.TIMEOUT) {
          setGeolocationError('Location request timed out. Please try again.');
          return;
        }
        setGeolocationError('Unable to fetch your location. Please try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleCharacteristicAdd = () => {
    if (!characteristicInput.trim() || fieldDisabled) return;
    setValues((prev) => ({
      ...prev,
      characteristics: [...prev.characteristics, characteristicInput.trim()],
    }));
    setCharacteristicInput('');
  };

  const handleCharacteristicRemove = (index: number) => {
    setValues((prev) => ({
      ...prev,
      characteristics: prev.characteristics.filter((_, i) => i !== index),
    }));
  };

  const ensureRecentSuggestions = useCallback(async () => {
    if (recentLoading || recentSuggestions.length > 0) return;
    setRecentLoading(true);
    const { data, error } = await supabase
      .from('jenis_pohon')
      .select('common_name, created_at')
      .order('created_at', { ascending: false })
      .limit(COMMON_NAME_SUGGESTION_LIMIT);
    setRecentLoading(false);
    if (error) return;
    const uniqueNames = Array.from(
      new Set((data ?? []).map((item) => item.common_name).filter(Boolean) as string[])
    );
    setRecentSuggestions(uniqueNames);
    if (values.common_name.trim().length < COMMON_NAME_MIN_QUERY) {
      setNameSuggestions(uniqueNames);
    }
  }, [recentLoading, recentSuggestions, values.common_name]);

  const ensureRecentLocationSuggestions = useCallback(async () => {
    if (recentLocationSuggestions.length > 0) return;
    setLocationLoading(true);
    setLocationError(null);
    const { data, error } = await supabase
      .from('lokasi')
      .select('lokasi')
      .order('created_at', { ascending: false })
      .limit(LOCATION_SUGGESTION_LIMIT);
    setLocationLoading(false);
    if (error) return;
    const uniqueLocations = Array.from(
      new Set((data ?? []).map((item) => item.lokasi).filter(Boolean) as string[])
    );
    setRecentLocationSuggestions(uniqueLocations);
    if ((values.coordinates?.location?.toString() ?? '').trim().length < LOCATION_MIN_QUERY) {
      setLocationSuggestions(uniqueLocations);
    }
  }, [recentLocationSuggestions.length, values.coordinates.location]);

  const handleSuggestionSelect = async (suggestion: string) => {
    if (fieldDisabled) return;
    skipNextLookupRef.current = true;
    setValues((prev) => ({ ...prev, common_name: suggestion }));
    setShowNameSuggestions(false);
    setTemplateHydrateError(null);
    setTemplateHydratedFrom(null);
    setTemplateHydrating(true);

    const { data, error } = await supabase
      .from('jenis_pohon')
      .select(TEMPLATE_FIELDS)
      .eq('common_name', suggestion)
      .limit(1)
      .maybeSingle();

    setTemplateHydrating(false);
    if (error || !data) {
      setTemplateHydrateError('Auto-fill failed. Please complete the form manually.');
      return;
    }

    setValues((prev) => applyTemplateToValues(prev, data));
    setTemplateHydratedFrom(data.common_name);
  };

  const handleLocationSuggestionSelect = (suggestion: string) => {
    if (fieldDisabled) return;
    skipNextLocationLookupRef.current = true;
    setValues((prev) => ({
      ...prev,
      coordinates: { ...prev.coordinates, location: suggestion },
    }));
    setShowLocationSuggestions(false);
    locationInputRef.current?.blur();
  };

  useEffect(() => {
    if (nameDebounceRef.current) {
      clearTimeout(nameDebounceRef.current);
    }

    const trimmed = values.common_name.trim();
    if (skipNextLookupRef.current) {
      skipNextLookupRef.current = false;
      return;
    }

    if (trimmed.length < COMMON_NAME_MIN_QUERY) return;

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setNameLoading(true);
      setNameError(null);
      const { data, error } = await supabase
        .from('jenis_pohon')
        .select('common_name')
        .ilike('common_name', `%${trimmed}%`)
        .limit(COMMON_NAME_SUGGESTION_LIMIT);

      if (cancelled) return;

      setNameLoading(false);
      if (error) {
        setNameError('Failed to load suggestions');
        setNameSuggestions([]);
        setShowNameSuggestions(true);
        return;
      }

      const uniqueNames = Array.from(
        new Set((data ?? []).map((item) => item.common_name).filter(Boolean) as string[])
      ).filter((name) => name.toLowerCase() !== trimmed.toLowerCase());

      setNameSuggestions(uniqueNames);
      setNameError(null);
      const shouldDisplay = document.activeElement === nameInputRef.current;
      setShowNameSuggestions(shouldDisplay && uniqueNames.length > 0);
    }, 300);

    nameDebounceRef.current = timeout;
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [values.common_name]);

  useEffect(() => {
    if (values.common_name.trim().length >= COMMON_NAME_MIN_QUERY) return;
    setNameLoading(false);
    setNameError(null);
    setNameSuggestions(recentSuggestions);
    if (document.activeElement !== nameInputRef.current) {
      setShowNameSuggestions(false);
    }
  }, [recentSuggestions, values.common_name]);

  useEffect(() => {
    if (values.common_name.trim().length < COMMON_NAME_MIN_QUERY) {
      void ensureRecentSuggestions();
    }
  }, [ensureRecentSuggestions, values.common_name]);

  useEffect(() => {
    if (isClassificationMode) return undefined;
    if (locationDebounceRef.current) {
      clearTimeout(locationDebounceRef.current);
    }

    const trimmed = (values.coordinates?.location?.toString() ?? '').trim();
    if (skipNextLocationLookupRef.current) {
      skipNextLocationLookupRef.current = false;
      return;
    }

    if (trimmed.length < LOCATION_MIN_QUERY) {
      setLocationSuggestions(recentLocationSuggestions);
      setLocationLoading(false);
      setLocationError(null);
      if (document.activeElement !== locationInputRef.current) {
        setShowLocationSuggestions(false);
      }
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setLocationLoading(true);
      setLocationError(null);
      const { data, error } = await supabase
        .from('lokasi')
        .select('lokasi')
        .ilike('lokasi', `%${trimmed}%`)
        .limit(LOCATION_SUGGESTION_LIMIT);

      if (cancelled) return;

      setLocationLoading(false);
      if (error) {
        setLocationError('Failed to load location suggestions');
        setLocationSuggestions([]);
        setShowLocationSuggestions(true);
        return;
      }

      const uniqueLocations = Array.from(
        new Set((data ?? []).map((item) => item.lokasi).filter(Boolean) as string[])
      );
      setLocationSuggestions(uniqueLocations);
      const shouldDisplay = document.activeElement === locationInputRef.current;
      setShowLocationSuggestions(shouldDisplay && uniqueLocations.length > 0);
    }, 300);

    locationDebounceRef.current = timeout;
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [recentLocationSuggestions, values.coordinates.location, isClassificationMode]);

  useEffect(() => {
    if (isClassificationMode) return;
    if ((values.coordinates?.location?.toString() ?? '').trim().length < LOCATION_MIN_QUERY) {
      void ensureRecentLocationSuggestions();
    }
  }, [ensureRecentLocationSuggestions, values.coordinates.location, isClassificationMode]);

  useEffect(() => {
    if (templateHydratedFrom && values.common_name !== templateHydratedFrom) {
      setTemplateHydratedFrom(null);
    }
  }, [templateHydratedFrom, values.common_name]);

  const hasMinCommonNameQuery = values.common_name.trim().length >= COMMON_NAME_MIN_QUERY;
  const nameSuggestionsLoading = nameLoading || recentLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        badge="STEP 01"
        title="Basic Information"
        description="Provide the initial identity so the team can recognize the tree quickly."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Tree ID"
            value={values.id}
            disabled
            readOnly
            helperText="Generated automatically"
            showEscapeHint={false}
          />
          <Input
            label="Created At"
            value={formattedCreatedAt}
            disabled
            readOnly
            showEscapeHint={false}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative" ref={nameSuggestionsRef}>
            <Input
              label="Common Name"
              placeholder="Tree common name"
              required
              value={values.common_name}
              ref={nameInputRef}
              onFocus={() => {
                if (values.common_name.trim().length < COMMON_NAME_MIN_QUERY) {
                  void ensureRecentSuggestions();
                }
                setShowNameSuggestions(true);
              }}
              onValueChange={(val) => {
                setValues((prev) => ({ ...prev, common_name: val }));
              }}
            />
            {showNameSuggestions && !fieldDisabled && (
              <div className="absolute left-0 right-0 z-20 mt-2 max-h-60 overflow-y-auto p-1 rounded-lg border border-gray-200 bg-white shadow-xl">
                <span className="text-xs text-brand-700 px-4 font-medium">
                  {hasMinCommonNameQuery ? 'Search Results' : 'Recent Suggestions'}
                </span>
                {nameSuggestionsLoading ? (
                  <p className="px-4 py-3 text-sm text-gray-500">Fetching suggestions...</p>
                ) : nameError ? (
                  <p className="px-4 py-3 text-sm text-red-600">{nameError}</p>
                ) : nameSuggestions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    {hasMinCommonNameQuery
                      ? 'No matching suggestions.'
                      : `Type at least ${COMMON_NAME_MIN_QUERY} letters to see suggestions.`}
                  </p>
                ) : (
                  nameSuggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      className="flex w-full rounded-md items-center justify-between px-4 py-2 text-left text-sm text-gray-600 hover:bg-brand-100 hover:text-brand-700"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))
                )}
              </div>
            )}
            {templateHydrating && (
              <p className="mt-2 text-xs font-semibold text-brand-700">Applying catalog template...</p>
            )}
            {templateHydrateError && !templateHydrating && (
              <p className="mt-2 text-xs text-red-600">{templateHydrateError}</p>
            )}
            {templateHydratedFrom && !templateHydrating && !templateHydrateError && (
              <p className="mt-2 text-xs text-brand-700">
                Prefilled from catalog {templateHydratedFrom}.
              </p>
            )}
          </div>
          <Input
            label="Scientific Name"
            placeholder="Scientific name"
            required
            disabled
            value={values.scientific_name}
            onValueChange={(val) => setValues((prev) => ({ ...prev, scientific_name: val }))}
            
          />
        </div>
      </FormSection>

      <FormSection
        badge="STEP 02"
        title="Taxonomy Structure"
        description="Fill every taxonomy rank completely."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {taxonomyFields.map((field) => (
            <Input
              key={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              placeholder="..."
              required
              readOnly
              disabled
              value={values.taxonomy[field]}
              onValueChange={(val) => setTaxonomy(field, val)}
              
            />
          ))}
        </div>
      </FormSection>

      <FormSection
        badge="STEP 03"
        title="Origin & Distribution"
        description="This data helps the team understand the ecological context."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Region"
            placeholder="Example: West Java"
            required
            value={values.endemic.region}
            disabled
            onValueChange={(val) =>
              setValues((prev) => ({ ...prev, endemic: { ...prev.endemic, region: val } }))
            }
            
          />
          <TextAreaField
            label="Countries"
            placeholder="Separate with commas"
            helperText="Example: Indonesia, Malaysia"
            value={values.endemic.countries.join(', ')}
            disabled
            onChange={(val) => setEndemicArray('countries', val)}
            minRows={4}
          />
          <TextAreaField
            label="Provinces"
            placeholder="Separate with commas"
            value={values.endemic.provinces.join(', ')}
            disabled
            onChange={(val) => setEndemicArray('provinces', val)}
            minRows={4}
          />
        </div>
      </FormSection>

      {!isClassificationMode && (
        <FormSection
          badge="STEP 04"
          title="Field Coordinates"
          description="Ensure the latitude/longitude values use decimal format."
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-row w-full gap-2">
                <Input
                  label="Latitude"
                  step="any"
                  placeholder="-6.200"
                  required
                  value={values.coordinates.latitude?.toString() ?? ''}
                  onValueChange={(val) => setCoordinates('latitude', val)}
                  disabled
                />
                <Input
                  label="Longitude"
                  step="any"
                  placeholder="106.816"
                  required
                  value={values.coordinates.longitude?.toString() ?? ''}
                  onValueChange={(val) => setCoordinates('longitude', val)}
                  disabled
                />
              </div>
              <div className="flex items-end w-full sm:w-auto">
                <div className="flex flex-col items-start gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    size="sm"
                    className="whitespace-nowrap w-full py-3 sm:px-4"
                    onClick={handleGetLocation}
                    disabled={fieldDisabled || geolocationLoading}
                  >
                    {geolocationLoading ? 'Getting...' : 'Get Location'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative" ref={locationSuggestionsRef}>
              <Input
                label="Location"
                placeholder="Location name"
                value={values.coordinates.location?.toString() ?? ''}
                ref={locationInputRef}
                onFocus={() => {
                  if (
                    (values.coordinates?.location?.toString() ?? '').trim().length < LOCATION_MIN_QUERY
                  ) {
                    void ensureRecentLocationSuggestions();
                  }
                  setShowLocationSuggestions(true);
                }}
                onBlur={() => {
                  if (locationBlurTimeoutRef.current) {
                    clearTimeout(locationBlurTimeoutRef.current);
                  }
                  locationBlurTimeoutRef.current = window.setTimeout(() => {
                    setShowLocationSuggestions(false);
                  }, 120);
                }}
                onValueChange={(val) => setCoordinates('location', val)}
              />
              {showLocationSuggestions && !fieldDisabled && (
                <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                    {values.coordinates.location && typeof values.coordinates.location === 'string'
                      ? values.coordinates.location.trim().length >= LOCATION_MIN_QUERY
                        ? 'Location Search Results'
                        : 'Recent Locations'
                      : ''}
                  </p>
                  {locationLoading ? (
                    <p className="px-4 py-3 text-sm text-gray-500">Fetching location suggestions...</p>
                  ) : locationError ? (
                    <p className="px-4 py-3 text-sm text-red-600">{locationError}</p>
                  ) : locationSuggestions.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      {values.coordinates.location &&
                      typeof values.coordinates.location === 'string' &&
                      values.coordinates.location.trim().length >= LOCATION_MIN_QUERY
                        ? 'No matching locations.'
                        : `Type at least ${LOCATION_MIN_QUERY} letters to see suggestions.`}
                    </p>
                  ) : (
                    locationSuggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-brand-50"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleLocationSuggestionSelect(suggestion)}
                      >
                        {suggestion}
                        <span className="text-[11px] font-semibold uppercase text-brand-600">Select</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </FormSection>
      )}
      {!isClassificationMode && locationError && (
        <p className="text-xs font-semibold text-red-600">{locationError}</p>
      )}

      <FormSection
        badge="STEP 05"
        title="Description & Characteristics"
        description="Add the narrative details and highlight key characteristics."
      >
        <TextAreaField
          label="Description"
          placeholder="Write a short summary about this tree..."
          value={values.description}
          disabled
          onChange={(val) => setValues((prev) => ({ ...prev, description: val }))}
          minRows={5}
        />

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Characteristics</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Example: Grows up to 30 meters"
              value={characteristicInput}
              disabled
              onValueChange={setCharacteristicInput}
              
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleCharacteristicAdd();
                }
              }}
            />
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full px-4 font-normal sm:w-auto"
              onClick={handleCharacteristicAdd}
              disabled={fieldDisabled || !characteristicInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {values.characteristics.length === 0 ? (
            <p className="text-sm text-gray-500">No characteristics added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {values.characteristics.map((characteristic, index) => (
                <span
                  key={`${characteristic}-${index}`}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  {characteristic}
                  <button
                    type="button"
                    onClick={() => handleCharacteristicRemove(index)}
                    disabled
                    className="text-gray-400 transition hover:text-gray-700 disabled:opacity-40"
                    aria-label={`Remove characteristic ${characteristic}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full py-3 sm:w-48"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="w-full py-3 sm:w-48"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default TreeForm;

const textareaBase =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-100 disabled:text-gray-500';

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
  minRows?: number;
};

const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  helperText,
  minRows = 3,
}: TextAreaFieldProps) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <textarea
      rows={minRows}
      className={textareaBase}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
    {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>
);

type FormSectionProps = {
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
};

const FormSection = ({ title, description, badge, children }: FormSectionProps) => (
  <section className="rounded-3xl border border-gray-300 bg-white/90 p-6 ">
    <div className="mb-4 space-y-1">
      {badge && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">{badge}</p>
      )}
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

type JenisPohonTemplate = {
  id: number;
  common_name: string;
  scientific_name: string | null;
  taxonomy: Record<string, unknown> | string | null;
  endemic: Record<string, unknown> | string | null;
  description: string | null;
  characteristics: string[] | Record<string, unknown> | string | null;
};

const parseJsonValue = <T,>(value: unknown): T | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') return value as T;
  return null;
};

const toStringValue = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

const sanitizeTaxonomy = (
  value: JenisPohonTemplate['taxonomy'],
  fallback: TreeFormValues['taxonomy']
): TreeFormValues['taxonomy'] => {
  const parsed = parseJsonValue<Record<string, unknown>>(value);
  return {
    kingdom: toStringValue(parsed?.kingdom) || fallback.kingdom,
    phylum:
      toStringValue(parsed?.phylum) ||
      toStringValue(parsed?.division) ||
      fallback.phylum,
    class: toStringValue(parsed?.class) || fallback.class,
    order: toStringValue(parsed?.order) || fallback.order,
    family: toStringValue(parsed?.family) || fallback.family,
    genus: toStringValue(parsed?.genus) || fallback.genus,
    species: toStringValue(parsed?.species) || fallback.species,
  };
};

const sanitizeEndemic = (
  value: JenisPohonTemplate['endemic'],
  fallback: TreeFormValues['endemic']
): TreeFormValues['endemic'] => {
  const parsed = parseJsonValue<Record<string, unknown>>(value);
  const region =
    typeof parsed?.region === 'string'
      ? parsed.region
      : Array.isArray(parsed?.regions)
        ? toStringValue(parsed.regions[0])
        : fallback.region;

  const countries = Array.isArray(parsed?.countries)
    ? parsed.countries.map((item) => toStringValue(item)).filter(Boolean)
    : [...fallback.countries];

  const provinces = Array.isArray(parsed?.provinces)
    ? parsed.provinces.map((item) => toStringValue(item)).filter(Boolean)
    : [...fallback.provinces];

  return {
    region,
    countries,
    provinces,
  };
};

const sanitizeCharacteristics = (
  value: JenisPohonTemplate['characteristics'],
  fallback: string[]
): string[] => {
  if (!value) return fallback;
  const parsed = parseJsonValue<unknown>(value);
  if (Array.isArray(parsed)) {
    const cleaned = parsed.map((item) => toStringValue(item)).filter(Boolean);
    return cleaned.length > 0 ? cleaned : fallback;
  }
  if (typeof parsed === 'string') return [parsed];
  if (parsed && typeof parsed === 'object') {
    const flattened = Object.entries(parsed).map(([key, val]) => {
      if (Array.isArray(val)) {
        const joined = val.map((item) => toStringValue(item)).filter(Boolean).join(', ');
        return `${key}: ${joined}`;
      }
      if (val && typeof val === 'object') {
        return `${key}: ${Object.entries(val)
          .map(([subKey, subVal]) => `${subKey} ${toStringValue(subVal)}`)
          .join(', ')}`;
      }
      return `${key}: ${toStringValue(val)}`;
    });
    return flattened.length > 0 ? flattened : fallback;
  }
  return fallback;
};

const applyTemplateToValues = (
  current: TreeFormValues,
  template: JenisPohonTemplate
): TreeFormValues => ({
  ...current,
  common_name: template.common_name,
  scientific_name: template.scientific_name ?? current.scientific_name,
  taxonomy: sanitizeTaxonomy(template.taxonomy, current.taxonomy),
  endemic: sanitizeEndemic(template.endemic, current.endemic),
  description: template.description ?? current.description,
  characteristics: sanitizeCharacteristics(template.characteristics, current.characteristics),
});
