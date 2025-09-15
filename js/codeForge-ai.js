const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");

let userMessage = null;
let uniqueIdCounter = 0;
let chatHistory = [];
let selectedImage = null;
let imageBase64 = null;

// Speak text of AI
function speak(textId) {
  const textToSpeak = document.getElementById(textId).innerText;

  // Speak the text using responsiveVoice
  responsiveVoice.speak(textToSpeak, "UK English Male");

  // Hide the volume_up button, show voice_over_off, and also show pause button
  document.getElementById("volumeUp").style.display = "none";
  document.getElementById("voiceOff").style.display = "";
  document.getElementById("pauseBtn").style.display = ""; // Show pause button
}

function stopSpeak() {
  // Stop speaking using responsiveVoice
  responsiveVoice.cancel();

  // Hide the voice_over_off button, pause button, and show the volume_up button again
  document.getElementById("voiceOff").style.display = "none";
  document.getElementById("volumeUp").style.display = "";
  document.getElementById("pauseBtn").style.display = "none"; // Hide pause button
  document.getElementById("resumeBtn").style.display = "none"; // Hide resume button
}

function pauseSpeech() {
  // Pause the speech
  responsiveVoice.pause();

  // Hide pause button and show resume button
  document.getElementById("pauseBtn").style.display = "none";
  document.getElementById("resumeBtn").style.display = ""; // Show resume button
}

function resumeSpeech() {
  // Resume the speech
  responsiveVoice.resume();

  // Hide resume button and show pause button again
  document.getElementById("resumeBtn").style.display = "none";
  document.getElementById("pauseBtn").style.display = ""; // Show pause button
}



//store temprary chat
const loadLocalStorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "dark_mode";
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
  chatList.innerHTML = savedChats || "";

  chatList.scrollTo(0, chatList.scrollHeight);
  document.body.classList.toggle("hide-header", savedChats);
};

loadLocalStorageData();

const API_KEY = "AIzaSyBv17n2ysLziVxFDONU4OcuXGAiss0nWJE";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};



/**
 * Handles and displays code responses in a formatted manner.
 * @param {string} text - The AI response text.
 * @param {HTMLElement} textElement - The element where the text should be displayed.
 */
const formatAndDisplayCode = (text, textElement, incomingMessageDiv) => {
  // Utility function to escape special HTML characters
  const escapeHTML = (str) =>
    str.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // Utility function to format markdown-like syntax
  const formatMarkdown = (str) =>
    str.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // Bold syntax
      .replace(/_(.*?)_/g, "<i>$1</i>")      // Italic syntax
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/Gemini/g, "Forge")
      .replace(/gemini/g, "Forge")
      .replace(/developed by Google/g, "developed by Ritik")
      .replace(/मैं Google द्वारा /g, "मैं Ritik द्वारा ")
      .replace(/जिसे Google द्वारा /g, "जिसे Ritik द्वारा ")
      .replace(/जो Google द्वारा /g, "जो Ritik द्वारा ")
      .replace(/Google dwara/g, "Ritik dwara")
      .replace(/trained by Google/g, "trained by Ritik"); // Inline code syntax

  // Break paragraphs and lists into well-structured HTML
  const formatStructure = (str) =>
    str.replace(/(?:\d+)\.\s/g, '<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&bull; ') // Numbers to bullets
      .replace(/[\r\n]+/g, "<br>"); // Add line breaks for better structure

  // Match code blocks enclosed in ```language\ncode``` format
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  // Replace code blocks with formatted HTML
  const formattedText = text.replace(codeBlockRegex, (match, lang, code) => {
    const escapedCode = escapeHTML(code); // Escape special HTML characters
    const languageClass = lang ? `language-${lang}` : "language-javascript"; // Default to JavaScript
    const languageLabel = lang ? lang.toUpperCase() : "JAVASCRIPT";
    return `
    <div class="code-container">
      <div class="code-header">
        <span class="code-language">${languageLabel}</span>
        <span class="copy-button" onclick="copyCode(this)"> <img src="images/content_copy.png" alt="copy" width="24" height="24" /></span>
      </div>
      <pre class="code-format ${languageClass}"><code class="${languageClass}">${escapedCode}</code></pre>
    </div>
  `;
  });

  // Apply markdown and structural formatting to non-code content
  const finalText = formatStructure(formatMarkdown(formattedText));

  let currentIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerHTML = finalText.slice(0, currentIndex + 1);
    currentIndex++;

    // Stop typing effect once the entire formatted text is displayed
    if (currentIndex === finalText.length) {
      clearInterval(typingInterval);
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML);

      // Assign speak functionality dynamically
      const speakButton = incomingMessageDiv.querySelector("#volumeUp");
      speakButton.setAttribute("onclick", `speak('${textElement.id}')`);

    }

    // Hide the typing icon while typing
    incomingMessageDiv.querySelector(".icon").classList.add("hide");
    chatList.scrollTo(0, chatList.scrollHeight);
  }, 5);

  // showTypingEffcet(text, textElement, incomingMessageDiv);
};



const copyCode = (copyButton) => {
  const codeText = copyButton.closest(".code-container").querySelector("pre code").innerText;

  navigator.clipboard.writeText(codeText).then(() => {
    copyButton.innerText = "✔ Copied!";

  }).catch(err => console.error("Copy failed:", err));
};




const showTypingEffcet = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerHTML +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];


    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML);

      // Assign speak functionality dynamically
      const speakButton = incomingMessageDiv.querySelector("#volumeUp");
      speakButton.setAttribute("onclick", `speak('${textElement.id}')`);
    }
    chatList.scrollTo(0, chatList.scrollHeight);
  }, 8);

};


// Modified generateAPIResponse with chat memory and image support
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  try {
    // Create the user message object
    const userMessageObj = {
      role: "user",
      parts: []
    };

    // Add text if available
    if (userMessage) {
      userMessageObj.parts.push({ text: userMessage });
    }

    // Add image if available
    if (imageBase64) {
      userMessageObj.parts.push({
        inline_data: {
          mime_type: selectedImage.type,
          data: imageBase64
        }
      });
    }

    // Add to chat history
    chatHistory.push(userMessageObj);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory // Send entire chat history
      }),
    });

    const data = await response.json();
    const candidates = data?.candidates;
    const firstCandidate = candidates && candidates[0];
    const content = firstCandidate && firstCandidate.content;
    const textParts = content && content.parts;
    const apiResponse = textParts && textParts[0]?.text;

    if (apiResponse) {
      // Add AI response to chat history
      chatHistory.push({
        role: "model",
        parts: [{ text: apiResponse }]
      });

      const isCodeBlock = /```/.test(apiResponse);

      if (isCodeBlock) {
        formatAndDisplayCode(apiResponse, textElement, incomingMessageDiv);
      } else {
        formatAndDisplayCode(apiResponse, textElement, incomingMessageDiv);
      }
    } else {
      textElement.innerText =
        "Sorry, there was an issue connecting to the server. Please try again later.";
    }

  } catch (error) {
    console.log(error);
  } finally {
    incomingMessageDiv.classList.remove("loading");
    removeImage(); // Clear image after sending
  }
};





const showLoadingAnimation = () => {
  const uniqueId = `response-text-${++uniqueIdCounter}`;
  const html = `<div class="message-content">
                <img src="images/logo-white.png" alt="forge" class="avatar" >
                <p class="text" id="${uniqueId}">
                  
                </p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">
                content_copy
            </span>

            <span id="volumeUp" class="icon material-symbols-outlined speakIcon" >
                volume_up
            </span>
            <span id="voiceOff" class="icon material-symbols-outlined speakIcon" onclick="stopSpeak(this)" style="display: none;">
                voice_over_off
            </span>
            <span id="pauseBtn" class="icon material-symbols-outlined speakIcon" onclick="pauseSpeech(this)" style="display: none;">
                pause
            </span>
            <span id="resumeBtn" class="icon material-symbols-outlined speakIcon" onclick="resumeSpeech(this)" style="display: none;">
                play_arrow
            </span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);
  chatList.scrollTo(0, chatList.scrollHeight);

  generateAPIResponse(incomingMessageDiv);
};

const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done";

  setTimeout(() => (copyIcon.innerText = "content_copy"), 500);
};

// Modified handleOutGoingChat to accept message parameter
const handleOutGoingChat = (message) => {
  userMessage = message; // Use the passed message
  if (!userMessage && !selectedImage) return;

  // Create HTML for outgoing message
  let html = `<div class="message-content" id="user-promt">
                <img src="images/PHOTO-2024-09-04-07-46-16.jpg" alt="img" class="avatar">
                <p class="text">${userMessage || ''}</p>`;

  if (selectedImage) {
    html += `<div class="attached-image">
              <img src="${document.getElementById('previewImage').src}" alt="Attached image">
            </div>`;
  }

  html += `</div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  chatList.appendChild(outgoingMessageDiv);
  typingForm.reset();

  chatList.scrollTo(0, chatList.scrollHeight);

  document.body.classList.add("hide-header");
  setTimeout(showLoadingAnimation, 500);
};





// Update suggestion click handlers to pass message
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    const message = suggestion.querySelector(".text").innerText;
    handleOutGoingChat(message);
  });
});


toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "dark_mode" : "light_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all messages?")) {
    localStorage.removeItem("savedChats");
    loadLocalStorageData();
  }
});
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = typingForm.querySelector(".typing-input").value.trim();
  handleOutGoingChat(message);
  resetTextarea();
});





//when hit shift+enter 
const typingInput = document.querySelector(".typing-input");
const sendButton = document.querySelector(".send-button"); // Assuming  a send button


// Function to reset the textarea to its normal size
function resetTextarea() {
  typingInput.style.height = "auto"; // Reset height to auto
  typingInput.style.height = "55px";
}

// Auto-resize the textarea as the user types
typingInput.addEventListener("input", function () {
  this.style.height = "auto"; // Reset height to auto to calculate new height
  this.style.height = this.scrollHeight + "px"; // Set height based on content
});

// Handle Enter and Shift + Enter keypresses
typingInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    if (event.shiftKey) {
      // Shift + Enter: Add a new line
      return; // Allow default behavior
    } else {
      // Enter: Send the message
      event.preventDefault(); // Prevent newline behavior
      typingForm.requestSubmit(); // Trigger form submission
    }
  }
});

// Handle form submission logic
typingForm.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent page reload
  const message = typingInput.value.trim();

  if (message) {
    typingInput.value = ""; // Clear the textarea
    resetTextarea(); // Reset the height after clearing
  }
});




// Image handling functions
document.getElementById('imageInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (file) {
    selectedImage = file;
    const reader = new FileReader();
    reader.onload = function (event) {
      imageBase64 = event.target.result.split(',')[1];
      document.getElementById('previewImage').src = event.target.result;
      document.getElementById('imagePreviewContainer').style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }
});

function removeImage() {
  selectedImage = null;
  imageBase64 = null;
  document.getElementById('imageInput').value = '';
  document.getElementById('previewImage').src = '';
  document.getElementById('imagePreviewContainer').style.display = 'none';
}

