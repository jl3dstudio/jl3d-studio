// Utilitário para combinar classes CSS condicionalmente
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
