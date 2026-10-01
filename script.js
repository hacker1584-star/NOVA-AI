/* =====================================
   NOVA AI — CORE APPLICATION
   ===================================== */

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const messagesContainer = document.getElementById("messages");
const welcomeScreen = document.getElementById("welcomeScreen");

const newChatBtn = document.getElementById("newChatBtn");
const conversationList = document.getElementById("conversationList");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");


// =====================================
// STATE
// =====================================

let conversations =
  JSON.parse(localStorage.getItem("nova_conversations")) || [];

let currentConversationId = null;


// =====================================
// STARTUP
// =====================================

initialize();


function initialize() {
  renderConversationList();
  createNewConversation();

  setupStarterCards();
  setupInput();

  console.log("NOVA AI initialized.");
}


// =====================================
// CONVERSATION
// =====================================

function createNewConversation() {

  const conversation = {
    id: Date.now().toString(),

    title: "New chat",

    messages: []
  };

  conversations.unshift(conversation);

  currentConversationId = conversation.id;

  saveConversations();

  clearChat();

  renderConversationList();
}


function getCurrentConversation() {

  return conversations.find(
    conversation =>
      conversation.id === currentConversationId
  );
}


// =====================================
// SAVE
// =====================================

function saveConversations() {

  localStorage.setItem(
    "nova_conversations",
    JSON.stringify(conversations)
  );
}


// =====================================
// CONVERSATION LIST
// =====================================

function renderConversationList() {

  conversationList.innerHTML = "";

  conversations.forEach(conversation => {

    const item = document.createElement("div");

    item.className = "conversation-item";

    item.textContent =
      conversation.title || "New chat";

    item.title = conversation.title || "New chat";

    item.addEventListener("click", () => {

      loadConversation(conversation.id);

      closeMobileSidebar();

    });

    conversationList.appendChild(item);

  });
}


// =====================================
// LOAD CONVERSATION
// =====================================

function loadConversation(id) {

  const conversation =
    conversations.find(
      item => item.id === id
    );

  if (!conversation) return;

  currentConversationId = id;

  messagesContainer.innerHTML = "";

  if (conversation.messages.length === 0) {

    welcomeScreen.style.display = "block";

  } else {

    welcomeScreen.style.display = "none";

    conversation.messages.forEach(message => {

      addMessageToScreen(
        message.role,
        message.content
      );

    });

  }

  renderConversationList();
}


// =====================================
// CLEAR CHAT
// =====================================

function clearChat() {

  messagesContainer.innerHTML = "";

  welcomeScreen.style.display = "block";
}


// =====================================
// ADD MESSAGE
// =====================================

function addMessageToScreen(role, content) {

  const message = document.createElement("div");

  message.className =
    `message ${role}`;

  const contentBox =
    document.createElement("div");

  contentBox.className =
    "message-content";

  const roleLabel =
    document.createElement("span");

  roleLabel.className =
    "message-role";

  roleLabel.textContent =
    role === "user" ? "You" : "NOVA";

  const text =
    document.createElement("div");

  text.textContent = content;

  contentBox.appendChild(roleLabel);
  contentBox.appendChild(text);

  message.appendChild(contentBox);

  messagesContainer.appendChild(message);

  scrollToBottom();
}


// =====================================
// SEND MESSAGE
// =====================================

function sendMessage() {

  const text =
    messageInput.value.trim();

  if (!text) return;

  const conversation =
    getCurrentConversation();

  if (!conversation) return;

  // Hide welcome screen

  welcomeScreen.style.display = "none";


  // Add user message

  conversation.messages.push({

    role: "user",

    content: text

  });

  addMessageToScreen(
    "user",
    text
  );


  // Set conversation title

  if (
    conversation.title === "New chat"
  ) {

    conversation.title =
      createConversationTitle(text);

  }


  messageInput.value = "";

  autoResizeTextarea();

  saveConversations();

  renderConversationList();


  // Temporary local AI response

  generateLocalResponse(text);
}


// =====================================
// LOCAL AI PLACEHOLDER
// =====================================

function generateLocalResponse(userMessage) {

  const conversation =
    getCurrentConversation();

  setTimeout(() => {

    const response =
      createTemporaryResponse(userMessage);


    conversation.messages.push({

      role: "ai",

      content: response

    });


    addMessageToScreen(
      "ai",
      response
    );


    saveConversations();

  }, 500);
}


// =====================================
// TEMPORARY RESPONSE ENGINE
// =====================================

function createTemporaryResponse(message) {

  const text =
    message.toLowerCase();


  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {

    return "Hello. I'm NOVA. What would you like to work on?";

  }


  if (
    text.includes("code") ||
    text.includes("program")
  ) {

    return "I can help you build and debug code. Tell me what you're trying to create.";

  }


  if (
    text.includes("plan")
  ) {

    return "Sure. Tell me the goal, and I'll break it into practical steps.";

  }


  if (
    text.includes("who are you") ||
    text.includes("what are you")
  ) {

    return "I'm NOVA, an AI workspace currently being built. My goal is to combine conversation, tools, memory, files, and other capabilities in one place.";

  }


  return "I received your message. The NOVA interface is working. The next major step is connecting the conversation engine to a real AI model.";

}


// =====================================
// CONVERSATION TITLE
// =====================================

function createConversationTitle(text) {

  let title =
    text.trim();


  if (title.length > 30) {

    title =
      title.substring(0, 30) + "...";

  }


  return title;
}


// =====================================
// STARTER CARDS
// =====================================

function setupStarterCards() {

  const cards =
    document.querySelectorAll(
      ".starter-card"
    );


  cards.forEach(card => {

    card.addEventListener(
      "click",
      () => {

        const prompt =
          card.dataset.prompt;

        if (!prompt) return;

        messageInput.value =
          prompt;

        messageInput.focus();

        autoResizeTextarea();

      }
    );

  });

}


// =====================================
// INPUT
// =====================================

function setupInput() {

  sendBtn.addEventListener(
    "click",
    sendMessage
  );


  messageInput.addEventListener(
    "input",
    autoResizeTextarea
  );


  messageInput.addEventListener(
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


  newChatBtn.addEventListener(
    "click",
    () => {

      createNewConversation();

      closeMobileSidebar();

    }
  );

}


// =====================================
// TEXTAREA AUTO RESIZE
// =====================================

function autoResizeTextarea() {

  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      150
    ) + "px";

}


// =====================================
// SCROLL
// =====================================

function scrollToBottom() {

  requestAnimationFrame(() => {

    const chat =
      document.querySelector(
        ".chat-container"
      );

    chat.scrollTop =
      chat.scrollHeight;

  });

}


// =====================================
// MOBILE SIDEBAR
// =====================================

menuBtn.addEventListener(
  "click",
  () => {

    sidebar.classList.add("open");

    sidebarOverlay.classList.add(
      "active"
    );

  }
);


sidebarOverlay.addEventListener(
  "click",
  closeMobileSidebar
);


function closeMobileSidebar() {

  sidebar.classList.remove("open");

  sidebarOverlay.classList.remove(
    "active"
  );

}


// =====================================
// KEYBOARD SHORTCUT
// =====================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.ctrlKey &&
      event.key === "k"
    ) {

      event.preventDefault();

      messageInput.focus();

    }

  }
);
