export const PASSWORD_MIN_LENGTH = 10;

export const passwordRequirements = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: "One uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "One lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    label: "One number",
    test: (password: string) => /\d/.test(password),
  },
  {
    label: "One special character",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

export function isStrongPassword(password: string) {
  return passwordRequirements.every((requirement) => requirement.test(password));
}
