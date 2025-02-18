document.addEventListener("DOMContentLoaded", function () {
    // Make sure to target the correct element by matching the ID correctly
    document.getElementById("contact-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const form = document.getElementById("contact-form");
        const responseMessage = document.getElementById("Response-message");  // Fixed the ID here

        const formData = new FormData(form);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            message: formData.get("message")
        };

        try {
            // Show a temporary "Sending..." message
            responseMessage.textContent = "Sending...";
            responseMessage.style.color = "blue";

            // Send the data to the server using fetch
            const response = await fetch("http://localhost:5000/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Successful message
                responseMessage.textContent = "Message sent successfully!";
                responseMessage.style.color = "green";

                // Reset form and hide response message after a few seconds
                setTimeout(() => {
                    form.reset();
                    responseMessage.textContent = ""; 
                }, 2000);
            } else {
                // Error message
                responseMessage.textContent = "Error sending message.";
                responseMessage.style.color = "red";
            }
        } catch (error) {
            // Handle network or server failure
            responseMessage.textContent = "Failed to connect to the server.";
            responseMessage.style.color = "red";
        }
    });
});
