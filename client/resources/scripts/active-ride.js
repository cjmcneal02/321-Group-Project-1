let activeRideId = null;
let chatPollingInterval = null;
let currentRide = null;
let selectedRating = 0;

// Initialize the active ride page
document.addEventListener('DOMContentLoaded', function() {
    // Get ride ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    activeRideId = urlParams.get('rideId');
    
    if (!activeRideId) {
        // No ride ID, redirect back to home
        window.location.href = './rider.html';
        return;
    }
    
    // Restore API service properties from localStorage
    restoreApiServiceFromLocalStorage();
    
    // Initialize the ride page
    initializeRidePage();
});

function restoreApiServiceFromLocalStorage() {
    try {
        const storedUserId = localStorage.getItem('riderUserId');
        const storedUserRole = localStorage.getItem('riderUserRole');
        
        if (storedUserId && storedUserRole) {
            apiService.currentUserId = parseInt(storedUserId);
            apiService.currentUserRole = storedUserRole;
            console.log('API service properties restored from localStorage:', {
                currentUserId: apiService.currentUserId,
                currentUserRole: apiService.currentUserRole
            });
        } else {
            console.warn('No stored user data found in localStorage');
        }
    } catch (error) {
        console.error('Error restoring API service from localStorage:', error);
    }
}

async function initializeRidePage() {
    try {
        // Load ride data from API
        currentRide = await apiService.getRide(activeRideId);
        
        if (!currentRide) {
            // No ride found, redirect back to home
            window.location.href = './rider.html';
            return;
        }
        
        // Update ride information
        updateRideInfo(currentRide);
        
        // Initialize chat
        initializeChat();
        
        // Initialize rating system
        initializeRatingSystem();
        
        // Start polling for updates
        startPolling();
        
    } catch (error) {
        console.error('Error initializing ride page:', error);
        window.location.href = './rider.html';
    }
}

function updateRideInfo(ride) {
    // Update ride details
    document.getElementById('pickup-location').textContent = ride.PickupLocation || ride.pickupLocation || 'Unknown';
    document.getElementById('dropoff-location').textContent = ride.DropoffLocation || ride.dropoffLocation || 'Unknown';
    document.getElementById('ride-fare').textContent = `$${(ride.EstimatedFare || ride.estimatedFare || 0).toFixed(2)}`;
    document.getElementById('passenger-count').textContent = ride.PassengerCount || ride.passengerCount || 1;
    document.getElementById('cart-size').textContent = ride.CartSize || ride.cartSize || 'Standard';
    
    // Update status badge
    const statusElement = document.getElementById('ride-status');
    const status = ride.Status || ride.status || 'Unknown';
    statusElement.textContent = status;
    statusElement.className = `badge ride-status-badge ${getStatusBadgeClass(status)}`;
    
    // Show/hide back button based on status
    const backButton = document.getElementById('back-button');
    if (status === 'Completed') {
        backButton.style.display = 'block';
    } else {
        backButton.style.display = 'none';
    }
    
    // Show special notes if they exist
    const specialNotes = ride.SpecialNotes || ride.specialNotes;
    const specialNotesSection = document.getElementById('special-notes-section');
    if (specialNotes && specialNotes.trim()) {
        document.getElementById('special-notes-content').textContent = specialNotes;
        specialNotesSection.style.display = 'block';
    } else {
        specialNotesSection.style.display = 'none';
    }
    
    // Update driver information
    if (ride.Driver || ride.driver) {
        const driver = ride.Driver || ride.driver;
        document.getElementById('driver-name').textContent = driver.Name || driver.name || 'Unknown Driver';
        document.getElementById('driver-vehicle').textContent = driver.VehicleName || driver.vehicleName || 'Unknown Vehicle';
        document.getElementById('driver-rating').textContent = `${driver.Rating || driver.rating || 0} ⭐`;
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Requested': return 'bg-warning';
        case 'In Progress': return 'bg-primary';
        case 'Completed': return 'bg-success';
        case 'Cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function initializeChat() {
    const sendBtn = document.getElementById('send-message-btn');
    const chatInput = document.getElementById('chat-input');
    
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Load existing messages
    loadChatMessages();
}

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput || !chatInput.value.trim()) return;
    
    try {
        const riderId = apiService.getCurrentRiderId();
        const message = {
            rideId: parseInt(activeRideId),
            driverId: null,
            riderId: riderId,
            sender: 'rider',
            senderName: 'You',
            content: chatInput.value.trim()
        };
        
        await apiService.sendChatMessage(message);
        chatInput.value = '';
        loadChatMessages();
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function loadChatMessages() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    try {
        const messages = await apiService.getChatMessages(activeRideId);
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-chat-dots" style="font-size: 2rem;"></i>
                    <p class="mt-2">Start chatting with your driver!</p>
                </div>
            `;
            return;
        }
        
                messagesContainer.innerHTML = messages.map(msg => {
                    const isRider = msg.Sender === 'rider' || msg.sender === 'rider';
                    const senderName = isRider ? 'You' : (currentRide?.Driver?.Name || currentRide?.driver?.name || 'Driver');
                    
                    return `
                        <div class="message mb-3 ${isRider ? 'text-end' : 'text-start'}">
                            <div class="message-bubble d-inline-block p-3 rounded-3 ${isRider ? 'message-rider' : 'message-driver'}">
                                <small class="d-block opacity-75 mb-1">${senderName}</small>
                                ${msg.Content || msg.content || ''}
                            </div>
                        </div>
                    `;
                }).join('');
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Error loading chat messages:', error);
    }
}

function showRideCompletionModal() {
    const modal = new bootstrap.Modal(document.getElementById('ride-completion-modal'));
    modal.show();
}

async function confirmRideCompletion() {
    try {
        // Hide completion modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('ride-completion-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Show rating modal
        setTimeout(() => {
            showRatingModal();
        }, 300);
        
    } catch (error) {
        console.error('Error confirming ride completion:', error);
    }
}

function startPolling() {
    chatPollingInterval = setInterval(async () => {
        try {
            // Get updated ride data
            const updatedRide = await apiService.getRide(activeRideId);
            
            if (!updatedRide) {
                // Ride no longer exists, redirect to home
                clearInterval(chatPollingInterval);
                window.location.href = './rider.html';
                return;
            }
            
            // Update ride info
            updateRideInfo(updatedRide);
            currentRide = updatedRide;
            
            // Load chat messages
            loadChatMessages();
            
            // Check if ride is completed
            const status = updatedRide.Status || updatedRide.status;
            if (status === 'Completed') {
                showRideCompletionModal();
                clearInterval(chatPollingInterval);
            }
            
        } catch (error) {
            console.error('Error polling for updates:', error);
        }
    }, 2000);
}

function goBack() {
    window.location.href = './rider.html';
}

// Rating System Functions
function initializeRatingSystem() {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => selectRating(index + 1));
        star.addEventListener('mouseenter', () => highlightStars(index + 1));
    });
    
    const starContainer = document.getElementById('star-rating');
    if (starContainer) {
        starContainer.addEventListener('mouseleave', resetStarHighlight);
    }
}

function selectRating(rating) {
    selectedRating = rating;
    updateStarDisplay(rating);
    updateRatingText(rating);
    updateSubmitButton();
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.className = 'bi bi-star-fill star active'; // Use filled star
        } else {
            star.classList.remove('active');
            star.className = 'bi bi-star star'; // Use outline star
        }
    });
}

function resetStarHighlight() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('active');
        star.className = 'bi bi-star star'; // Reset to outline star
    });
    
    if (selectedRating > 0) {
        updateStarDisplay(selectedRating);
    }
}

function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.className = 'bi bi-star-fill star active'; // Use filled star
        } else {
            star.classList.remove('active');
            star.className = 'bi bi-star star'; // Use outline star
        }
    });
}

function updateRatingText(rating) {
    const ratingText = document.getElementById('rating-text');
    if (ratingText) {
        const texts = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        ratingText.textContent = texts[rating] || 'Tap a star to rate';
    }
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-rating-btn');
    if (submitBtn) {
        submitBtn.disabled = selectedRating === 0;
    }
}

function showRatingModal() {
    // Update driver info in rating modal
    if (currentRide && currentRide.Driver) {
        const driver = currentRide.Driver;
        document.getElementById('rating-driver-name').textContent = driver.Name || driver.name || 'Unknown Driver';
        document.getElementById('rating-ride-details').textContent = 
            `${currentRide.PickupLocation || currentRide.pickupLocation} → ${currentRide.DropoffLocation || currentRide.dropoffLocation}`;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('rating-modal'));
    modal.show();
}

function skipRating() {
    // Hide rating modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('rating-modal'));
    if (modal) {
        modal.hide();
    }
    
    // Show thank you modal
    setTimeout(() => {
        showThankYouModal();
    }, 300);
}

async function submitRating() {
    if (selectedRating === 0) return;
    
    try {
        const riderId = apiService.getCurrentRiderId();
        const driverId = currentRide.Driver?.Id || currentRide.driver?.id;
        
        
        // Validate required data
        if (!riderId) {
            throw new Error('Rider ID not found. Please ensure you are logged in.');
        }
        if (!driverId) {
            throw new Error('Driver ID not found. Unable to submit rating.');
        }
        if (!activeRideId) {
            throw new Error('Ride ID not found. Unable to submit rating.');
        }
        
        const ratingData = {
            rideId: parseInt(activeRideId),
            rating: selectedRating,
            comments: document.getElementById('rating-comments').value.trim() || ''
        };
        
        await apiService.submitRating(ratingData);
        
        // Hide rating modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('rating-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Show thank you modal
        setTimeout(() => {
            showThankYouModal();
        }, 300);
        
    } catch (error) {
        console.error('Error submitting rating:', error);
        const errorMessage = error.message || 'Unknown error occurred';
        alert(`Error submitting rating: ${errorMessage}`);
    }
}

function showThankYouModal() {
    const modal = new bootstrap.Modal(document.getElementById('thank-you-modal'));
    modal.show();
}

function closeThankYouModal() {
    // Hide thank you modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('thank-you-modal'));
    if (modal) {
        modal.hide();
    }
    
    // Clear localStorage and redirect
    localStorage.removeItem('activeRideId');
    setTimeout(() => {
        window.location.href = './rider.html';
    }, 500);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }
});
