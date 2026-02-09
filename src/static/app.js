document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      const activityTemplate = document.getElementById("activity-card-template");

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const spotsLeft = details.max_participants - details.participants.length;
        const activityCard = activityTemplate
          ? activityTemplate.content.firstElementChild.cloneNode(true)
          : document.createElement("div");

        if (!activityTemplate) {
          activityCard.className = "activity-card";
        }

        const title = activityCard.querySelector(".activity-title") || activityCard.querySelector("h4");
        const description = activityCard.querySelector(".activity-description") || activityCard.querySelector("p");
        const schedule = activityCard.querySelector(".activity-schedule");
        const participantsList = activityCard.querySelector(".participants-list");

        if (title) {
          title.textContent = name;
        }

        if (description) {
          description.textContent = details.description;
        }

        if (schedule) {
          schedule.textContent = `Schedule: ${details.schedule}`;
        } else {
          const scheduleText = document.createElement("p");
          scheduleText.textContent = `Schedule: ${details.schedule}`;
          activityCard.appendChild(scheduleText);
        }

        const availabilityText = document.createElement("p");
        availabilityText.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(availabilityText);

        if (participantsList) {
          participantsList.innerHTML = "";
          if (details.participants.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.className = "participant-empty";
            emptyItem.textContent = "No participants yet";
            participantsList.appendChild(emptyItem);
          } else {
            details.participants.forEach((participant) => {
              const item = document.createElement("li");
              item.className = "participant-item";

              const nameSpan = document.createElement("span");
              nameSpan.textContent = participant;

              const deleteButton = document.createElement("button");
              deleteButton.type = "button";
              deleteButton.className = "delete-participant";
              deleteButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);
              deleteButton.dataset.activity = name;
              deleteButton.dataset.email = participant;
              deleteButton.textContent = "x";

              item.appendChild(nameSpan);
              item.appendChild(deleteButton);
              participantsList.appendChild(item);
            });
          }
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant");
    if (!deleteButton) {
      return;
    }

    const activityName = deleteButton.dataset.activity;
    const email = deleteButton.dataset.email;

    if (!activityName || !email) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
