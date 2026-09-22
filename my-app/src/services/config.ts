export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  "https://cafeteria-api-3hqs.onrender.com";

export function imageUrl(value: string): string | undefined {
  if (!value) return undefined;

  // Si ya es una URL completa, la dejamos igual
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Ejemplo: /uploads/producto.jpg
  if (value.startsWith("/") && !value.startsWith("//")) {
    return `${API_URL}${value}`;
  }

  // Ejemplo: assets/producto.jpg
  if (value.startsWith("assets/")) {
    return `${API_URL}/${value}`;
  }

  return undefined;
}