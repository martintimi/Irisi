/**
 * Client-Side Video Trimmer Utility
 * Allows vendors to trim videos longer than 10 seconds directly in their browser
 * without needing external video editing tools.
 */

export interface TrimOptions {
  targetSeconds?: number;
  maxDimension?: number;
  videoBitrate?: number;
  onProgress?: (progressPercent: number) => void;
}

export async function trimVideoInBrowser(
  file: File,
  options: TrimOptions = {}
): Promise<File> {
  if (typeof window === 'undefined') {
    throw new Error('Video trimming is only supported in browser environments');
  }

  const targetSeconds = options.targetSeconds || 10;
  const maxDimension = options.maxDimension || 1280;
  const videoBitrate = options.videoBitrate || 2500000; // 2.5 Mbps
  const onProgress = options.onProgress;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    // Temporarily attach to DOM to prevent browser autoplay/decoding restrictions
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.opacity = '0';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    let cleanupDone = false;
    const cleanup = () => {
      if (cleanupDone) return;
      cleanupDone = true;
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      } catch {}
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}
    };

    video.onloadedmetadata = async () => {
      try {
        const originalWidth = video.videoWidth || 720;
        const originalHeight = video.videoHeight || 1280;

        // Scale down if dimensions exceed maxDimension to speed up encoding and reduce file size
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;
        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
            targetHeight = maxDimension;
          }
        }
        // Ensure even dimensions for video codecs
        targetWidth = targetWidth - (targetWidth % 2);
        targetHeight = targetHeight - (targetHeight % 2);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) {
          cleanup();
          return reject(new Error('Canvas 2D context not available'));
        }

        // Check for captureStream support (Safari fallback)
        const captureFn = (canvas as any).captureStream || (canvas as any).mozCaptureStream || (canvas as any).webkitCaptureStream;
        if (typeof captureFn !== 'function') {
          cleanup();
          return reject(new Error('Canvas captureStream is not supported in this browser'));
        }

        // Determine supported mime type
        let mimeType = 'video/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
            mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          } else if (MediaRecorder.isTypeSupported('video/webm')) {
            mimeType = 'video/webm';
          }
        } else {
          cleanup();
          return reject(new Error('MediaRecorder is not supported in this browser'));
        }

        // Capture video track from canvas (product showcase clips are silent luxury loops)
        const canvasStream = captureFn.call(canvas, 30);

        const recorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: videoBitrate
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          cleanup();
          const baseMime = mimeType.split(';')[0];
          const isMp4 = baseMime.includes('mp4');
          const ext = isMp4 ? '.mp4' : '.webm';
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const trimmedBlob = new Blob(chunks, { type: baseMime });

          if (trimmedBlob.size < 500) {
            return reject(new Error('Trimmed video blob is empty'));
          }

          const trimmedFile = new File([trimmedBlob], `${baseName}-trimmed${ext}`, {
            type: baseMime,
            lastModified: Date.now()
          });
          if (onProgress) onProgress(100);
          resolve(trimmedFile);
        };

        // Prepare video playback from start
        video.currentTime = 0;
        await new Promise((res) => {
          video.onseeked = () => res(true);
          setTimeout(res, 250);
        });

        recorder.start(100);

        try {
          await video.play();
        } catch {
          // If autoplay promise rejects, still continue frame loop
        }

        let animationFrameId: number;
        let isStopped = false;
        const startTime = Date.now();
        const maxRecordMs = (targetSeconds + 0.3) * 1000;

        const stopRecording = () => {
          if (isStopped) return;
          isStopped = true;
          cancelAnimationFrame(animationFrameId);
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          video.pause();
        };

        const drawLoop = () => {
          if (isStopped) return;

          const elapsedMs = Date.now() - startTime;

          // Stop when targetSeconds reached or video finished
          if (video.currentTime >= targetSeconds || video.ended || elapsedMs >= maxRecordMs) {
            stopRecording();
            return;
          }

          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

          if (onProgress) {
            const currentProgressTime = Math.max(video.currentTime, elapsedMs / 1000);
            const percent = Math.min(99, Math.round((currentProgressTime / targetSeconds) * 100));
            onProgress(percent);
          }

          animationFrameId = requestAnimationFrame(drawLoop);
        };

        animationFrameId = requestAnimationFrame(drawLoop);

        // Fail-safe timeout if video stalls
        setTimeout(() => {
          if (!isStopped) {
            stopRecording();
          }
        }, (targetSeconds + 2.5) * 1000);

      } catch (err: any) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video file for trimming.'));
    };
  });
}
