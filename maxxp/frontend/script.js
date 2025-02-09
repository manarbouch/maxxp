document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("contact-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const form = document.getElementById("contact-form");
        const responseMessage = document.getElementById("response-message");

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

            const response = await fetch("http://localhost:5000/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                responseMessage.textContent = "Message sent successfully!";
                responseMessage.style.color = "green";

                setTimeout(() => {
                    form.reset();
                    responseMessage.textContent = ""; 
                }, 2000);
            } else {
                responseMessage.textContent = "Error sending message.";
                responseMessage.style.color = "red";
            }
        } catch (error) {
            responseMessage.textContent = "Failed to connect to the server.";
            responseMessage.style.color = "red";
        }
    });
});
