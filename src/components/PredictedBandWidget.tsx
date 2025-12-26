"use client";

import { useEffect, useState } from "react";
import { FiTrendingUp, FiAlertCircle, FiChevronDown, FiChevronUp, FiTarget, FiZap } from "react-icons/fi";
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
        return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "bg-red-500";
    if (priority === 2) return "bg-orange-500";
    return "bg-yellow-500";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <FiTrendingUp className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-700">
            Predicted Band Score
          </h3>
        </div>
        <div className="flex items-start gap-2 mt-4 p-4 bg-blue-50 rounded-lg">
          <FiAlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium">
              {error || "Need more data"}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Complete at least 1 placement test to see your predicted band score.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 overflow-hidden">
      {/* Main Band Display */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Predicted Band Score
              </h3>
              <p className="text-xs text-blue-700">
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
        <div className="bg-white rounded-lg p-6 mb-4 text-center">
          <p className="text-sm text-slate-600 mb-2">Overall Predicted Band</p>
          <p className="text-5xl font-bold text-blue-600">
            {data.overallBand.toFixed(1)}
          </p>
        </div>

        {/* Per-skill breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {data.readingBand !== null && (
            <div className="bg-white/80 rounded-lg p-3">
              <p className="text-xs text-slate-600 mb-1">Reading</p>
              <p className="text-2xl font-bold text-blue-700">
                {data.readingBand.toFixed(1)}
              </p>
            </div>
          )}
          {data.listeningBand !== null && (
            <div className="bg-white/80 rounded-lg p-3">
              <p className="text-xs text-slate-600 mb-1">Listening</p>
              <p className="text-2xl font-bold text-blue-700">
                {data.listeningBand.toFixed(1)}
              </p>
            </div>
          )}
          {data.writingBand !== null && (
            <div className="bg-white/80 rounded-lg p-3">
              <p className="text-xs text-slate-600 mb-1">Writing</p>
              <p className="text-2xl font-bold text-blue-700">
                {data.writingBand.toFixed(1)}
              </p>
            </div>
          )}
          {data.speakingBand !== null && (
            <div className="bg-white/80 rounded-lg p-3">
              <p className="text-xs text-slate-600 mb-1">Speaking</p>
              <p className="text-2xl font-bold text-blue-700">
                {data.speakingBand.toFixed(1)}
              </p>
            </div>
          )}
        </div>

        {data.latestAttemptDate && (
          <p className="text-xs text-blue-700 mt-4 text-center">
            Last updated: {new Date(data.latestAttemptDate).toLocaleDateString("vi-VN")}
          </p>
        )}
      </div>

      {/* AI Insights Toggle Button */}
      <button
        onClick={handleToggleInsights}
        className="w-full px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 transition-colors flex items-center justify-center gap-2 text-blue-700 font-medium text-sm border-t border-blue-200"
      >
        <FiZap className="h-4 w-4" />
        AI Insights & Recommendations
        {showInsights ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
      </button>

      {/* AI Insights Section */}
      {showInsights && (
        <div className="px-6 pb-6 bg-white border-t border-blue-200">
          {insightsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-slate-600">Đang phân tích...</span>
            </div>
          ) : insights ? (
            <div className="pt-4 space-y-4">
              {/* Summary */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <p className="text-sm text-slate-800 leading-relaxed">
                  {insights.summary}
                </p>
                {insights.trendAnalysis && (
                  <p className="text-sm text-slate-600 mt-2 italic">
                    {insights.trendAnalysis}
                  </p>
                )}
              </div>

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <FiTarget className="h-4 w-4 text-blue-600" />
                    Gợi ý học tập
                  </h4>
                  <ul className="space-y-2">
                    {insights.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg"
                      >
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
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
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Kỹ năng cần tập trung
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.focusAreas.map((area, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs"
                        title={area.reason}
                      >
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(area.priority)}`} />
                        <span className="font-medium text-slate-700">{area.skill}</span>
                        <span className="text-slate-500">• {area.area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 text-center pt-2">
                Generated at {new Date(insights.generatedAt).toLocaleString("vi-VN")}
              </p>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-slate-500">
              Không thể tạo AI insights. Vui lòng thử lại sau.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
