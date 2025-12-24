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

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML = details.participants && details.participants.length > 0
          ? details.participants.map(email => {
              const local = email.split("@")[0] || "";
              const initials = local
                .split(/[\.\-_]/)
                .map(part => part[0] || "")
                .join("")
                .slice(0, 2)
                .toUpperCase();
              // include data attributes so delete handler knows which activity/email to act on
              return `<li data-activity="${name}" data-email="${email}"><span class="participant-badge">${initials}</span><span class="participant-email">${email}</span><button class="participant-delete" title="Unregister">×</button></li>`;
            }).join("")
          : `<li class="no-participants"><em>No participants yet</em></li>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants</strong>
            <ul>
              ${participantsHTML}
            </ul>
          </div>
        `;

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

    // Delegate click handler for participant delete buttons
    activitiesList.addEventListener("click", async (e) => {
      const btn = e.target.closest && e.target.closest(".participant-delete");
      if (!btn) return;

      const li = btn.closest("li");
      if (!li) return;

      const activity = li.getAttribute("data-activity");
      const email = li.getAttribute("data-email");

      if (!activity || !email) return;

      try {
        const res = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
          method: "DELETE",
        });

        if (res.ok) {
          // refresh activities to update counts and list
          fetchActivities();
        } else {
          const body = await res.json().catch(() => ({}));
          console.error("Failed to unregister:", body.detail || body.message || res.statusText);
          alert(body.detail || body.message || "Failed to unregister participant");
        }
      } catch (err) {
        console.error("Error unregistering participant:", err);
        alert("Failed to unregister participant. Please try again.");
      }
    });

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
        // Refresh activity list to show the new participant
        fetchActivities();
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

  // Initialize app
  fetchActivities();
});
