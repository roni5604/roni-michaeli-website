// Initialize EmailJS
(function(){
    emailjs.init("5FKITJYeXCawO2u4-");
})();

// Load About Content
fetch('assets/texts/about.txt')
    .then(response => response.text())
    .then(data => {
        document.getElementById('about-content').innerText = data;
    });

// Load Projects Content
fetch('assets/texts/projects.txt')
    .then(response => response.text())
    .then(data => {
        document.getElementById('projects-content').innerHTML = data;
    });

// Initialize Particles.js
document.addEventListener('DOMContentLoaded', function() {
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#ffffff" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5 },
            "size": { "value": 3 },
            "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
            "move": { "enable": true, "speed": 6 }
        },
        "interactivity": {
            "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" } },
            "modes": { "repulse": { "distance": 100 }, "push": { "particles_nb": 4 } }
        },
        "retina_detect": true
    });
});

// Handle Contact Form Submission
document.getElementById('contact-form').addEventListener('submit', function(event){
    event.preventDefault();

    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();

    // Validate form
    if (!name || !email || !message) {
        displayStatus('Please fill in all required fields.', 'danger');
        return;
    }

    // Prepare parameters
    const params = {
        from_name: name,
        from_email: email,
        phone: phone,
        message: message
    };

    // Send email via EmailJS
    emailjs.send('service_43iogao', 'template_wrtb6vt', params)
        .then(function(response) {
            displayStatus('Message sent successfully!', 'success');
            document.getElementById('contact-form').reset();
        })
        .catch(function(error) {
            console.error('Error sending email:', error);
            displayStatus('Failed to send message. Please try again later.', 'danger');
        });
});

// Display form status
function displayStatus(message, type) {
    const statusDiv = document.getElementById('form-status');
    statusDiv.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}
