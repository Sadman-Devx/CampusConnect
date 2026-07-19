const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[\w.@+-]+$/;

export function validateUsername(value) {
  if (!value.trim()) return "Username is required.";
  if (value.trim().length < 3) return "Username must be at least 3 characters.";
  if (!USERNAME_REGEX.test(value.trim())) {
    return "Username can only contain letters, digits and @/./+/-/_.";
  }
  return "";
}

export function validateEmail(value) {
  if (!value.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address.";
  return "";
}

export function validatePassword(value) {
  if (!value) return "Password is required.";
  if (value.length < 6) return "Password must be at least 6 characters.";
  return "";
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
}

export function validateStudentId(value) {
  if (value && !/^[a-zA-Z0-9-]{3,20}$/.test(value.trim())) {
    return "Student ID looks invalid.";
  }
  return "";
}