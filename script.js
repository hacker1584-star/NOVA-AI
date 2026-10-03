/* =========================================
   NOVA AI — FRONTEND + SUPABASE
========================================= */


/* =========================================
   DOM
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

const themeToggle = document.getElementById("themeToggle");
const starterCards = document.querySelectorAll(".starter-card");


/* =========================================
   SUPABASE
========================================= */

let supabaseClient = null;
let currentUser = null;
let supabaseReady = false;


/* =========================================
   APP STATE
========================================= */

let conversations = [];
let currentConversationId = null;

let novaMemories = [];

let isSending = false;


/* =========================================
   THEME
========================================= */

function loadTheme() {
    const savedTheme = localStorage.getItem("nova_theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
    } else {
        document.body.classList.remove("light-theme");
    }
}

function toggleTheme() {
    document.body.classList.toggle("light-theme");

    const theme = document.body.classList.contains("light-theme")
        ? "light"
        : "dark";

    localStorage.setItem("nova_theme", theme);
}

loadTheme();

if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
}


/* =========================================
   SUPABASE CONFIG
========================================= */

async function initializeSupabase() {
    try {
        const response = await fetch("/api/config");

        if (!response.ok) {
            throw new Error("Could not load Supabase configuration.");
        }

        const config = await response.json();

        if (!config.supabaseUrl || !config.supabasePublishableKey) {
            throw new Error("Supabase configuration is missing.");
        }

        if (typeof supabase === "undefined") {
            throw new Error("Supabase library did not load.");
        }

        supabaseClient = supabase.createClient(
            config.supabaseUrl,
            config.supabasePublishableKey
        );

        supabaseReady = true;

        console.log("NOVA: Supabase connected.");

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (session && session.user) {
            currentUser = session.user;

            await loadUserData();

            hideAuthScreen();

            initializeNOVA();
        } else {
            showAuthScreen();
        }

        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log("NOVA auth event:", event);

            if (session && session.user) {
                currentUser = session.user;

                await loadUserData();

                hideAuthScreen();

                initializeNOVA();
            } else {
                currentUser = null;
                conversations = [];
                novaMemories = [];
                currentConversationId = null;

                showAuthScreen();
            }
        });

    } catch (error) {
        console.error("Supabase initialization error:", error);

        showConfigError(error.message);
    }
}


/* =========================================
   AUTH UI
========================================= */

let authScreen = null;

function createAuthScreen() {
    if (authScreen) return;

    authScreen = document.createElement("div");

    authScreen.id = "novaAuthScreen";

    authScreen.innerHTML = `
        <div class="nova-auth-box">

            <div class="nova-auth-logo">
                ✦
            </div>

            <h1>NOVA<span>AI</span></h1>

            <p class="nova-auth-subtitle">
                Your AI workspace
            </p>

            <div class="nova-auth-tabs">
                <button id="novaLoginTab" class="nova-auth-tab active">
                    Login
                </button>

                <button id="novaSignupTab" class="nova-auth-tab">
                    Sign up
                </button>
            </div>

            <form id="novaAuthForm">

                <input
                    id="novaAuthEmail"
                    type="email"
                    placeholder="Email address"
                    autocomplete="email"
                    required
                >

                <input
                    id="novaAuthPassword"
                    type="password"
                    placeholder="Password"
                    autocomplete="current-password"
                    required
                >

                <input
                    id="novaAuthName"
                    type="text"
                    placeholder="Your name"
                    autocomplete="name"
                    style="display:none;"
                >

                <button
                    id="novaAuthSubmit"
                    type="submit"
                >
                    Login
                </button>

            </form>

            <p id="novaAuthMessage" class="nova-auth-message"></p>

            <p class="nova-auth-footer">
                By continuing, you agree to use NOVA responsibly.
            </p>

        </div>
    `;

    document.body.appendChild(authScreen);

    addAuthStyles();

    const loginTab = document.getElementById("novaLoginTab");
    const signupTab = document.getElementById("novaSignupTab");
    const form = document.getElementById("novaAuthForm");
    const nameInput = document.getElementById("novaAuthName");
    const submitButton = document.getElementById("novaAuthSubmit");

    let authMode = "login";

    loginTab.addEventListener("click", () => {
        authMode = "login";

        loginTab.classList.add("active");
        signupTab.classList.remove("active");

        nameInput.style.display = "none";
        nameInput.required = false;

        submitButton.textContent = "Login";

        clearAuthMessage();
    });

    signupTab.addEventListener("click", () => {
        authMode = "signup";

        signupTab.classList.add("active");
        loginTab.classList.remove("active");

        nameInput.style.display = "block";
        nameInput.required = true;

        submitButton.textContent = "Create account";

        clearAuthMessage();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document
            .getElementById("novaAuthEmail")
            .value
            .trim();

        const password = document
            .getElementById("novaAuthPassword")
            .value;

        const name = nameInput.value.trim();

        if (!email || !password) {
            showAuthMessage(
                "Enter your email and password.",
                "error"
            );

            return;
        }

        if (password.length < 6) {
            showAuthMessage(
                "Password must be at least 6 characters.",
                "error"
            );

            return;
        }

        submitButton.disabled = true;

        submitButton.textContent =
            authMode === "login"
                ? "Logging in..."
                : "Creating account...";

        clearAuthMessage();

        try {
            if (authMode === "login") {
                const { error } =
                    await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });

                if (error) {
                    throw error;
                }

                showAuthMessage(
                    "Login successful.",
                    "success"
                );

            } else {
                const { data, error } =
                    await supabaseClient.auth.signUp({
                        email,
                        password
                    });

                if (error) {
                    throw error;
                }

                if (data.user) {
                    await createOrUpdateProfile(
                        data.user,
                        name || email.split("@")[0]
                    );
                }

                if (!data.session) {
                    showAuthMessage(
                        "Account created. Check your email to confirm your account, then log in.",
                        "success"
                    );
                } else {
                    showAuthMessage(
                        "Account created successfully.",
                        "success"
                    );
                }
            }

        } catch (error) {
            console.error("Authentication error:", error);

            showAuthMessage(
                getFriendlyAuthError(error),
                "error"
            );

        } finally {
            submitButton.disabled = false;

            submitButton.textContent =
                authMode === "login"
                    ? "Login"
                    : "Create account";
        }
    });
}


/* =========================================
   AUTH STYLES
========================================= */

function addAuthStyles() {

    if (document.getElementById("novaAuthStyles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "novaAuthStyles";

    style.textContent = `
        #novaAuthScreen {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #050505;
            color: white;
            overflow-y: auto;
        }

        .nova-auth-box {
            width: 100%;
            max-width: 420px;
            padding: 34px 26px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 22px;
            background: rgba(15,15,15,.96);
            box-shadow: 0 25px 80px rgba(0,0,0,.45);
            text-align: center;
        }

        .nova-auth-logo {
            width: 54px;
            height: 54px;
            margin: 0 auto 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 16px;
            background: rgba(255,255,255,.08);
            font-size: 28px;
        }

        .nova-auth-box h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: .5px;
        }

        .nova-auth-box h1 span {
            opacity: .55;
        }

        .nova-auth-subtitle {
            margin: 8px 0 25px;
            color: #999;
            font-size: 14px;
        }

        .nova-auth-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 18px;
        }

        .nova-auth-tab {
            flex: 1;
            border: 1px solid rgba(255,255,255,.10);
            background: rgba(255,255,255,.04);
            color: #aaa;
            padding: 11px;
            border-radius: 10px;
            cursor: pointer;
        }

        .nova-auth-tab.active {
            background: rgba(255,255,255,.12);
            color: white;
        }

        #novaAuthForm {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        #novaAuthForm input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid rgba(255,255,255,.10);
            background: rgba(255,255,255,.05);
            color: white;
            padding: 14px;
            border-radius: 10px;
            outline: none;
            font-size: 15px;
        }

        #novaAuthForm input:focus {
            border-color: rgba(255,255,255,.30);
        }

        #novaAuthSubmit {
            border: 0;
            background: white;
            color: black;
            padding: 14px;
            border-radius: 10px;
            font-weight: 700;
            cursor: pointer;
            margin-top: 4px;
        }

        #novaAuthSubmit:disabled {
            opacity: .55;
            cursor: wait;
        }

        .nova-auth-message {
            min-height: 22px;
            margin: 15px 0 0;
            font-size: 13px;
            line-height: 1.5;
        }

        .nova-auth-message.error {
            color: #ff8585;
        }

        .nova-auth-message.success {
            color: #8de6a4;
        }

        .nova-auth-footer {
            margin: 22px 0 0;
            color: #666;
            font-size: 11px;
            line-height: 1.5;
        }

        @media (max-width: 480px) {
            .nova-auth-box {
                padding: 28px 20px;
            }
        }
    `;

    document.head.appendChild(style);
}


/* =========================================
   AUTH SCREEN FUNCTIONS
========================================= */

function showAuthScreen() {
    createAuthScreen();

    authScreen.style.display = "flex";

    document.body.style.overflow = "hidden";
}

function hideAuthScreen() {
    createAuthScreen();

    authScreen.style.display = "none";

    document.body.style.overflow = "";
}

function showAuthMessage(message, type) {
    const element =
        document.getElementById("novaAuthMessage");

    if (!element) return;

    element.textContent = message;
    element.className =
        `nova-auth-message ${type || ""}`;
}

function clearAuthMessage() {
    const element =
        document.getElementById("novaAuthMessage");

    if (!element) return;

    element.textContent = "";
    element.className = "nova-auth-message";
}

function showConfigError(message) {
    showAuthScreen();

    showAuthMessage(
        "NOVA could not connect to its account system. Check the Vercel deployment and /api/config.",
        "error"
    );

    console.error(message);
}

function getFriendlyAuthError(error) {

    const message =
        error?.message ||
        "Something went wrong.";

    if (
        message.toLowerCase().includes("invalid login credentials")
    ) {
        return "Incorrect email or password.";
    }

    if (
        message.toLowerCase().includes("user already registered")
    ) {
        return "An account with this email already exists. Try logging in.";
    }

    if (
        message.toLowerCase().includes("email not confirmed")
    ) {
        return "Please confirm your email before logging in.";
    }

    if (
        message.toLowerCase().includes("password should be at least")
    ) {
        return "Your password must be at least 6 characters.";
    }

    return message;
}


/* =========================================
   PROFILE
========================================= */

async function createOrUpdateProfile(user, displayName) {

    if (!supabaseClient || !user) return;

    const { error } =
        await supabaseClient
            .from("profiles")
            .upsert(
                {
                    id: user.id,
                    display_name: displayName || null
                },
                {
                    onConflict: "id"
                }
            );

    if (error) {
        console.error(
            "Profile error:",
            error
        );
    }
}


/* =========================================
   LOAD USER DATA
========================================= */

async function loadUserData() {

    if (!currentUser || !supabaseClient) {
        return;
    }

    try {

        await createOrUpdateProfile(
            currentUser,
            currentUser.user_metadata?.display_name ||
            currentUser.email?.split("@")[0] ||
            "NOVA User"
        );


        /* -------------------------------
           LOAD CONVERSATIONS
        -------------------------------- */

        const {
            data: conversationData,
            error: conversationError
        } = await supabaseClient
            .from("conversations")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("updated_at", {
                ascending: false
            });

        if (conversationError) {
            throw conversationError;
        }

        conversations = [];

        for (const conversation of conversationData || []) {

            const {
                data: messageData,
                error: messageError
            } = await supabaseClient
                .from("messages")
                .select("*")
                .eq("conversation_id", conversation.id)
                .eq("user_id", currentUser.id)
                .order("created_at", {
                    ascending: true
                });

            if (messageError) {
                console.error(
                    "Message loading error:",
                    messageError
                );

                continue;
            }

            conversations.push({
                id: conversation.id,
                title: conversation.title || "New chat",
                createdAt: conversation.created_at,
                updatedAt: conversation.updated_at,
                messages: (messageData || []).map(message => ({
                    role:
                        message.role === "assistant"
                            ? "ai"
                            : message.role,
                    content: message.content
                }))
            });
        }


        /* -------------------------------
           LOAD MEMORIES
        -------------------------------- */

        const {
            data: memoryData,
            error: memoryError
        } = await supabaseClient
            .from("memories")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            });

        if (memoryError) {
            throw memoryError;
        }

        novaMemories = (memoryData || []).map(memory => ({
            id: memory.id,
            content: memory.content,
            createdAt: memory.created_at,
            updatedAt: memory.updated_at
        }));


        /* -------------------------------
           SELECT MOST RECENT CHAT
        -------------------------------- */

        if (conversations.length > 0) {
            currentConversationId =
                conversations[0].id;
        } else {
            currentConversationId = null;
        }

        renderConversationList();

        if (currentConversationId) {
            loadConversation(currentConversationId);
        } else {
            clearMessages();
        }

    } catch (error) {

        console.error(
            "Could not load NOVA user data:",
            error
        );
    }
}


/* =========================================
   MEMORY
========================================= */

function getMemoryContext() {

    if (!novaMemories.length) {
        return "";
    }

    return `
The following are memories NOVA has saved about the user.
Use them only when relevant.

${novaMemories
    .map(memory => `- ${memory.content}`)
    .join("\n")}
`;
}


async function addMemory(content) {

    if (!content || !currentUser || !supabaseClient) {
        return;
    }

    const cleanContent = content.trim();

    if (!cleanContent) return;

    const alreadyExists = novaMemories.some(
        memory =>
            memory.content.toLowerCase() ===
            cleanContent.toLowerCase()
    );

    if (alreadyExists) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("memories")
            .insert({
                user_id: currentUser.id,
                content: cleanContent
            })
            .select()
            .single();

    if (error) {
        console.error(
            "Could not save memory:",
            error
        );

        return;
    }

    if (data) {
        novaMemories.unshift({
            id: data.id,
            content: data.content,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        });
    }
}


function detectMemory(message) {

    const patterns = [
        {
            regex: /my name is (.+)/i,
            label: "The user's name is"
        },
        {
            regex: /i live in (.+)/i,
            label: "The user lives in"
        },
        {
            regex: /i am learning (.+)/i,
            label: "The user is learning"
        },
        {
            regex: /my project is called (.+)/i,
            label: "The user's project is called"
        },
        {
            regex: /i work on (.+)/i,
            label: "The user works on"
        },
        {
            regex: /my goal is (.+)/i,
            label: "The user's goal is"
        },
        {
            regex: /i want to become (.+)/i,
            label: "The user wants to become"
        }
    ];

    for (const pattern of patterns) {

        const match = message.match(pattern.regex);

        if (match && match[1]) {

            const value =
                match[1]
                    .trim()
                    .replace(/[.!?]+$/, "");

            addMemory(
                `${pattern.label} ${value}.`
            );

            break;
        }
    }
}


/* =========================================
   CONVERSATIONS
========================================= */

async function createConversation() {

    if (!currentUser || !supabaseClient) {
        return null;
    }

    const title = "New chat";

    const {
        data,
        error
    } = await supabaseClient
        .from("conversations")
        .insert({
            user_id: currentUser.id,
            title
        })
        .select()
        .single();

    if (error) {
        console.error(
            "Could not create conversation:",
            error
        );

        return null;
    }

    const conversation = {
        id: data.id,
        title: data.title,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        messages: []
    };

    conversations.unshift(conversation);

    currentConversationId = conversation.id;

    renderConversationList();

    return conversation;
}


function getCurrentConversation() {

    return conversations.find(
        conversation =>
            conversation.id === currentConversationId
    );
}


async function updateConversationTitle(
    conversation,
    title
) {

    if (
        !conversation ||
        !currentUser ||
        !supabaseClient
    ) {
        return;
    }

    conversation.title = title;

    const { error } =
        await supabaseClient
            .from("conversations")
            .update({
                title
            })
            .eq("id", conversation.id)
            .eq("user_id", currentUser.id);

    if (error) {
        console.error(
            "Could not update conversation:",
            error
        );
    }

    renderConversationList();
}


async function touchConversation(
    conversation
) {

    if (
        !conversation ||
        !currentUser ||
        !supabaseClient
    ) {
        return;
    }

    const now = new Date().toISOString();

    conversation.updatedAt = now;

    await supabaseClient
        .from("conversations")
        .update({
            updated_at: now
        })
        .eq("id", conversation.id)
        .eq("user_id", currentUser.id);
}


/* =========================================
   RENDER CONVERSATION LIST
========================================= */

function renderConversationList() {

    if (!conversationList) return;

    conversationList.innerHTML = "";

    if (!conversations.length) {

        conversationList.innerHTML = `
            <div style="
                padding:14px;
                color:#777;
                font-size:13px;
            ">
                No conversations yet
            </div>
        `;

        return;
    }

    conversations.forEach(conversation => {

        const item =
            document.createElement("div");

        item.className =
            "conversation-item";

        if (
            conversation.id ===
            currentConversationId
        ) {
            item.classList.add("active");
        }

        item.textContent =
            conversation.title ||
            "New chat";

        item.addEventListener(
            "click",
            () => {

                currentConversationId =
                    conversation.id;

                loadConversation(
                    conversation.id
                );

                renderConversationList();

                closeMobileSidebar();
            }
        );

        conversationList.appendChild(item);
    });
}


/* =========================================
   LOAD CONVERSATION
========================================= */

function loadConversation(id) {

    const conversation =
        conversations.find(
            item => item.id === id
        );

    if (!conversation) {
        clearMessages();
        return;
    }

    currentConversationId = id;

    clearMessages();

    conversation.messages.forEach(message => {

        addMessageToScreen(
            message.role,
            message.content
        );
    });

    renderConversationList();
}


/* =========================================
   MESSAGE UI
========================================= */

function clearMessages() {

    if (!messagesContainer) return;

    messagesContainer.innerHTML = "";

    if (welcomeScreen) {
        welcomeScreen.style.display = "flex";

        if (
            messagesContainer.parentElement &&
            messagesContainer.parentElement
                .contains(welcomeScreen)
        ) {
            // Keep existing welcome screen.
        }
    }
}


function hideWelcomeScreen() {

    if (welcomeScreen) {
        welcomeScreen.style.display = "none";
    }
}


function addMessageToScreen(
    role,
    content
) {

    hideWelcomeScreen();

    if (!messagesContainer) return;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${role === "user" ? "user-message" : "ai-message"}`;

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent = content;

    wrapper.appendChild(bubble);

    messagesContainer.appendChild(wrapper);

    scrollToBottom();
}


/* =========================================
   SAVE MESSAGE
========================================= */

async function saveMessageToSupabase(
    conversationId,
    role,
    content
) {

    if (
        !currentUser ||
        !supabaseClient ||
        !conversationId
    ) {
        return null;
    }

    const databaseRole =
        role === "ai"
            ? "assistant"
            : role;

    const {
        data,
        error
    } = await supabaseClient
        .from("messages")
        .insert({
            conversation_id: conversationId,
            user_id: currentUser.id,
            role: databaseRole,
            content
        })
        .select()
        .single();

    if (error) {
        console.error(
            "Could not save message:",
            error
        );

        return null;
    }

    return data;
}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    if (isSending) return;

    const text =
        messageInput?.value?.trim();

    if (!text) return;

    if (!currentUser) {
        showAuthScreen();
        return;
    }

    isSending = true;

    if (sendBtn) {
        sendBtn.disabled = true;
    }

    try {

        let conversation =
            getCurrentConversation();

        if (!conversation) {
            conversation =
                await createConversation();
        }

        if (!conversation) {
            throw new Error(
                "Could not create a conversation."
            );
        }

        hideWelcomeScreen();

        messageInput.value = "";

        messageInput.style.height = "auto";

        detectMemory(text);

        conversation.messages.push({
            role: "user",
            content: text
        });

        addMessageToScreen(
            "user",
            text
        );

        await saveMessageToSupabase(
            conversation.id,
            "user",
            text
        );


        /* -------------------------------
           SET TITLE
        -------------------------------- */

        const userMessages =
            conversation.messages.filter(
                message =>
                    message.role === "user"
            );

        if (
            userMessages.length === 1 &&
            conversation.title === "New chat"
        ) {

            let title =
                text
                    .replace(/\s+/g, " ")
                    .trim();

            if (title.length > 45) {
                title =
                    title.substring(0, 45) +
                    "...";
            }

            await updateConversationTitle(
                conversation,
                title
            );
        }


        await touchConversation(
            conversation
        );


        /* -------------------------------
           AI RESPONSE
        -------------------------------- */

        await generateLocalResponse(
            text
        );

    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        addMessageToScreen(
            "ai",
            "Something went wrong. Please try again."
        );

    } finally {

        isSending = false;

        if (sendBtn) {
            sendBtn.disabled = false;
        }

        messageInput?.focus();
    }
}


/* =========================================
   AI RESPONSE
========================================= */

async function generateLocalResponse(
    userMessage
) {

    const conversation =
        getCurrentConversation();

    if (!conversation) {
        return;
    }

    const loadingElement =
        document.createElement("div");

    loadingElement.className =
        "message ai-message nova-loading";

    loadingElement.innerHTML = `
        <div class="message-bubble">
            NOVA is thinking...
        </div>
    `;

    messagesContainer.appendChild(
        loadingElement
    );

    scrollToBottom();


    try {

        const messagesForAI = [];

        const memoryContext =
            getMemoryContext();

        if (memoryContext) {

            messagesForAI.push({
                role: "system",
                content: `
You are NOVA, an AI workspace assistant.

${memoryContext}

Use these memories naturally when relevant.
Do not mention the memory system unless asked.
`
            });

        } else {

            messagesForAI.push({
                role: "system",
                content: `
You are NOVA, an AI workspace assistant.
Be helpful, accurate, clear and practical.
`
            });
        }


        conversation.messages.forEach(
            message => {

                messagesForAI.push({
                    role:
                        message.role === "ai"
                            ? "assistant"
                            : message.role,
                    content: message.content
                });

            }
        );


        const response =
            await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    messages:
                        messagesForAI
                })
            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "AI request failed."
            );
        }


        const aiText =
            data.reply ||
            data.message ||
            data.content ||
            "I couldn't generate a response.";


        loadingElement.remove();


        conversation.messages.push({
            role: "ai",
            content: aiText
        });


        addMessageToScreen(
            "ai",
            aiText
        );


        await saveMessageToSupabase(
            conversation.id,
            "ai",
            aiText
        );


        await touchConversation(
            conversation
        );

        renderConversationList();


    } catch (error) {

        console.error(
            "AI response error:",
            error
        );

        loadingElement.remove();

        addMessageToScreen(
            "ai",
            "I couldn't reach the AI service right now. Please try again."
        );
    }
}


/* =========================================
   MEMORY PANEL
========================================= */

function renderMemoryPanel() {

    const existing =
        document.getElementById(
            "novaMemoryPanel"
        );

    if (existing) {
        existing.remove();
    }

    const panel =
        document.createElement("div");

    panel.id =
        "novaMemoryPanel";

    panel.innerHTML = `
        <div class="nova-memory-overlay"></div>

        <div class="nova-memory-box">

            <button
                id="closeMemoryPanel"
                class="nova-memory-close"
            >
                ×
            </button>

            <h2>NOVA Memory</h2>

            <p>
                Memories help NOVA remember useful information
                about you across conversations.
            </p>

            <div id="novaMemoryList"></div>

            <button
                id="clearAllMemories"
                class="nova-clear-memory"
            >
                Clear all memories
            </button>

        </div>
    `;

    document.body.appendChild(panel);

    const style =
        document.createElement("style");

    style.textContent = `
        #novaMemoryPanel {
            position: fixed;
            inset: 0;
            z-index: 9000;
        }

        .nova-memory-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,.65);
        }

        .nova-memory-box {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%);
            width: min(90%,500px);
            max-height: 80vh;
            overflow-y: auto;
            padding: 25px;
            border-radius: 18px;
            background: #111;
            color: white;
            border: 1px solid rgba(255,255,255,.1);
        }

        .nova-memory-box h2 {
            margin-top: 0;
        }

        .nova-memory-box p {
            color: #999;
            line-height: 1.5;
            font-size: 14px;
        }

        .nova-memory-close {
            float: right;
            border: 0;
            background: transparent;
            color: white;
            font-size: 28px;
            cursor: pointer;
        }

        .nova-memory-item {
            display: flex;
            gap: 10px;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin-top: 10px;
            border-radius: 10px;
            background: rgba(255,255,255,.05);
            font-size: 13px;
        }

        .nova-memory-delete {
            border: 0;
            background: transparent;
            color: #ff7777;
            cursor: pointer;
        }

        .nova-clear-memory {
            margin-top: 18px;
            width: 100%;
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,.1);
            background: rgba(255,255,255,.05);
            color: white;
            cursor: pointer;
        }
    `;

    document.head.appendChild(style);


    const list =
        document.getElementById(
            "novaMemoryList"
        );


    if (!novaMemories.length) {

        list.innerHTML = `
            <p>No memories saved yet.</p>
        `;

    } else {

        novaMemories.forEach(memory => {

            const item =
                document.createElement("div");

            item.className =
                "nova-memory-item";

            const text =
                document.createElement("span");

            text.textContent =
                memory.content;

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "nova-memory-delete";

            deleteButton.textContent =
                "Delete";

            deleteButton.addEventListener(
                "click",
                () => deleteMemory(memory.id)
            );

            item.appendChild(text);
            item.appendChild(deleteButton);

            list.appendChild(item);
        });
    }


    document
        .getElementById("closeMemoryPanel")
        .addEventListener(
            "click",
            () => panel.remove()
        );


    document
        .getElementById("clearAllMemories")
        .addEventListener(
            "click",
            clearAllMemories
        );
}


async function deleteMemory(id) {

    if (!currentUser || !supabaseClient) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("memories")
            .delete()
            .eq("id", id)
            .eq("user_id", currentUser.id);

    if (error) {

        console.error(
            "Could not delete memory:",
            error
        );

        return;
    }

    novaMemories =
        novaMemories.filter(
            memory =>
                memory.id !== id
        );

    renderMemoryPanel();
}


async function clearAllMemories() {

    if (!currentUser || !supabaseClient) {
        return;
    }

    const confirmed =
        confirm(
            "Delete all NOVA memories?"
        );

    if (!confirmed) return;

    const { error } =
        await supabaseClient
            .from("memories")
            .delete()
            .eq("user_id", currentUser.id);

    if (error) {

        console.error(
            "Could not clear memories:",
            error
        );

        return;
    }

    novaMemories = [];

    renderMemoryPanel();
}


/* =========================================
   SETTINGS / LOGOUT
========================================= */

function openSettings() {

    const panel =
        document.createElement("div");

    panel.id =
        "novaSettingsPanel";

    const email =
        currentUser?.email ||
        "Unknown user";

    panel.innerHTML = `
        <div class="nova-settings-overlay"></div>

        <div class="nova-settings-box">

            <button
                id="closeNovaSettings"
                class="nova-settings-close"
            >
                ×
            </button>

            <h2>NOVA Settings</h2>

            <p>
                Logged in as:
            </p>

            <strong>
                ${escapeHtml(email)}
            </strong>

            <button
                id="openNovaMemories"
                class="nova-settings-button"
            >
                🧠 Manage memories
            </button>

            <button
                id="novaLogout"
                class="nova-settings-button logout"
            >
                Log out
            </button>

        </div>
    `;

    document.body.appendChild(panel);


    const style =
        document.createElement("style");

    style.textContent = `
        #novaSettingsPanel {
            position: fixed;
            inset: 0;
            z-index: 8000;
        }

        .nova-settings-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,.65);
        }

        .nova-settings-box {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%);
            width: min(90%,400px);
            padding: 25px;
            border-radius: 18px;
            background: #111;
            color: white;
            border: 1px solid rgba(255,255,255,.1);
        }

        .nova-settings-close {
            float: right;
            border: 0;
            background: transparent;
            color: white;
            font-size: 28px;
            cursor: pointer;
        }

        .nova-settings-box p {
            color: #888;
            margin-bottom: 5px;
        }

        .nova-settings-button {
            width: 100%;
            margin-top: 18px;
            padding: 13px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,.1);
            background: rgba(255,255,255,.06);
            color: white;
            cursor: pointer;
        }

        .nova-settings-button.logout {
            color: #ff8080;
        }
    `;

    document.head.appendChild(style);


    document
        .getElementById("closeNovaSettings")
        .addEventListener(
            "click",
            () => panel.remove()
        );


    document
        .getElementById("openNovaMemories")
        .addEventListener(
            "click",
            () => {
                panel.remove();
                renderMemoryPanel();
            }
        );


    document
        .getElementById("novaLogout")
        .addEventListener(
            "click",
            logout
        );
}


async function logout() {

    if (!supabaseClient) return;

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {
        console.error(
            "Logout error:",
            error
        );

        return;
    }

    conversations = [];
    novaMemories = [];
    currentConversationId = null;

    clearMessages();

    const settings =
        document.getElementById(
            "novaSettingsPanel"
        );

    if (settings) {
        settings.remove();
    }
}


/* =========================================
   SETTINGS BUTTON DETECTION
========================================= */

document.addEventListener(
    "click",
    event => {

        const text =
            event.target?.textContent
                ?.trim()
                ?.toLowerCase();

        if (!text) return;

        if (
            text === "settings" ||
            text.includes("⚙settings")
        ) {
            openSettings();
        }
    }
);


/* =========================================
   NEW CHAT
========================================= */

if (newChatBtn) {

    newChatBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {
                showAuthScreen();
                return;
            }

            await createConversation();

            clearMessages();

            closeMobileSidebar();

            messageInput?.focus();
        }
    );
}


/* =========================================
   SEND BUTTON
========================================= */

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );
}


/* =========================================
   ENTER KEY
========================================= */

if (messageInput) {

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
}


/* =========================================
   STARTER CARDS
========================================= */

starterCards.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            const prompt =
                card.dataset.prompt ||
                card.querySelector("p")?.textContent ||
                card.querySelector("span")?.textContent ||
                "";

            if (!prompt) return;

            messageInput.value =
                prompt;

            sendMessage();
        }
    );
});


/* =========================================
   MOBILE SIDEBAR
========================================= */

function openMobileSidebar() {

    if (sidebar) {
        sidebar.classList.add("open");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.add("active");
    }
}


function closeMobileSidebar() {

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("active");
    }
}


if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        openMobileSidebar
    );
}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeMobileSidebar
    );
}


/* =========================================
   SCROLL
========================================= */

function scrollToBottom() {

    if (!messagesContainer) return;

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   INITIALIZE NOVA
========================================= */

function initializeNOVA() {

    console.log(
        "NOVA initialized for:",
        currentUser?.email
    );

    renderConversationList();

    if (currentConversationId) {
        loadConversation(
            currentConversationId
        );
    } else {
        clearMessages();
    }

    messageInput?.focus();
}


/* =========================================
   START
========================================= */

createAuthScreen();

initializeSupabase();
