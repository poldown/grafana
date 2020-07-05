export interface Threshold {
  value: number;
  color: string;
  /**
   *  Warning, Error, LowLow, Low, OK, High, HighHigh etc
   */
  state?: string;
}

/**
 *  Display mode
 */
export enum ThresholdsMode {
  Absolute = 'absolute',
  /**
   *  between 0 and 1 (based on min/max)
   */
  Percentage = 'percentage',
  /**
   *  based on a field read from the data
   */
  FieldBased = 'field_based',
}

/**
 *  Config that is passed to the ThresholdsEditor
 */
export interface ThresholdsConfig {
  mode: ThresholdsMode;

  /**
   *  Must be sorted by 'value', first value is always -Infinity
   */
  steps: Threshold[];

  /**
   *  Field Name (when enabling field_based mode)
   */
  fieldName?: string;
}
