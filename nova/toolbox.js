(() => {
  "use strict";
  if (window.__NOVA_TOOLBOX_LOADED__) return;
  window.__NOVA_TOOLBOX_LOADED__ = true;

  const AI_TOOLS = [
    { id: "write", icon: "✍️", name: "AI Writer", desc: "Write, rewrite, improve tone" },
    { id: "summarize", icon: "🧠", name: "Summarizer", desc: "Turn long text into key points" },
    { id: "translate", icon: "🌐", name: "Translator", desc: "Translate between languages" },
    { id: "code", icon: "💻", name: "Code Generator", desc: "Create functions, apps and scripts" },
    { id: "explain_code", icon: "🔍", name: "Explain Code", desc: "Understand code step by step" },
    { id: "debug", icon: "🛠️", name: "Code Debugger", desc: "Find bugs and propose fixes" },
    { id: "prompt", icon: "🎯", name: "Prompt Improver", desc: "Turn rough ideas into strong prompts" },
    { id: "email", icon: "✉️", name: "Email Writer", desc: "Draft professional messages" },
    { id: "quiz", icon: "📝", name: "Quiz Maker", desc: "Generate practice questions" },
    { id: "flashcards", icon: "🗂️", name: "Flashcards", desc: "Create study cards from notes" },
    { id: "business", icon: "📈", name: "Business Planner", desc: "Plan an idea, MVP and next steps" },
    { id: "research", icon: "🌍", name: "Web Research", desc: "Research a question with search" },
    { id: "image", icon: "🎨", name: "Image Studio", desc: "Generate an image from a prompt" }
  ];

  const css = `
  #novaToolboxLaunch{position:fixed;right:18px;bottom:100px;z-index:9990;border:1px solid #c7d9ff;border-radius:999px;padding:12px 16px;background:linear-gradient(135deg,#fff,#edf4ff);color:#1647a8;box-shadow:0 10px 32px #376bc52b;font:700 13px/1.1 system-ui,sans-serif;cursor:pointer;display:flex;gap:8px;align-items:center}
  #novaToolboxLaunch:hover{transform:translateY(-2px);box-shadow:0 14px 36px #376bc540}
  #novaToolboxRoot{position:fixed;inset:0;z-index:9999;display:none;font-family:Inter,system-ui,-apple-system,sans-serif;color:#17233c}
  #novaToolboxRoot.open{display:block}
  #novaToolboxRoot *{box-sizing:border-box}
  #novaToolboxShade{position:absolute;inset:0;background:#07152bb0;backdrop-filter:blur(7px)}
  #novaToolboxPanel{position:absolute;right:0;top:0;height:100%;width:min(760px,100%);background:#f8faff;border-left:1px solid #dbe6fb;box-shadow:-20px 0 70px #061a3a33;display:flex;flex-direction:column;animation:novaToolSlide .22s ease-out}
  @keyframes novaToolSlide{from{transform:translateX(24px);opacity:.7}to{transform:translateX(0);opacity:1}}
  .nt-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:19px 22px;background:linear-gradient(115deg,#fff,#edf4ff);border-bottom:1px solid #dce7fa}
  .nt-brand{display:flex;gap:12px;align-items:center}.nt-logo{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;color:white;background:linear-gradient(145deg,#438bff,#2253c7);box-shadow:0 8px 20px #3979e632;font-size:21px}
  .nt-title{font-size:17px;font-weight:800;letter-spacing:-.3px}.nt-subtitle{font-size:12px;color:#71809b;margin-top:3px}.nt-close{border:1px solid #dce5f4;background:#fff;border-radius:12px;width:40px;height:40px;font-size:22px;color:#52627e;cursor:pointer}
  .nt-body{display:grid;grid-template-columns:235px minmax(0,1fr);min-height:0;flex:1}
  .nt-sidebar{padding:14px 10px;border-right:1px solid #e0e8f6;overflow:auto;background:#f2f6ff}.nt-label{font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#8a99b3;padding:8px 10px 10px}
  .nt-tool{display:flex;gap:10px;align-items:center;width:100%;border:1px solid transparent;background:transparent;padding:10px;border-radius:13px;text-align:left;cursor:pointer;color:#31415f;margin-bottom:4px}.nt-tool:hover{background:#e8f0ff}.nt-tool.active{background:#fff;border-color:#d3e2ff;box-shadow:0 4px 14px #3e72c10c;color:#1c56c2}.nt-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#e6efff;flex:none;font-size:16px}.nt-tool.active .nt-icon{background:#dce9ff}.nt-tool-name{font-size:12px;font-weight:750}.nt-tool-desc{font-size:10px;color:#8795ac;margin-top:3px;line-height:1.3}
  .nt-work{padding:22px;overflow:auto;min-width:0}.nt-work h3{margin:0;font-size:21px;letter-spacing:-.5px}.nt-work p.nt-help{font-size:13px;color:#75839b;line-height:1.5;margin:8px 0 20px}.nt-field-label{display:block;font-size:12px;font-weight:750;color:#3d4c68;margin:14px 0 8px}.nt-input,.nt-select{width:100%;border:1px solid #d6e1f2;background:#fff;border-radius:12px;padding:12px 13px;color:#17233c;font:13px/1.5 inherit;outline:none}.nt-input:focus,.nt-select:focus{border-color:#72a1ff;box-shadow:0 0 0 3px #438bff19}.nt-textarea{min-height:180px;resize:vertical}.nt-small{min-height:72px}.nt-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.nt-run{margin-top:16px;width:100%;border:0;border-radius:12px;padding:13px 16px;background:linear-gradient(110deg,#377eff,#2559cf);color:#fff;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 8px 20px #3476ed30}.nt-run:disabled{opacity:.55;cursor:wait}.nt-output-wrap{margin-top:20px;border:1px solid #dce6f6;background:#fff;border-radius:15px;overflow:hidden;display:none}.nt-output-wrap.show{display:block}.nt-output-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 13px;border-bottom:1px solid #e7edf7;background:#f9fbff;font-size:12px;font-weight:800}.nt-copy{border:1px solid #d6e1f2;background:white;color:#315da8;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:750;cursor:pointer}.nt-output{padding:15px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.65;color:#273650;max-height:45vh;overflow:auto}.nt-status{font-size:12px;color:#71809b;margin-top:10px;min-height:18px}.nt-images{display:grid;gap:12px}.nt-image{width:100%;height:auto;border-radius:12px;border:1px solid #dbe4f2;background:#f5f7fb}.nt-download{display:inline-block;margin:4px 0 0;color:#225cc8;font-size:12px;font-weight:700}
  @media(max-width:620px){#novaToolboxLaunch{right:12px;bottom:90px;padding:11px 13px}.nt-body{grid-template-columns:1fr}.nt-sidebar{display:flex;gap:7px;overflow-x:auto;overflow-y:hidden;border-right:0;border-bottom:1px solid #e0e8f6;padding:9px}.nt-label{display:none}.nt-tool{width:auto;min-width:116px;margin:0;padding:8px;flex-direction:column;align-items:flex-start;gap:5px}.nt-tool-desc{display:none}.nt-icon{width:30px;height:30px}.nt-work{padding:17px}.nt-textarea{min-height:145px}.nt-head{padding:14px 16px}}
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "novaToolboxLaunch";
  launcher.type = "button";
  launcher.innerHTML = "<span>✦</span><span>NOVA Tools</span>";
  launcher.setAttribute("aria-label", "Open NOVA AI toolbox");
  document.body.appendChild(launcher);

  const root = document.createElement("div");
  root.id = "novaToolboxRoot";
  root.innerHTML = `
    <div id="novaToolboxShade"></div>
    <section id="novaToolboxPanel" role="dialog" aria-modal="true" aria-label="NOVA AI Toolbox">
      <header class="nt-head"><div class="nt-brand"><div class="nt-logo">✦</div><div><div class="nt-title">NOVA AI Toolbox</div><div class="nt-subtitle">AI tools for writing, coding, study, research and images</div></div></div><button class="nt-close" id="ntClose" aria-label="Close toolbox">×</button></header>
      <div class="nt-body"><nav class="nt-sidebar" id="ntToolList"><div class="nt-label">AI TOOLS</div></nav>
      <main class="nt-work"><h3 id="ntHeading">Choose a tool</h3><p class="nt-help" id="ntDescription">Choose an AI tool from the list to get started.</p>
        <label class="nt-field-label" for="ntInput">Your request or content</label>
        <textarea id="ntInput" class="nt-input nt-textarea" placeholder="Describe what you want NOVA to do..."></textarea>
        <div id="ntExtras"></div>
        <button class="nt-run" id="ntRun">Run tool ✦</button><div class="nt-status" id="ntStatus" role="status"></div>
        <section class="nt-output-wrap" id="ntOutputWrap"><div class="nt-output-head"><span id="ntOutputTitle">Result</span><button class="nt-copy" id="ntCopy">Copy result</button></div><div class="nt-output" id="ntOutput"></div></section>
      </main></div>
    </section>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  let activeTool = null;
  let lastText = "";
  let lastImages = [];

  const toolExamples = {
    write: "Rewrite this text to sound clear, confident and professional:\n[paste your text]",
    summarize: "Summarize the following material into key points:\n[paste text]",
    translate: "Translate into French:\nHello, how are you today?",
    code: "Create a responsive HTML/CSS/JavaScript to-do app with add, complete, delete and local storage. Give complete files.",
    explain_code: "Explain what this code does, step by step:\n[paste code]",
    debug: "Find the bug and provide a corrected version. Error message: [paste error and code]",
    prompt: "Create a hyper-realistic 8K professional-camera wallpaper of a BMW at night.",
    email: "Write a polite professional email asking for more information about a service.",
    quiz: "Create a 10-question quiz about JavaScript fundamentals for a beginner.",
    flashcards: "Create flashcards from these notes:\n[paste notes]",
    business: "Plan a small AI service business I can start with a phone and a low budget.",
    research: "Research the current capabilities and pricing of AI image generation APIs. Cite source URLs.",
    image: "A hyper-realistic blue sports car on a wet city street at night, professional automotive photography, cinematic reflections, sharp focus, 16:9 composition."
  };

  function chooseTool(id) {
    activeTool = AI_TOOLS.find(t => t.id === id) || AI_TOOLS[0];
    root.querySelectorAll(".nt-tool").forEach(b => b.classList.toggle("active", b.dataset.id === activeTool.id));
    $("#ntHeading").textContent = activeTool.name;
    $("#ntDescription").textContent = activeTool.desc + (activeTool.id === "image" ? " — creates an actual image when your OpenRouter model supports image generation." : " — powered by the AI model configured in your server environment.");
    $("#ntInput").placeholder = toolExamples[activeTool.id] || "Describe your task...";
    $("#ntInput").value = "";
    $("#ntExtras").innerHTML = activeTool.id === "image"
      ? `<label class="nt-field-label" for="ntAspect">Image aspect ratio</label><select class="nt-select" id="ntAspect"><option value="1:1">Square — 1:1</option><option value="16:9">Landscape — 16:9</option><option value="9:16">Portrait — 9:16</option><option value="4:3">Photo — 4:3</option><option value="3:4">Portrait photo — 3:4</option><option value="3:2">Landscape photo — 3:2</option><option value="2:3">Portrait photo — 2:3</option></select>`
      : `<label class="nt-field-label" for="ntInstructions">Extra instructions (optional)</label><textarea class="nt-input nt-small" id="ntInstructions" placeholder="Tone, language, format, target audience, programming language... "></textarea>`;
    $("#ntRun").textContent = activeTool.id === "image" ? "Generate image ✦" : "Run " + activeTool.name + " ✦";
    $("#ntStatus").textContent = "";
    $("#ntOutputWrap").classList.remove("show");
    lastText = ""; lastImages = [];
  }

  const list = $("#ntToolList");
  AI_TOOLS.forEach((tool, index) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "nt-tool"; b.dataset.id = tool.id;
    b.innerHTML = `<span class="nt-icon">${tool.icon}</span><span><div class="nt-tool-name">${tool.name}</div><div class="nt-tool-desc">${tool.desc}</div></span>`;
    b.addEventListener("click", () => chooseTool(tool.id));
    list.appendChild(b);
  });

  function open() { root.classList.add("open"); if (!activeTool) chooseTool("write"); }
  function close() { root.classList.remove("open"); }
  launcher.addEventListener("click", open);
  $("#ntClose").addEventListener("click", close);
  $("#novaToolboxShade").addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && root.classList.contains("open")) close(); });

  function setTextOutput(text, title) {
    lastText = String(text || ""); lastImages = [];
    $("#ntOutputTitle").textContent = title || "Result";
    $("#ntOutput").textContent = lastText;
    $("#ntOutputWrap").classList.add("show");
    $("#ntCopy").style.display = "inline-block";
  }

  function setImageOutput(data) {
    lastImages = Array.isArray(data.images) ? data.images : [];
    lastText = data.answer || "Image generated by NOVA AI.";
    $("#ntOutputTitle").textContent = "Generated image";
    const out = $("#ntOutput"); out.textContent = "";
    const wrap = document.createElement("div"); wrap.className = "nt-images";
    if (lastText && !/^image generated successfully\.?$/i.test(lastText.trim())) {
      const caption = document.createElement("p"); caption.textContent = lastText; wrap.appendChild(caption);
    }
    lastImages.forEach((src, i) => {
      const img = document.createElement("img"); img.className = "nt-image"; img.alt = "Image generated by NOVA AI"; img.src = src; img.loading = "lazy"; wrap.appendChild(img);
      if (/^https?:/i.test(src)) {
        const link = document.createElement("a"); link.href = src; link.target = "_blank"; link.rel = "noopener noreferrer"; link.className = "nt-download"; link.textContent = `Open image ${i + 1} in new tab`; wrap.appendChild(link);
      }
    });
    out.appendChild(wrap);
    $("#ntOutputWrap").classList.add("show");
    $("#ntCopy").style.display = "none";
  }

  $("#ntCopy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(lastText);
      $("#ntCopy").textContent = "Copied ✓";
      setTimeout(() => { $("#ntCopy").textContent = "Copy result"; }, 1300);
    } catch {
      const area = document.createElement("textarea"); area.value = lastText; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
      $("#ntCopy").textContent = "Copied ✓";
    }
  });

  $("#ntRun").addEventListener("click", async () => {
    if (!activeTool) return;
    const input = $("#ntInput").value.trim();
    if (!input) { $("#ntStatus").textContent = "Enter a request or some content first."; $("#ntInput").focus(); return; }
    const btn = $("#ntRun"); btn.disabled = true;
    btn.textContent = activeTool.id === "image" ? "Generating image…" : "Working…";
    $("#ntStatus").textContent = activeTool.id === "image" ? "Image generation can take a little time and may use API credits." : "NOVA is working on your request…";
    $("#ntOutputWrap").classList.remove("show");
    try {
      if (activeTool.id === "image") {
        const response = await fetch("/api/image", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input, aspectRatio: $("#ntAspect")?.value || "1:1" })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || `Image request failed (${response.status}).`);
        setImageOutput(data);
        $("#ntStatus").textContent = `Image generated using ${data.model || "OpenRouter"}.`;
      } else {
        const response = await fetch("/api/toolbox", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: activeTool.id, input, instructions: $("#ntInstructions")?.value || "" })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || `Tool request failed (${response.status}).`);
        setTextOutput(data.answer, data.title || activeTool.name);
        $("#ntStatus").textContent = `Completed with ${data.model || "the configured AI model"}.`;
      }
    } catch (error) {
      $("#ntStatus").textContent = error?.message || "The tool failed. Please try again.";
      setTextOutput(error?.message || "The tool failed. Please try again.", "Tool error");
    } finally {
      btn.disabled = false;
      btn.textContent = activeTool.id === "image" ? "Generate image ✦" : "Run " + activeTool.name + " ✦";
    }
  });

  // Optional global entry point for opening the toolbox from another UI button.
  window.NOVA_TOOLBOX = { open, close, tools: AI_TOOLS };
})();
