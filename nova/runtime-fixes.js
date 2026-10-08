(function () {
  "use strict";

  const STORAGE_KEY = "nova_current_conversation_id";

  function normalizeStoredRole(role) {
    const value = String(role || "").trim().toLowerCase();

    if (value === "assistant") {
      return "ai";
    }

    if (value === "user" || value === "ai" || value === "system") {
      return value;
    }

    return "user";
  }

  function normalizeOpenRouterRole(role) {
    const value = String(role || "").trim().toLowerCase();

    if (value === "assistant" || value === "ai") {
      return "assistant";
    }

    if (value === "user" || value === "system") {
      return value;
    }

    return "user";
  }

  function readPersistedConversationId() {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch (_) {
      return null;
    }
  }

  function writePersistedConversationId(id) {
    try {
      if (!id) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      localStorage.setItem(STORAGE_KEY, String(id));
    } catch (_) {
      // Ignore storage failures; keep the app working without persistence.
    }
  }

  function preserveConversationState() {
    if (window.currentConversationId) {
      writePersistedConversationId(window.currentConversationId);
    } else {
      writePersistedConversationId(null);
    }
  }

  function safeCloneMessages(messages) {
    if (!Array.isArray(messages)) {
      return [];
    }

    return messages
      .filter(message => message && typeof message === "object")
      .map(message => ({
        ...message,
        role: normalizeStoredRole(message.role),
        content: typeof message.content === "string" ? message.content : ""
      }))
      .filter(message => message.content.trim());
  }

  const originalLoadUserData = window.loadUserData;
  if (typeof originalLoadUserData === "function") {
    window.loadUserData = async function () {
      const result = await originalLoadUserData.call(window);
      const restoredId = readPersistedConversationId();

      if (restoredId && !window.currentConversationId) {
        try {
          await window.loadConversation(restoredId);
        } catch (error) {
          console.error("Persisted conversation restore failed:", error);
          writePersistedConversationId(null);
        }
      }

      return result;
    };
  }

  const originalLoadConversation = window.loadConversation;
  if (typeof originalLoadConversation === "function") {
    window.loadConversation = async function (conversationId) {
      const result = await originalLoadConversation.call(window, conversationId);
      preserveConversationState();
      return result;
    };
  }

  const originalCreateConversation = window.createConversation;
  if (typeof originalCreateConversation === "function") {
    window.createConversation = async function (firstMessage) {
      const result = await originalCreateConversation.call(window, firstMessage);
      if (result && result.id) {
        writePersistedConversationId(result.id);
      }
      return result;
    };
  }

  const originalSaveMessageToSupabase = window.saveMessageToSupabase;
  if (typeof originalSaveMessageToSupabase === "function") {
    window.saveMessageToSupabase = async function (conversationId, role, content) {
      const safeRole = normalizeStoredRole(role);
      return originalSaveMessageToSupabase.call(window, conversationId, safeRole, content);
    };
  }

  const originalGenerateAIResponse = window.generateAIResponse;
  if (typeof originalGenerateAIResponse === "function") {
    window.generateAIResponse = async function (messagesOverride = null) {
      const sourceMessages = messagesOverride || window.currentConversationMessages || [];
      const normalizedMessages = safeCloneMessages(sourceMessages).map(message => ({
        ...message,
        role: normalizeOpenRouterRole(message.role)
      }));

      return originalGenerateAIResponse.call(window, normalizedMessages);
    };
  }

  const originalNewChat = window.newChat;
  if (typeof originalNewChat === "function") {
    window.newChat = async function () {
      const result = await originalNewChat.call(window);
      writePersistedConversationId(null);
      return result;
    };
  }

  if (typeof window.enterApp === "function") {
    const originalEnterApp = window.enterApp;

    window.enterApp = async function (user) {
      const result = await originalEnterApp.call(window, user);
      const savedConversation = readPersistedConversationId();

      if (savedConversation && window.currentUser) {
        try {
          await window.loadConversation(savedConversation);
        } catch (error) {
          console.error("Saved conversation restore failed on app enter:", error);
          writePersistedConversationId(null);
        }
      }

      return result;
    };
  }

  window.NOVA_RUNTIME = {
    normalizeStoredRole,
    normalizeOpenRouterRole,
    readPersistedConversationId,
    writePersistedConversationId,
    preserveConversationState
  };
})();
