import mammoth from 'mammoth';

// Utility to extract raw text from any document URL (Base64 Data URL, Google Docs link, Word .docx URL, etc.)
export async function extractTextFromDocUrl(url: string, fallbackContent: string = ''): Promise<string> {
  if (!url || !url.trim()) {
    return fallbackContent || '';
  }

  const targetUrl = url.trim();

  // 1. Handle Base64 Data URLs (e.g. uploaded .docx, .doc, .txt files)
  if (targetUrl.startsWith('data:')) {
    try {
      const parts = targetUrl.split(',');
      if (parts.length >= 2) {
        const header = parts[0].toLowerCase();
        const base64Data = parts[1];

        // Decode base64 to Uint8Array
        const binaryStr = atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        if (header.includes('word') || header.includes('document') || header.includes('octet-stream') || header.includes('zip')) {
          try {
            const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
            if (result.value && result.value.trim()) {
              return result.value.trim();
            }
          } catch (mammothErr) {
            console.warn('Mammoth extraction failed on base64 data:', mammothErr);
          }
        }

        // Try plain text decoding for txt / fallback
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const decodedText = decoder.decode(bytes);
        const cleaned = decodedText
          .replace(/<[^>]+>/g, ' ')
          .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleaned && cleaned.length > 10) {
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Error processing base64 doc URL:', e);
    }
  }

  // 2. Handle HTTP/HTTPS URLs (Google Docs, Word web links, external server docs)
  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    try {
      const res = await fetch('/api/parse-doc-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.text && data.text.trim()) {
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn('Error fetching web doc text:', e);
    }
  }

  return fallbackContent || '';
}
