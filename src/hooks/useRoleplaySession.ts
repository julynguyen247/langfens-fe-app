"use client";

import { useState, useCallback } from "react";
import { ChatMessage, RoleplayScenario } from "@/types/speaking";

interface UseRoleplaySessionProps {
  scenario: RoleplayScenario;
}

interface UseRoleplaySessionReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isSessionEnded: boolean;
  sendMessage: (content: string) => Promise<void>;
  endSession: () => void;
  turnCount: number;
}

export function useRoleplaySession({
  scenario,
}: UseRoleplaySessionProps): UseRoleplaySessionReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isSessionEnded || isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setTurnCount((prev) => prev + 1);
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/speaking/roleplay/scenarios/${scenario.slug}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: content,
              history: messages,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }

        const data = await response.json();

        const agentMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "agent",
          content: data.message.content,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, agentMessage]);

        // Check if session should end
        if (data.session_ended || turnCount >= scenario.turn_count_target) {
          setIsSessionEnded(true);
        }
      } catch (err) {
        console.error("[RoleplaySession] Send message error:", err);
        // Remove the user message if the request failed
        setMessages((prev) => prev.slice(0, -1));
        setTurnCount((prev) => prev - 1);
      } finally {
        setIsLoading(false);
      }
    },
    [scenario, messages, isLoading, isSessionEnded, turnCount]
  );

  const endSession = useCallback(() => {
    setIsSessionEnded(true);
  }, []);

  return {
    messages,
    isLoading,
    isSessionEnded,
    sendMessage,
    endSession,
    turnCount,
  };
}
