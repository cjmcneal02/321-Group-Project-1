using System.ComponentModel.DataAnnotations;

namespace api.Models
{
    public class Driver
    {
        public int Id { get; set; }
        public int? UserId { get; set; } // Foreign key to User
        public string Name { get; set; } = string.Empty;
        public string VehicleId { get; set; } = string.Empty;
        public string VehicleName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public bool IsAvailable { get; set; } = true;
        public int TotalRides { get; set; }
        public decimal AverageTip { get; set; }
        public decimal Rating { get; set; }
        public string Status { get; set; } = "Active";
        public int? CurrentRideId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public User? User { get; set; }
    }

    public class Rider
    {
        public int Id { get; set; }
        public int UserId { get; set; } // Foreign key to User
        public string Name { get; set; } = string.Empty;
        public int TotalRides { get; set; } = 0;
        public string RiderStatus { get; set; } = "New"; // "New", "Regular", "VIP"
        public decimal AverageRating { get; set; } = 0.0m;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public User? User { get; set; }
    }


    public class Ride
    {
        public int Id { get; set; }
        public int? DriverId { get; set; } // Optional - NULL until driver accepts
        public int? RiderId { get; set; } // Foreign key to Rider
        public string RiderName { get; set; } = string.Empty;
        public string PickupLocation { get; set; } = string.Empty;
        public string DropoffLocation { get; set; } = string.Empty;
        public int PassengerCount { get; set; }
        public string CartSize { get; set; } = string.Empty;
        public string SpecialNotes { get; set; } = string.Empty;
        public decimal EstimatedFare { get; set; }
        public string Status { get; set; } = "Requested"; // "Requested", "In Progress", "Completed", "Cancelled"
        public DateTime? StartTime { get; set; } // NULL until driver accepts
        public DateTime? EndTime { get; set; } // NULL until completed
        public int Distance { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public Driver? Driver { get; set; }
    }

    public class ChatMessage
    {
        public int Id { get; set; }
        public int RideId { get; set; }
        public string Sender { get; set; } = string.Empty; // "rider" or "driver"
        public string SenderName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public Ride? Ride { get; set; }
    }

    // DTOs for API requests/responses
    public class CreateRideDto
    {
        [Required]
        public int RiderId { get; set; }
        [Required]
        public string RiderName { get; set; } = string.Empty;
        [Required]
        public string PickupLocation { get; set; } = string.Empty;
        [Required]
        public string DropoffLocation { get; set; } = string.Empty;
        [Required]
        public int PassengerCount { get; set; }
        [Required]
        public string CartSize { get; set; } = string.Empty;
        public string SpecialNotes { get; set; } = string.Empty;
        [Required]
        public decimal EstimatedFare { get; set; }
    }

    public class AcceptRideDto
    {
        [Required]
        public int DriverId { get; set; }
        [Required]
        public int RideId { get; set; }
    }

    public class SendMessageDto
    {
        [Required]
        public int RideId { get; set; }
        [Required]
        public string Sender { get; set; } = string.Empty;
        [Required]
        public string SenderName { get; set; } = string.Empty;
        [Required]
        public string Content { get; set; } = string.Empty;
    }

    public class CompleteRideDto
    {
        [Required]
        public int RideId { get; set; }
        [Required]
        public int DriverId { get; set; }
    }

    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty; // In production, this should be hashed
        public string Role { get; set; } = string.Empty; // "Admin", "Driver", "Rider"
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public Driver? Driver { get; set; }
        public Rider? Rider { get; set; }
    }

    public class CreateUserDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
        [Required]
        public string Role { get; set; } = string.Empty;
        [Required]
        public string FirstName { get; set; } = string.Empty;
        [Required]
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class UpdateUserDto
    {
        public string Username { get; set; } = string.Empty;
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public bool? IsActive { get; set; }
    }

    public class LoginDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
