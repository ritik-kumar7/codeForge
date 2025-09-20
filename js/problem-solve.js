const urlParams = new URLSearchParams(window.location.search);
let problemIndex = urlParams.get("index");
const runBtn = document.getElementById("run-btn");
const submitBtn = document.getElementById("submit-btn");
const subHead = document.getElementById("submissions-head");
const desHead = document.getElementById("des-head");
const aiHead = document.getElementById("ai-head");
let problemContent = document.getElementById("problem-content");
const solutionHead= document.getElementById("solution-head")
// Code editor functionality
const codeEditor = document.getElementById("code-editor");
const languageSelector = document.querySelector(".language-selector");
let lastSubmissionHTML = "";




// ==== JUDGE_API call and get data section ====

const JUDGE_API =
  "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";
// If you want to use RapidAPI (as you did), put your key here. Leave empty to use public CE endpoint.
const RAPIDAPI_KEY = "fe81c33ec0mshbadcf5481793dd2p1cf45bjsn568419d4bb43"; // e.g. "fe81c33ec0msh..." or "" to use public endpoint

// language id map for Judge0
const langIds = {
  javascript: 63,
  python: 71,
  java: 62,
  "c++": 54,
  c: 50,
};

// small helpers
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function normalize(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/\s+/g, "")
    .replace(/[\r\n]/g, "");
}

// unified submission to Judge0 (returns parsed JSON)
async function sendToJudge0({ source_code, language_id, stdin }) {
  const body = {
    source_code,
    language_id,
    stdin: stdin || "",
  };

  const headers = {
    "Content-Type": "application/json",
  };

  let url = JUDGE_API;
  // If user provided a RapidAPI key, use their RapidAPI host path (same endpoint but required headers)
  if (RAPIDAPI_KEY && RAPIDAPI_KEY.trim() !== "") {
    url =
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";
    headers["X-RapidAPI-Key"] = RAPIDAPI_KEY;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 522) {
      throw new Error('Judge0 service is temporarily unavailable. Please try again in a few minutes.');
    }
    throw new Error(`Judge0 API error: ${res.status} ${res.statusText}`);
  }
  let data = res.json();
  console.log(data);
  return data;
}

/* --------- RUN button (runs sample test cases and shows results in Output tab) ---------- */
runBtn.addEventListener("click", async () => {
  // Switch output tab UI
  document.getElementById("test-section").classList.remove("active");
  document.getElementById("output-section").classList.add("active");

  const consoleArea = document.getElementById("console-area");
  consoleArea.innerHTML = ""; // clear

  if (
    !currentProblem ||
    !currentProblem.testCases ||
    currentProblem.testCases.length === 0
  ) {
    consoleArea.innerHTML =
      "<div class='test-case'><div class='input-output'><strong>Error:</strong> No test cases available for this problem.</div></div>";
    return;
  }

  const codeValue = editor.getValue();
  const languageId = langIds[languageChoose.value] || 63;

  // Run just first 2 sample test cases
  const sampleTestCases = currentProblem.testCases.slice(0, 2);

  // Header
  const header = document.createElement("div");
  header.className = "run-header";
  header.innerHTML = `<strong>Running ${sampleTestCases.length} sample test case(s)...</strong>`;
  consoleArea.appendChild(header);

  for (let i = 0; i < sampleTestCases.length; i++) {
    const tc = sampleTestCases[i];
    const tcWrapper = document.createElement("div");
    tcWrapper.className = "test-case";
    tcWrapper.innerHTML = `<div class="test-case-header">
      <div class="test-case-title">Test Case ${i + 1}</div>
      <div class="test-case-result pending">Running</div>
      </div>
      <div class="input-output">
        <div><strong>Input:</strong> ${escapeHtml(tc.input)}</div>
        <div><strong>Expected:</strong> ${escapeHtml(tc.output)}</div>
        <div class="run-output"><strong>Output:</strong> <span class="out-value">...</span></div>
      </div>`;
    consoleArea.appendChild(tcWrapper);

    try {
      const result = await sendToJudge0({
        source_code: codeValue,
        language_id: languageId,
        stdin: tc.input,
      });

      const output = (result.stdout || "").trim();
      const compileOut = result.compile_output || "";
      const stderr = result.stderr || "";

      const passed = normalize(output) === normalize(tc.output);

      // update UI
      tcWrapper.querySelector(
        ".test-case-result"
      ).className = `test-case-result ${passed ? "success" : "failure"}`;
      tcWrapper.querySelector(".test-case-result").textContent = passed
        ? "Passed"
        : "Failed";

      const outElem = tcWrapper.querySelector(".out-value");
      let display = output || compileOut || stderr || "No output";
      display = escapeHtml(display);
      outElem.innerHTML =
        display +
        `<div style="font-size:12px;margin-top:6px;color:#666;"><strong>Time:</strong> ${
          result.time || 0
        }s &nbsp; <strong>Memory:</strong> ${result.memory || 0}KB</div>`;
    } catch (err) {
      tcWrapper.querySelector(
        ".test-case-result"
      ).className = `test-case-result failure`;
      tcWrapper.querySelector(".test-case-result").textContent = `Error`;
      tcWrapper.querySelector(".out-value").innerHTML = escapeHtml(err.message);
    }
  }
});



// ============ code submitBtn function =============

async function codeSubmit() {
  const codeValue = editor.getValue();
  const languageId = langIds[languageChoose.value] || 63;

  // switch to Submissions tab UI

  desHead.classList.remove("active");
  subHead.classList.add("active");

  problemContent.innerHTML =
    "<div class='console-output'>Submitting your code and running all test cases...</div>";

  if (
    !currentProblem ||
    !currentProblem.testCases ||
    currentProblem.testCases.length === 0
  ) {
    problemContent.innerHTML = `<div class="submission-result submission-failure"><h3>Error</h3><p>No test cases available.</p></div>`;
    return;
  }

  const allTestCases = currentProblem.testCases;
  let passedCount = 0;
  let totalExecutionTime = 0;
  let maxMemory = 0;
  const testResults = [];

  // run each test sequentially (keeps ordering and easier debugging)
  for (let i = 0; i < allTestCases.length; i++) {
    const tc = allTestCases[i];
    try {
      const res = await sendToJudge0({
        source_code: codeValue,
        language_id: languageId,
        stdin: tc.input,
      });

      const output = (res.stdout || "").trim();
      const compileOut = res.compile_output || "";
      const stderr = res.stderr || "";
      const shownOutput = output || compileOut || stderr || "";

      const passed = normalize(output) === normalize(tc.output);
      if (passed) passedCount++;

      totalExecutionTime += Number(res.time || 0);
      maxMemory = Math.max(maxMemory, Number(res.memory || 0));

      testResults.push({
        input: tc.input,
        expected: tc.output,
        output: shownOutput,
        passed,
        time: res.time || 0,
        memory: res.memory || 0,
      });
    } catch (err) {
      testResults.push({
        input: tc.input,
        expected: tc.output,
        output: `Error: ${err.message}`,
        passed: false,
        time: 0,
        memory: 0,
      });
    }
  }

  const avgTime = totalExecutionTime / allTestCases.length;
  const successRate = (passedCount / allTestCases.length) * 100;

  // Build submission HTML
  let resultsHTML = `
    <div class="submission-result ${
      successRate === 100 ? "submission-success" : "submission-failure"
    }">
      <h3>${successRate === 100 ? "Accepted" : "Wrong Answer"}</h3>
      <p>${passedCount} out of ${allTestCases.length} test cases passed</p>
      <div class="metrics-container">
        <div class="metric">
          <div class="metric-value">${avgTime.toFixed(2)}s</div>
          <div class="metric-label">Average Time</div>
        </div>
        <div class="metric">
          <div class="metric-value">${maxMemory}KB</div>
          <div class="metric-label">Memory (max)</div>
        </div>
        <div class="metric">
          <div class="metric-value">${successRate.toFixed(0)}%</div>
          <div class="metric-label">Success Rate</div>
        </div>
      </div>
    </div>
    <h3>Test Cases:</h3>
  `;

  testResults.forEach((r, idx) => {
    resultsHTML += `
      <div class="test-case">
        <div class="test-case-header">
          <div class="test-case-title">Test Case ${idx + 1}</div>
          <div class="test-case-result ${r.passed ? "success" : "failure"}">
            ${r.passed ? "Passed" : "Failed"}
          </div>
        </div>
        <div class="input-output">
          <div><strong>Input:</strong> ${escapeHtml(r.input)}</div>
          <div><strong>Expected:</strong> ${escapeHtml(r.expected)}</div>
          <div><strong>Output:</strong> ${escapeHtml(r.output)}</div>
          <div><strong>Time:</strong> ${r.time}s</div>
          <div><strong>Memory:</strong> ${r.memory}KB</div>
        </div>
      </div>
    `;
  });

  problemContent.innerHTML = resultsHTML;
  lastSubmissionHTML = resultsHTML;
}

/* --------- SUBMIT button (runs all test cases and shows detailed submission view) ---------- */
submitBtn.addEventListener("click", codeSubmit);

// Tab functionality
const tabs = document.querySelectorAll(".tab");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

// Console tabs functionality
const consoleTabs = document.querySelectorAll(".console-tab");
consoleTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    consoleTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  });
});



// Example of changing syntax based on language
languageSelector.addEventListener("change", (e) => {
  const language = e.target.value;
  // In a real app, you would change the editor mode here
  console.log(`Language changed to: ${language}`);
});

// Update the showProblem function to store the problem data
async function showProblem(problemIndex) {
  try {
    const response = await fetch("../datas/problems.json");
    const data = await response.json();
    currentProblem = data[problemIndex];

    document.title = `CodeForge - ${currentProblem.title}`;
    let prNum=Number(problemIndex);
    prNum++;

    // Update problem description
    //  problemContent = document.querySelector("#problem-content");
    problemContent.innerHTML = `
       <h1 class="problem-title">${(prNum) + ". " +currentProblem.title}</h1>
          <div class="difficulty  ${currentProblem.difficulty.toLowerCase()}">${
      currentProblem.difficulty.charAt(0).toUpperCase() +
      currentProblem.difficulty.slice(1)
    }</div>
      <p>${currentProblem.description}</p>
      
      ${currentProblem.examples
        .map(
          (example, idx) => `
        <h3 class='exp'>Example ${idx + 1}:</h3>
        <div class="example">
          <p><strong>Input:</strong> ${example.input}</p>
          <p><strong>Output:</strong> ${example.output}</p>
        </div>
      `
        )
        .join("")}
      
      <h3>Constraints:</h3>
      <div class="constraints">
        ${currentProblem.constraints
          .map((constraint) => `<p>${constraint}</p>`)
          .join("")}
      </div>
    `;

    // ✅ NEW: also update test cases dynamically in console
    const consoleArea = document.getElementById("console-area");
    consoleArea.innerHTML = currentProblem.testCases
      .map(
        (tc, i) => `
      <div class="test-case">
        <div class="test-case-header">
          <div class="test-case-title">Test Case ${i + 1}</div>
        </div>
        <div class="input-output">
          <div><strong>Input:</strong> ${tc.input}</div>
          <div><strong>Expected:</strong> ${tc.output}</div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading problem:", error);
  }
}


// =============== description Heading click function =============
desHead.addEventListener("click", () => {
  desHead.classList.add("active");
  subHead.classList.remove("active");
  showProblem(problemIndex);
});


// AI section with chat functionality
let aiChatHistory = [];
let aiUniqueIdCounter = 0;
let aiChatHTML = '';
const AI_API_KEY = "AIzaSyBv17n2ysLziVxFDONU4OcuXGAiss0nWJE";
const AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`;

aiHead.addEventListener("click", () => {
  // Switch to AI tab
  tabs.forEach(t => t.classList.remove('active'));
  aiHead.classList.add('active');
  
  problemContent.innerHTML = `
    <div class="ai-chat-container">
      <div class="ai-header">
        <h3>Forge Ai - Get Help with Your Code</h3>
        <p>Ask questions about algorithms, debugging, or problem-solving approaches</p>
      </div>
      <div class="ai-chat-list" id="ai-chat-list">${aiChatHTML}</div>
      <div class="ai-input-area">
        <form class="ai-typing-form" id="ai-typing-form">
          <div class="ai-input-wrapper">
            <textarea placeholder="Ask me about this problem, algorithms, or debugging..." class="ai-typing-input" rows="2"></textarea>
            <button type="submit" class="ai-send-btn">Send</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add event listener for AI form
  document.getElementById('ai-typing-form').addEventListener('submit', handleAIChat);
  
  // Scroll to bottom if there's chat history
  if (aiChatHTML) {
    const chatList = document.getElementById('ai-chat-list');
    chatList.scrollTop = chatList.scrollHeight;
  }
});

function handleAIChat(e) {
  e.preventDefault();
  const input = e.target.querySelector('.ai-typing-input');
  const message = input.value.trim();
  if (!message) return;
  
  // Add user message
  addAIMessage(message, 'user');
  input.value = '';
  
  // Generate AI response
  generateAIResponse(message);
}

function addAIMessage(content, type) {
  const chatList = document.getElementById('ai-chat-list');
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-${type}`;
  
  if (type === 'user') {
    messageDiv.innerHTML = `<div class="ai-message-content">${content}</div>`;
  } else {
    const uniqueId = `ai-response-${++aiUniqueIdCounter}`;
    messageDiv.innerHTML = `
      <div class="ai-message-content" id="${uniqueId}">${content}</div>
      <div class="ai-loading" style="display: none;">
        <div class="ai-loading-dot"></div>
        <div class="ai-loading-dot"></div>
        <div class="ai-loading-dot"></div>
      </div>
    `;
  }
  
  chatList.appendChild(messageDiv);
  chatList.scrollTop = chatList.scrollHeight;
  
  // Store chat HTML
  aiChatHTML = chatList.innerHTML;
  
  return messageDiv;
}

async function generateAIResponse(userMessage) {
  const loadingDiv = addAIMessage('', 'assistant');
  const loadingElement = loadingDiv.querySelector('.ai-loading');
  const contentElement = loadingDiv.querySelector('.ai-message-content');
  
  loadingElement.style.display = 'flex';
  
  try {
    // Add context about current problem
    const contextMessage = `Current problem: ${currentProblem?.title || 'Unknown'}\n\nUser question: ${userMessage}`;
    
    aiChatHistory.push({ role: "user", parts: [{ text: contextMessage }] });
    
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: aiChatHistory })
    });
    
    const data = await response.json();
    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiResponse) {
      aiChatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
      
      loadingElement.style.display = 'none';
      
      // Format response with code highlighting and auto-insert to editor
      const formattedResponse = aiResponse
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
          // Auto-insert code into Monaco editor with typing animation
          if (editor && code.trim()) {
            typeCodeInEditor(code.trim());
          }
          return `<div class="ai-code-container"><div class="ai-code-header"><span>${lang || 'Code'}</span><button class="ai-copy-btn" onclick="copyAICode(this)"><i class="fas fa-copy"></i></button></div><pre class="ai-code"><code>${code}</code></pre></div>`;
        })
        .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      
      contentElement.innerHTML = formattedResponse;
      
      // Update stored chat HTML
      aiChatHTML = document.getElementById('ai-chat-list').innerHTML;
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    loadingElement.style.display = 'none';
    contentElement.innerHTML = 'Sorry, I encountered an error. Please try again.';
  }
}

function typeCodeInEditor(code) {
  if (!editor) return;
  
  const lines = code.split('\n');
  let currentLine = 0;
  
  editor.setValue('');
  
  const typeInterval = setInterval(() => {
    if (currentLine < lines.length) {
      const currentValue = editor.getValue();
      const newValue = currentValue + (currentLine > 0 ? '\n' : '') + lines[currentLine];
      editor.setValue(newValue);
      
      // Move cursor to end
      const lineCount = editor.getModel().getLineCount();
      const lastLineLength = editor.getModel().getLineLength(lineCount);
      editor.setPosition({ lineNumber: lineCount, column: lastLineLength + 1 });
      
      currentLine++;
    } else {
      clearInterval(typeInterval);
    }
  }, 300);
}

function copyAICode(button) {
  const codeBlock = button.closest('.ai-code-container').querySelector('code');
  const code = codeBlock.innerText;
  
  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.style.color = '#22c55e';
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.color = '';
    }, 2000);
  });
}

function updateUrl(index) {
  const url = new URL(window.location);
  url.searchParams.set("index", index);
  window.history.pushState({}, "", url); // updates URL without reload
}

function leftPorblem() {
  if (problemIndex > 0 && problemIndex <= 19) {
    problemIndex--;
    showProblem(problemIndex);
    updateUrl(problemIndex);
  }
}
function rightProblme() {
  if (problemIndex >= 0 && problemIndex < 19) {
    problemIndex++;
    showProblem(problemIndex);
    updateUrl(problemIndex);
  }
}
subHead.addEventListener("click", () => {
  desHead.classList.remove("active");
  subHead.classList.add("active");

  if (lastSubmissionHTML) {
    problemContent.innerHTML = lastSubmissionHTML;
  } else {
    problemContent.innerHTML =
      "<p>No submissions yet. Please submit your code first.</p>";
  }
});



solutionHead.addEventListener('click',()=>{
 tabs.forEach(t => t.classList.remove('active'));
  solutionHead.classList.add('active');
   
  if (currentProblem && currentProblem.solutions) {
    problemContent.innerHTML = `
      <div class="solution-container">
        <h2>Solution Approaches</h2>
        
        <div class="solution-section">
          <h3>📺 Video Tutorial</h3>
          <div class="video-container">
            <iframe width="100%" height="315" src="${currentProblem.solutions.youtube.replace('youtu.be/', 'youtube.com/embed/').replace('watch?v=', 'embed/').split('?')[0]}" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
        
        <div class="solution-section">
          <h3>🧠 Algorithm Approach</h3>
          <div class="approach-content">
            <p>${currentProblem.solutions.approach}</p>
          </div>
        </div>
      </div>
    `;
  } else {
    problemContent.innerHTML = '<p>Solution not available for this problem.</p>';
  }

  

})



// Initialize with the first problem
showProblem(problemIndex);
