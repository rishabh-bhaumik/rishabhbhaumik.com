/** Save the canvas as a PNG. Call it in the same task as a render: the drawing buffer is not preserved. */
export function savePng(canvas: HTMLCanvasElement, name: string) {
  canvas.toBlob((blob) => blob && download(blob, `${name}.png`), "image/png");
}

/** Lengths the recorder offers, in seconds. */
export const RECORD_LENGTHS = [3, 10, 15, 30, 60, 90] as const;

/**
 * Record up to `seconds` of the canvas as WebM and save it; `signal` stops it
 * early (what was recorded is still saved). Resolves when the file is saved.
 * Long takes get a lower bitrate so a minute and a half stays a sane size.
 */
export function recordWebm(canvas: HTMLCanvasElement, name: string, seconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === "undefined") return reject(new Error("Recording is not supported in this browser."));
    const stream = canvas.captureStream(60);
    const type = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
    const bitrate = seconds > 30 ? 6_000_000 : 12_000_000;
    const recorder = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: bitrate } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      clearTimeout(timer);
      download(new Blob(chunks, { type: "video/webm" }), `${name}.webm`);
      stream.getTracks().forEach((t) => t.stop());
      resolve();
    };
    recorder.onerror = () => reject(new Error("Recording failed."));
    recorder.start(1000);
    const stop = () => recorder.state !== "inactive" && recorder.stop();
    const timer = setTimeout(stop, seconds * 1000);
    signal?.addEventListener("abort", stop, { once: true });
  });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
