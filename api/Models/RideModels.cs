using System.ComponentModel.DataAnnotations;

namespace api.Models
{
    public class Driver
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string VehicleId { get; set; } = string.Empty;
        public string VehicleName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public bool IsAvailable { get; set; } = true;
        public int BatteryLevel { get; set; }
        public int TotalRides { get; set; }
        public decimal AverageTip { get; set; }
        public decimal Rating { get; set; }
        public string Status { get; set; } = "Active";
        public int? CurrentRideId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class RideRequest
    {
        public int Id { get; set; }
        public string RiderName { get; set; } = string.Empty;
        public string PickupLocation { get; set; } = string.Empty;
        public string DropoffLocation { get; set; } = string.Empty;
        public int PassengerCount { get; set; }
        public string CartSize { get; set; } = string.Empty;
        public decimal EstimatedFare { get; set; }
        public string Status { get; set; } = "Pending";
        public string DeclinedByDrivers { get; set; } = string.Empty; // Comma-separated list of driver IDs who declined
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Ride
    {
        public int Id { get; set; }
        public int RideRequestId { get; set; }
        public int DriverId { get; set; }
        public string RiderName { get; set; } = string.Empty;
        public string PickupLocation { get; set; } = string.Empty;
        public string DropoffLocation { get; set; } = string.Empty;
        public int PassengerCount { get; set; }
        public string CartSize { get; set; } = string.Empty;
        public decimal EstimatedFare { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public int Distance { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public RideRequest? RideRequest { get; set; }
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
    public class CreateRideRequestDto
    {
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
        [Required]
        public decimal EstimatedFare { get; set; }
    }

    public class AcceptRideRequestDto
    {
        [Required]
        public int DriverId { get; set; }
        [Required]
        public int RideRequestId { get; set; }
    }

    public class DeclineRideRequestDto
    {
        [Required]
        public int DriverId { get; set; }
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
}
