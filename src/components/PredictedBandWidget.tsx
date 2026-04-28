"use client";

import { useEffect, useState } from "react";
import { getPredictedBand, getAiInsights } from "@/utils/api";

type PredictedBand = {
  overallBand: number;
  confidence: string;
  readingBand: number | null;
  listeningBand: number | null;
  writingBand: number | null;
  speakingBand: number | null;
  sampleSize: number;
  latestAttemptDate: string | null;
};

type FocusArea = {
  skill: string;
  area: string;
  reason: string;
  priority: number;
};

type AiInsights = {
  summary: string;
  trendAnalysis: string;
  recommendations: string[];
  focusAreas: FocusArea[];
  generatedAt: string;
};

export default function PredictedBandWidget() {
  const [data, setData] = useState<PredictedBand | null>(null);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    async function fetchPrediction() {
      try {
        setLoading(true);
        const res = await getPredictedBand();
        const result = (res as any).data;

        if (result.isSuccess) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.message || "Insufficient data");
          setData(null);
        }
      } catch (e: any) {
        console.error("Failed to fetch predicted band:", e);
        setError(e.response?.data?.message || "Failed to load prediction");
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
  }, []);

  const fetchAiInsights = async () => {
    if (insights || insightsLoading) return;

    try {
      setInsightsLoading(true);
      const res = await getAiInsights();
      const result = (res as any).data;

      if (result.isSuccess && result.data) {
        setInsights(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch AI insights:", e);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleToggleInsights = () => {
    if (!showInsights && !insights) {
      fetchAiInsights();
    }
    setShowInsights(!showInsights);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "High":
        return "bg-green-100 text-green-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "bg-orange-100 text-orange-700";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "bg-red-500";
    if (priority === 2) return "bg-orange-500";
    return "bg-yellow-500";
  };

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border-[3px] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 rounded-full" style={{ borderColor: "var(--primary-light)", borderTopColor: "var(--primary)" }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[1.5rem] border-[3px] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Predicted Band Score
          </h3>
        </div>
        <div className="flex items-start gap-2 mt-4 p-4 rounded-lg" style={{ backgroundColor: "var(--primary-light)" }}>
          <span className="font-bold mt-0.5" style={{ color: "var(--primary)" }}>i</span>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--primary-dark)" }}>
              {error || "Need more data"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--primary)" }}>
              Complete at least 1 placement test to see your predicted band score.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border-[3px] overflow-hidden shadow-[0_4px_0_rgba(0,0,0,0.08)]" style={{ backgroundColor: "var(--primary-light)", borderColor: "var(--border)" }}>
      {/* Main Band Display */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: "var(--primary)" }}>
              B
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
                Predicted Band Score
              </h3>
              <p className="text-xs" style={{ color: "var(--primary)" }}>
                Based on {data.sampleSize} recent tests
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(
              data.confidence
            )}`}
          >
            {data.confidence} Confidence
          </span>
        </div>

        {/* Overall Band */}
        <div className="rounded-lg p-6 mb-4 text-center" style={{ backgroundColor: "var(--background)" }}>
          <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>Overall Predicted Band</p>
          <p className="text-5xl font-bold" style={{ color: "var(--primary)" }}>
            {data.overallBand.toFixed(1)}
          </p>
        </div>

        {/* Per-skill breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {data.readingBand !== null && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "var(--background)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Reading</p>
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {data.readingBand.toFixed(1)}
              </p>
            </div>
          )}
          {data.listeningBand !== null && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "var(--background)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Listening</p>
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {data.listeningBand.toFixed(1)}
              </p>
            </div>
          )}
          {data.writingBand !== null && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "var(--background)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Writing</p>
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {data.writingBand.toFixed(1)}
              </p>
            </div>
          )}
          {data.speakingBand !== null && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "var(--background)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Speaking</p>
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {data.speakingBand.toFixed(1)}
              </p>
            </div>
          )}
        </div>

        {data.latestAttemptDate && (
          <p className="text-xs mt-4 text-center" style={{ color: "var(--primary)" }}>
            Last updated: {new Date(data.latestAttemptDate).toLocaleDateString("vi-VN")}
          </p>
        )}
      </div>

      {/* AI Insights Toggle Button */}
      <button
        onClick={handleToggleInsights}
        className="w-full px-6 py-3 transition-colors flex items-center justify-center gap-2 font-medium text-sm border-t"
        style={{
          color: "var(--primary)",
          borderColor: "var(--border)",
          backgroundColor: "var(--background)",
        }}
      >
        AI Insights & Recommendations
        <span className="text-xs">{showInsights ? "▲" : "▼"}</span>
      </button>

      {/* AI Insights Section */}
      {showInsights && (
        <div className="px-6 pb-6 border-t" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
          {insightsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-3 rounded-full" style={{ borderColor: "var(--primary-light)", borderTopColor: "var(--primary)" }} />
              <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>Đang phân tích...</span>
            </div>
          ) : insights ? (
            <div className="pt-4 space-y-4">
              {/* Summary */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--primary-light)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {insights.summary}
                </p>
                {insights.trendAnalysis && (
                  <p className="text-sm mt-2 italic" style={{ color: "var(--text-muted)" }}>
                    {insights.trendAnalysis}
                  </p>
                )}
              </div>

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                    Gợi ý học tập
                  </h4>
                  <ul className="space-y-2">
                    {insights.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm p-3 rounded-lg"
                        style={{ color: "var(--foreground)", backgroundColor: "var(--primary-light)" }}
                      >
                        <span className="flex-shrink-0 w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: "var(--primary)" }}>
                          {i + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Focus Areas */}
              {insights.focusAreas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                    Kỹ năng cần tập trung
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.focusAreas.map((area, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                        style={{ backgroundColor: "var(--primary-light)" }}
                        title={area.reason}
                      >
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(area.priority)}`} />
                        <span className="font-medium" style={{ color: "var(--foreground)" }}>{area.skill}</span>
                        <span style={{ color: "var(--text-muted)" }}>- {area.area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-center pt-2" style={{ color: "var(--text-muted)" }}>
                Generated at {new Date(insights.generatedAt).toLocaleString("vi-VN")}
              </p>
            </div>
          ) : (
            <div className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Không thể tạo AI insights. Vui lòng thử lại sau.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
