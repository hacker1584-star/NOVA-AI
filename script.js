/* =========================================
   NOVA AI — FRONTEND
========================================= */

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messagesContainer = document.getElementById("messages");
const welcomeScreen = document.getElementById("welcomeScreen");

const newChatBtn = document.getElementById("newChatBtn");
const conversationList = document.getElementById("conversationList");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const starterCards =
  document.querySelectorAll(".starter-card");


/* =========================================
   STATE
========================================= */

let conversations =
  JSON.parse(
    localStorage.getItem("nova_conversations") || "[]"
  );

let currentConversationId =
  localStorage.getItem("nova_current_conversation");


/* =========================================
   NOVA MEMORY
========================================= */

let novaMemories =
  JSON.parse(
    localStorage.getItem("nova_memories") || "[]"
  );


function saveMemories() {

  localStorage.setItem(
    "nova_memories",
    JSON.stringify(novaMemories)
  );

}


function addMemory(memory) {

  memory = memory.trim();

  if (!memory) {
    return;
  }


  const exists =
    novaMemories.some(
      item =>
        item.toLowerCase() ===
        memory.toLowerCase()
    );


  if (!exists) {

    novaMemories.push(memory);

    saveMemories();

  }

}


function getMemoryContext() {

  if (novaMemories.length === 0) {
    return "";
  }


  return `
The following information has been saved as memory about the user:

${novaMemories
  .map(
    memory => `- ${memory}`
  )
  .join("\n")}

Use these memories when they are relevant to the user's request.
Do not mention the memory system unless the user asks about it.
`;
}


/* =========================================
   AUTOMATIC MEMORY DETECTION
========================================= */

function detectMemory(userMessage) {

  const patterns = [

    /^my name is (.+)$/i,

    /^i live in (.+)$/i,

    /^i am learning (.+)$/i,

    /^i'm learning (.+)$/i,

    /^my project is called (.+)$/i,

    /^i work on (.+)$/i,

    /^my goal is (.+)$/i,

    /^i want to become (.+)$/i

  ];


  for (
    const pattern of patterns
  ) {

    const match =
      userMessage.match(pattern);


    if (match) {

      addMemory(userMessage);

      return true;

    }

  }


  return false;

}


/* =========================================
   SAVE CONVERSATIONS
========================================= */

function saveConversations() {

  localStorage.setItem(
    "nova_conversations",
    JSON.stringify(conversations)
  );


  localStorage.setItem(
    "nova_current_conversation",
    currentConversationId || ""
  );

}


/* =========================================
   CREATE CONVERSATION
========================================= */

function createConversation() {

  const conversation = {

    id:
      Date.now().toString(),

    title:
      "New chat",

    messages:
      []

  };


  conversations.unshift(
    conversation
  );


  currentConversationId =
    conversation.id;


  saveConversations();

  renderConversationList();

  clearMessages();


  welcomeScreen.style.display =
    "flex";

}


/* =========================================
   CURRENT CONVERSATION
========================================= */

function getCurrentConversation() {

  return conversations.find(
    conversation =>
      conversation.id ===
      currentConversationId
  );

}


/* =========================================
   CONVERSATION LIST
========================================= */

function renderConversationList() {

  conversationList.innerHTML = "";


  conversations.forEach(
    conversation => {

      const button =
        document.createElement("button");


      button.className =
        "conversation-item";


      button.textContent =
        conversation.title ||
        "New chat";


      button.addEventListener(
        "click",
        () => {

          currentConversationId =
            conversation.id;


          saveConversations();


          loadConversation(
            conversation
          );


          closeSidebar();

        }
      );


      conversationList.appendChild(
        button
      );

    }
  );

}


/* =========================================
   LOAD CONVERSATION
========================================= */

function loadConversation(
  conversation
) {

  clearMessages();


  if (
    !conversation ||
    conversation.messages.length === 0
  ) {

    welcomeScreen.style.display =
      "flex";

    return;

  }


  welcomeScreen.style.display =
    "none";


  conversation.messages.forEach(
    message => {

      addMessageToScreen(
        message.role,
        message.content
      );

    }
  );


  scrollToBottom();

}


/* =========================================
   CLEAR CHAT SCREEN
========================================= */

function clearMessages() {

  messagesContainer.innerHTML = "";

}


/* =========================================
   ADD MESSAGE TO SCREEN
========================================= */

function addMessageToScreen(
  role,
  content
) {

  const message =
    document.createElement("div");


  message.className =
    `message ${role}`;


  const messageContent =
    document.createElement("div");


  messageContent.className =
    "message-content";


  const roleLabel =
    document.createElement("span");


  roleLabel.className =
    "message-role";


  roleLabel.textContent =
    role === "user"
      ? "You"
      : "NOVA";


  const text =
    document.createElement("div");


  text.textContent =
    content;


  messageContent.appendChild(
    roleLabel
  );


  messageContent.appendChild(
    text
  );


  message.appendChild(
    messageContent
  );


  messagesContainer.appendChild(
    message
  );

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

  const userMessage =
    messageInput.value.trim();


  if (!userMessage) {
    return;
  }


  let conversation =
    getCurrentConversation();


  if (!conversation) {

    createConversation();

    conversation =
      getCurrentConversation();

  }


  /* ================================
     MEMORY DETECTION
  ================================= */

  detectMemory(
    userMessage
  );


  /* ================================
     HIDE WELCOME
  ================================= */

  welcomeScreen.style.display =
    "none";


  /* ================================
     ADD USER MESSAGE
  ================================= */

  conversation.messages.push({

    role: "user",

    content: userMessage

  });


  addMessageToScreen(
    "user",
    userMessage
  );


  /* ================================
     CONVERSATION TITLE
  ================================= */

  if (
    conversation.title ===
    "New chat"
  ) {

    conversation.title =
      userMessage.length > 30
        ? userMessage.substring(
            0,
            30
          ) + "..."
        : userMessage;

  }


  saveConversations();

  renderConversationList();


  /* ================================
     CLEAR INPUT
  ================================= */

  messageInput.value = "";

  messageInput.style.height =
    "auto";


  scrollToBottom();


  /* ================================
     ASK NOVA
  ================================= */

  await generateLocalResponse(
    userMessage
  );

}


/* =========================================
   CONNECT TO NOVA BACKEND
========================================= */

async function generateLocalResponse(
  userMessage
) {

  const conversation =
    getCurrentConversation();


  if (!conversation) {
    return;
  }


  /* ================================
     LOADING MESSAGE
  ================================= */

  const loadingMessage =
    document.createElement("div");


  loadingMessage.className =
    "message ai";


  loadingMessage.id =
    "nova-loading";


  const loadingContent =
    document.createElement("div");


  loadingContent.className =
    "message-content";


  loadingContent.innerHTML = `
    <span class="message-role">NOVA</span>
    <div>NOVA is thinking...</div>
  `;


  loadingMessage.appendChild(
    loadingContent
  );


  messagesContainer.appendChild(
    loadingMessage
  );


  scrollToBottom();


  try {

    /* ================================
       BUILD REQUEST
    ================================= */

    const memoryContext =
      getMemoryContext();


    const messagesForAI = [

      ...(memoryContext
        ? [
            {
              role: "system",

              content:
                memoryContext
            }
          ]
        : []),

      ...conversation.messages

    ];


    /* ================================
       API REQUEST
    ================================= */

    const response =
      await fetch(
        "/api/chat",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              messages:
                messagesForAI

            })

        }
      );


    const data =
      await response.json();


    /* ================================
       REMOVE LOADING
    ================================= */

    const loading =
      document.getElementById(
        "nova-loading"
      );


    if (loading) {
      loading.remove();
    }


    /* ================================
       API ERROR
    ================================= */

    if (!response.ok) {

      throw new Error(
        data.error ||
        "NOVA backend returned an error."
      );

    }


    /* ================================
       GET ANSWER
    ================================= */

    const answer =
      data.answer;


    if (!answer) {

      throw new Error(
        "NOVA returned an empty response."
      );

    }


    /* ================================
       SAVE NOVA MESSAGE
    ================================= */

    conversation.messages.push({

      role: "ai",

      content: answer

    });


    /* ================================
       DISPLAY NOVA
    ================================= */

    addMessageToScreen(
      "ai",
      answer
    );


    saveConversations();

    renderConversationList();

    scrollToBottom();


  } catch (error) {

    console.error(
      "NOVA error:",
      error
    );


    const loading =
      document.getElementById(
        "nova-loading"
      );


    if (loading) {
      loading.remove();
    }


    const errorMessage =
      "I couldn't connect to the NOVA AI service right now. Please try again.";


    conversation.messages.push({

      role: "ai",

      content: errorMessage

    });


    addMessageToScreen(
      "ai",
      errorMessage
    );


    saveConversations();

    scrollToBottom();

  }

}


/* =========================================
   ENTER / SHIFT + ENTER
========================================= */

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


/* =========================================
   SEND BUTTON
========================================= */

sendBtn.addEventListener(
  "click",
  sendMessage
);


/* =========================================
   STARTER CARDS
========================================= */

starterCards.forEach(
  card => {

    card.addEventListener(
      "click",
      () => {

        const prompt =
          card.dataset.prompt;


        messageInput.value =
          prompt;


        messageInput.focus();


        sendMessage();

      }
    );

  }
);


/* =========================================
   NEW CHAT
========================================= */

newChatBtn.addEventListener(
  "click",
  () => {

    createConversation();

    closeSidebar();

  }
);


/* =========================================
   TEXTAREA AUTO RESIZE
========================================= */

messageInput.addEventListener(
  "input",
  () => {

    messageInput.style.height =
      "auto";


    messageInput.style.height =
      Math.min(
        messageInput.scrollHeight,
        180
      ) + "px";

  }
);


/* =========================================
   MOBILE SIDEBAR
========================================= */

function openSidebar() {

  sidebar.classList.add(
    "open"
  );


  sidebarOverlay.classList.add(
    "active"
  );

}


function closeSidebar() {

  sidebar.classList.remove(
    "open"
  );


  sidebarOverlay.classList.remove(
    "active"
  );

}


menuBtn.addEventListener(
  "click",
  openSidebar
);


sidebarOverlay.addEventListener(
  "click",
  closeSidebar
);


/* =========================================
   SCROLL
========================================= */

function scrollToBottom() {

  messagesContainer.scrollTop =
    messagesContainer.scrollHeight;

}


/* =========================================
   INITIALIZE NOVA
========================================= */

function initializeNOVA() {

  renderConversationList();


  if (
    currentConversationId &&
    getCurrentConversation()
  ) {

    loadConversation(
      getCurrentConversation()
    );

  } else {

    welcomeScreen.style.display =
      "flex";

  }

}


initializeNOVA();
