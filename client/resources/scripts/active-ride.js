let activeRideId = null;
let chatPollingInterval = null;
let currentRide = null;

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
    
    // Initialize the ride page
    initializeRidePage();
});

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
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('ride-completion-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Clear localStorage
        localStorage.removeItem('activeRideId');
        
        // Show success message and redirect
        setTimeout(() => {
            alert('Ride completed successfully! Thank you for using Tide Rides.');
            window.location.href = './rider.html';
        }, 500);
        
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

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }
});
