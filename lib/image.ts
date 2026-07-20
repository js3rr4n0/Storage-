/**
 * Redimensiona una imagen (File) a un dataURL JPEG comprimido.
 * Sirve tanto para la miniatura guardada en el inventario como para
 * enviar a la IA sin gastar demasiados datos.
 */
export function fileToResizedDataURL(
  file: File,
  maxSize = 640,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen invalida"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas no disponible"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Extrae el media type y los datos base64 de un dataURL. */
export function splitDataURL(dataURL: string): { mediaType: string; data: string } {
  const match = dataURL.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return { mediaType: "image/jpeg", data: "" };
  return { mediaType: match[1], data: match[2] };
}
