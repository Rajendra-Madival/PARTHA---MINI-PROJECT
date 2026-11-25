import {
  Camera,
  Check,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { Avatar } from './Avatar';
import AvatarPicker from './kokonutui/avatar-picker';

interface ProfileAvatarEditorProps {
  displayName: string;
  avatarUrl?: string;
  roleLabel: string;
  onSaveAvatar: (nextAvatarUrl: string) => Promise<void>;
}

type EditorMode = 'picker' | 'upload';

function parseKokonutSeed(
  avatarUrl: string | undefined,
  fallbackName: string,
): { displayName: string; variant: number } {
  const fallbackDisplay = fallbackName.trim() || 'PARTHA Member';
  if (!avatarUrl || !avatarUrl.startsWith('kokonut:')) {
    return { displayName: fallbackDisplay, variant: 0 };
  }
  const seed = avatarUrl.slice('kokonut:'.length).trim();
  const splitIdx = seed.lastIndexOf(':');
  if (splitIdx === -1) {
    return { displayName: seed || fallbackDisplay, variant: 0 };
  }
  const parsedName = seed.slice(0, splitIdx).trim();
  const parsedVariant = Number.parseInt(seed.slice(splitIdx + 1), 10);
  return {
    displayName: parsedName || fallbackDisplay,
    variant: Number.isFinite(parsedVariant) ? parsedVariant : 0,
  };
}

async function processUploadedPhoto(file: File): Promise<string> {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a PNG, JPG, or WEBP photo.');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Photo must be smaller than 8 MB before cropping.');
  }

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Your browser could not initialize the image cropper.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Unable to read the selected image file.'));
      el.src = objectUrl;
    });

    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    if (!srcW || !srcH) {
      throw new Error('Invalid image dimensions.');
    }

    const side = Math.min(srcW, srcH);
    const sx = Math.floor((srcW - side) / 2);
    const sy = Math.floor((srcH - side) / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    let dataUrl = canvas.toDataURL('image/webp', 0.85);
    if (!dataUrl.startsWith('data:image/webp') || dataUrl.length > 320_000) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.84);
    }
    if (dataUrl.length > 350_000) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.68);
    }
    if (dataUrl.length > 350_000) {
      throw new Error('Processed photo is still too large. Please try a simpler image.');
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ProfileAvatarEditor({
  displayName,
  avatarUrl,
  roleLabel,
  onSaveAvatar,
}: ProfileAvatarEditorProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialMode: EditorMode =
    avatarUrl && !avatarUrl.startsWith('kokonut:') ? 'upload' : 'picker';
  const [mode, setMode] = useState<EditorMode>(initialMode);
  const [saving, setSaving] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const pickerInitial = useMemo(
    () => parseKokonutSeed(avatarUrl, displayName),
    [avatarUrl, displayName],
  );

  const activePreviewUrl =
    mode === 'upload' && pendingUploadUrl ? pendingUploadUrl : avatarUrl;

  const avatarKindLabel = !avatarUrl
    ? 'Using initials badge'
    : avatarUrl.startsWith('kokonut:')
      ? 'Kokonut generated avatar'
      : 'Uploaded profile photo';

  async function commitAvatar(nextValue: string, message: string) {
    setError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      await onSaveAvatar(nextValue);
      setPendingUploadUrl(null);
      setSavedMessage(message);
      setTimeout(() => {
        setSavedMessage((curr) => (curr === message ? null : curr));
      }, 2800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save profile avatar.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSavedMessage(null);
    setProcessingFile(true);
    try {
      const croppedDataUrl = await processUploadedPhoto(file);
      setPendingUploadUrl(croppedDataUrl);
      setMode('upload');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to process selected image.',
      );
    } finally {
      setProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    void handleFileSelected(e.target.files?.[0]);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void handleFileSelected(e.dataTransfer.files?.[0]);
  }

  return (
    <section className="rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEE9DC] pb-4">
        <div className="flex items-center gap-3.5">
          <Avatar
            name={displayName || 'PARTHA Member'}
            src={activePreviewUrl}
            size="lg"
          />
          <div>
            <h2 className="font-display text-base font-semibold text-[#18221D]">
              {roleLabel} Profile Picture
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {pendingUploadUrl
                ? 'Cropped square preview ready — click Save Photo to update your profile.'
                : `${avatarKindLabel}. Spin a custom Kokonut face or upload your own photo.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Avatar source"
            className="inline-flex rounded-lg border border-[#E5DFD0] bg-[#FAF7F0] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'picker'}
              onClick={() => {
                setMode('picker');
                setError(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                mode === 'picker'
                  ? 'bg-emerald-800 text-white'
                  : 'text-stone-700 hover:text-[#18221D]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Avatar Picker
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'upload'}
              onClick={() => {
                setMode('upload');
                setError(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                mode === 'upload'
                  ? 'bg-emerald-800 text-white'
                  : 'text-stone-700 hover:text-[#18221D]'
              }`}
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              Upload Photo
            </button>
          </div>

          {avatarUrl && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void commitAvatar('', 'Avatar reset to initials.')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-[#FAF7F0] hover:text-red-700 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {savedMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900"
        >
          <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
          {savedMessage}
        </div>
      )}

      {mode === 'picker' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr] items-start">
          <AvatarPicker
            key={`${pickerInitial.displayName}:${pickerInitial.variant}`}
            defaultValue={pickerInitial}
            title="Spin & Pick Avatar"
            description="Generated from your name. Drag the coin, tap a slot, or shuffle."
            submitLabel={saving ? 'Saving Avatar...' : 'Use This Avatar'}
            className="mx-0 max-w-full border-[#E5DFD0] bg-[#FAF7F0]/70 text-[#18221D] shadow-none"
            onComplete={({ seed }) => {
              void commitAvatar(
                `kokonut:${seed}`,
                'Kokonut avatar saved to your profile.',
              );
            }}
          />

          <div className="rounded-xl border border-[#E5DFD0] bg-[#FAF7F0]/50 p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-[#18221D]">
              How it works
            </h3>
            <ul className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <li>
                • <strong>Drag or tap the 3D coin</strong> to spin through unique illustrated portraits seeded from your name.
              </li>
              <li>
                • <strong>Compare 5 quick slots</strong> or hit the shuffle dice to discover different expressions, glasses, and hairstyles.
              </li>
              <li>
                • Prefer a real headshot? Switch to <strong>Upload Photo</strong> above anytime to crop and save a PNG, JPG, or WEBP image.
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_240px] items-stretch">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
              dragOver
                ? 'border-emerald-700 bg-emerald-50/70'
                : 'border-[#D9D1BE] bg-[#FAF7F0]/60'
            }`}
          >
            <div className="rounded-full border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#18221D]">
              {processingFile
                ? 'Cropping & optimizing photo...'
                : 'Drop your photo here, or browse'}
            </p>
            <p className="mt-1 text-xs text-stone-500 max-w-sm">
              PNG, JPG, or WEBP up to 8 MB. Automatically center-cropped to a sharp 256×256 square.
            </p>

            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleInputChange}
              className="sr-only"
            />

            <label
              htmlFor={inputId}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#D9D1BE] bg-white px-4 py-2 text-xs font-semibold text-[#18221D] hover:bg-[#F3EFE4] cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
              {pendingUploadUrl ? 'Choose Another Photo' : 'Select Photo File'}
            </label>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#E5DFD0] bg-[#FAF7F0]/60 p-4 space-y-4">
            <div className="flex flex-col items-center text-center pt-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500 mb-3">
                {pendingUploadUrl ? 'Cropped Preview' : 'Current Photo'}
              </span>
              {pendingUploadUrl || (avatarUrl && !avatarUrl.startsWith('kokonut:')) ? (
                <img
                  src={pendingUploadUrl || avatarUrl}
                  alt={`${displayName} preview`}
                  className="h-24 w-24 rounded-xl border border-[#E5DFD0] object-cover bg-white"
                />
              ) : (
                <Avatar name={displayName || 'PARTHA Member'} src={avatarUrl} size="lg" />
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={!pendingUploadUrl || saving || processingFile}
                onClick={() => {
                  if (pendingUploadUrl) {
                    void commitAvatar(
                      pendingUploadUrl,
                      'Custom photo saved to your profile.',
                    );
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {saving ? 'Saving Photo...' : 'Save Photo'}
              </button>

              {pendingUploadUrl && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPendingUploadUrl(null)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E5DFD0] bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-[#FAF7F0] cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Discard Preview
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
