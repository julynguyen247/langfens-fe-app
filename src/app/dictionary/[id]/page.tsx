"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getDictionaryDetails } from "@/utils/api";

type Pronunciation = {
  region: string | null;
  ipa: string | null;
  mp3Url: string | null;
};

type WordForm = {
  form: string;
  tags: string[];
};

type Sense = {
  id: string;
  definitionEn: string;
  labels: string[];
  vietnamese: string[];
  examples: string[];
};

type DictionaryDetails = {
  id: number;
  word: string;
  pos: string;
  wordNorm: string;
  importedAt: string;
  pronunciations: Pronunciation[];
  forms: WordForm[];
  senses: Sense[];
  vietnamese: string[];
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

export default function DictionaryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [data, setData] = useState<DictionaryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErr("");

        if (!Number.isFinite(id)) throw new Error("ID không hợp lệ");

        const res = (await getDictionaryDetails(id)) as DictionaryDetails;
        if (alive) setData(res);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Không thể tải dữ liệu.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [id]);

  const ipaList = useMemo(() => {
    return (data?.pronunciations || [])
      .map((p) => p.ipa)
      .filter((x): x is string => !!x);
  }, [data]);

  const audioList = useMemo(() => {
    return (data?.pronunciations || [])
      .map((p) => p.mp3Url)
      .filter((x): x is string => !!x);
  }, [data]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-24 w-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {err}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{data.word}</h1>
              <Badge>{data.pos}</Badge>
              <Badge>#{data.id}</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {audioList.length > 0 ? (
              audioList.map((src, idx) => (
                <audio
                  key={`audio-${idx}-${src}`}
                  controls
                  preload="none"
                  src={src}
                />
              ))
            ) : (
              <div className="text-sm text-gray-500">Không có audio.</div>
            )}
          </div>
        </div>

        {(ipaList.length > 0 || (data.pronunciations?.length ?? 0) > 0) && (
          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-900">
              Pronunciations
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ipaList.length > 0 ? (
                ipaList.map((ipa, i) => (
                  <span
                    key={`ipa-${i}-${ipa}`}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1 font-mono text-sm text-gray-800"
                  >
                    {ipa}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">Không có IPA.</span>
              )}
            </div>
          </div>
        )}

        {data.forms?.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-900">Forms</div>
            <div className="mt-2 grid gap-2">
              {data.forms.map((f, fi) => (
                <div
                  key={`form-${fi}-${f.form}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div className="font-medium text-gray-900">{f.form}</div>
                  <div className="flex flex-wrap gap-2">
                    {f.tags?.map((t, ti) => (
                      <Badge key={`form-${fi}-tag-${ti}-${t}`}>{t}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-900">Senses</div>

          <div className="mt-3 grid gap-4">
            {data.senses?.map((s, idx) => (
              <div
                key={`sense-${s.id}`}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-gray-900">
                    Sense {idx + 1}
                  </div>
                  {s.labels?.map((l, li) => (
                    <Badge key={`sense-${s.id}-label-${li}-${l}`}>{l}</Badge>
                  ))}
                </div>

                <div className="mt-2 text-base text-gray-900">
                  {s.definitionEn}
                </div>

                {s.vietnamese?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-gray-900">
                      Vietnamese
                    </div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                      {s.vietnamese.map((v, i) => (
                        <li key={`sense-${s.id}-vi-${i}-${v}`}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.examples?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-gray-900">
                      Examples
                    </div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                      {s.examples.map((ex, i) => (
                        <li key={`sense-${s.id}-ex-${i}`} className="leading-6">
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {(!data.senses || data.senses.length === 0) && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Không có sense nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
