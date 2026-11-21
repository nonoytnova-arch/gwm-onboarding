import FieldList from './FieldList';

function emptyItemFromFields(fields) {
  const item = {};
  fields.forEach((f) => { item[f.key] = f.type === 'checkbox' ? false : ''; });
  return item;
}

// A repeatable block of fields — vehicles, drivers, branches, lanes,
// pickup/delivery locations all use this with a different `fields` schema
// and a different `items` array.
export default function RepeatableGroup({ title, fields, items, onAdd, onRemove, onItemChange, minItems = 0 }) {
  return (
    <div className="field-group">
      {items.map((item, index) => (
        <div className="repeatable-item" key={index}>
          <div className="repeatable-item-header">
            <h4>{title} {index + 1}</h4>
            {items.length > minItems && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemove(index)}>Remove</button>
            )}
          </div>
          <FieldList
            fields={fields}
            data={item}
            onChange={(key, value) => onItemChange(index, key, value)}
          />
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => onAdd(emptyItemFromFields(fields))}>
        + Add {title}
      </button>
    </div>
  );
}
