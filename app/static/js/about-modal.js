// This script creates a modal for the "About" section of the StudyMate application.

(function() {
    // Modal HTML template
    const modalHTML = `
        <div class="modal fade custom-about-modal" id="aboutModal" tabindex="-1" aria-labelledby="aboutModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="aboutModalLabel">About StudyMate</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <img src="/static/images/logo.png" alt="StudyMate Logo" style="max-width: 150px;" class="mb-3">
                            <h4>Welcome to StudyMate!</h4>
                        </div>
                        
                        <h6 class="font-weight-bold">🎯 Our Mission</h6>
                        <p>StudyMate is designed to help students organize their academic life efficiently and effectively.</p>
                        
                        <h6 class="font-weight-bold">✨ Key Features</h6>
                        <ul>
                            <li>Task Management & Planning</li>
                            <li>Study Progress Tracking</li>
                            <li>Personalized Dashboard</li>
                            <li>Collaborative Tools</li>
                        </ul>
                        
                        <h6 class="font-weight-bold">👥 Our Team</h6>
                        <p>Created by students, for students. We understand the challenges of academic life and are here to help!</p>
                        
                        <h6 class="font-weight-bold">📧 Contact</h6>
                        <p>Questions or suggestions? Email us at: help@studymate.com</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <a href="mailto:support@studymate.com" class="btn btn-primary">Contact Us</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize modal when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize modal functionality
        document.querySelector('a[href="#"][data-bs-toggle="modal"]').addEventListener('click', function(e) {
            e.preventDefault();
            $('#aboutModal').modal('show');
        });
    });
})();
