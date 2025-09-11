
      // Functionality for topic buttons
      const problemsList = document.querySelector(".problem-container");
      const topicButtons = document.querySelectorAll(".topic-btn");



      topicButtons.forEach((button) => {
        button.addEventListener("click", () => {
          // Remove active class from all buttons
          topicButtons.forEach((btn) => btn.classList.remove("active"));
          // Add active class to clicked button
          button.classList.add("active");
        });
      });

      // Functionality for problem checkboxes
      const checkboxes = document.querySelectorAll(".problem-solved input");
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          const row = checkbox.closest(".problem-row");
          const statusElement = row.querySelector(".problem-status");

          if (checkbox.checked) {
            statusElement.textContent = "Solved";
            statusElement.classList.remove("status-unsolved");
            statusElement.classList.add("status-solved");
          } else {
            statusElement.textContent = "Unsolved";
            statusElement.classList.remove("status-solved");
            statusElement.classList.add("status-unsolved");
          }
        });
      });

      // Simple search functionality
      const searchInput = document.querySelector(".search-bar input");
      searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        const problemRows = document.querySelectorAll(".problem-row");

        problemRows.forEach((row) => {
          const problemName = row
            .querySelector(".problem-name")
            .textContent.toLowerCase();
          const problemType = row
            .querySelector(".problem-type")
            .textContent.toLowerCase();

          if (
            problemName.includes(searchTerm) ||
            problemType.includes(searchTerm)
          ) {
            row.style.display = "grid";
          } else {
            row.style.display = "none";
          }
        });
      });

      function sendProblem(index) {
         window.open(`problemSolve.html?index=${index}`, "_blank");
      }

      async function problemsSet() {
        try {
          const responce = await fetch("../datas/problems.json");
          const data = await responce.json();

          data.forEach((ind, idx) => {
            problemsList.innerHTML += `
                <div class="problem-row">
          <div class="problem-solved">
            <input type="checkbox">
          </div>
        <a href="#" class="problem-name" onClick="sendProblem('${idx}')">${
              ind.title
            }</a>
          <div class="problem-type">${ind.type}</div>
          <div class="problem-difficulty difficulty-${ind.difficulty.toLowerCase()}">${
              ind.difficulty
            }</div>
          <div class="problem-status status-unsolved">Unsolved</div>
        </div>
               `;
          });
        } catch (e) {}
      }



      
      problemsSet();
   