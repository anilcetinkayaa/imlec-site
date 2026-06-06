"use client";

import { useEffect, useRef, useState } from "react";

type PreviewState = {
  body: string;
  imageUrl: string;
  productSlug: string;
  title: string;
};

type AnnouncementPreviewProps = {
  defaultBody?: string;
  defaultImageUrl?: string | null;
  defaultProductSlug?: string | null;
  defaultTitle?: string;
};

const targetLabels: Record<string, string> = {
  launcher: "Launcher / Genel",
  fis260: "FIS260",
  cozver: "Çözver",
};

function readFormValue(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);

  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement ||
    field instanceof HTMLSelectElement
  ) {
    return field.value;
  }

  return "";
}

export function AnnouncementPreview({
  defaultBody = "",
  defaultImageUrl = "",
  defaultProductSlug = "launcher",
  defaultTitle = "",
}: AnnouncementPreviewProps) {
  const [preview, setPreview] = useState<PreviewState>({
    body: defaultBody,
    imageUrl: defaultImageUrl ?? "",
    productSlug: defaultProductSlug || "launcher",
    title: defaultTitle,
  });
  const [imageFailed, setImageFailed] = useState(false);
  const previewRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const focusedNode = document.activeElement;
    const previewNode = previewRef.current;
    const form = previewNode?.closest("form");

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const update = () => {
      setImageFailed(false);
      setPreview({
        body: readFormValue(form, "body"),
        imageUrl: readFormValue(form, "imageUrl"),
        productSlug: readFormValue(form, "productSlug") || "launcher",
        title: readFormValue(form, "title"),
      });
    };

    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    if (focusedNode instanceof HTMLElement) {
      focusedNode.focus();
    }

    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, []);

  const title = preview.title.trim() || "Duyuru başlığı";
  const body =
    preview.body.trim() ||
    "Yayın içeriği burada görünecek. Kısa, net ve tek konuya odaklanan metinler launcher içinde daha iyi okunur.";
  const target = targetLabels[preview.productSlug] ?? preview.productSlug;
  const hasImage = preview.imageUrl.trim() && !imageFailed;

  return (
    <aside
      data-announcement-preview
      ref={previewRef}
      className="rounded-xl border border-blue-300/15 bg-[#0c111b] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300/80">
            Canlı önizleme
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">
            Launcher kart görünümü
          </h3>
        </div>
        <span className="shrink-0 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs text-blue-100">
          {target}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#10141d]">
        <div className="relative aspect-video bg-[#07090d]">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              src={preview.imageUrl}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
              Görsel yok veya yüklenemedi. Önerilen oran: 16:9, en az
              1200x675 piksel.
            </div>
          )}
        </div>
        <div className="p-5">
          <h4 className="line-clamp-2 text-xl font-semibold tracking-tight text-white">
            {title}
          </h4>
          <p className="mt-3 max-h-40 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {body}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.07] bg-black/20 p-3 text-xs leading-5 text-zinc-400">
        Görsel kart içinde kırpılarak oturur; önemli logo/metinleri görselin
        ortasına yakın tutun. Uzun duyurularda ilk 2-3 cümle launcher içinde
        en görünür alandır.
      </div>
    </aside>
  );
}
