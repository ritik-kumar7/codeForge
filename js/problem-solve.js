

    const urlParams = new URLSearchParams(window.location.search);
    const problemIndex = urlParams.get("index");

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

    // Run button functionality
    const runButtons = document.querySelectorAll('.btn-run');
    runButtons.forEach(button => {
      button.addEventListener('click', () => {
        // In a real app, this would execute the code
        console.log('Running code...');
        alert('Code executed! Check console for results.');
      });
    });

    // Submit button functionality
    const submitButtons = document.querySelectorAll('.btn-submit');
    submitButtons.forEach(button => {
      button.addEventListener('click', () => {
        // In a real app, this would submit the code
        console.log('Submitting code...');
        alert('Code submitted!');
      });
    });

    // Example of loading problem data
    async function showProblem(problemIndex) {
      try {
        // This is a mock implementation since we don't have the actual JSON file
      const responce = await fetch("../datas/problems.json");
      const data = await responce.json();

      const problem = data[problemIndex];
      console.log(problem);
        

        
        // Update the problem content
        document.querySelector('.problem-title').textContent = problem.title;
        document.querySelector('.difficulty').textContent = problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1);
        document.querySelector('.difficulty').className = `difficulty ${problem.difficulty.toLowerCase()}`;
        
      } catch (error) {
        console.error("Error loading problem:", error);
      }
    }
    
    // Initialize with the first problem
    showProblem(problemIndex);




