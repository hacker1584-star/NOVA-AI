/* =========================================
   NOVA AI — V4 FRONTEND
   Major Tool-Ready Architecture
========================================= */


/* =========================================
   DOM
========================================= */

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const messagesContainer =
    document.getElementById("messages");

const welcomeScreen =
    document.getElementById("welcomeScreen");

const chatContainer =
    document.getElementById("chatContainer");

const newChatBtn =
    document.getElementById("newChatBtn");

const conversationList =
    document.getElementById("conversationList");

const emptyConversations =
    document.getElementById("emptyConversations");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const themeToggle =
    document.getElementById("themeToggle");

const starterCards =
    document.querySelectorAll(".starter-card");

const settingsBtn =
    document.getElementById("settingsBtn");

const helpBtn =
    document.getElementById("helpBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const modalOverlay =
    document.getElementById("modalOverlay");

const modalClose =
    document.getElementById("modalClose");

const modalContent =
    document.getElementById("modalContent");


/* =========================================
   AUTH DOM
========================================= */

const authScreen =
    document.getElementById("authScreen");

const authForm =
    document.getElementById("authForm");

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const authName =
    document.getElementById("authName");

const authNameField =
    document.getElementById("authNameField");

const authSubmit =
    document.getElementById("authSubmit");

const authSwitch =
    document.getElementById("authSwitch");

const authMessage =
    document.getElementById("authMessage");


/* =========================================
   STATE
========================================= */

let supabaseClient = null;

let supabaseReady = false;

let currentUser = null;

let conversations = [];

let currentConversationId = null;

let novaMemories = [];

let currentConversationMessages = [];

let authMode = "login";

let isGenerating = false;


/*
 * Prevents duplicate initialization when
 * Supabase fires multiple auth events.
 */

let novaInitialized = false;


/* =========================================
   SUPABASE
========================================= */

async function initializeSupabase() {

    try {

        const response =
            await fetch("/api/config");

        if (!response.ok) {
            throw new Error(
                "Could not load Supabase configuration."
            );
        }

        const config =
            await response.json();

        if (
            !config.supabaseUrl ||
            !config.supabasePublishableKey
        ) {
            throw new Error(
                "Supabase configuration is missing."
            );
        }

        if (typeof supabase === "undefined") {
            throw new Error(
                "Supabase library did not load."
            );
        }

        supabaseClient =
            supabase.createClient(
                config.supabaseUrl,
                config.supabasePublishableKey
            );

        supabaseReady = true;

        console.log(
            "NOVA: Supabase connected."
        );


        const {
            data: { session }
        } =
            await supabaseClient.auth.getSession();


        if (session?.user) {

            currentUser =
                session.user;

            await loadUserData();

            hideAuthScreen();

            initializeNOVA();

        } else {

            showAuthScreen();

        }


        supabaseClient.auth.onAuthStateChange(
            async (event, session) => {

                console.log(
                    "NOVA auth event:",
                    event
                );


                if (session?.user) {

                    currentUser =
                        session.user;

                    await loadUserData();

                    hideAuthScreen();

                    initializeNOVA();

                } else {

                    currentUser = null;

                    conversations = [];

                    novaMemories = [];

                    currentConversationId = null;

                    currentConversationMessages = [];

                    novaInitialized = false;

                    showAuthScreen();

                }

            }
        );

    } catch (error) {

        console.error(
            "Supabase initialization error:",
            error
        );

        showConfigError(
            error.message
        );

    }

}


/* =========================================
   AUTH SCREEN
========================================= */

function showAuthScreen() {

    if (!authScreen) return;

    authScreen.style.display =
        "flex";

}


function hideAuthScreen() {

    if (!authScreen) return;

    authScreen.style.display =
        "none";

}


function setAuthMessage(message) {

    if (authMessage) {

        authMessage.textContent =
            message || "";

    }

}


/* =========================================
   AUTH MODE
========================================= */

function updateAuthMode() {

    if (
        !authNameField ||
        !authSwitch ||
        !authSubmit
    ) {
        return;
    }


    if (authMode === "signup") {

        authNameField.classList.add(
            "visible"
        );

        authSubmit.textContent =
            "Create account";

        authSwitch.textContent =
            "Already have an account? Sign in";

    } else {

        authNameField.classList.remove(
            "visible"
        );

        authSubmit.textContent =
            "Continue";

        authSwitch.textContent =
            "Create an account";

    }


    setAuthMessage("");

}


if (authSwitch) {

    authSwitch.addEventListener(
        "click",
        () => {

            authMode =
                authMode === "login"
                    ? "signup"
                    : "login";

            updateAuthMode();

        }
    );

}


if (authForm) {

    authForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!supabaseReady) {

                setAuthMessage(
                    "NOVA is still connecting..."
                );

                return;

            }


            const email =
                authEmail.value.trim();

            const password =
                authPassword.value;

            const name =
                authName.value.trim();


            if (!email || !password) {

                setAuthMessage(
                    "Enter your email and password."
                );

                return;

            }


            authSubmit.disabled =
                true;


            setAuthMessage(
                authMode === "signup"
                    ? "Creating your account..."
                    : "Signing in..."
            );


            try {

                if (authMode === "signup") {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth.signUp({
                            email,
                            password,

                            options: {
                                data: {
                                    display_name:
                                        name ||
                                        "NOVA User"
                                }
                            }
                        });


                    if (error) {
                        throw error;
                    }


                    if (!data.session) {

                        setAuthMessage(
                            "Account created. Check your email to confirm your account."
                        );

                    } else {

                        setAuthMessage(
                            "Account created."
                        );

                    }

                } else {

                    const {
                        error
                    } =
                        await supabaseClient.auth.signInWithPassword({
                            email,
                            password
                        });


                    if (error) {
                        throw error;
                    }

                }

            } catch (error) {

                console.error(
                    "Authentication error:",
                    error
                );

                setAuthMessage(
                    error.message ||
                    "Authentication failed."
                );

            } finally {

                authSubmit.disabled =
                    false;

            }

        }
    );

}


/* =========================================
   USER DATA
========================================= */

async function loadUserData() {

    if (
        !supabaseClient ||
        !currentUser
    ) {
        return;
    }


    try {

        await ensureProfile();


        const {
            data: conversationData,
            error: conversationError
        } =
            await supabaseClient
                .from("conversations")
                .select("*")
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


        if (conversationError) {
            throw conversationError;
        }


        conversations =
            conversationData || [];


        const {
            data: memoryData,
            error: memoryError
        } =
            await supabaseClient
                .from("memories")
                .select("*")
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


        if (memoryError) {
            throw memoryError;
        }


        novaMemories =
            memoryData || [];


        currentConversationId =
            null;

        currentConversationMessages =
            [];


        renderConversationList();

        clearMessages();

    } catch (error) {

        console.error(
            "Could not load user data:",
            error
        );

    }

}


/* =========================================
   PROFILE
========================================= */

async function ensureProfile() {

    if (!currentUser) return;


    const displayName =
        currentUser.user_metadata?.display_name ||
        currentUser.email?.split("@")[0] ||
        "NOVA User";


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .upsert(
                {
                    id:
                        currentUser.id,

                    display_name:
                        displayName
                },
                {
                    onConflict: "id"
                }
            );


    if (error) {

        console.warn(
            "Profile update:",
            error
        );

    }

}


/* =========================================
   INITIALIZE NOVA
========================================= */

function initializeNOVA() {

    if (novaInitialized) {
        return;
    }


    novaInitialized =
        true;


    loadTheme();

    renderConversationList();

    clearMessages();

    autoResizeTextarea();

    messageInput?.focus();


    console.log(
        "NOVA V4 initialized."
    );

}


/* =========================================
   CONVERSATION LIST
========================================= */

function renderConversationList() {

    if (!conversationList) {
        return;
    }


    conversationList.innerHTML =
        "";


    if (!conversations.length) {

        if (emptyConversations) {

            emptyConversations.style.display =
                "block";

        }

        return;

    }


    if (emptyConversations) {

        emptyConversations.style.display =
            "none";

    }


    conversations.forEach(
        (conversation) => {

            const button =
                document.createElement(
                    "button"
                );


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
                "New chat";


            button.title =
                conversation.title ||
                "New chat";


            button.addEventListener(
                "click",
                () => {

                    loadConversation(
                        conversation.id
                    );

                    closeMobileSidebar();

                }
            );


            conversationList.appendChild(
                button
            );

        }
    );

}


/* =========================================
   CREATE CONVERSATION
========================================= */

async function createConversation(
    firstMessage = ""
) {

    if (!currentUser) {
        return null;
    }


    const title =
        firstMessage
            ? firstMessage
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 55)
            : "New chat";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("conversations")
            .insert({
                user_id:
                    currentUser.id,

                title:
                    title ||
                    "New chat"
            })
            .select()
            .single();


    if (error) {
        throw error;
    }


    conversations.unshift(data);

    currentConversationId =
        data.id;


    renderConversationList();


    return data;

}


/* =========================================
   LOAD CONVERSATION
========================================= */

async function loadConversation(
    conversationId
) {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("messages")
                .select("*")
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


        if (error) {
            throw error;
        }


        currentConversationId =
            conversationId;


        currentConversationMessages =
            data || [];


        clearMessages();


        currentConversationMessages.forEach(
            (message) => {

                addMessageToScreen(
                    message.role,
                    message.content,
                    false
                );

            }
        );


        renderConversationList();

        scrollToBottom();

    } catch (error) {

        console.error(
            "Could not load conversation:",
            error
        );

    }

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
        !supabaseClient ||
        !currentUser ||
        !conversationId
    ) {
        return null;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("messages")
            .insert({
                conversation_id:
                    conversationId,

                user_id:
                    currentUser.id,

                role:
                    role,

                content:
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
   UPDATE CONVERSATION
========================================= */

async function updateConversationTimestamp(
    conversationId
) {

    if (!conversationId || !currentUser) {
        return;
    }


    const timestamp =
        new Date().toISOString();


    const {
        error
    } =
        await supabaseClient
            .from("conversations")
            .update({
                updated_at:
                    timestamp
            })
            .eq(
                "id",
                conversationId
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.warn(
            "Conversation timestamp:",
            error
        );

    }


    const index =
        conversations.findIndex(
            (item) =>
                item.id ===
                conversationId
        );


    if (index !== -1) {

        conversations[index].updated_at =
            timestamp;


        conversations.sort(
            (a, b) =>
                new Date(b.updated_at) -
                new Date(a.updated_at)
        );

    }


    renderConversationList();

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage(
    forcedText = null
) {

    if (isGenerating) {
        return;
    }


    const text =
        forcedText !== null
            ? forcedText.trim()
            : messageInput.value.trim();


    if (!text) {
        return;
    }


    if (!currentUser) {

        showAuthScreen();

        return;
    }


    isGenerating =
        true;


    sendBtn.disabled =
        true;


    if (messageInput) {

        messageInput.value =
            "";

        autoResizeTextarea();

    }


    hideWelcome();


    try {

        /*
         * Create conversation first.
         */

        if (!currentConversationId) {

            const conversation =
                await createConversation(
                    text
                );


            if (!conversation) {

                throw new Error(
                    "Could not create conversation."
                );

            }

        }


        /*
         * Add user message.
         */

        currentConversationMessages.push({
            role:
                "user",

            content:
                text
        });


        addMessageToScreen(
            "user",
            text
        );


        await saveMessageToSupabase(
            currentConversationId,
            "user",
            text
        );


        await updateConversationTimestamp(
            currentConversationId
        );


        /*
         * Detect memory.
         */

        await detectMemory(text);


        /*
         * Generate answer.
         */

        showLoading();


        const aiText =
            await generateAIResponse(
                currentConversationMessages
            );


        hideLoading();


        currentConversationMessages.push({
            role:
                "ai",

            content:
                aiText
        });


        addMessageToScreen(
            "ai",
            aiText
        );


        await saveMessageToSupabase(
            currentConversationId,
            "ai",
            aiText
        );


        await updateConversationTimestamp(
            currentConversationId
        );


    } catch (error) {

        hideLoading();


        console.error(
            "NOVA message error:",
            error
        );


        addMessageToScreen(
            "ai",
            `I couldn't complete that request.\n\n${error.message || "Please try again."}`
        );

    } finally {

        isGenerating =
            false;

        sendBtn.disabled =
            false;

        messageInput?.focus();

    }

}


/* =========================================
   AI RESPONSE
========================================= */

async function generateAIResponse(
    conversationMessages
) {

    const messagesForAI =
        conversationMessages.map(
            (message) => ({

                role:
                    message.role === "ai"
                        ? "assistant"
                        : "user",

                content:
                    message.content

            })
        );


    const memoryContext =
        getMemoryContext();


    if (memoryContext) {

        messagesForAI.unshift({

            role:
                "system",

            content:
                `Relevant long-term memory about the user:

${memoryContext}

Use this information only when it is relevant. Do not mention that memory was injected unless useful to the conversation.`

        });

    }


    const response =
        await fetch(
            "/api/chat",
            {

                method:
                    "POST",

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


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "NOVA received an invalid server response."
        );

    }


    if (!response.ok) {

        throw new Error(
            data?.error ||
            "AI request failed."
        );

    }


    const aiText =
        data?.answer ||
        data?.reply ||
        data?.message ||
        data?.content;


    if (!aiText) {

        throw new Error(
            "NOVA returned an empty response."
        );

    }


    return aiText;

}


/* =========================================
   MESSAGE UI
========================================= */

function addMessageToScreen(
    role,
    content,
    scroll = true
) {

    if (!messagesContainer) {
        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        `message ${role}`;


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-content";


    const roleLabel =
        document.createElement(
            "span"
        );


    roleLabel.className =
        "message-role";


    roleLabel.textContent =
        role === "user"
            ? "You"
            : "NOVA";


    const text =
        document.createElement(
            "div"
        );


    text.className =
        "message-text";


    text.textContent =
        content;


    bubble.appendChild(
        roleLabel
    );


    bubble.appendChild(
        text
    );


    if (role === "ai") {

        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "message-actions";


        const copyButton =
            document.createElement(
                "button"
            );


        copyButton.className =
            "message-action";


        copyButton.textContent =
            "Copy";


        copyButton.addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        content
                    );


                    copyButton.textContent =
                        "Copied";


                    setTimeout(
                        () => {

                            copyButton.textContent =
                                "Copy";

                        },
                        1200
                    );

                } catch (error) {

                    console.error(
                        "Copy failed:",
                        error
                    );

                }

            }
        );


        const regenerateButton =
            document.createElement(
                "button"
            );


        regenerateButton.className =
            "message-action";


        regenerateButton.textContent =
            "↻ Regenerate";


        regenerateButton.addEventListener(
            "click",
            () => {

                regenerateLastResponse();

            }
        );


        actions.appendChild(
            copyButton
        );


        actions.appendChild(
            regenerateButton
        );


        bubble.appendChild(
            actions
        );

    }


    wrapper.appendChild(
        bubble
    );


    messagesContainer.appendChild(
        wrapper
    );


    if (scroll) {
        scrollToBottom();
    }

}


/* =========================================
   REGENERATE
========================================= */

async function regenerateLastResponse() {

    if (
        isGenerating ||
        !currentConversationId ||
        !currentConversationMessages.length
    ) {
        return;
    }


    const lastMessage =
        currentConversationMessages[
            currentConversationMessages.length - 1
        ];


    if (
        !lastMessage ||
        lastMessage.role !== "ai"
    ) {
        return;
    }


    isGenerating =
        true;


    sendBtn.disabled =
        true;


    try {

        currentConversationMessages.pop();


        const aiMessages =
            messagesContainer.querySelectorAll(
                ".message.ai"
            );


        if (aiMessages.length) {

            aiMessages[
                aiMessages.length - 1
            ].remove();

        }


        /*
         * Remove the latest AI message
         * safely using the latest message row.
         */

        const {
            data: latestAI,
            error: latestError
        } =
            await supabaseClient
                .from("messages")
                .select("id")
                .eq(
                    "conversation_id",
                    currentConversationId
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .eq(
                    "role",
                    "ai"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1);


        if (!latestError && latestAI?.[0]?.id) {

            await supabaseClient
                .from("messages")
                .delete()
                .eq(
                    "id",
                    latestAI[0].id
                )
                .eq(
                    "user_id",
                    currentUser.id
                );

        }


        showLoading();


        const aiText =
            await generateAIResponse(
                currentConversationMessages
            );


        hideLoading();


        currentConversationMessages.push({

            role:
                "ai",

            content:
                aiText

        });


        addMessageToScreen(
            "ai",
            aiText
        );


        await saveMessageToSupabase(
            currentConversationId,
            "ai",
            aiText
        );


        await updateConversationTimestamp(
            currentConversationId
        );


    } catch (error) {

        hideLoading();


        console.error(
            "Regeneration error:",
            error
        );


        addMessageToScreen(
            "ai",
            "I couldn't regenerate the response. Please try again."
        );

    } finally {

        isGenerating =
            false;

        sendBtn.disabled =
            false;

    }

}


/* =========================================
   LOADING
========================================= */

function showLoading() {

    hideLoading();


    const loading =
        document.createElement(
            "div"
        );


    loading.id =
        "novaLoading";


    loading.className =
        "nova-loading";


    const dot =
        document.createElement(
            "span"
        );


    dot.className =
        "loading-dot";


    const text =
        document.createElement(
            "span"
        );


    text.textContent =
        "NOVA is thinking…";


    loading.appendChild(
        dot
    );


    loading.appendChild(
        text
    );


    messagesContainer.appendChild(
        loading
    );


    scrollToBottom();

}


function hideLoading() {

    const loading =
        document.getElementById(
            "novaLoading"
        );


    if (loading) {
        loading.remove();
    }

}


/* =========================================
   CLEAR CHAT
========================================= */

function clearMessages() {

    if (messagesContainer) {

        messagesContainer.innerHTML =
            "";

    }


    currentConversationMessages =
        [];


    if (welcomeScreen) {

        welcomeScreen.style.display =
            "block";

    }

}


/* =========================================
   NEW CHAT
========================================= */

if (newChatBtn) {

    newChatBtn.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                showAuthScreen();

                return;

            }


            currentConversationId =
                null;


            currentConversationMessages =
                [];


            clearMessages();


            closeMobileSidebar();


            messageInput?.focus();

        }
    );

}


/* =========================================
   STARTER CARDS
========================================= */

starterCards.forEach(
    (card) => {

        card.addEventListener(
            "click",
            () => {

                const prompt =
                    card.dataset.prompt ||
                    "";


                if (prompt) {

                    sendMessage(
                        prompt
                    );

                }

            }
        );

    }
);


/* =========================================
   WELCOME
========================================= */

function hideWelcome() {

    if (welcomeScreen) {

        welcomeScreen.style.display =
            "none";

    }

}


/* =========================================
   SCROLL
========================================= */

function scrollToBottom() {

    if (!chatContainer) {
        return;
    }


    requestAnimationFrame(
        () => {

            chatContainer.scrollTop =
                chatContainer.scrollHeight;

        }
    );

}


/* =========================================
   TEXTAREA
========================================= */

function autoResizeTextarea() {

    if (!messageInput) {
        return;
    }


    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            150
        ) + "px";

}


if (messageInput) {

    messageInput.addEventListener(
        "input",
        autoResizeTextarea
    );


    messageInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        () => {

            sendMessage();

        }
    );

}


/* =========================================
   MOBILE SIDEBAR
========================================= */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "open"
            );


            sidebarOverlay?.classList.toggle(
                "active"
            );

        }
    );

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeMobileSidebar
    );

}


function closeMobileSidebar() {

    sidebar?.classList.remove(
        "open"
    );


    sidebarOverlay?.classList.remove(
        "active"
    );

}


/* =========================================
   THEME
========================================= */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "nova_theme"
        );


    if (savedTheme === "light") {

        document.body.classList.add(
            "light-theme"
        );


        updateThemeIcon(
            true
        );

    } else {

        document.body.classList.remove(
            "light-theme"
        );


        updateThemeIcon(
            false
        );

    }

}


function updateThemeIcon(
    isLight
) {

    if (!themeToggle) {
        return;
    }


    themeToggle.textContent =
        isLight
            ? "☀"
            : "☾";

}


function toggleTheme() {

    const isLight =
        document.body.classList.toggle(
            "light-theme"
        );


    localStorage.setItem(
        "nova_theme",
        isLight
            ? "light"
            : "dark"
    );


    updateThemeIcon(
        isLight
    );

}


if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        toggleTheme
    );

}


/* =========================================
   MEMORY
========================================= */

function getMemoryContext() {

    if (!novaMemories.length) {
        return "";
    }


    return novaMemories
        .map(
            memory =>
                memory.content
        )
        .join("\n");

}


async function detectMemory(
    text
) {

    if (
        !supabaseClient ||
        !currentUser
    ) {
        return;
    }


    const patterns = [

        /my name is (.+)/i,

        /i live in (.+)/i,

        /i am learning (.+)/i,

        /i'm learning (.+)/i,

        /my project is called (.+)/i,

        /my goal is (.+)/i,

        /i want to become (.+)/i

    ];


    let memoryText =
        null;


    for (
        const pattern of patterns
    ) {

        const match =
            text.match(pattern);


        if (match) {

            memoryText =
                match[0]
                    .trim()
                    .slice(0, 250);

            break;

        }

    }


    if (!memoryText) {
        return;
    }


    const alreadyExists =
        novaMemories.some(
            memory =>
                memory.content
                    .toLowerCase() ===
                memoryText.toLowerCase()
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

                user_id:
                    currentUser.id,

                content:
                    memoryText

            })
            .select()
            .single();


    if (error) {

        console.warn(
            "Memory save failed:",
            error
        );

        return;

    }


    if (data) {

        novaMemories.push(
            data
        );

    }

}


/* =========================================
   SETTINGS
========================================= */

if (settingsBtn) {

    settingsBtn.addEventListener(
        "click",
        () => {

            const email =
                currentUser?.email ||
                "Not available";


            const memoryCount =
                novaMemories.length;


            openModal(`

                <h2>Settings</h2>

                <p>
                    Manage your NOVA workspace.
                </p>

                <div class="modal-row">
                    <span>Account</span>
                    <strong>
                        ${escapeHTML(email)}
                    </strong>
                </div>

                <div class="modal-row">
                    <span>Conversations</span>
                    <strong>
                        ${conversations.length}
                    </strong>
                </div>

                <div class="modal-row">
                    <span>Memories</span>
                    <strong>
                        ${memoryCount}
                    </strong>
                </div>

                <div class="modal-row">
                    <span>AI Tools</span>
                    <strong>
                        Web + Research
                    </strong>
                </div>

                <div class="modal-row">
                    <span>Theme</span>
                    <strong>
                        ${
                            document.body.classList.contains(
                                "light-theme"
                            )
                                ? "Light"
                                : "Dark"
                        }
                    </strong>
                </div>

            `);


            closeMobileSidebar();

        }
    );

}


/* =========================================
   HELP
========================================= */

if (helpBtn) {

    helpBtn.addEventListener(
        "click",
        () => {

            openModal(`

                <h2>About NOVA</h2>

                <p>
                    NOVA is your AI workspace for
                    questions, learning, coding,
                    research, analysis, writing
                    and project development.
                </p>

                <br>

                <p>
                    NOVA can now use server-side AI
                    tools when appropriate, including
                    live web research and webpage
                    fetching.
                </p>

                <br>

                <p>
                    Start a conversation and ask NOVA
                    naturally. You do not need to
                    manually select a tool.
                </p>

            `);


            closeMobileSidebar();

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            if (!supabaseClient) {
                return;
            }


            try {

                await supabaseClient.auth.signOut();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


/* =========================================
   MODAL
========================================= */

function openModal(
    content
) {

    if (
        !modalOverlay ||
        !modalContent
    ) {
        return;
    }


    modalContent.innerHTML =
        content;


    modalOverlay.classList.add(
        "active"
    );

}


function closeModal() {

    modalOverlay?.classList.remove(
        "active"
    );

}


if (modalClose) {

    modalClose.addEventListener(
        "click",
        closeModal
    );

}


if (modalOverlay) {

    modalOverlay.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modalOverlay
            ) {

                closeModal();

            }

        }
    );

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================
   CONFIG ERROR
========================================= */

function showConfigError(
    message
) {

    if (!authScreen) {
        return;
    }


    authScreen.style.display =
        "flex";


    if (authMessage) {

        authMessage.textContent =
            `NOVA setup error: ${message}`;

    }

}


/* =========================================
   LOCAL TOOL COMPATIBILITY
========================================= */

/*
 * If nova/tools.js is still loaded from
 * index.html, NOVA can use it.
 *
 * The important difference from the previous
 * version is that local tools are handled BEFORE
 * the AI request only when a valid result exists.
 */

async function tryLocalTool(
    userText
) {

    if (
        typeof novaRunToolFromMessage !==
        "function"
    ) {

        return null;

    }


    try {

        const result =
            novaRunToolFromMessage(
                userText
            );


        if (!result) {
            return null;
        }


        const answer =
            typeof novaFormatToolResult ===
            "function"

                ? novaFormatToolResult(
                    result
                )

                : null;


        if (!answer) {
            return null;
        }


        return answer;

    } catch (error) {

        console.warn(
            "Local tool failed:",
            error
        );


        return null;

    }

}


/* =========================================
   START
========================================= */

updateAuthMode();

initializeSupabase();
