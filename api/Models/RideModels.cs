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
        public decimal AverageRating { get; set; }
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
        public string DriverLocation { get; set; } = "PreRide"; // "PreRide", "OnWay", "AtPickup", "AtDropoff"
        public DateTime? StartTime { get; set; } // NULL until driver accepts
        public DateTime? EndTime { get; set; } // NULL until completed
        public int Distance { get; set; }
        public int? DriverRating { get; set; } // Rating given by rider to driver (1-5)
        public int? RiderRating { get; set; } // Rating given by driver to rider (1-5)
        public string DriverComments { get; set; } = string.Empty; // Comments from rider about driver
        public string RiderComments { get; set; } = string.Empty; // Comments from driver about rider
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public Driver? Driver { get; set; }
    }

    public class ChatMessage
    {
        public int Id { get; set; }
        public int RideId { get; set; }
        public int? DriverId { get; set; } // NULL if sent by rider
        public int? RiderId { get; set; } // NULL if sent by driver
        public string Sender { get; set; } = string.Empty; // "rider" or "driver"
        public string SenderName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public Ride? Ride { get; set; }
        public Driver? Driver { get; set; }
        public Rider? Rider { get; set; }
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
        public int? DriverId { get; set; } // NULL if sent by rider
        public int? RiderId { get; set; } // NULL if sent by driver
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

    public class UpdateDriverLocationDto
    {
        [Required]
        public string DriverLocation { get; set; } = string.Empty; // "PreRide", "OnWay", "AtPickup", "AtDropoff"
    }

    public class SubmitDriverRatingDto
    {
        [Required]
        public int RideId { get; set; }
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        public string Comments { get; set; } = string.Empty;
    }

    public class SubmitRiderRatingDto
    {
        [Required]
        public int RideId { get; set; }
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        public string Comments { get; set; } = string.Empty;
    }

    public class CampusLocation
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Type { get; set; } = string.Empty; // "academic", "residential", "dining", "recreation", "landmark", "hub"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateCampusLocationDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public double Latitude { get; set; }
        [Required]
        public double Longitude { get; set; }
        [Required]
        public string Type { get; set; } = string.Empty;
    }

    public class UpdateCampusLocationDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public double Latitude { get; set; }
        [Required]
        public double Longitude { get; set; }
        [Required]
        public string Type { get; set; } = string.Empty;
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
        public int? DriverId { get; set; } // Foreign key to Driver
        public int? RiderId { get; set; } // Foreign key to Rider
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
