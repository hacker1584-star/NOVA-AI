/* =========================================================
    NOVA AI — COMPLETE FRONTEND
========================================================= */

"use strict";

/* =========================================================
    GLOBAL STATE
========================================================= */

let supabaseClient = null;

let currentUser = null;

let currentConversationId = null;

let currentConversationMessages = [];

let isSending = false;

let authMode = "signin";

let sidebarOpen = false;

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

/* =========================================================
    DOM HELPERS
========================================================= */

const $ = id =>
  document.getElementById(id);


function qs(selector) {
  return document.querySelector(selector);
}


function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}


/* =========================================================
    INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initialize
);


async function initialize() {

  setupStaticEvents();

  initializeTheme();

  startLiveClock();

  await initializeSupabase();
}


/* =========================================================
    SUPABASE
========================================================= */

async function initializeSupabase() {

  try {

    const response =
      await fetch(
        "/api/config",
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        "Could not load NOVA configuration."
      );
    }


    const config =
      await response.json();


    if (
      !config.supabaseUrl ||
      !config.supabaseKey
    ) {
      throw new Error(
        "Supabase configuration is incomplete."
      );
    }


    supabaseClient =
      window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );


    const {
      data
    } =
      await supabaseClient
        .auth
        .getSession();


    if (data?.session?.user) {

      await enterApp(
        data.session.user
      );

    } else {

      showAuth();
    }


    supabaseClient
      .auth
      .onAuthStateChange(
        async (
          event,
          session
        ) => {

          if (
            event ===
            "SIGNED_IN"
          ) {

            if (
              session?.user &&
              !currentUser
            ) {

              await enterApp(
                session.user
              );
            }

          }


          if (
            event ===
            "SIGNED_OUT"
          ) {

            currentUser = null;

            currentConversationId =
              null;

            currentConversationMessages =
              [];

            try {
              localStorage.removeItem("nova_current_conversation_id");
            } catch (_) {}

            showAuth();
          }

        }
      );


  } catch (error) {

    console.error(
      "Supabase initialization error:",
      error
    );


    showAuth();

    showAuthMessage(
      "NOVA could not initialize authentication."
    );
  }
}


/* =========================================================
    AUTH UI
========================================================= */

function showAuth() {

  $("authScreen")
    ?.classList
    .remove("hidden");

  $("app")
    ?.classList
    .add("hidden");
}


function showApp() {

  $("authScreen")
    ?.classList
    .add("hidden");

  $("app")
    ?.classList
    .remove("hidden");
}


function setupAuthMode(mode) {

  authMode = mode;

  const signup =
    mode === "signup";


  $("authTitle").textContent =
    signup
      ? "Create your account"
      : "Welcome back";


  $("authDescription").textContent =
    signup
      ? "Create an account to save your NOVA workspace."
      : "Sign in to continue using NOVA.";


  $("authNameField")
    .classList
    .toggle(
      "hidden",
      !signup
    );


  $("authSubmit").textContent =
    signup
      ? "Create account"
      : "Sign in";


  $("authSwitch").textContent =
    signup
      ? "Already have an account? Sign in"
      : "Create an account";


  $("authPassword")
    .setAttribute(
      "autocomplete",
      signup
        ? "new-password"
        : "current-password"
    );


  $("authMessage").textContent =
    "";
}


function showAuthMessage(message) {

  $("authMessage").textContent =
    message || "";
}


async function handleAuthSubmit(event) {

  event.preventDefault();


  if (!supabaseClient) {

    showAuthMessage(
      "Authentication is still loading."
    );

    return;
  }


  const email =
    $("authEmail")
      .value
      .trim();

  const password =
    $("authPassword")
      .value;


  if (!email || !password) {

    showAuthMessage(
      "Enter your email and password."
    );

    return;
  }


  $("authSubmit").disabled =
    true;

  showAuthMessage("");


  try {

    if (authMode === "signup") {

      const name =
        $("authName")
          .value
          .trim();


      if (!name) {

        throw new Error(
          "Enter your name."
        );
      }


      const {
        error
      } =
        await supabaseClient
          .auth
          .signUp({

            email,

            password,

            options: {
              data: {
                full_name: name
              }
            }

          });

      if (error) {
        throw error;
      }


      showAuthMessage(
        "Account created. Check your email if confirmation is required."
      );


      setupAuthMode("signin");


    } else {

      const {
        data,
        error
      } =
        await supabaseClient
          .auth
          .signInWithPassword({

            email,

            password

          });

      if (error) {
        throw error;
      }


      if (data?.user) {

        await enterApp(
          data.user
        );
      }
    }


  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );


    showAuthMessage(
      error?.message ||
      "Authentication failed."
    );


  } finally {

    $("authSubmit").disabled =
      false;
  }
}


/* =========================================================
    ENTER APP
========================================================= */

async function enterApp(user) {

  currentUser = user;

  showApp();

  currentConversationId = null;
  currentConversationMessages = [];

  clearMessages();

  await loadUserData();

  updateNovaStatus(
    "ONLINE"
  );
}


/* =========================================================
    USER DATA
========================================================= */

async function loadUserData() {

  if (
    !currentUser ||
    !supabaseClient
  ) {
    return;
  }

  currentConversationId = null;
  currentConversationMessages = [];
  clearMessages();

  try {
    const savedConversationId = localStorage.getItem("nova_current_conversation_id");

    if (savedConversationId) {
      await loadConversation(savedConversationId);
    }
  } catch (_) {
    // Ignore restore failures; user can still browse and create new chats.
  }

  await loadMemories();
  await loadConversations();
}


/* =========================================================
    CONVERSATIONS
========================================================= */

async function loadConversations() {

  if (!currentUser) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient

      .from("conversations")

      .select(
        "id,title,created_at,updated_at"
      )

      .eq(
        "user_id",
        currentUser.id
      )

      .order(
        "updated_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Conversation load error:",
      error
    );

    return;
  }


  renderConversationList(
    data || []
  );
}


function renderConversationList(
  conversations = []
) {

  const list =
    $("conversationList");


  list.innerHTML =
    "";


  $("emptyConversations")
    .classList
    .toggle(
      "hidden",
      conversations.length > 0
    );


  conversations.forEach(
    conversation => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "conversation-item";


      if (
        conversation.id ===
        currentConversationId
      ) {

        button.classList.add(
          "active"
        );
      }


      button.textContent =
        conversation.title ||
        "New conversation";


      button.title =
        conversation.title ||
        "New conversation";


      button.addEventListener(
        "click",
        async () => {

          await loadConversation(
            conversation.id
          );

          closeMobileSidebar();
        }
      );


      list.appendChild(
        button
      );
    }
  );
}


/* =========================================================
    LOAD ONE CONVERSATION
========================================================= */

async function loadConversation(
  conversationId
) {

  if (
    !currentUser ||
    !conversationId
  ) {
    return;
  }


  updateNovaStatus(
    "LOADING"
  );


  try {

    clearMessages();

    const {
      data: conversation,
      error:
        conversationError
    } =
      await supabaseClient

        .from("conversations")

        .select(
          "id,title,user_id,created_at,updated_at"
        )

        .eq(
          "id",
          conversationId
        )

        .eq(
          "user_id",
          currentUser.id
        )

        .maybeSingle();


    if (conversationError) {
      throw conversationError;
    }


    if (!conversation) {
      throw new Error(
        "Conversation not found."
      );
    }

    currentConversationId = conversation.id;
    localStorage.setItem("nova_current_conversation_id", conversation.id);

    const {
      data: messages,
      error:
        messageError
    } =
      await supabaseClient

        .from("messages")

        .select(
          "id,conversation_id,user_id,role,content,created_at"
        )

        .eq(
          "conversation_id",
          conversationId
        )

        .eq(
          "user_id",
          currentUser.id
        )

        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (messageError) {
      throw messageError;
    }

    currentConversationMessages =
      (messages || []).map(
        message => ({
          id: message.id,
          role: normalizeStoredRole(message.role),
          content: typeof message.content === "string" ? message.content : "",
          created_at: message.created_at
        })
      ).filter(message => message.content.trim());

    currentConversationMessages.forEach(
      message => {
        addMessageToScreen(
          message.role,
          message.content,
          message.id
        );
      }
    );

    await loadConversations();
    scrollToBottom();


  } catch (error) {

    console.error(
      "Conversation load error:",
      error
    );

    currentConversationId = null;
    currentConversationMessages = [];
    localStorage.removeItem("nova_current_conversation_id");
    clearMessages();

    addMessageToScreen(
      "ai",
      "I couldn't load that conversation. Please try again."
    );


  } finally {

    updateNovaStatus(
      "ONLINE"
    );
  }
}


/* =========================================================
    CREATE CONVERSATION
========================================================= */

async function createConversation(
  firstMessage
) {

  if (!currentUser) {
    throw new Error(
      "You are not signed in."
    );
  }


  const title =
    createConversationTitle(
      firstMessage
    );


  const {
    data,
    error
  } =
    await supabaseClient

      .from("conversations")

      .insert({

        user_id:
          currentUser.id,

        title,

        updated_at:
          new Date().toISOString()

      })

      .select(
        "id,title,created_at,updated_at"
      )

      .single();


  if (error) {
    throw error;
  }


  currentConversationId = data.id;
  localStorage.setItem("nova_current_conversation_id", data.id);

  currentConversationMessages = [];

  await loadConversations();

  return data;
}


function createConversationTitle(
  text
) {

  const clean =
    text
      .replace(/\s+/g, " ")
      .trim();


  if (!clean) {
    return "New conversation";
  }


  return clean.length > 60
    ? clean.slice(0, 57) + "..."
    : clean;
}


/* =========================================================
    SAVE MESSAGE
========================================================= */

async function saveMessageToSupabase(
  conversationId,
  role,
  content
) {
  if (!currentUser || !conversationId) {
    return null;
  }

  const databaseRole =
    normalizeStoredRole(role);

  const { data, error } = await supabaseClient
    .from("messages")
    .insert({
      conversation_id: conversationId,
      user_id: currentUser.id,
      role: databaseRole,
      content
    })
    .select(
      "id,conversation_id,user_id,role,content,created_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
    UPDATE CONVERSATION
========================================================= */

async function touchConversation(
  conversationId
) {

  if (!conversationId) {
    return;
  }


  await supabaseClient

    .from("conversations")

    .update({
      updated_at:
        new Date().toISOString()
    })

    .eq(
      "id",
      conversationId
    )

    .eq(
      "user_id",
      currentUser.id
    );
}


/* =========================================================
    SEND MESSAGE
========================================================= */

async function sendMessage(
  forcedText = null
) {

  if (isSending) {
    return;
  }


  const input =
    $("messageInput");


  const text =
    (
      forcedText !== null
        ? forcedText
        : input.value
    )
      .trim();


  if (!text) {
    return;
  }


  isSending = true;


  $("sendBtn").disabled = true;


  input.value = "";


  resizeTextarea();


  try {

    if (!currentConversationId) {
      const created = await createConversation(text);
      if (!created?.id) {
        throw new Error("Conversation could not be created.");
      }
    }


    const userMessage = {
      role: "user",
      content: text
    };

    currentConversationMessages.push(userMessage);

    addMessageToScreen(
      "user",
      text
    );

    await saveMessageToSupabase(
      currentConversationId,
      "user",
      text
    );

    await detectAndSaveMemory(text);
    scrollToBottom();

    const localToolHandled =
      await handleNovaLocalTool(text);

    if (localToolHandled) {
      await touchConversation(currentConversationId);
      await loadConversations();
      return;
    }

    const aiAnswer = await generateAIResponse();

    if (!aiAnswer) {
      throw new Error("NOVA returned an empty answer.");
    }

    currentConversationMessages.push({
      role: "ai",
      content: aiAnswer
    });

    const savedAI = await saveMessageToSupabase(
      currentConversationId,
      "ai",
      aiAnswer
    );

    if (savedAI) {
      const last = currentConversationMessages[currentConversationMessages.length - 1];
      if (last) {
        last.id = savedAI.id;
      }
    }

    await touchConversation(currentConversationId);
    await loadConversations();

  } catch (error) {

    console.error(
      "Send message error:",
      error
    );

    addMessageToScreen(
      "ai",
      `I couldn't complete that request.\n\n**Error:** ${error?.message || "Unknown error."}`
    );

  } finally {

    isSending = false;
    $("sendBtn").disabled = false;
    updateNovaStatus("ONLINE");
  }
}


/* =========================================================
    AI RESPONSE
========================================================= */

async function generateAIResponse(
  messagesOverride = null
) {

  const thinking = showThinking();

  updateNovaStatus("THINKING");

  try {
    const messages = messagesOverride || currentConversationMessages;

    const messagesForAI = messages
      .filter(
        message =>
          message &&
          typeof message.content === "string"
      )
      .map(
        message => ({
          role: normalizeOpenRouterRole(message.role),
          content: message.content
        })
      )
      .slice(-40);

    const researchMode = shouldNOVAResearch(messagesForAI);

    const response = await fetch(
      "/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: messagesForAI,
          researchMode
        })
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      throw new Error(
        data?.error || `AI service returned HTTP ${response.status}.`
      );
    }

    const answer =
      data?.answer ||
      data?.reply ||
      data?.message ||
      data?.content;

    if (
      typeof answer !== "string" ||
      !answer.trim()
    ) {
      throw new Error(
        "NOVA returned no usable answer."
      );
    }

    removeThinking(thinking);
    addMessageToScreen("ai", answer);

    return answer.trim();

  } catch (error) {
    removeThinking(thinking);
    updateNovaStatus("ONLINE");
    throw error;
  }
}


/* =========================================================
    CURRENT INFORMATION DETECTION
========================================================= */

function shouldNOVAResearch(
  messages
) {

  const lastUser =
    [...messages]
      .reverse()
      .find(
        message =>
          message.role === "user"
      );


  if (!lastUser) {
    return false;
  }


  const text = lastUser.content.toLowerCase();

  const currentSignals = [
    /\blatest\b/,
    /\bcurrent\b/,
    /\btoday\b/,
    /\btonight\b/,
    /\bright now\b/,
    /\bnow\b/,
    /\brecent\b/,
    /\bthis week\b/,
    /\bthis month\b/,
    /\bthis year\b/,
    /\bnews\b/,
    /\bresearch\b/,
    /\blook up\b/,
    /\bsearch the web\b/,
    /\bwhat happened\b/,
    /\bwhat's happening\b/,
    /\bwhats happening\b/,
    /\bupdate me\b/,
    /\bcurrent price\b/,
    /\bprice today\b/,
    /\bmarket price\b/,
    /\bavailable now\b/,
    /\bavailability\b/,
    /\bofficial\b/,
    /\baccording to\b/,
    /\bsources?\b/,
    /\b2026\b/
  ];

  if (
    currentSignals.some(
      pattern =>
        pattern.test(text)
    )
  ) {
    return true;
  }

  const volatileTopics = [
    /\bbitcoin\b/,
    /\bcrypto\b/,
    /\bstock\b/,
    /\bstocks\b/,
    /\bshare price\b/,
    /\bexchange rate\b/,
    /\bcurrency rate\b/,
    /\bweather\b/,
    /\bsports?\b/,
    /\bfootball\b/,
    /\bsoccer\b/,
    /\bbasketball\b/,
    /\biphone\b.*\bprice\b/,
    /\bandroid\b.*\bupdate\b/,
    /\bopenrouter\b/,
    /\bsupabase\b/,
    /\bopenai\b/,
    /\bchatgpt\b/,
    /\bgithub\b/,
    /\bvercel\b/
  ];

  if (
    volatileTopics.some(
      pattern =>
        pattern.test(text)
    )
  ) {
    return /\?|how|what|which|when|where|latest|current|price|update|status|available|released|changed|news|research|look up|compare/i
      .test(text);
  }

  return false;
}


/* =========================================================
    LOCAL TOOL HANDLER
========================================================= */

async function handleNovaLocalTool(
  userText
) {

  if (
    typeof window.NOVA_TOOLS
      ?.runFromMessage !==
    "function"
  ) {
    return false;
  }


  let result;


  try {

    result =
      window.NOVA_TOOLS
        .runFromMessage(
          userText
        );

  } catch (error) {

    console.error(
      "Local tool error:",
      error
    );

    return false;
  }


  if (!result) {
    return false;
  }


  const answer =
    window.NOVA_TOOLS
      .format(result);


  if (!answer) {
    return false;
  }


  currentConversationMessages.push({
    role: "ai",
    content: answer
  });


  addMessageToScreen(
    "ai",
    answer
  );


  const saved =
    await saveMessageToSupabase(
      currentConversationId,
      "ai",
      answer
    );


  if (saved) {
    const last = currentConversationMessages[currentConversationMessages.length - 1];
    if (last) {
      last.id = saved.id;
    }
  }


  return true;
}


/* =========================================================
    MEMORY
========================================================= */

let cachedMemories = [];


async function loadMemories() {

  if (!currentUser) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient

      .from("memories")

      .select(
        "id,user_id,content,created_at"
      )

      .eq(
        "user_id",
        currentUser.id
      )

      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Memory load error:",
      error
    );

    cachedMemories = [];
    return;
  }


  cachedMemories = data || [];
}


async function detectAndSaveMemory(
  text
) {

  if (!currentUser) {
    return;
  }


  const memory = detectMemory(text);

  if (!memory) {
    return;
  }


  const normalized = memory.toLowerCase().replace(/[.!?]+$/, "");
  const alreadyExists = cachedMemories.some(
    item =>
      String(item.content || "").toLowerCase().replace(/[.!?]+$/, "") === normalized
  );

  if (alreadyExists) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient

      .from("memories")

      .insert({
        user_id: currentUser.id,
        content: memory
      })

      .select(
        "id,user_id,content,created_at"
      )

      .single();


  if (error) {

    console.error(
      "Memory save error:",
      error
    );

    return;
  }


  cachedMemories.unshift(data);
}


function detectMemory(text) {

  const patterns = [

    {
      regex:
        /\bmy name is\s+(.+)/i,
      prefix:
        "User's name is "
    },

    {
      regex:
        /\bi live in\s+(.+)/i,
      prefix:
        "User lives in "
    },

    {
      regex:
        /\bi(?:'m| am) learning\s+(.+)/i,
      prefix:
        "User is learning "
    },

    {
      regex:
        /\bmy project is called\s+(.+)/i,
      prefix:
        "User's project is called "
    },

    {
      regex:
        /\bmy goal is\s+(.+)/i,
      prefix:
        "User's goal is "
    },

    {
      regex:
        /\bi want to become\s+(.+)/i,
      prefix:
        "User wants to become "
    }

  ];


  for (const pattern of patterns) {

    const match = text.match(pattern.regex);

    if (match?.[1]) {
      const value = match[1].trim().replace(/[.!?]+$/, "");

      if (value.length > 1 && value.length < 200) {
        return pattern.prefix + value;
      }
    }
  }

  return null;
}


/* =========================================================
    MESSAGE RENDERING
========================================================= */

function addMessageToScreen(
  role,
  text,
  messageId = null
) {

  const container = $("messages");


  $("welcomeScreen")?.classList.add("hidden");

  const row = document.createElement("div");
  row.className = `message-row ${role === "user" ? "user" : "ai"}`;

  if (messageId) {
    row.dataset.messageId = messageId;
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const content = document.createElement("div");
  content.className = "message-content";

  if (role === "user") {
    content.textContent = text;
  } else {
    content.innerHTML = renderMarkdown(text);
  }

  bubble.appendChild(content);

  if (role === "ai") {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "message-action";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", async () => {
      await copyText(text);
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1200);
    });

    actions.appendChild(copyButton);

    const regenerateButton = document.createElement("button");
    regenerateButton.type = "button";
    regenerateButton.className = "message-action";
    regenerateButton.textContent = "Regenerate";
    regenerateButton.addEventListener("click", () => regenerateMessage(row));
    actions.appendChild(regenerateButton);

    bubble.appendChild(actions);
  }

  row.appendChild(bubble);
  container.appendChild(row);

  wireCodeCopyButtons(row);
  scrollToBottom();

  return row;
}


/* =========================================================
    MARKDOWN
========================================================= */

function renderMarkdown(
  text
) {

  if (
    typeof marked ===
    "undefined"
  ) {

    const fallback =
      document.createElement(
        "div"
      );

    fallback.textContent =
      text;

    return fallback.innerHTML;
  }

  const raw =
    marked.parse(
      text || "",
      {
        gfm: true,
        breaks: true
      }
    );

  if (
    typeof DOMPurify ===
    "undefined"
  ) {

    const fallback =
      document.createElement(
        "div"
      );

    fallback.textContent =
      text;

    return fallback.innerHTML;
  }

  return DOMPurify.sanitize(
    raw,
    {
      USE_PROFILES: {
        html: true
      },
      ADD_ATTR: [
        "target",
        "rel"
      ]
    }
  );
}


/* =========================================================
    CODE COPY
========================================================= */

function wireCodeCopyButtons(
  root
) {

  root
    .querySelectorAll(
      "pre"
    )
    .forEach(
      pre => {

        if (
          pre.parentElement
            ?.classList
            .contains(
              "code-block"
            )
        ) {
          return;
        }

        const code =
          pre.querySelector(
            "code"
          );

        if (!code) {
          return;
        }

        const wrapper =
          document.createElement(
            "div"
          );

        wrapper.className =
          "code-block";

        const header =
          document.createElement(
            "div"
          );

        header.className =
          "code-header";

        const language =
          code.className
            .match(
              /language-([^\s]+)/
            )?.[1] ||
          "code";

        const label =
          document.createElement(
            "span"
          );

        label.textContent =
          language;

        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "code-copy";

        button.textContent =
          "Copy";

        button.addEventListener(
          "click",
          async () => {
            await copyText(
              code.textContent
            );

            button.textContent =
              "Copied";

            setTimeout(
              () => {
                button.textContent =
                  "Copy";
              },
              1200
            );
          }
        );

        header.appendChild(label);
        header.appendChild(button);

        pre.parentNode.insertBefore(
          wrapper,
          pre
        );

        wrapper.appendChild(header);
        wrapper.appendChild(pre);
      }
    );
}


/* =========================================================
    COPY
========================================================= */

async function copyText(
  text
) {

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return true;
  }
}


/* =========================================================
    REGENERATE
========================================================= */

async function regenerateMessage(
  row
) {

  if (
    isSending ||
    !currentConversationId
  ) {
    return;
  }

  const messageId = row.dataset.messageId;

  const index = currentConversationMessages.findIndex(
    message => message.id === messageId
  );

  if (index === -1) {
    let fallbackIndex = -1;

    for (
      let i = currentConversationMessages.length - 1;
      i >= 0;
      i--
    ) {
      if (
        currentConversationMessages[i].role === "ai"
      ) {
        fallbackIndex = i;
        break;
      }
    }

    if (fallbackIndex === -1) {
      return;
    }

    await regenerateFromIndex(fallbackIndex);
    return;
  }

  await regenerateFromIndex(index);
}


async function regenerateFromIndex(
  aiIndex
) {

  if (isSending) {
    return;
  }

  let userIndex = aiIndex - 1;

  while (
    userIndex >= 0 &&
    currentConversationMessages[userIndex].role !== "user"
  ) {
    userIndex--;
  }

  if (userIndex < 0) {
    return;
  }

  const aiMessage = currentConversationMessages[aiIndex];

  if (aiMessage?.id) {
    const { error } = await supabaseClient
      .from("messages")
      .delete()
      .eq("id", aiMessage.id)
      .eq("user_id", currentUser.id);

    if (error) {
      console.error("Regeneration delete error:", error);
    }
  }

  currentConversationMessages.splice(aiIndex, 1);
  renderCurrentConversation();

  isSending = true;
  $("sendBtn").disabled = true;

  try {
    const answer = await generateAIResponse(currentConversationMessages);

    const saved = await saveMessageToSupabase(
      currentConversationId,
      "ai",
      answer
    );

    currentConversationMessages.push({
      id: saved?.id || null,
      role: "ai",
      content: answer
    });

    await touchConversation(currentConversationId);
    await loadConversations();

  } catch (error) {
    console.error("Regeneration error:", error);
    addMessageToScreen(
      "ai",
      `I couldn't regenerate the answer.\n\n**Error:** ${error?.message || "Unknown error."}`
    );

  } finally {
    isSending = false;
    $("sendBtn").disabled = false;
    updateNovaStatus("ONLINE");
  }
}


/* =========================================================
    RENDER CURRENT CONVERSATION
========================================================= */

function renderCurrentConversation() {

  $("messages").innerHTML = "";
  $("welcomeScreen")?.classList.add("hidden");

  currentConversationMessages.forEach(
    message => {
      addMessageToScreen(
        message.role,
        message.content,
        message.id
      );
    }
  );

  scrollToBottom();
}


/* =========================================================
    THINKING
========================================================= */

function showThinking() {

  $("welcomeScreen")?.classList.add("hidden");

  const row = document.createElement("div");
  row.className = "message-row ai";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  bubble.innerHTML = `
    <div class="thinking">
      <span>NOVA is thinking</span>
      <span class="thinking-dot"></span>
    </div>
  `;

  row.appendChild(bubble);
  $("messages").appendChild(row);
  scrollToBottom();
  return row;
}


function removeThinking(row) {
  row?.remove();
}


/* =========================================================
    CLEAR CHAT
========================================================= */

function clearMessages() {
  $("messages").innerHTML = "";
  currentConversationMessages = [];
  $("welcomeScreen")?.classList.remove("hidden");
  scrollToBottom();
}


/* =========================================================
    NEW CHAT
========================================================= */

async function newChat() {
  currentConversationId = null;
  currentConversationMessages = [];
  try {
    localStorage.removeItem("nova_current_conversation_id");
  } catch (_) {}
  clearMessages();
  closeMobileSidebar();
  updateNovaStatus("ONLINE");
}


/* =========================================================
    THEME
========================================================= */

function initializeTheme() {

  const theme = localStorage.getItem("nova_theme");

  if (theme === "light") {
    document.body.classList.add("light-theme");
  }

  updateThemeIcon();
}


function toggleTheme() {

  document.body.classList.toggle("light-theme");

  const light = document.body.classList.contains("light-theme");
  localStorage.setItem("nova_theme", light ? "light" : "dark");

  updateThemeIcon();
}


function updateThemeIcon() {

  const light = document.body.classList.contains("light-theme");

  $("themeToggle").textContent =
    light ? "☀" : "☾";
}


/* =========================================================
    LIVE CLOCK
========================================================= */

function startLiveClock() {

  updateLiveClock();

  setInterval(
    updateLiveClock,
    1000
  );
}


function updateLiveClock() {

  const now = new Date();

  const time = new Intl.DateTimeFormat(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
      second: undefined
    }
  ).format(now);

  const date = new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  ).format(now);

  const day = new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "long"
    }
  ).format(now);

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";

  if ($("liveTime")) {
    $("liveTime").textContent = time;
  }

  if ($("liveDate")) {
    $("liveDate").textContent = date;
  }

  if ($("liveDay")) {
    $("liveDay").textContent = day;
  }

  if ($("liveTimeZone")) {
    $("liveTimeZone").textContent = zone.replace(/_/g, " ");
  }
}


/* =========================================================
    STATUS
========================================================= */

function updateNovaStatus(
  status
) {

  const element = $("novaStatus");

  if (!element) {
    return;
  }

  const normalized = String(status).toUpperCase();
  element.textContent = normalized;

  if (normalized === "ONLINE") {
    element.style.color = "#8ee0a7";
  } else {
    element.style.color = "var(--accent)";
  }
}


/* =========================================================
    SIDEBAR
========================================================= */

function openMobileSidebar() {

  $("sidebar").classList.add("open");
  $("sidebarOverlay").classList.add("open");
  sidebarOpen = true;
}


function closeMobileSidebar() {

  $("sidebar").classList.remove("open");
  $("sidebarOverlay").classList.remove("open");
  sidebarOpen = false;
}


/* =========================================================
    MODAL
========================================================= */

function openModal(
  title,
  body
) {

  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = body;
  $("modal").classList.remove("hidden");
}


function closeModal() {
  $("modal").classList.add("hidden");
}


/* =========================================================
    SETTINGS
========================================================= */

function showSettings() {

  const memoryCount = cachedMemories.length;

  openModal(
    "NOVA Settings",
    `
      <p>
        <strong>Account</strong><br>
        ${escapeHTML(currentUser?.email || "Signed in")}
      </p>

      <p>
        <strong>Memory</strong><br>
        ${memoryCount} saved memory item${memoryCount === 1 ? "" : "s"}.
      </p>

      <p>
        <strong>Theme</strong><br>
        ${document.body.classList.contains("light-theme") ? "Light" : "Dark"}
      </p>

      <p>
        <strong>AI</strong><br>
        NOVA uses OpenRouter for AI inference and can use current web tools when a request requires fresh information.
      </p>
    `
  );
}


/* =========================================================
    HELP
========================================================= */

function showHelp() {

  openModal(
    "How NOVA works",
    `
      <p>
        <strong>Chat</strong><br>
        Ask NOVA questions, request explanations, write content, solve problems or build software.
      </p>

      <p>
        <strong>Current information</strong><br>
        When a question requires fresh information, NOVA can use current web search and webpage fetching rather than relying only on older model knowledge.
      </p>

      <p>
        <strong>Local tools</strong><br>
        NOVA can handle calculations, percentages, conversions, statistics, JSON, date differences, number bases and other utility tasks directly in the browser.
      </p>

      <p>
        <strong>Conversations</strong><br>
        Your conversations are stored in your Supabase database and are loaded when you select them from the sidebar.
      </p>
    `
  );
}


/* =========================================================
    LOGOUT
========================================================= */

async function logout() {

  if (!supabaseClient) {
    return;
  }

  await supabaseClient.auth.signOut();
}


/* =========================================================
    STARTER PROMPTS
========================================================= */

function useStarterPrompt(
  prompt
) {

  $("messageInput").value = prompt;
  resizeTextarea();
  $("messageInput").focus();
}


/* =========================================================
    TEXTAREA
========================================================= */

function resizeTextarea() {

  const textarea = $("messageInput");

  textarea.style.height = "auto";
  textarea.style.height = Math.min(
    textarea.scrollHeight,
    180
  ) + "px";
}


/* =========================================================
    SCROLL
========================================================= */

function scrollToBottom() {

  requestAnimationFrame(
    () => {
      const container = $("chatContainer");
      container.scrollTop = container.scrollHeight;
    }
  );
}


/* =========================================================
    ESCAPE HTML FOR MODALS
========================================================= */

function escapeHTML(
  value
) {

  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}


/* =========================================================
    STATIC EVENTS
========================================================= */

function setupStaticEvents() {

  $("authForm")?.addEventListener(
    "submit",
    handleAuthSubmit
  );

  $("authSwitch")?.addEventListener(
    "click",
    () => {
      setupAuthMode(
        authMode === "signin"
          ? "signup"
          : "signin"
      );
    }
  );

  $("sendBtn")?.addEventListener(
    "click",
    () => sendMessage()
  );

  $("newChatBtn")?.addEventListener(
    "click",
    newChat
  );

  $("themeToggle")?.addEventListener(
    "click",
    toggleTheme
  );

  $("menuBtn")?.addEventListener(
    "click",
    openMobileSidebar
  );

  $("sidebarCloseBtn")?.addEventListener(
    "click",
    closeMobileSidebar
  );

  $("sidebarOverlay")?.addEventListener(
    "click",
    closeMobileSidebar
  );

  $("settingsBtn")?.addEventListener(
    "click",
    showSettings
  );

  $("helpBtn")?.addEventListener(
    "click",
    showHelp
  );

  $("logoutBtn")?.addEventListener(
    "click",
    logout
  );

  $("modalClose")?.addEventListener(
    "click",
    closeModal
  );

  $("modalOverlay")?.addEventListener(
    "click",
    closeModal
  );

  $("messageInput")?.addEventListener(
    "input",
    resizeTextarea
  );

  $("messageInput")?.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    }
  );

  qsa(".starter-card").forEach(
    card => {
      card.addEventListener(
        "click",
        () => {
          useStarterPrompt(
            card.dataset.prompt || ""
          );
        }
      );
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeModal();
        closeMobileSidebar();
      }
    }
  );
}


/* =========================================================
    EXPOSE OPTIONAL DEBUG API
========================================================= */

window.NOVA = {
  getUser: () => currentUser,
  getConversationId: () => currentConversationId,
  getMessages: () => [...currentConversationMessages],
  newChat,
  sendMessage,
  toggleTheme
};
