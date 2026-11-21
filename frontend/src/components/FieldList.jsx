import DynamicField from './DynamicField';

// Renders a whole formSchema.js field array against a plain data object,
// resolving each field's optional `showIf` condition (e.g. only show
// `noGstinReason` when `noGstin` is checked).
export default function FieldList({ fields, data, onChange, errors = {} }) {
  return (
    <>
      {fields.map((field) => {
        if (field.showIf) {
          const conditionValue = data[field.showIf.field];
          if (conditionValue !== field.showIf.equals) return null;
        }
        return (
          <DynamicField
            key={field.key}
            field={field}
            value={data[field.key]}
            onChange={(value) => onChange(field.key, value)}
            error={errors[field.key]}
          />
        );
      })}
    </>
  );
}
