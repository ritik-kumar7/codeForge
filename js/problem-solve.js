

    const urlParams = new URLSearchParams(window.location.search);
    const problemIndex = urlParams.get("index");
          const runBtn=document.getElementById("run-btn");
      const submitBtn=document.getElementById("submit-btn");
const JUDGE_API = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";
let currentProblem = null;
// Mapping language names to Judge0 IDs
const langIds = {
  javascript: 63,
  python: 71,
  java: 62,
  "c++": 54,
  c: 50,
};



    // Modified submit button event listener
    submitBtn.addEventListener("click", async () => {
      const codeValue = editor.getValue();
      const languageId = langIds[languageChoose.value] || 63; // Default to JavaScript
      
      // Switch to submissions tab
      const subHead = document.getElementById("submissions-head");
      const desHead = document.getElementById("des-head");
      desHead.classList.remove('active');
      subHead.classList.add('active');
      
      const problemContent = document.getElementById("problem-content");
      problemContent.innerHTML = "<div class='console-output'>Submitting your code...</div>";
      
      try {
        // Run all test cases for submission
        const allTestCases = currentProblem.testCases;
        let passedCount = 0;
        let totalExecutionTime = 0;
        let totalMemory = 0;
        
        const testResults = [];
        
        for (let i = 0; i < allTestCases.length; i++) {
          const testCase = allTestCases[i];
          
          const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": "fe81c33ec0mshbadcf5481793dd2p1cf45bjsn568419d4bb43",
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
            },
            body: JSON.stringify({
              source_code: codeValue,
              language_id: languageId,
              stdin: testCase.input
            })
          });

          const result = await response.json();
          console.log(result)
const output = (result.stdout || "").trim();
const error = result.stderr || result.compile_output || "";

// Normalize both expected and actual outputs
const normalize = (str) => str.replace(/\s+/g, "").replace(/[\r\n]/g, "");

// Use normalized compare
const passed = normalize(output) === normalize(testCase.output);
          
          if (passed) passedCount++;
          
          totalExecutionTime += result.time || 0;
          totalMemory = Math.max(totalMemory, result.memory || 0);
          
          testResults.push({
            input: testCase.input,
            expected: testCase.output,
            output: output || error,
            passed: passed,
            time: result.time || 0,
            memory: result.memory || 0
          });
        }
        
        // Calculate averages
        const avgTime = totalExecutionTime / allTestCases.length;
        const successRate = (passedCount / allTestCases.length) * 100;
        
        // Display submission results
        let resultsHTML = `
          <div class="submission-result ${successRate === 100 ? 'submission-success' : 'submission-failure'}">
            <h3>${successRate === 100 ? 'Accepted' : 'Wrong Answer'}</h3>
            <p>${passedCount} out of ${allTestCases.length} test cases passed</p>
            
            <div class="metrics-container">
              <div class="metric">
                <div class="metric-value">${avgTime.toFixed(2)}s</div>
                <div class="metric-label">Average Time</div>
              </div>
              <div class="metric">
                <div class="metric-value">${totalMemory}KB</div>
                <div class="metric-label">Memory</div>
              </div>
              <div class="metric">
                <div class="metric-value">${successRate.toFixed(0)}%</div>
                <div class="metric-label">Success Rate</div>
              </div>
            </div>
          </div>
        `;
        
        // Add detailed test results
        resultsHTML += `<h3>Test Cases:</h3>`;
        
        testResults.forEach((result, idx) => {
          resultsHTML += `
            <div class="test-case">
              <div class="test-case-header">
                <div class="test-case-title">Test Case ${idx + 1}</div>
                <div class="test-case-result ${result.passed ? 'success' : 'failure'}">
                  ${result.passed ? 'Passed' : 'Failed'}
                </div>
              </div>
              <div class="input-output">
                <div><strong>Input:</strong> ${result.input}</div>
                <div><strong>Expected:</strong> ${result.expected}</div>
                <div><strong>Output:</strong> ${result.output}</div>
                <div><strong>Time:</strong> ${result.time}s</div>
                <div><strong>Memory:</strong> ${result.memory}KB</div>
              </div>
            </div>
          `;
        });
        
        problemContent.innerHTML = resultsHTML;
        
      } catch (error) {
        problemContent.innerHTML = `
          <div class="submission-result submission-failure">
            <h3>Submission Error</h3>
            <p>${error.message}</p>
          </div>
        `;
      }
    });




    // Modified run button event listener
    runBtn.addEventListener("click", async () => {
      document.getElementById("test-section").classList.remove('active');
      document.getElementById("output-section").classList.add('active');
      
      const codeValue = editor.getValue();
      const languageId = langIds[languageChoose.value] || 63; // Default to JavaScript
      
      const consoleArea = document.getElementById("console-area");
      consoleArea.innerHTML = ""; // Clear previous results
      
      // Use the test cases from the current problem
      if (!currentProblem || !currentProblem.testCases) {
        consoleArea.textContent = "Error: No test cases available for this problem.";
        return;
      }
      
      // Show only a few sample test cases for running
      const sampleTestCases = currentProblem.testCases.slice(0, 2);
      
      consoleArea.textContent = "Running sample test cases...\n\n";
      
      for (let i = 0; i < sampleTestCases.length; i++) {
        const testCase = sampleTestCases[i];
        
        try {
          const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": "fe81c33ec0mshbadcf5481793dd2p1cf45bjsn568419d4bb43",
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
            },
            body: JSON.stringify({
              source_code: codeValue,
              language_id: languageId,
              stdin: testCase.input
            })
          });

          const result = await response.json();
const output = (result.stdout || "").trim();
const error = result.stderr || result.compile_output || "";

// Normalize both expected and actual outputs
const normalize = (str) => str.replace(/\s+/g, "").replace(/[\r\n]/g, "");

// Use normalized compare
const passed = normalize(output) === normalize(testCase.output);
          
          // Create test case result element
          const testCaseElement = document.createElement('div');
          testCaseElement.className = 'test-case';
          testCaseElement.innerHTML = `
            <div class="test-case-header">
              <div class="test-case-title">Test Case ${i + 1}</div>
              <div class="test-case-result ${passed ? 'success' : 'failure'}">
                ${passed ? 'Passed' : 'Failed'}
              </div>
            </div>
            <div class="input-output">
              <div><strong>Input:</strong> ${testCase.input}</div>
              <div><strong>Expected:</strong> ${testCase.output}</div>
              <div><strong>Output:</strong> ${output || error}</div>
            </div>
          `;
          
          consoleArea.appendChild(testCaseElement);
          
        } catch (error) {
          const errorElement = document.createElement('div');
          errorElement.className = 'test-case';
          errorElement.innerHTML = `
            <div class="test-case-header">
              <div class="test-case-title">Test Case ${i + 1}</div>
              <div class="test-case-result failure">Error</div>
            </div>
            <div class="input-output">
              <div><strong>Error:</strong> ${error.message}</div>
            </div>
          `;
          consoleArea.appendChild(errorElement);
        }
      }
    });







    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Console tabs functionality
    const consoleTabs = document.querySelectorAll('.console-tab');
    consoleTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        consoleTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Code editor functionality
    const codeEditor = document.getElementById('code-editor');
    const languageSelector = document.querySelector('.language-selector');
    
    // Example of changing syntax based on language
    languageSelector.addEventListener('change', (e) => {
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
    
    // Update the problem content
    document.querySelector('.problem-title').textContent = currentProblem.title;
    document.querySelector('.difficulty').textContent = 
      currentProblem.difficulty.charAt(0).toUpperCase() + currentProblem.difficulty.slice(1);
    document.querySelector('.difficulty').className = `difficulty ${currentProblem.difficulty.toLowerCase()}`;
    
    // Update problem description
    const problemContent = document.querySelector('.problem-content');
    problemContent.innerHTML = `
      <p>${currentProblem.description}</p>
      
      ${currentProblem.examples.map((example, idx) => `
        <h3>Example ${idx + 1}:</h3>
        <div class="example">
          <p><strong>Input:</strong> ${example.input}</p>
          <p><strong>Output:</strong> ${example.output}</p>
        </div>
      `).join('')}
      
      <h3>Constraints:</h3>
      <div class="constraints">
        ${currentProblem.constraints.map(constraint => `<p>${constraint}</p>`).join('')}
      </div>
    `;

    // ✅ NEW: also update test cases dynamically in console
    const consoleArea = document.getElementById("console-area");
    consoleArea.innerHTML = currentProblem.testCases.map((tc, i) => `
      <div class="test-case">
        <div class="test-case-header">
          <div class="test-case-title">Test Case ${i + 1}</div>
        </div>
        <div class="input-output">
          <div><strong>Input:</strong> ${tc.input}</div>
          <div><strong>Expected:</strong> ${tc.output}</div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error("Error loading problem:", error);
  }
}


    // Initialize with the first problem
    showProblem(problemIndex);




