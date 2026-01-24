declare module 'heic2any' {
  interface Options {
    blob: Blob;
    toType?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    quality?: number;
    multiple?: boolean;
  }
  export default function heic2any(options: Options): Promise<Blob | Blob[]>;
}
