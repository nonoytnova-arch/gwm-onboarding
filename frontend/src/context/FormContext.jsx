/*
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { getPath, setPath } from '../utils/path';
import { mapVehicleFromDb, mapDriverFromDb, resolveDriverVehicleIds } from '../utils/mappers';

const FormContext = createContext(null);
const STORAGE_KEY = 'gwm_draft_ref';

const emptyFormData = {
  subRole: '', legalName: '', tradeName: '', constitution: '', gstin: '', noGstin: false,
  noGstinReason: '', gstRegistrationType: '', pan: '', cinLlpin: '', udyamNumber: '', udyamCategory: '',
  regAddressLine1: '', regAddressLine2: '', regLandmark: '', regCity: '', regDistrict: '',
  regState: '', regPincode: '', regCountry: 'India',
  billingAddress: { sameAsRegistered: true, line1: '', line2: '', city: '', state: '', pincode: '' },
  contacts: {
    owner: { name: '', mobile: '', email: '' },
    operations: { name: '', mobile: '', email: '' },
    accounts: { name: '', mobile: '', whatsapp: '', email: '' },
    emergencyNumber: ''
  },
  website: '', yearEstablished: '',
  branches: [],
  roleSpecificData: {},
  vehicles: [],
  drivers: [],
  bankAccountHolder: '', bankAccountNumber: '', bankIfsc: '', bankUpi: '',
  signatoryName: '', signatoryDesignation: '', declarationAccepted: false,
  dpdpConsentAccepted: false, declarationDate: '',
  documents: []
};

export function FormProvider({ children }) {
  const [submissionId, setSubmissionId] = useState(null);
  const [draftToken, setDraftToken] = useState(null);
  const [role, setRole] = useState(null);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const saveTimer = useRef(null);

  // Resume the same draft on page refresh within this device/browser.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { id, token, role: storedRole } = JSON.parse(stored);
        setSubmissionId(id);
        setDraftToken(token);
        setRole(storedRole);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  function persistRef(id, token, roleValue) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, token, role: roleValue }));
  }

  async function startDraft(selectedRole, subRole, mobileValue, emailValue, language) {
    const result = await api.createDraft(selectedRole, subRole, mobileValue, emailValue, language);
    setSubmissionId(result.id);
    setDraftToken(result.draftToken);
    setRole(selectedRole);
    setMobile(mobileValue);
    setEmail(emailValue);
    setFormData({ ...emptyFormData, subRole: subRole || '' });
    persistRef(result.id, result.draftToken, selectedRole);
    return result;
  }

  async function resumeDraft(id, token) {
    const draft = await api.getDraft(id, token);
    setSubmissionId(draft.id);
    setDraftToken(token);
    setRole(draft.role);
    setMobile(draft.mobile || '');
    setEmail(draft.email || '');
    setFormData({
      ...emptyFormData,
      subRole: draft.sub_role || '',
      legalName: draft.legal_name || '', tradeName: draft.trade_name || '', constitution: draft.constitution || '',
      gstin: draft.gstin || '', gstRegistrationType: draft.gst_registration_type || '',
      noGstin: !!draft.no_gstin_reason, noGstinReason: draft.no_gstin_reason || '', pan: draft.pan || '', cinLlpin: draft.cin_llpin || '',
      udyamNumber: draft.udyam_number || '', udyamCategory: draft.udyam_category || '',
      regAddressLine1: draft.reg_address_line1 || '', regAddressLine2: draft.reg_address_line2 || '',
      regLandmark: draft.reg_landmark || '', regCity: draft.reg_city || '', regDistrict: draft.reg_district || '',
      regState: draft.reg_state || '', regPincode: draft.reg_pincode || '', regCountry: draft.reg_country || 'India',
      billingAddress: draft.billing_address_json ? JSON.parse(draft.billing_address_json) : emptyFormData.billingAddress,
      contacts: draft.contacts_json ? JSON.parse(draft.contacts_json) : emptyFormData.contacts,
      branches: draft.branches_json ? JSON.parse(draft.branches_json) : [],
      roleSpecificData: draft.role_specific_data ? JSON.parse(draft.role_specific_data) : {},
      vehicles: (draft.vehicles || []).map(mapVehicleFromDb),
      drivers: (draft.drivers || []).map((d) => mapDriverFromDb(d, draft.vehicles || [])),
      signatoryName: draft.signatory_name || '', signatoryDesignation: draft.signatory_designation || '',
      declarationAccepted: !!draft.declaration_accepted, dpdpConsentAccepted: !!draft.dpdp_consent_accepted,
      declarationDate: draft.declaration_date || '',
      documents: draft.documents || []
    });
    persistRef(draft.id, token, draft.role);
    return draft;
  }

  // Driver->vehicle linking uses an array index in the UI (see the dropdown
  // in SectionB) but the backend needs a real foreign-key ID. This resolves
  // that right before sending, and leaves everything else untouched.
  function withResolvedDriverVehicleIds(data) {
    if (!data.drivers || data.drivers.length === 0) return data;
    return { ...data, drivers: resolveDriverVehicleIds(data.drivers, data.vehicles) };
  }

  // After any save that included vehicles/drivers, pull the real DB rows
  // back (now carrying real IDs) and merge them into local state — this is
  // what lets a later driver-vehicle link or document upload resolve
  // correctly instead of silently staying null forever.
  async function refreshVehiclesAndDrivers() {
    const fresh = await api.getDraft(submissionId, draftToken);
    const vehicles = (fresh.vehicles || []).map(mapVehicleFromDb);
    const drivers = (fresh.drivers || []).map((d) => mapDriverFromDb(d, fresh.vehicles || []));
    setFormData((prev) => ({ ...prev, vehicles, drivers }));
  }

  // Debounced autosave: fires 900ms after the last change, not on every
  // keystroke, so typing a name doesn't trigger a request per character.
  const scheduleSave = useCallback((nextFormData) => {
    if (!submissionId || !draftToken) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setSaveError('');
      try {
        await api.updateDraft(submissionId, draftToken, withResolvedDriverVehicleIds(nextFormData));
        if (nextFormData.vehicles.length > 0 || nextFormData.drivers.length > 0) {
          await refreshVehiclesAndDrivers();
        }
      } catch (err) {
        setSaveError(err.message);
      } finally {
        setSaving(false);
      }
    }, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, draftToken]);

  function setField(path, value) {
    setFormData((prev) => {
      const next = setPath(prev, path, value);
      scheduleSave(next);
      return next;
    });
  }

  async function saveNow() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!submissionId || !draftToken) return;
    setSaving(true);
    setSaveError('');
    try {
      await api.updateDraft(submissionId, draftToken, withResolvedDriverVehicleIds(formData));
      // Real database IDs get assigned to vehicles/drivers on save (see
      // submissionController.updateDraft) — pull them back immediately so
      // Section C's per-vehicle/per-driver document uploads can link
      // correctly without waiting for a full draft-resume.
      if (formData.vehicles.length > 0 || formData.drivers.length > 0) {
        await refreshVehiclesAndDrivers();
      }
    } catch (err) {
      setSaveError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function addRepeatableItem(listPath, emptyItem) {
    setFormData((prev) => {
      const current = getPath(prev, listPath, []);
      const next = setPath(prev, listPath, [...current, emptyItem]);
      scheduleSave(next);
      return next;
    });
  }

  function removeRepeatableItem(listPath, index) {
    setFormData((prev) => {
      const current = getPath(prev, listPath, []);
      const next = setPath(prev, listPath, current.filter((_, i) => i !== index));
      scheduleSave(next);
      return next;
    });
  }

  // Documents are already persisted the moment they're uploaded (their own
  // endpoint writes straight to the documents table), so tracking them here
  // is just local UI state — it deliberately does NOT call scheduleSave,
  // to avoid re-sending the whole draft on every upload.
  function addDocumentLocal(doc) {
    setFormData((prev) => ({ ...prev, documents: [...prev.documents, doc] }));
  }
  function removeDocumentLocal(docId) {
    setFormData((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== docId) }));
  }

  async function submitFinal(captchaId, captchaAnswer) {
    await saveNow();
    const result = await api.submitFinal(submissionId, draftToken, captchaId, captchaAnswer);
    localStorage.removeItem(STORAGE_KEY);
    return result;
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setSubmissionId(null);
    setDraftToken(null);
    setRole(null);
    setFormData(emptyFormData);
  }

  return (
    <FormContext.Provider
      value={{
        submissionId, draftToken, role, mobile, email, formData,
        saving, saveError,
        startDraft, resumeDraft, setField, saveNow,
        addRepeatableItem, removeRepeatableItem, submitFinal, reset,
        addDocumentLocal, removeDocumentLocal,
        getPath: (path, fallback) => getPath(formData, path, fallback)
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useFormWizard() {
  return useContext(FormContext);
}
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

import { api } from '../services/api';
import { getPath, setPath } from '../utils/path';

import {
  mapVehicleFromDb,
  mapDriverFromDb,
  resolveDriverVehicleIds
} from '../utils/mappers';

const FormContext = createContext(null);

const STORAGE_KEY = 'gwm_draft_ref';

// -------------------------------------------------------------------------
// EMPTY FORM DATA
// -------------------------------------------------------------------------

const createEmptyFormData = () => ({
  subRole: '',
  legalName: '',
  tradeName: '',
  constitution: '',
  gstin: '',
  noGstin: false,
  noGstinReason: '',
  gstRegistrationType: '',
  pan: '',
  cinLlpin: '',
  udyamNumber: '',
  udyamCategory: '',

  regAddressLine1: '',
  regAddressLine2: '',
  regLandmark: '',
  regCity: '',
  regDistrict: '',
  regState: '',
  regPincode: '',
  regCountry: 'India',

  billingAddress: {
    sameAsRegistered: true,
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: ''
  },

  contacts: {
    owner: {
      name: '',
      mobile: '',
      email: ''
    },
    operations: {
      name: '',
      mobile: '',
      email: ''
    },
    accounts: {
      name: '',
      mobile: '',
      whatsapp: '',
      email: ''
    },
    emergencyNumber: ''
  },

  website: '',
  yearEstablished: '',

  branches: [],
  roleSpecificData: {},
  vehicles: [],
  drivers: [],

  bankAccountHolder: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankUpi: '',

  signatoryName: '',
  signatoryDesignation: '',

  declarationAccepted: false,
  dpdpConsentAccepted: false,
  declarationDate: '',

  documents: []
});

// -------------------------------------------------------------------------
// FORM PROVIDER
// -------------------------------------------------------------------------

export function FormProvider({ children }) {
  const [submissionId, setSubmissionId] = useState(null);
  const [draftToken, setDraftToken] = useState(null);

  const [role, setRole] = useState(null);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  const [formData, setFormData] = useState(createEmptyFormData);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const saveTimer = useRef(null);

  // -----------------------------------------------------------------------
  // TIMER CLEANUP
  // -----------------------------------------------------------------------

  const clearSaveTimer = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearSaveTimer();
    };
  }, [clearSaveTimer]);

  // -----------------------------------------------------------------------
  // RESTORE DRAFT REFERENCE FROM LOCAL STORAGE
  // -----------------------------------------------------------------------

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return;

    try {
      const {
        id,
        token,
        role: storedRole
      } = JSON.parse(stored);

      if (!id || !token) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setSubmissionId(id);
      setDraftToken(token);
      setRole(storedRole || null);

    } catch (err) {
      console.error('Unable to restore draft reference:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // -----------------------------------------------------------------------
  // SAVE DRAFT REFERENCE
  // -----------------------------------------------------------------------

  function persistRef(id, token, roleValue) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        id,
        token,
        role: roleValue
      })
    );
  }

  // -----------------------------------------------------------------------
  // CREATE NEW DRAFT
  // -----------------------------------------------------------------------

  async function startDraft(
    selectedRole,
    subRole,
    mobileValue,
    emailValue,
    language
  ) {
    clearSaveTimer();

    const result = await api.createDraft(
      selectedRole,
      subRole,
      mobileValue,
      emailValue,
      language
    );

    setSubmissionId(result.id);
    setDraftToken(result.draftToken);

    setRole(selectedRole);
    setMobile(mobileValue || '');
    setEmail(emailValue || '');

    setFormData({
      ...createEmptyFormData(),
      subRole: subRole || ''
    });

    setSaveError('');

    persistRef(
      result.id,
      result.draftToken,
      selectedRole
    );

    return result;
  }

  // -----------------------------------------------------------------------
  // RESUME EXISTING DRAFT
  // -----------------------------------------------------------------------

  async function resumeDraft(id, token) {
    clearSaveTimer();

    const draft = await api.getDraft(id, token);

    const parsedBillingAddress = draft.billing_address_json
      ? JSON.parse(draft.billing_address_json)
      : createEmptyFormData().billingAddress;

    const parsedContacts = draft.contacts_json
      ? JSON.parse(draft.contacts_json)
      : createEmptyFormData().contacts;

    const parsedBranches = draft.branches_json
      ? JSON.parse(draft.branches_json)
      : [];

    const parsedRoleData = draft.role_specific_data
      ? JSON.parse(draft.role_specific_data)
      : {};

    setSubmissionId(draft.id);
    setDraftToken(token);

    setRole(draft.role);
    setMobile(draft.mobile || '');
    setEmail(draft.email || '');

    setFormData({
      ...createEmptyFormData(),

      subRole: draft.sub_role || '',

      legalName: draft.legal_name || '',
      tradeName: draft.trade_name || '',
      constitution: draft.constitution || '',

      gstin: draft.gstin || '',
      gstRegistrationType: draft.gst_registration_type || '',

      noGstin: !!draft.no_gstin_reason,
      noGstinReason: draft.no_gstin_reason || '',

      pan: draft.pan || '',
      cinLlpin: draft.cin_llpin || '',

      udyamNumber: draft.udyam_number || '',
      udyamCategory: draft.udyam_category || '',

      regAddressLine1: draft.reg_address_line1 || '',
      regAddressLine2: draft.reg_address_line2 || '',
      regLandmark: draft.reg_landmark || '',

      regCity: draft.reg_city || '',
      regDistrict: draft.reg_district || '',
      regState: draft.reg_state || '',
      regPincode: draft.reg_pincode || '',
      regCountry: draft.reg_country || 'India',

      billingAddress: parsedBillingAddress,
      contacts: parsedContacts,
      branches: parsedBranches,
      roleSpecificData: parsedRoleData,

      vehicles: (draft.vehicles || []).map(mapVehicleFromDb),

      drivers: (draft.drivers || []).map((driver) =>
        mapDriverFromDb(driver, draft.vehicles || [])
      ),

      signatoryName: draft.signatory_name || '',
      signatoryDesignation: draft.signatory_designation || '',

      declarationAccepted: !!draft.declaration_accepted,
      dpdpConsentAccepted: !!draft.dpdp_consent_accepted,

      declarationDate: draft.declaration_date || '',

      documents: draft.documents || []
    });

    setSaveError('');

    persistRef(
      draft.id,
      token,
      draft.role
    );

    return draft;
  }

  // -----------------------------------------------------------------------
  // RESOLVE DRIVER-VEHICLE RELATIONSHIPS
  // -----------------------------------------------------------------------

  function withResolvedDriverVehicleIds(data) {
    if (!data.drivers || data.drivers.length === 0) {
      return data;
    }

    return {
      ...data,
      drivers: resolveDriverVehicleIds(
        data.drivers,
        data.vehicles
      )
    };
  }

  // -----------------------------------------------------------------------
  // REFRESH VEHICLE AND DRIVER DATABASE IDS
  // -----------------------------------------------------------------------

  async function refreshVehiclesAndDrivers() {
    const fresh = await api.getDraft(
      submissionId,
      draftToken
    );

    const vehicles = (fresh.vehicles || []).map(
      mapVehicleFromDb
    );

    const drivers = (fresh.drivers || []).map((driver) =>
      mapDriverFromDb(
        driver,
        fresh.vehicles || []
      )
    );

    setFormData((previous) => ({
      ...previous,
      vehicles,
      drivers
    }));
  }

  // -----------------------------------------------------------------------
  // DEBOUNCED AUTOSAVE
  // -----------------------------------------------------------------------

  const scheduleSave = useCallback(
    (nextFormData) => {
      if (!submissionId || !draftToken) return;

      clearSaveTimer();

      saveTimer.current = setTimeout(async () => {
        saveTimer.current = null;

        setSaving(true);
        setSaveError('');

        try {
          await api.updateDraft(
            submissionId,
            draftToken,
            withResolvedDriverVehicleIds(nextFormData)
          );

          // Background autosave intentionally does not call getDraft.
          // This prevents unnecessary extra requests during form filling.

        } catch (err) {
          console.error('Autosave failed:', err);

          setSaveError(
            err.message || 'Unable to save your draft. Please try again.'
          );

        } finally {
          setSaving(false);
        }

      }, 1500);
    },
    [submissionId, draftToken, clearSaveTimer]
  );

  // -----------------------------------------------------------------------
  // UPDATE INDIVIDUAL FORM FIELD
  // -----------------------------------------------------------------------

  function setField(path, value) {
    setFormData((previous) => {
      const next = setPath(previous, path, value);

      scheduleSave(next);

      return next;
    });
  }

  // -----------------------------------------------------------------------
  // SAVE DRAFT IMMEDIATELY
  // -----------------------------------------------------------------------

  async function saveNow() {
    clearSaveTimer();

    if (!submissionId || !draftToken) {
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      await api.updateDraft(
        submissionId,
        draftToken,
        withResolvedDriverVehicleIds(formData)
      );

      // Refresh database IDs only during explicit saves.
      // This is important for document uploads linked to vehicles/drivers.

      if (
        formData.vehicles.length > 0 ||
        formData.drivers.length > 0
      ) {
        await refreshVehiclesAndDrivers();
      }

    } catch (err) {
      console.error('Manual draft save failed:', err);

      setSaveError(
        err.message || 'Unable to save your draft. Please try again.'
      );

      throw err;

    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------------------------------------
  // ADD REPEATABLE ITEM
  // -----------------------------------------------------------------------

  function addRepeatableItem(listPath, emptyItem) {
    setFormData((previous) => {
      const current = getPath(
        previous,
        listPath,
        []
      );

      const next = setPath(
        previous,
        listPath,
        [...current, emptyItem]
      );

      scheduleSave(next);

      return next;
    });
  }

  // -----------------------------------------------------------------------
  // REMOVE REPEATABLE ITEM
  // -----------------------------------------------------------------------

  function removeRepeatableItem(listPath, index) {
    setFormData((previous) => {
      const current = getPath(
        previous,
        listPath,
        []
      );

      const next = setPath(
        previous,
        listPath,
        current.filter((_, itemIndex) => itemIndex !== index)
      );

      scheduleSave(next);

      return next;
    });
  }

  // -----------------------------------------------------------------------
  // ADD DOCUMENT TO LOCAL STATE
  // -----------------------------------------------------------------------

  function addDocumentLocal(doc) {
    setFormData((previous) => ({
      ...previous,
      documents: [
        ...previous.documents,
        doc
      ]
    }));
  }

  // -----------------------------------------------------------------------
  // REMOVE DOCUMENT FROM LOCAL STATE
  // -----------------------------------------------------------------------

  function removeDocumentLocal(docId) {
    setFormData((previous) => ({
      ...previous,
      documents: previous.documents.filter(
        (doc) => doc.id !== docId
      )
    }));
  }

  // -----------------------------------------------------------------------
  // FINAL SUBMISSION
  // -----------------------------------------------------------------------

  async function submitFinal(captchaId, captchaAnswer) {
    await saveNow();

    const result = await api.submitFinal(
      submissionId,
      draftToken,
      captchaId,
      captchaAnswer
    );

    localStorage.removeItem(STORAGE_KEY);

    return result;
  }

  // -----------------------------------------------------------------------
  // RESET FORM
  // -----------------------------------------------------------------------

  function reset() {
    clearSaveTimer();

    localStorage.removeItem(STORAGE_KEY);

    setSubmissionId(null);
    setDraftToken(null);

    setRole(null);
    setMobile('');
    setEmail('');

    setFormData(createEmptyFormData());

    setSaving(false);
    setSaveError('');
  }

  // -----------------------------------------------------------------------
  // CONTEXT PROVIDER
  // -----------------------------------------------------------------------

  return (
    <FormContext.Provider
      value={{
        submissionId,
        draftToken,
        role,
        mobile,
        email,
        formData,

        saving,
        saveError,

        startDraft,
        resumeDraft,
        setField,
        saveNow,

        addRepeatableItem,
        removeRepeatableItem,

        submitFinal,
        reset,

        addDocumentLocal,
        removeDocumentLocal,

        getPath: (path, fallback) =>
          getPath(formData, path, fallback)
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

// -------------------------------------------------------------------------
// FORM WIZARD HOOK
// -------------------------------------------------------------------------

export function useFormWizard() {
  return useContext(FormContext);
}
