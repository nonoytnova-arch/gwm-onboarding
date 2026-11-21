// Generic required-field checker for a formSchema.js field array against a
// plain data object — respects each field's `showIf` condition, so a field
// hidden by a condition (e.g. noGstinReason when noGstin is unchecked)
// never blocks progress.
export function getMissingRequiredFields(fields, data) {
  const missing = [];
  for (const field of fields) {
    if (!field.required) continue;
    if (field.showIf) {
      const conditionValue = data[field.showIf.field];
      if (conditionValue !== field.showIf.equals) continue;
    }
    const value = data[field.key];
    if (value === undefined || value === null || value === '') {
      missing.push(field.label);
    }
  }
  return missing;
}
