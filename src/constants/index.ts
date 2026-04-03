  export const guards = [
    { label: 'User', value: 'User' },
  ]

  export const BOOLEAN_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'others', label: 'Others' },
];
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';