import { DataLink, FieldOverrideContext, SelectableValue, ThresholdsConfig, ValueMapping } from '../../types';

export const identityOverrideProcessor = <T>(value: T, _context: FieldOverrideContext, _settings: any) => {
  return value;
};

export interface NumberFieldConfigSettings {
  placeholder?: string;
  integer?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const numberOverrideProcessor = (
  value: any,
  context: FieldOverrideContext,
  settings?: NumberFieldConfigSettings
) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return parseFloat(value);
};

export interface DataLinksFieldConfigSettings {}

export const dataLinksOverrideProcessor = (
  value: any,
  _context: FieldOverrideContext,
  _settings?: DataLinksFieldConfigSettings
) => {
  return value as DataLink[];
};

export interface ValueMappingFieldConfigSettings {}

export const valueMappingsOverrideProcessor = (
  value: any,
  _context: FieldOverrideContext,
  _settings?: ValueMappingFieldConfigSettings
) => {
  return value as ValueMapping[]; // !!!! likely not !!!!
};

export interface SelectFieldConfigSettings<T> {
  allowCustomValue?: boolean;

  /** The default options */
  options: Array<SelectableValue<T>>;

  /** Optionally use the context to define the options */
  getOptions?: (context: FieldOverrideContext) => Promise<Array<SelectableValue<T>>>;
}

export const selectOverrideProcessor = (
  value: any,
  _context: FieldOverrideContext,
  _settings?: SelectFieldConfigSettings<any>
) => {
  return value;
};

export interface StringFieldConfigSettings {
  placeholder?: string;
  maxLength?: number;
  expandTemplateVars?: boolean;
  useTextarea?: boolean;
  rows?: number;
}

const replaceFieldVariables = (value: string, context: FieldOverrideContext) => {
  return value.replace(/\&\&\((\w+)\)/g, (substr, fieldName) => {
    if (context.field!.labels && context.field!.labels[fieldName]) return context.field!.labels[fieldName];
    else {
      for (let s = 0; s < context.data.length; s++) {
        const series = context.data[s];
        const _f = series.fields.find((val, ind, obj) => {
          return val.name == fieldName;
        });
        if (_f) {
          return _f.values.get(0);
        }
      }
    }
  });
};

export const stringOverrideProcessor = (
  value: any,
  context: FieldOverrideContext,
  settings?: StringFieldConfigSettings
) => {
  if (value === null || value === undefined) {
    return value;
  }
  //RADGREEN - process field variables
  value = replaceFieldVariables(value, context);
  if (settings && settings.expandTemplateVars && context.replaceVariables) {
    return context.replaceVariables(value, context.field!.state!.scopedVars);
  }
  return `${value}`;
};

export interface ThresholdsFieldConfigSettings {
  // Anything?
}

export const thresholdsOverrideProcessor = (
  value: any,
  _context: FieldOverrideContext,
  _settings?: ThresholdsFieldConfigSettings
) => {
  return value as ThresholdsConfig; // !!!! likely not !!!!
};

export interface UnitFieldConfigSettings {}

export const unitOverrideProcessor = (
  value: boolean,
  _context: FieldOverrideContext,
  _settings?: UnitFieldConfigSettings
) => {
  return value;
};

export const booleanOverrideProcessor = (
  value: boolean,
  _context: FieldOverrideContext,
  _settings?: ThresholdsFieldConfigSettings
) => {
  return value; // !!!! likely not !!!!
};

export interface ColorFieldConfigSettings {
  allowUndefined?: boolean;
  textWhenUndefined?: string; // Pick Color
  disableNamedColors?: boolean;
}
