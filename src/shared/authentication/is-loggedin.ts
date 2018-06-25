export function isLoggedin() {
  return !!localStorage.getItem('storage');
}
