import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormWizard } from '../context/FormContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import FileUploadField from '../components/FileUploadField';
import StepNav from '../components/StepNav';
import { STEPS } from './SectionA';
import { DOCUMENT_REQUIREMENTS } from '../data/formSchema';

export default function SectionC() {
  const { t } = useLanguage();
  const { formData, submissionId, draftToken, role, saveNow, addDocumentLocal, removeDocumentLocal } = useFormWizard();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) navigate('/register');
  }, [role, navigate]);

  if (!role) return null;

  const docsForRole = [...DOCUMENT_REQUIREMENTS.common, ...(DOCUMENT_REQUIREMENTS[role] || [])];

  function findUploaded(docType) {
    return formData.documents.find((d) => d.docType === docType || d.doc_type === docType);
  }

  async function handleUpload(docType, file) {
    const result = await api.uploadDocument(submissionId, file, { draftToken, docType });
    addDocumentLocal({ id: result.id, docType, originalName: result.originalName });
  }

  async function handleRemove(docId) {
    await api.deleteDocument(docId, draftToken);
    removeDocumentLocal(docId);
  }

  async function handleVehicleFileUpload(vehicleIndex, vehicleId, docType, file) {
    const result = await api.uploadDocument(submissionId, file, {
      draftToken, docType: `vehicle_${docType}`, relatedVehicleId: vehicleId
    });
    addDocumentLocal({ id: result.id, docType: `vehicle_${docType}`, originalName: result.originalName, relatedVehicleId: vehicleId });
  }

  async function handleDriverFileUpload(driverIndex, driverId, docType, file) {
    const result = await api.uploadDocument(submissionId, file, {
      draftToken, docType: `driver_${docType}`, relatedDriverId: driverId
    });
    addDocumentLocal({ id: result.id, docType: `driver_${docType}`, originalName: result.originalName, relatedDriverId: driverId });
  }

  async function handleNext() {
    await saveNow();
    navigate('/register/declaration');
  }

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <ProgressBar steps={STEPS} currentIndex={2} />
      <h2>{t('documents_title')}</h2>
      <p className="text-muted mb-16">{t('documents_subtitle')}</p>

      <div className="card card-pad mt-16">
        {docsForRole.map((doc) => {
          const uploaded = findUploaded(doc.key);
          return (
            <FileUploadField
              key={doc.key}
              label={doc.label}
              help={doc.help}
              optional={doc.optional}
              uploaded={uploaded}
              onUpload={(file) => handleUpload(doc.key, file)}
              onRemove={() => handleRemove(uploaded.id)}
            />
          );
        })}
      </div>

      {role === 'transporter' && formData.vehicles.length > 0 && (
        <div className="card card-pad mt-16">
          <h3>Per-Vehicle Documents</h3>
          <p className="text-muted text-sm mb-16">RC, insurance, fitness certificate and permit for each vehicle you listed.</p>
          {formData.vehicles.map((vehicle, vi) => (
            <div className="repeatable-item" key={vi}>
              <div className="repeatable-item-header">
                <h4>{vehicle.registrationNumber || `Vehicle ${vi + 1}`}</h4>
              </div>
              {['rc', 'insurance', 'fitness', 'permit'].map((docType) => {
                const uploaded = formData.documents.find(
                  (d) => (d.docType === `vehicle_${docType}` || d.doc_type === `vehicle_${docType}`) &&
                         (d.relatedVehicleId === vehicle.id || d.related_vehicle_id === vehicle.id)
                );
                return (
                  <FileUploadField
                    key={docType}
                    label={docType.toUpperCase()}
                    uploaded={uploaded}
                    onUpload={(file) => handleVehicleFileUpload(vi, vehicle.id, docType, file)}
                    onRemove={() => handleRemove(uploaded.id)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {role === 'transporter' && formData.drivers.length > 0 && (
        <div className="card card-pad mt-16">
          <h3>Per-Driver Documents</h3>
          <p className="text-muted text-sm mb-16">Driving licence for each driver you listed.</p>
          {formData.drivers.map((driver, di) => {
            const uploaded = formData.documents.find(
              (d) => (d.docType === 'driver_dl' || d.doc_type === 'driver_dl') &&
                     (d.relatedDriverId === driver.id || d.related_driver_id === driver.id)
            );
            return (
              <div className="repeatable-item" key={di}>
                <div className="repeatable-item-header">
                  <h4>{driver.name || `Driver ${di + 1}`}</h4>
                </div>
                <FileUploadField
                  label="Driving Licence"
                  uploaded={uploaded}
                  onUpload={(file) => handleDriverFileUpload(di, driver.id, 'dl', file)}
                  onRemove={() => handleRemove(uploaded.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      <StepNav onBack={() => navigate('/register/role-details')} onNext={handleNext} />
    </div>
  );
}
