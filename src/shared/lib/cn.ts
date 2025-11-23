type ClassValue =
  | string
  | number
  | ClassValue[]
  | Record<string, boolean | null | undefined>
  | null
  | undefined
  | boolean;

const toClassList = (value: ClassValue): string[] => {
  if (!value) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(toClassList);
  if (typeof value === 'object') {
    return Object.keys(value).filter((key) => Boolean((value as Record<string, boolean>)[key]));
  }
  return [];
};

export const cn = (...values: ClassValue[]) => toClassList(values).join(' ');
